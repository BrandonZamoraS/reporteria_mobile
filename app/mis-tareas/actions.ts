"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CompleteTaskState = {
  error: string | null;
  success: boolean;
};

const INITIAL_COMPLETE_TASK_STATE: CompleteTaskState = {
  error: null,
  success: false,
};

export async function completeTaskAction(
  _prevState: CompleteTaskState,
  formData: FormData,
): Promise<CompleteTaskState> {
  const rawTaskId = String(formData.get("taskId") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const taskId = Number(rawTaskId);

  if (!Number.isFinite(taskId)) {
    return { ...INITIAL_COMPLETE_TASK_STATE, error: "Tarea invalida." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ...INITIAL_COMPLETE_TASK_STATE, error: "Sesion no valida." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.user_id) {
    return { ...INITIAL_COMPLETE_TASK_STATE, error: "No se encontro tu perfil." };
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from("user_tasks")
    .update({
      task_state: "Completada",
      comments: comment || null,
    })
    .eq("user_id", profile.user_id)
    .eq("task_id", taskId)
    .eq("task_state", "Pendiente")
    .select("task_id")
    .maybeSingle();

  if (updateError) {
    return { ...INITIAL_COMPLETE_TASK_STATE, error: "No se pudo completar la tarea." };
  }

  if (!updatedTask) {
    return {
      ...INITIAL_COMPLETE_TASK_STATE,
      error: "La tarea ya no esta pendiente o no te pertenece.",
    };
  }

  revalidatePath("/mis-tareas");
  return { error: null, success: true };
}
