import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AppShell from "@/app/_components/app-shell";
import { logoutAction } from "@/app/home/actions";
import { isAllowedAppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RegistroForm from "../registro-form";
import type {
  EstablishmentOption,
  ProductEstablishmentRelation,
  ProductOption,
  RegistroSource,
  RouteOption,
} from "../types";

const PROFILE_PHOTO_BUCKET = "profile-photos";

function getDisplayName(user: User | null, profileName?: string | null) {
  if (profileName?.trim()) return profileName.trim();
  if (!user) return "Juan Perez";

  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name ?? metadata.name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return user.email ?? "Usuario";
}

function parseSource(value: string | undefined): RegistroSource {
  if (value === "home") return "home";
  if (value === "pendientes") return "pendientes";
  if (value === "completadas") return "completadas";
  return "registros";
}

function parseOptionalNumber(value: string | undefined) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function buildBackHref(source: RegistroSource, routeId: number | null) {
  if (source === "home") return "/home";
  if (source === "pendientes" && routeId !== null) {
    return `/mis-rutas/${routeId}/pendientes`;
  }
  if (source === "completadas" && routeId !== null) {
    return `/mis-rutas/${routeId}/completadas`;
  }
  return "/registros";
}

export default async function RegistroNuevoPage({
  searchParams,
}: {
  searchParams: Promise<{
    routeId?: string;
    establishmentId?: string;
    productId?: string;
    source?: string;
  }>;
}) {
  const { routeId, establishmentId, productId, source } = await searchParams;
  const parsedRouteId = parseOptionalNumber(routeId);
  const parsedEstablishmentId = parseOptionalNumber(establishmentId);
  const parsedProductId = parseOptionalNumber(productId);
  const sourceValue = parseSource(source);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("user_id, role, photo_path, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.user_id || !isAllowedAppRole(profile.role)) {
    redirect("/home");
  }

  let profilePhotoUrl: string | null = null;
  if (profile.photo_path) {
    const { data } = await supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .createSignedUrl(profile.photo_path, 3600);
    profilePhotoUrl = data?.signedUrl ?? null;
  }

  let routesQuery = supabase
    .from("route")
    .select("route_id, nombre")
    .eq("is_active", true)
    .order("route_id", { ascending: true });

  if (profile.role === "rutero") {
    routesQuery = routesQuery.eq("assigned_user", profile.user_id);
  }

  const { data: routeRows } = await routesQuery;
  const routeOptions: RouteOption[] = (routeRows ?? []).map((route) => ({
    id: route.route_id,
    name: route.nombre,
  }));

  const routeIds = routeOptions.map((route) => route.id);
  let establishmentOptions: EstablishmentOption[] = [];
  let productRelations: ProductEstablishmentRelation[] = [];
  let productOptions: ProductOption[] = [];

  if (routeIds.length > 0) {
    const { data: establishmentRows } = await supabase
      .from("establishment")
      .select("establishment_id, route_id, name")
      .in("route_id", routeIds)
      .eq("is_active", true)
      .order("name", { ascending: true });

    establishmentOptions = (establishmentRows ?? []).map((establishment) => ({
      id: establishment.establishment_id,
      routeId: establishment.route_id,
      name: establishment.name,
    }));

    const establishmentIds = establishmentOptions.map((establishment) => establishment.id);

    if (establishmentIds.length > 0) {
      const { data: relationRows } = await supabase
        .from("products_establishment")
        .select("establishment_id, product_id")
        .in("establishment_id", establishmentIds);

      productRelations = (relationRows ?? []).map((relation) => ({
        establishmentId: relation.establishment_id,
        productId: relation.product_id,
      }));

      const productIds = [
        ...new Set(productRelations.map((relation) => relation.productId)),
      ];

      if (productIds.length > 0) {
        const { data: productRows } = await supabase
          .from("product")
          .select("product_id, name, sku")
          .in("product_id", productIds)
          .eq("is_active", true)
          .order("name", { ascending: true });

        productOptions = (productRows ?? []).map((product) => ({
          id: product.product_id,
          name: product.name,
          sku: product.sku,
        }));
      }
    }
  }

  const validRouteIds = new Set(routeOptions.map((option) => option.id));
  const validEstablishmentIds = new Set(
    establishmentOptions.map((option) => option.id),
  );
  const validProductIds = new Set(productOptions.map((option) => option.id));

  const initialRouteId =
    parsedRouteId !== null && validRouteIds.has(parsedRouteId) ? parsedRouteId : null;
  const initialEstablishmentId =
    parsedEstablishmentId !== null && validEstablishmentIds.has(parsedEstablishmentId)
      ? parsedEstablishmentId
      : null;
  const initialProductId =
    parsedProductId !== null && validProductIds.has(parsedProductId) ? parsedProductId : null;
  const displayName = getDisplayName(user, profile.name);

  return (
    <AppShell
      title="Crear registro"
      displayName={displayName}
      profilePhotoUrl={profilePhotoUrl}
      onLogout={logoutAction}
      contentClassName="relative flex min-h-0 flex-1 h-full w-full pt-4 overflow-hidden"
    >
      <RegistroForm
        mode="create"
        source={sourceValue}
        backHref={buildBackHref(sourceValue, initialRouteId)}
        routeOptions={routeOptions}
        establishmentOptions={establishmentOptions}
        productOptions={productOptions}
        productRelations={productRelations}
        initialRouteId={initialRouteId}
        initialEstablishmentId={initialEstablishmentId}
        initialProductId={initialProductId}
        initialSystemInventory={null}
        initialRealInventory={null}
        initialComments={null}
        existingEvidences={[]}
        recordId={null}
        submitLabel="Guardar registro"
        currentUserName={displayName}
      />
    </AppShell>
  );
}
