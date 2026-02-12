import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AppShell from "@/app/_components/app-shell";
import { logoutAction } from "@/app/home/actions";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMisTareasPage } from "./data";
import MisTareasView from "./mis-tareas-view";

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

export default async function MisTareasPage() {
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
    .select("user_id, photo_path")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profile?.photo_path) {
    const { data } = await supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .createSignedUrl(profile.photo_path, 3600);
    profilePhotoUrl = data?.signedUrl ?? null;
  }

  const initialData = profile?.user_id
    ? await Promise.all([
        getMisTareasPage({
          supabase,
          profileUserId: profile.user_id,
          status: "pendiente",
          offset: 0,
          limit: DEFAULT_PAGE_SIZE,
        }),
        getMisTareasPage({
          supabase,
          profileUserId: profile.user_id,
          status: "completada",
          offset: 0,
          limit: DEFAULT_PAGE_SIZE,
        }),
      ])
    : [{ items: [], hasMore: false }, { items: [], hasMore: false }];

  const [pendingPage, completedPage] = initialData;

  return (
    <AppShell
      title="Mis tareas"
      displayName={getDisplayName(user)}
      profilePhotoUrl={profilePhotoUrl}
      onLogout={logoutAction}
      contentClassName="relative flex min-h-0 flex-1 w-full pt-4"
    >
      <MisTareasView
        initialPendingTasks={pendingPage.items}
        initialPendingHasMore={pendingPage.hasMore}
        initialCompletedTasks={completedPage.items}
        initialCompletedHasMore={completedPage.hasMore}
        pageSize={DEFAULT_PAGE_SIZE}
      />
    </AppShell>
  );
}
