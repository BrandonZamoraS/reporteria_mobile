export const ALLOWED_APP_ROLES = ["admin", "rutero"] as const;

export type AllowedAppRole = (typeof ALLOWED_APP_ROLES)[number];

export function isAllowedAppRole(role: string | null | undefined): role is AllowedAppRole {
  return role === "admin" || role === "rutero";
}
