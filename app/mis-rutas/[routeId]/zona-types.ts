export type ZonaSource = "pendientes" | "completadas";

export type ZonaListItem = {
  id: number;
  name: string;
  meta: string;
  href?: string;
};