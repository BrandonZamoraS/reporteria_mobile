const DEFAULT_ADMIN_SITE_URL = "https://admin.hmsucomer.com";

/**
 * @param {string | null | undefined} adminSiteUrl
 * @returns {string}
 */
export function getAdminSiteUrl(adminSiteUrl) {
  const normalized = typeof adminSiteUrl === "string" ? adminSiteUrl.trim() : "";

  if (!normalized) {
    return DEFAULT_ADMIN_SITE_URL;
  }

  return normalized.replace(/\/+$/, "");
}

/**
 * @param {string | null | undefined} adminSiteUrl
 * @returns {string}
 */
export function getAdminResetPasswordRedirectUrl(adminSiteUrl) {
  return `${getAdminSiteUrl(adminSiteUrl)}/auth/reset-contrasena`;
}
