import { NextResponse } from "next/server";
import { parsePaginationParams } from "@/lib/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMisTareasPage } from "@/app/mis-tareas/data";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.user_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const { offset, limit } = parsePaginationParams(url.searchParams);
  const statusParam = url.searchParams.get("status");
  const status = statusParam === "completada" ? "completada" : "pendiente";

  const page = await getMisTareasPage({
    supabase,
    profileUserId: profile.user_id,
    status,
    offset,
    limit,
  });

  return NextResponse.json(page);
}
