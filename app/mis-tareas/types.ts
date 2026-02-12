export type TaskStatus = "pendiente" | "completada";

export type MisTarea = {
  id: number;
  title: string;
  description: string | null;
  dueDateLabel: string | null;
  comment: string | null;
  status: TaskStatus;
  statusLabel: string;
  overdue: boolean;
};
