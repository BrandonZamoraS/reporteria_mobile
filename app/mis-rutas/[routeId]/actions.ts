"use server";

import { revalidatePath } from "next/cache";
import { isAllowedAppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDurationDaysFromVisitPeriod } from "@/lib/route-lapsos";

export type StartRouteState = {
  error: string | null;
  success: boolean;
};

const INITIAL_START_ROUTE_STATE: StartRouteState = {
  error: null,
  success: false,
};

export async function startRouteAction(
  _prevState: StartRouteState,
  formData: FormData,
): Promise<StartRouteState> {
  const routeId = Number(String(formData.get("routeId") ?? ""));

  if (!Number.isFinite(routeId)) {
    return { ...INITIAL_START_ROUTE_STATE, error: "Ruta invalida." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...INITIAL_START_ROUTE_STATE, error: "Sesion no valida." };
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("user_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.user_id || !isAllowedAppRole(profile.role)) {
    return {
      ...INITIAL_START_ROUTE_STATE,
      error: "Solo usuarios admin o rutero pueden iniciar la ruta.",
    };
  }

  const { data: routeRow } = await supabase
    .from("route")
    .select("route_id, assigned_user, visit_period")
    .eq("route_id", routeId)
    .maybeSingle();

  if (!routeRow?.assigned_user) {
    return {
      ...INITIAL_START_ROUTE_STATE,
      error: "La ruta no tiene rutero asignado.",
    };
  }

  if (profile.role === "rutero" && routeRow.assigned_user !== profile.user_id) {
    return {
      ...INITIAL_START_ROUTE_STATE,
      error: "No tienes asignada esta ruta.",
    };
  }

  const { data: activeLapso } = await supabase
    .from("route_lapso")
    .select("lapso_id")
    .eq("route_id", routeId)
    .eq("user_id", routeRow.assigned_user)
    .eq("status", "en_curso")
    .limit(1)
    .maybeSingle();

  if (!activeLapso) {
    const durationDays = getDurationDaysFromVisitPeriod(routeRow.visit_period);
    const startAt = new Date();
    const endAt = new Date(startAt);
    endAt.setUTCDate(endAt.getUTCDate() + durationDays);

    const { error } = await supabase.from("route_lapso").insert({
      route_id: routeId,
      user_id: routeRow.assigned_user,
      duration_days: durationDays,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: "en_curso",
    });

    if (error) {
      return { ...INITIAL_START_ROUTE_STATE, error: "No se pudo iniciar la ruta." };
    }
  }

  revalidatePath("/mis-rutas");
  revalidatePath(`/mis-rutas/${routeId}`);
  return { error: null, success: true };
}
