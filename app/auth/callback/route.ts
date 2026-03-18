import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthCallbackOutcome } from "../auth-flow.mjs";

const ROLE_COOKIE_NAME = "app_role";
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 8;

function createSupabaseRouteClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const responseCookies: Array<{
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieEncoding: "raw",
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        responseCookies.push(...cookiesToSet);
      },
    },
  });

  return {
    supabase,
    applyCookies(response: NextResponse) {
      responseCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    },
  };
}

function withClearedRoleCookie(response: NextResponse) {
  response.cookies.set(ROLE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function GET(request: NextRequest) {
  const supabaseContext = createSupabaseRouteClient(request);

  if (!supabaseContext) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  const { supabase, applyCookies } = supabaseContext;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const redirectWithCookies = (pathname: string) => {
    const response = NextResponse.redirect(new URL(pathname, request.url));
    return applyCookies(response);
  };

  const signOutAndRedirect = async (pathname: string) => {
    await supabase.auth.signOut();
    return withClearedRoleCookie(redirectWithCookies(pathname));
  };

  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (error) {
      return signOutAndRedirect("/login?error=token-expired");
    }

    return redirectWithCookies("/auth/reset-contrasena");
  }

  if (!code) {
    return signOutAndRedirect("/login?error=oauth");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return signOutAndRedirect("/login?error=oauth");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return signOutAndRedirect("/login?error=oauth");
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const profileSelect = "user_id, role, is_active, auth_user_id, email";

  const { data: profileByAuthUserId, error: authProfileError } = await supabase
    .from("user_profile")
    .select(profileSelect)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (authProfileError) {
    return signOutAndRedirect("/login?error=oauth");
  }

  let profileByEmail = null;

  if (!profileByAuthUserId) {
    const { data: fallbackProfile, error: fallbackProfileError } = await supabase
      .from("user_profile")
      .select(profileSelect)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (fallbackProfileError) {
      return signOutAndRedirect("/login?error=oauth");
    }

    profileByEmail = fallbackProfile;
  }

  const outcome = resolveAuthCallbackOutcome({
    profileByAuthUserId,
    profileByEmail,
  });

  if (outcome.status !== "authorized" || !outcome.profile) {
    return signOutAndRedirect(outcome.redirectTo);
  }

  if (outcome.shouldLinkAuthUserId) {
    const { error: linkError } = await supabase
      .from("user_profile")
      .update({
        auth_user_id: user.id,
        email: normalizedEmail,
      })
      .eq("user_id", outcome.profile.user_id);

    if (linkError) {
      return signOutAndRedirect("/login?error=oauth");
    }
  }

  const { error: sessionLogError } = await supabase
    .from("user_session_log")
    .insert({
      user_id: outcome.profile.user_id,
      auth_user_id: user.id,
      user_agent: request.headers.get("user-agent"),
    });

  if (sessionLogError) {
    return signOutAndRedirect("/login?error=oauth");
  }

  const response = redirectWithCookies(outcome.redirectTo);
  response.cookies.set(ROLE_COOKIE_NAME, outcome.roleCookieValue ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ROLE_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
