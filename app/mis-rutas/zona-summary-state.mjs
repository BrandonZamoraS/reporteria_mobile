export function getEstablishmentRouteStatus({
  totalProducts,
  completedProducts,
  hasRecordedProducts,
}) {
  if (totalProducts <= 0) {
    return hasRecordedProducts ? "completed" : "pending";
  }

  if (completedProducts <= 0) {
    return "pending";
  }

  if (completedProducts < totalProducts) {
    return "in_progress";
  }

  return "completed";
}

export function buildEstablishmentProgressById({
  establishmentIds,
  productRelations,
  activeProductIds,
  records,
}) {
  const activeProductIdSet = new Set(activeProductIds);
  const activeProductsByEstablishment = new Map();
  const completedProductsByEstablishment = new Map();
  const progressById = new Map();

  for (const establishmentId of establishmentIds) {
    progressById.set(establishmentId, {
      totalProducts: 0,
      completedProducts: 0,
    });
  }

  for (const relation of productRelations) {
    if (!activeProductIdSet.has(relation.product_id)) {
      continue;
    }

    let relatedProductIds = activeProductsByEstablishment.get(relation.establishment_id);
    if (!relatedProductIds) {
      relatedProductIds = new Set();
      activeProductsByEstablishment.set(relation.establishment_id, relatedProductIds);
    }

    relatedProductIds.add(relation.product_id);
  }

  for (const record of records) {
    const relatedProductIds = activeProductsByEstablishment.get(record.establishment_id);
    if (!relatedProductIds?.has(record.product_id)) {
      continue;
    }

    let completedProductIds = completedProductsByEstablishment.get(record.establishment_id);
    if (!completedProductIds) {
      completedProductIds = new Set();
      completedProductsByEstablishment.set(record.establishment_id, completedProductIds);
    }

    completedProductIds.add(record.product_id);
  }

  for (const establishmentId of establishmentIds) {
    progressById.set(establishmentId, {
      totalProducts: activeProductsByEstablishment.get(establishmentId)?.size ?? 0,
      completedProducts: completedProductsByEstablishment.get(establishmentId)?.size ?? 0,
    });
  }

  return progressById;
}
