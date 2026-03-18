export type RouteListItem = {
  id: number;
  name: string;
  supermarketsLabel: string;
  activeLapsoId: number | null;
  lapsoLabel: string | null;
};

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  wazeHref: string | null;
};

export type RouteLapsoSummary = {
  lapsoId: number;
  routeId: number;
  userId: number;
  status: "en_curso" | "completado" | "incompleto" | "vencido";
  startAt: string;
  endAt: string;
  durationDays: number;
  dayLabel: string;
  progressPercent: number;
};
