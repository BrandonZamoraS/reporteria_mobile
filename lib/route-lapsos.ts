import {
  getCurrentCostaRicaMondayStartIso,
  getNextCostaRicaMondayStartIso,
  hasRouteLapsoPendingItems,
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
  const failClosed = (
    message: string,
    error: unknown,
    result: CloseRouteLapsoResult,
  ): CloseRouteLapsoResult => {
    console.error(message, error);
    return result;
  };

  const { data: record, error: recordError } = await supabase
    .from("check_record")
    .select("record_id, lapso_id, user_id, establishment_id, evidence_num")
    .eq("record_id", recordId)
    .maybeSingle();

  if (recordError) {
    return failClosed("Error consultando check_record para cierre de route_lapso:", recordError, {
      closed: false,
      routeId: null,
      establishmentId: null,
    });
  }

  if (
    !record ||
    !Number.isFinite(record.lapso_id) ||
    !Number.isFinite(record.user_id) ||
    !Number.isFinite(record.establishment_id)
  ) {
    return { closed: false, routeId: null, establishmentId: null };
  }

  const { data: lapso, error: lapsoError } = await supabase
    .from("route_lapso")
    .select("lapso_id, route_id, user_id, status")
    .eq("lapso_id", record.lapso_id)
    .eq("user_id", record.user_id)
    .eq("status", "en_curso")
    .maybeSingle();

  if (lapsoError) {
    return failClosed("Error consultando route_lapso para cierre automatico:", lapsoError, {
      closed: false,
      routeId: null,
      establishmentId: record.establishment_id,
    });
  }

  if (!lapso || !Number.isFinite(lapso.route_id)) {
    return { closed: false, routeId: null, establishmentId: record.establishment_id };
  }

  const { data: establishments, error: establishmentsError } = await supabase
    .from("establishment")
    .select("establishment_id")
    .eq("route_id", lapso.route_id)
    .eq("is_active", true);

  if (establishmentsError) {
    return failClosed(
      "Error consultando establecimientos para cierre automatico:",
      establishmentsError,
      { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id },
    );
  }

  const establishmentIds = (establishments ?? [])
    .map((row) => row.establishment_id)
    .filter((value): value is number => Number.isFinite(value));

  if (establishmentIds.length === 0) {
    return { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id };
  }

  const { data: relations, error: relationsError } = await supabase
    .from("products_establishment")
    .select("establishment_id, product_id")
    .in("establishment_id", establishmentIds);

  if (relationsError) {
    return failClosed(
      "Error consultando products_establishment para cierre automatico:",
      relationsError,
      { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id },
    );
  }

  const productIds = [
    ...new Set(
      (relations ?? [])
        .map((row) => row.product_id)
        .filter((value): value is number => Number.isFinite(value)),
    ),
  ];

  const { data: products, error: productsError } = productIds.length === 0
    ? { data: [] as { product_id: number }[], error: null }
    : await supabase
        .from("product")
        .select("product_id")
        .in("product_id", productIds)
        .eq("is_active", true);

  if (productsError) {
    return failClosed("Error consultando productos para cierre automatico:", productsError, {
      closed: false,
      routeId: lapso.route_id,
      establishmentId: record.establishment_id,
    });
  }

  const activeProductIds =
    (products ?? [])
      .map((row) => row.product_id)
      .filter((value): value is number => Number.isFinite(value));

  const requiredActiveRelations = (relations ?? []).filter(
    (relation) =>
      Number.isFinite(relation.establishment_id) &&
      activeProductIds.includes(relation.product_id),
  );

  if (requiredActiveRelations.length === 0) {
    return { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id };
  }

  const { data: records, error: recordsError } = await supabase
    .from("check_record")
    .select("establishment_id, product_id")
    .eq("lapso_id", record.lapso_id)
    .eq("user_id", record.user_id);

  if (recordsError) {
    return failClosed(
      "Error consultando registros del lapso para cierre automatico:",
      recordsError,
      { closed: false, routeId: lapso.route_id, establishmentId: record.establishment_id },
    );
  }

  if (
    hasRouteLapsoPendingItems({
      establishmentIds,
      productRelations: requiredActiveRelations,
      activeProductIds,
      records: records ?? [],
    })
  ) {
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
