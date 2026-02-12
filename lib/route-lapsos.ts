export type RouteLapsoStatus = "en_curso" | "completado" | "incompleto" | "vencido";

export function getDurationDaysFromVisitPeriod(visitPeriod: string | null | undefined) {
  if (!visitPeriod) return 7;

  const match = visitPeriod.match(/\d+/);
  if (!match) return 7;

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed) || parsed < 1) return 7;
  return Math.floor(parsed);
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
