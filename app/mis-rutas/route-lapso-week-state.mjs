export const CURRENT_WEEK_ROUTE_LAPSO_STATUSES = ["en_curso", "completado"];

export function getCurrentWeekLapsoLabel(lapso) {
  if (!lapso) return "No hay lapso activo para esta ruta.";
  if (lapso.status === "completado") return "Ruta completada esta semana";
  return `Lapso activo ${lapso.dayLabel} (${lapso.progressPercent}%)`;
}

export function canStartCurrentWeekRoute({ lapso, canStartRoute }) {
  return canStartRoute && !lapso;
}

export function getStartRouteResultForExistingLapso(lapso) {
  if (!lapso) return null;
  if (lapso.status === "completado") {
    return {
      error:
        "Esta ruta ya fue completada esta semana. Podras iniciarla de nuevo el proximo lunes.",
      success: false,
    };
  }
  return { error: null, success: true };
}
