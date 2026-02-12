import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AppShell from "@/app/_components/app-shell";
import { logoutAction } from "@/app/home/actions";
import { isAllowedAppRole } from "@/lib/auth/roles";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMisRutasPage } from "./data";
import MisRutasView from "./mis-rutas-view";

const PROFILE_PHOTO_BUCKET = "profile-photos";

function getDisplayName(user: User | null) {
  if (!user) return "Juan Perez";

  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name ?? metadata.name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return user.email ?? "Usuario";
}

export default async function MisRutasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profilePhotoUrl: string | null = null;

  const { data: profile } = await supabase
    .from("user_profile")
    .select("user_id, role, photo_path")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profile?.photo_path) {
    const { data } = await supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .createSignedUrl(profile.photo_path, 3600);
    profilePhotoUrl = data?.signedUrl ?? null;
  }

  if (!profile?.user_id || !isAllowedAppRole(profile.role)) {
    redirect("/home");
  }

  const { items: initialRoutes, hasMore: initialHasMore } = await getMisRutasPage({
    supabase,
    profile: { userId: profile.user_id, role: profile.role },
    offset: 0,
    limit: DEFAULT_PAGE_SIZE,
  });

  return (
    <AppShell
      title="Mis rutas"
      displayName={getDisplayName(user)}
      profilePhotoUrl={profilePhotoUrl}
      onLogout={logoutAction}
      contentClassName="relative flex min-h-0 flex-1 w-full pt-4"
    >
      <MisRutasView
        initialRoutes={initialRoutes}
        initialHasMore={initialHasMore}
        pageSize={DEFAULT_PAGE_SIZE}
      />
    </AppShell>
  );
}
