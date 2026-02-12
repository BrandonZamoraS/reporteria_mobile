import type { SupabaseClient } from "@supabase/supabase-js";
import type { AllowedAppRole } from "@/lib/auth/roles";
import type { RegistroListItem } from "./types";

type Params = {
  supabase: SupabaseClient;
  profileUserId: number;
  profileRole: AllowedAppRole;
  offset: number;
  limit: number;
};

export async function getRegistrosPage({
  supabase,
  profileUserId,
  profileRole,
  offset,
  limit,
}: Params): Promise<{ items: RegistroListItem[]; hasMore: boolean }> {
  let recordsQuery = supabase
    .from("check_record")
    .select(
      "record_id, time_date, comments, evidence_num, product_id, establishment_id, user_id",
    )
    .order("time_date", { ascending: false })
    .range(offset, offset + limit);

  if (profileRole === "rutero") {
    recordsQuery = recordsQuery.eq("user_id", profileUserId);
  }

  const { data: checkRecordRows } = await recordsQuery;
  const rows = checkRecordRows ?? [];
  const hasMore = rows.length > limit;
  const visibleRows = hasMore ? rows.slice(0, limit) : rows;

  const productIds = [
    ...new Set(visibleRows.map((row) => row.product_id).filter(Boolean)),
  ] as number[];
  const establishmentIds = [
    ...new Set(visibleRows.map((row) => row.establishment_id).filter(Boolean)),
  ] as number[];

  const productById = new Map<number, { name: string; sku: string }>();
  const establishmentById = new Map<number, { name: string; routeId: number | null }>();
  const routeById = new Map<number, string>();

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("product")
      .select("product_id, name, sku")
      .in("product_id", productIds);

    for (const product of products ?? []) {
      productById.set(product.product_id, {
        name: product.name,
        sku: product.sku,
      });
    }
  }

  if (establishmentIds.length > 0) {
    const { data: establishments } = await supabase
      .from("establishment")
      .select("establishment_id, name, route_id")
      .in("establishment_id", establishmentIds);

    for (const establishment of establishments ?? []) {
      establishmentById.set(establishment.establishment_id, {
        name: establishment.name,
        routeId: establishment.route_id ?? null,
      });
    }
  }

  const routeIds = [
    ...new Set(
      [...establishmentById.values()]
        .map((value) => value.routeId)
        .filter((value): value is number => typeof value === "number"),
    ),
  ];

  if (routeIds.length > 0) {
    const { data: routes } = await supabase
      .from("route")
      .select("route_id, nombre")
      .in("route_id", routeIds);

    for (const route of routes ?? []) {
      routeById.set(route.route_id, route.nombre);
    }
  }

  const items: RegistroListItem[] = visibleRows.map((row) => {
    const product = productById.get(row.product_id);
    const establishment = establishmentById.get(row.establishment_id);
    const routeId = establishment?.routeId ?? null;

    return {
      recordId: row.record_id,
      routeId,
      routeName:
        routeId !== null ? (routeById.get(routeId) ?? `Ruta #${routeId}`) : null,
      establishmentId: row.establishment_id,
      establishmentName:
        establishment?.name ?? `Establecimiento #${row.establishment_id}`,
      productId: row.product_id,
      productName: product?.name ?? `Producto #${row.product_id}`,
      productSku: product?.sku ?? "-",
      comments: row.comments ?? null,
      evidenceNum: row.evidence_num ?? null,
      createdAt: row.time_date,
      createdByUserId: row.user_id,
    };
  });

  return { items, hasMore };
}
