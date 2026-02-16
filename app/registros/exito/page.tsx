import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/app/_components/app-shell";
import { logoutAction } from "@/app/home/actions";
import { isAllowedAppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function parseOptionalNumber(value: string | undefined) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function RegistroSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    recordId?: string;
    backHref?: string;
    source?: string;
    routeId?: string;
    establishmentId?: string;
  }>;
}) {
  const { recordId, backHref, source, routeId, establishmentId } = await searchParams;
  const parsedRouteId = parseOptionalNumber(routeId);
  const parsedEstablishmentId = parseOptionalNumber(establishmentId);

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

  return (
    <AppShell
      title="Registro guardado"
      displayName={getDisplayName(user, profile.name)}
      profilePhotoUrl={profilePhotoUrl}
      onLogout={logoutAction}
      contentClassName="relative flex min-h-0 flex-1 w-full pt-4"
    >
      <div className="flex h-full w-full flex-col justify-center gap-4">
        <div className="rounded-[12px] border border-[#B3B5B3] bg-white p-4 text-center">
          <p className="m-0 text-[16px] leading-none font-normal text-[#0D3233]">
            Se registro correctamente
          </p>
          <p className="m-0 mt-2 text-[13px] leading-none font-normal text-[#5A7984]">
            El registro fue guardado.
          </p>
          {recordId ? (
            <p className="m-0 mt-2 text-[12px] leading-none font-normal text-[#405C62]">
              Registro #{recordId}
            </p>
          ) : null}
        </div>

        {parsedRouteId && parsedEstablishmentId && source ? (
          <Link
            href={`/mis-rutas/${parsedRouteId}/establecimientos/${parsedEstablishmentId}?from=${source}`}
            className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#0D3233] text-[14px] leading-none font-normal text-white"
          >
            Registrar otro producto
          </Link>
        ) : null}

        <Link
          href="/registros"
          className="flex h-11 w-full items-center justify-center rounded-[12px] border border-[#8A9BA7] bg-white text-[14px] leading-none font-normal text-[#0D3233] shadow-[0_2px_8px_0_#0D32330F]"
        >
          Ir a registros
        </Link>
      </div>
    </AppShell>
  );
}
