export type RegistroSource =
  | "home"
  | "registros"
  | "pendientes"
  | "completadas";

export type RegistroActionState = {
  error: string | null;
  success: boolean;
  recordId: number | null;
};

export type EvidenceGeoInfo = {
  lat: number;
  lng: number;
  accuracy: number | null;
  capturedAt: string;
};

export type EvidenceItem = {
  evidenceId: number;
  rawPath: string;
  imageUrl: string;
  geoInfo: EvidenceGeoInfo | null;
};

export type RegistroListItem = {
  recordId: number;
  routeId: number | null;
  routeName: string | null;
  establishmentId: number;
  establishmentName: string;
  productId: number;
  productName: string;
  productSku: string;
  comments: string | null;
  evidenceNum: number | null;
  createdAt: string;
  createdByUserId: number;
};

export type RegistroFormInput = {
  routeId: number;
  establishmentId: number;
  productId: number;
  source: RegistroSource;
  systemInventory: number | null;
  realInventory: number | null;
  comments: string | null;
};

export type RouteOption = {
  id: number;
  name: string;
};

export type EstablishmentOption = {
  id: number;
  routeId: number;
  name: string;
};

export type ProductOption = {
  id: number;
  name: string;
  sku: string;
};

export type ProductEstablishmentRelation = {
  establishmentId: number;
  productId: number;
};
