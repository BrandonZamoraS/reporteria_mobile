"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error: string | null;
  success: boolean;
};

const PROFILE_PHOTO_BUCKET = "profile-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatDbError(prefix: string, rawMessage: string | undefined) {
  if (!rawMessage) return prefix;
  return `${prefix} Detalle: ${rawMessage}`;
}

function hasPasswordRequirements(password: string) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return (
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSymbol
  );
}

function getDefaultName(email: string | undefined, metadata: Record<string, unknown>) {
  const fullName = metadata.full_name ?? metadata.name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (email) {
    return email.split("@")[0] ?? "Usuario";
  }

  return "Usuario";
}

async function getOrCreateProfileUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      userId: null,
      photoPath: null,
      error: "Sesion no valida. Inicia sesion de nuevo.",
    };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("user_profile")
    .select("user_id, photo_path")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return {
      supabase,
      user,
      userId: null,
      photoPath: null,
      error: formatDbError(
        "No se pudo leer tu perfil actual.",
        existingProfileError.message,
      ),
    };
  }

  if (existingProfile?.user_id) {
    return {
      supabase,
      user,
      userId: existingProfile.user_id,
      photoPath: existingProfile.photo_path ?? null,
      error: null,
    };
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fallbackName = getDefaultName(user.email, metadata);

  const { data: createdProfile, error: createdProfileError } = await supabase
    .from("user_profile")
    .insert({
      auth_user_id: user.id,
      name: fallbackName,
      role: "visitante",
    })
    .select("user_id, photo_path")
    .single();

  if (createdProfileError || !createdProfile) {
    return {
      supabase,
      user,
      userId: null,
      photoPath: null,
      error: formatDbError(
        "No se pudo crear tu perfil.",
        createdProfileError?.message,
      ),
    };
  }

  return {
    supabase,
    user,
    userId: createdProfile.user_id,
    photoPath: createdProfile.photo_path ?? null,
    error: null,
  };
}

export async function uploadProfilePhotoAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const uploadedPhoto = formData.get("profilePhoto");

  if (!(uploadedPhoto instanceof File) || uploadedPhoto.size <= 0) {
    return {
      error: "No se selecciono una foto valida.",
      success: false,
    };
  }

  if (!ALLOWED_PHOTO_TYPES.includes(uploadedPhoto.type)) {
    return {
      error: "La foto debe ser JPG, PNG o WEBP.",
      success: false,
    };
  }

  if (uploadedPhoto.size > MAX_PHOTO_BYTES) {
    return {
      error: "La foto no puede superar 5MB.",
      success: false,
    };
  }

  const ctx = await getOrCreateProfileUserId();
  if (ctx.error || !ctx.user || !ctx.userId) {
    return { error: ctx.error ?? "No se pudo preparar tu perfil.", success: false };
  }

  const extension = uploadedPhoto.type === "image/png"
    ? "png"
    : uploadedPhoto.type === "image/webp"
    ? "webp"
    : "jpg";
  const newPath = `${ctx.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await ctx.supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(newPath, uploadedPhoto, {
      upsert: false,
      contentType: uploadedPhoto.type,
    });

  if (uploadError) {
    return {
      error: formatDbError("No se pudo subir la foto.", uploadError.message),
      success: false,
    };
  }

  const { error: updateError } = await ctx.supabase
    .from("user_profile")
    .update({ photo_path: newPath })
    .eq("user_id", ctx.userId);

  if (updateError) {
    await ctx.supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([newPath]);
    return {
      error: formatDbError("No se pudo asociar la foto al perfil.", updateError.message),
      success: false,
    };
  }

  if (ctx.photoPath) {
    await ctx.supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([ctx.photoPath]);
  }

  return { error: null, success: true };
}

export async function removeProfilePhotoAction(): Promise<ProfileActionState> {
  const ctx = await getOrCreateProfileUserId();
  if (ctx.error || !ctx.userId) {
    return { error: ctx.error ?? "No se pudo preparar tu perfil.", success: false };
  }

  if (ctx.photoPath) {
    const { error: removeError } = await ctx.supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .remove([ctx.photoPath]);

    if (removeError) {
      return {
        error: formatDbError("No se pudo quitar la foto.", removeError.message),
        success: false,
      };
    }
  }

  const { error: updateError } = await ctx.supabase
    .from("user_profile")
    .update({ photo_path: null })
    .eq("user_id", ctx.userId);

  if (updateError) {
    return {
      error: formatDbError("No se pudo actualizar el perfil al quitar foto.", updateError.message),
      success: false,
    };
  }

  return { error: null, success: true };
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const phoneNum = String(formData.get("phone") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name) {
    return { error: "El nombre es obligatorio.", success: false };
  }

  const ctx = await getOrCreateProfileUserId();
  if (ctx.error || !ctx.user || !ctx.userId) {
    return { error: ctx.error ?? "No se pudo preparar tu perfil.", success: false };
  }

  const { error: profileError } = await ctx.supabase
    .from("user_profile")
    .update({
      name,
      phone_num: phoneNum || null,
    })
    .eq("user_id", ctx.userId);

  if (profileError) {
    return {
      error: formatDbError(
        "No se pudo actualizar tu perfil.",
        profileError.message,
      ),
      success: false,
    };
  }

  const wantsPasswordChange = !!currentPassword || !!newPassword || !!confirmPassword;

  if (!wantsPasswordChange) {
    return { error: null, success: true };
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      error:
        "No se cambio la contrasena: debes completar contrasena actual, nueva y confirmacion.",
      success: false,
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error:
        "No se cambio la contrasena: la nueva contrasena y la confirmacion no coinciden.",
      success: false,
    };
  }

  if (!hasPasswordRequirements(newPassword)) {
    return {
      error:
        "No se cambio la contrasena: debe tener 8+ caracteres, mayuscula, minuscula, numero y simbolo.",
      success: false,
    };
  }

  if (newPassword === currentPassword) {
    return {
      error:
        "No se cambio la contrasena: la nueva contrasena debe ser diferente a la actual.",
      success: false,
    };
  }

  if (!ctx.user.email) {
    return {
      error:
        "No se cambio la contrasena: tu cuenta no tiene email valido para verificar contrasena actual.",
      success: false,
    };
  }

  const { error: signInError } = await ctx.supabase.auth.signInWithPassword({
    email: ctx.user.email,
    password: currentPassword,
  });

  if (signInError) {
    return {
      error:
        "No se cambio la contrasena: la contrasena actual es incorrecta.",
      success: false,
    };
  }

  const { error: passwordError } = await ctx.supabase.auth.updateUser({
    password: newPassword,
  });

  if (passwordError) {
    return {
      error: formatDbError(
        "No se pudo actualizar la contrasena.",
        passwordError.message,
      ),
      success: false,
    };
  }

  return { error: null, success: true };
}
