import {
  getCompleteRegisteredPairs,
  getCurrentCostaRicaMondayStartIso,
  getNextCostaRicaMondayStartIso,
  isRouteLapsoFullyRegistered,
} from "./route-lapsos.mjs";

export type RouteLapsoStatus = "en_curso" | "completado" | "incompleto" | "vencido";

export type ResolvedLapso = {
  lapsoId: number;
  lapsoUserId: number;
};

export type CloseRouteLapsoResult = {
  closed: boolean;
  routeId: number | null;
  establishmentId: number | null;
};

/**
 * Finds the active lapso for a route.
 * For admin/editor: first tries the assigned user, then falls back to any active lapso
 * for the route (same logic used when creating records).
 * For rutero: only returns the lapso belonging to that user.
 */
export async function resolveActiveLapso(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  params: {
    routeId: number;
    assignedUser: number | null;
    profileUserId: number;
    role: string;
  },
): Promise<ResolvedLapso | null> {
  const { routeId, assignedUser, profileUserId, role } = params;
  const nowIso = new Date().toISOString();
  const currentWeekStartIso = getCurrentCostaRicaMondayStartIso();

  if (role === "rutero") {
    const { data } = await supabase
      .from("route_lapso")
      .select("lapso_id, user_id")
      .eq("route_id", routeId)
      .eq("user_id", profileUserId)
      .eq("status", "en_curso")
      .gte("start_at", currentWeekStartIso)
      .gt("end_at", nowIso)
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return { lapsoId: data.lapso_id, lapsoUserId: data.user_id };
  }

  // admin / editor: try assigned user first, then any active lapso for the route
  const candidateUserId = assignedUser ?? null;

  let query = supabase
    .from("route_lapso")
    .select("lapso_id, user_id")
    .eq("route_id", routeId)
    .eq("status", "en_curso")
    .gte("start_at", currentWeekStartIso)
    .gt("end_at", nowIso)
    .order("start_at", { ascending: false })
    .limit(1);

  if (typeof candidateUserId === "number") {
    query = query.eq("user_id", candidateUserId);
  }

  let { data } = await query.maybeSingle();

  if (!data && typeof candidateUserId === "number") {
    // fallback: any active lapso for the route (admin created it under a different user)
    const { data: fallback } = await supabase
      .from("route_lapso")
      .select("lapso_id, user_id")
      .eq("route_id", routeId)
      .eq("status", "en_curso")
      .gte("start_at", currentWeekStartIso)
      .gt("end_at", nowIso)
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    data = fallback ?? null;
  }

  if (!data) return null;
  return { lapsoId: data.lapso_id, lapsoUserId: data.user_id };
}

export function getDurationDaysFromVisitPeriod(visitPeriod: string | null | undefined) {
  if (!visitPeriod) return 7;

  const match = visitPeriod.match(/\d+/);
  if (!match) return 7;

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed) || parsed < 1) return 7;
  return Math.floor(parsed);
}

export function getRouteLapsoEndAt(nowDate: Date = new Date()) {
  return getNextCostaRicaMondayStartIso(nowDate);
}

export function getRouteLapsoWeekStartAt(nowDate: Date = new Date()) {
  return getCurrentCostaRicaMondayStartIso(nowDate);
}

export async function closeExpiredRouteLapsos(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  nowDate: Date = new Date(),
) {
  const nowIso = nowDate.toISOString();
  const currentWeekStartIso = getCurrentCostaRicaMondayStartIso(nowDate);

  await supabase
    .from("route_lapso")
    .update({
      status: "vencido",
      closed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("status", "en_curso")
    .or(`end_at.lte.${nowIso},start_at.lt.${currentWeekStartIso}`);
}

export async function closeRouteLapsoIfFullyRegisteredAfterRecord(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  recordId: number,
): Promise<CloseRouteLapsoResult> {
  const { data: record } = await supabase
    .from("check_record")
    .select("record_id, lapso_id, user_id, establishment_id, evidence_num")
    .eq("record_id", recordId)
    .maybeSingle();

  if (
    !record ||
    !Number.isFinite(record.lapso_id) ||
    !Number.isFinite(record.user_id) ||
    !Number.isFinite(record.establishment_id)
  ) {
    return { closed: false, routeId: null, establishmentId: null };
  }

  const expectedEvidenceCount = Number(record.evidence_num ?? 0);
  if (expectedEvidenceCount > 0) {
    const { count: evidenceCount } = await supabase
      .from("evidence")
      .select("evidence_id", { count: "exact", head: true })
      .eq("record_id", recordId);

    if ((evidenceCount ?? 0) < expectedEvidenceCount) {
      return { closed: false, routeId: null, establishmentId: record.establishment_id };
    }
  }

  const { data: lapso } = await supabase
    .from("route_lapso")
    .select("lapso_id, route_id, user_id, status")
    .eq("lapso_id", record.lapso_id)
    .eq("user_id", record.user_id)
    .eq("status", "en_curso")
    .maybeSingle();

  if (!lapso || !Number.isFinite(lapso.route_id)) {
    return { closed: false, routeId: null, establishmentId: record.establishment_id };
  }

  const { data: establishments } = await supabase
    .from("establishment")
    .select("establishment_id")
    .eq("route_id", lapso.route_id)
    .eq("is_active", true);

  const establishmentIds = (establishments ?? [])
    .map((row) => row.establishment_id)
    .filter((value): value is number => Number.isFinite(value));

  if (establishmentIds.length === 0) {
    return { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id };
  }

  const { data: relations } = await supabase
    .from("products_establishment")
    .select("establishment_id, product_id")
    .in("establishment_id", establishmentIds)
    .eq("is_active", true);

  const productIds = [
    ...new Set(
      (relations ?? [])
        .map((row) => row.product_id)
        .filter((value): value is number => Number.isFinite(value)),
    ),
  ];

  if (productIds.length === 0) {
    return { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id };
  }

  const { data: products } = await supabase
    .from("product")
    .select("product_id")
    .in("product_id", productIds)
    .eq("is_active", true);

  const activeProductIds = new Set(
    (products ?? [])
      .map((row) => row.product_id)
      .filter((value): value is number => Number.isFinite(value)),
  );

  const requiredPairs = (relations ?? [])
    .filter((row) => activeProductIds.has(row.product_id))
    .map((row) => ({
      establishmentId: row.establishment_id,
      productId: row.product_id,
    }));

  const { data: records } = await supabase
    .from("check_record")
    .select("record_id, establishment_id, product_id, evidence_num")
    .eq("lapso_id", record.lapso_id)
    .eq("user_id", record.user_id);

  const recordIds = (records ?? [])
    .map((row) => row.record_id)
    .filter((value): value is number => Number.isFinite(value));
  const evidenceCountByRecordId = new Map<number, number>();

  if (recordIds.length > 0) {
    const { data: evidenceRows } = await supabase
      .from("evidence")
      .select("record_id")
      .in("record_id", recordIds);

    for (const evidence of evidenceRows ?? []) {
      const evidenceRecordId = Number(evidence.record_id);
      if (!Number.isFinite(evidenceRecordId)) continue;
      evidenceCountByRecordId.set(
        evidenceRecordId,
        (evidenceCountByRecordId.get(evidenceRecordId) ?? 0) + 1,
      );
    }
  }

  const registeredPairs = getCompleteRegisteredPairs(
    (records ?? []).map((row) => ({
      establishmentId: row.establishment_id,
      productId: row.product_id,
      evidenceNum: row.evidence_num,
      evidenceCount: evidenceCountByRecordId.get(row.record_id) ?? 0,
    })),
  );

  if (!isRouteLapsoFullyRegistered({ requiredPairs, registeredPairs })) {
    return { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id };
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("route_lapso")
    .update({
      status: "completado",
      closed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("lapso_id", record.lapso_id)
    .eq("status", "en_curso");

  return {
    closed: !error,
    routeId: lapso.route_id,
    establishmentId: record.establishment_id,
  };
}

export function getLapsoProgress(
  startAt: string,
  endAt: string,
  nowDate: Date = new Date(),
) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return {
      elapsedDay: 1,
      totalDays: 1,
      percent: 0,
    };
  }

  const totalMs = end.getTime() - start.getTime();
  const elapsedMsRaw = nowDate.getTime() - start.getTime();
  const elapsedMs = Math.min(Math.max(elapsedMsRaw, 0), totalMs);

  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const elapsedDay = Math.min(
    totalDays,
    Math.max(1, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1),
  );
  const percent = Math.round((elapsedMs / totalMs) * 100);

  return { elapsedDay, totalDays, percent };
}
