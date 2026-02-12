import type { SupabaseClient } from "@supabase/supabase-js";
import type { MisTarea, TaskStatus } from "./types";

export type MisTareasFilter = TaskStatus;

function formatDateLabel(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]}`;
}

function mapStatus(taskState: string): { status: TaskStatus; label: string } {
  if (taskState === "Completada") {
    return { status: "completada", label: "Completada" };
  }
  if (taskState === "Atrasada") {
    return { status: "pendiente", label: "Atrasada" };
  }
  if (taskState === "Incompleta") {
    return { status: "pendiente", label: "Incompleta" };
  }
  return { status: "pendiente", label: "Pendiente" };
}

type Params = {
  supabase: SupabaseClient;
  profileUserId: number;
  status: MisTareasFilter;
  offset: number;
  limit: number;
};

export async function getMisTareasPage({
  supabase,
  profileUserId,
  status,
  offset,
  limit,
}: Params): Promise<{ items: MisTarea[]; hasMore: boolean }> {
  let userTasksQuery = supabase
    .from("user_tasks")
    .select("task_id, task_state, comments")
    .eq("user_id", profileUserId)
    .order("task_id", { ascending: true })
    .range(offset, offset + limit);

  if (status === "completada") {
    userTasksQuery = userTasksQuery.eq("task_state", "Completada");
  } else {
    userTasksQuery = userTasksQuery.neq("task_state", "Completada");
  }

  const { data: userTasks } = await userTasksQuery;
  const rows = userTasks ?? [];
  const hasMore = rows.length > limit;
  const visibleRows = hasMore ? rows.slice(0, limit) : rows;

  const taskIds = visibleRows.map((entry) => entry.task_id).filter(Boolean);

  if (taskIds.length === 0) {
    return { items: [], hasMore };
  }

  const { data: taskRows } = await supabase
    .from("task")
    .select("task_id, title, description, due_to")
    .in("task_id", taskIds);

  const taskById = new Map((taskRows ?? []).map((task) => [task.task_id, task]));
  const now = new Date();

  const items = visibleRows
    .map((entry) => {
      const task = taskById.get(entry.task_id);
      if (!task) return null;

      const statusInfo = mapStatus(entry.task_state ?? "Pendiente");
      const dueDate = task.due_to ? new Date(task.due_to) : null;
      const isOverdueByDate =
        statusInfo.status !== "completada" &&
        !!dueDate &&
        !Number.isNaN(dueDate.getTime()) &&
        dueDate.getTime() < now.getTime();

      return {
        id: task.task_id,
        title: task.title,
        description: task.description,
        dueDateLabel: formatDateLabel(task.due_to),
        comment: entry.comments ?? null,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        overdue: statusInfo.label === "Atrasada" || isOverdueByDate,
      } satisfies MisTarea;
    })
    .filter((task): task is MisTarea => task !== null);

  return { items, hasMore };
}
