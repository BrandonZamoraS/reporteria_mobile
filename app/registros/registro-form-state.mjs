export function isRegistroSubmitDisabled({
  pending,
  hasClientError,
  hasLockedSelection,
  routeId,
  establishmentId,
  productId,
  totalEvidenceCount,
}) {
  if (pending) return true;
  if (hasClientError) return true;
  if (hasLockedSelection) return true;
  if (!Number.isFinite(routeId)) return true;
  if (!Number.isFinite(establishmentId)) return true;
  if (!Number.isFinite(productId)) return true;
  if (!Number.isFinite(totalEvidenceCount)) return true;
  if (totalEvidenceCount < 1) return true;
  if (totalEvidenceCount > 6) return true;

  return false;
}
