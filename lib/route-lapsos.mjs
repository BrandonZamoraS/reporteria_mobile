const COSTA_RICA_UTC_OFFSET_HOURS = -6;
const HOURS_TO_MS = 60 * 60 * 1000;

export function getNextCostaRicaMondayStartIso(nowDate = new Date()) {
  const costaRicaDate = new Date(
    nowDate.getTime() + COSTA_RICA_UTC_OFFSET_HOURS * HOURS_TO_MS,
  );
  const dayOfWeek = costaRicaDate.getUTCDay();
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;

  const nextMondayCostaRicaMidnightUtc = Date.UTC(
    costaRicaDate.getUTCFullYear(),
    costaRicaDate.getUTCMonth(),
    costaRicaDate.getUTCDate() + daysUntilMonday,
    -COSTA_RICA_UTC_OFFSET_HOURS,
    0,
    0,
    0,
  );

  return new Date(nextMondayCostaRicaMidnightUtc).toISOString();
}

export function getCurrentCostaRicaMondayStartIso(nowDate = new Date()) {
  const costaRicaDate = new Date(
    nowDate.getTime() + COSTA_RICA_UTC_OFFSET_HOURS * HOURS_TO_MS,
  );
  const dayOfWeek = costaRicaDate.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const currentMondayCostaRicaMidnightUtc = Date.UTC(
    costaRicaDate.getUTCFullYear(),
    costaRicaDate.getUTCMonth(),
    costaRicaDate.getUTCDate() - daysSinceMonday,
    -COSTA_RICA_UTC_OFFSET_HOURS,
    0,
    0,
    0,
  );

  return new Date(currentMondayCostaRicaMidnightUtc).toISOString();
}

export function isLapsoActiveAt(endAt, nowDate = new Date()) {
  const endDate = new Date(endAt);
  return !Number.isNaN(endDate.getTime()) && endDate.getTime() > nowDate.getTime();
}

function getPairKey(pair) {
  return `${Number(pair.establishmentId)}:${Number(pair.productId)}`;
}

export function isRouteLapsoFullyRegistered({ requiredPairs, registeredPairs }) {
  const required = new Set();

  for (const pair of requiredPairs) {
    if (pair.establishmentActive === false || pair.productActive === false) continue;

    const establishmentId = Number(pair.establishmentId);
    const productId = Number(pair.productId);
    if (!Number.isFinite(establishmentId) || !Number.isFinite(productId)) continue;

    required.add(getPairKey({ establishmentId, productId }));
  }

  if (required.size === 0) return false;

  const registered = new Set();
  for (const pair of registeredPairs) {
    const establishmentId = Number(pair.establishmentId);
    const productId = Number(pair.productId);
    if (!Number.isFinite(establishmentId) || !Number.isFinite(productId)) continue;

    registered.add(getPairKey({ establishmentId, productId }));
  }

  for (const key of required) {
    if (!registered.has(key)) return false;
  }

  return true;
}
