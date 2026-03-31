"use server";

import { getSupabaseServerEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createForgotPasswordSuccessState } from "../forgot-password-state.mjs";
import { getAdminResetPasswordRedirectUrl } from "./recovery-redirect.mjs";

export type ForgotPasswordActionState = {
  error: string | null;
  success: boolean;
  email: string;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return {
      error: "Debes ingresar un correo.",
      success: false,
      email,
    };
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseServerEnv();

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAdminResetPasswordRedirectUrl(process.env.NEXT_PUBLIC_ADMIN_SITE_URL),
      });
    }
  } catch {
    // Intentionally swallow auth reset errors to avoid exposing account existence.
  }

  return createForgotPasswordSuccessState(email);
}
