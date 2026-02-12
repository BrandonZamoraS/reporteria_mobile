"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAppRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export type LoginActionState = {
  error: string | null;
  success: boolean;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      error: "Error de configuracion de autenticacion. Revisa variables de entorno.",
      success: false,
    };
  }

  const email = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Debes ingresar correo y contrasena.",
      success: false,
    };
  }

  if (password.length < 8) {
    return {
      error: "La contrasena debe tener al menos 8 caracteres.",
      success: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      // Generic message to avoid exposing auth internals.
      error: "No fue posible iniciar sesion con esas credenciales.",
      success: false,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "No fue posible validar la sesion del usuario.",
      success: false,
    };
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!isAllowedAppRole(profile?.role)) {
    await supabase.auth.signOut();
    return {
      error: "Acceso denegado. Solo usuarios admin o rutero pueden ingresar.",
      success: false,
    };
  }

  redirect("/home");
}
