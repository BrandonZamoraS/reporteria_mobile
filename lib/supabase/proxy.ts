import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAppRole } from "@/lib/auth/roles";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieEncoding: "raw",
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isRootRoute = pathname === "/";
  const isLoginRoute = pathname === "/login";
  const isPublicAuthRoute = isRootRoute || isLoginRoute;

  if (!user && !isPublicAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const hasAccess = isAllowedAppRole(profile?.role);

  if (!hasAccess && !isPublicAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unauthorized_role");
    return NextResponse.redirect(url);
  }

  if (hasAccess && isPublicAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
