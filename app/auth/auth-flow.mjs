/**
 * @typedef {object} AuthProfile
 * @property {number} user_id
 * @property {string | null | undefined} role
 * @property {boolean} is_active
 * @property {string | null | undefined} auth_user_id
 * @property {string | null | undefined} email
 */

const LOGIN_URL_ERROR_MESSAGES = {
  oauth: "No fue posible completar el inicio de sesion con Google.",
  "no-role": "Tu cuenta no tiene permisos para ingresar a la aplicacion.",
  inactive: "Tu cuenta esta inactiva. Contacta a un administrador.",
  "token-expired": "El enlace ha expirado o ya fue usado. Solicita uno nuevo.",
  unauthorized_role: "Acceso denegado. Solo usuarios admin o rutero pueden ingresar.",
};

function isAllowedAppRole(role) {
  return role === "admin" || role === "rutero";
}

/**
 * @param {string | null | undefined} code
 * @returns {string | null}
 */
export function getLoginUrlErrorMessage(code) {
  if (!code) return null;
  return LOGIN_URL_ERROR_MESSAGES[code] ?? LOGIN_URL_ERROR_MESSAGES.oauth;
}

/**
 * @param {string | undefined} siteUrl
 * @returns {string}
 */
export function getSiteUrl(siteUrl) {
  const normalized = typeof siteUrl === "string" ? siteUrl.trim() : "";
  return normalized || "http://localhost:3000";
}

/**
 * @param {{
 *   profileByAuthUserId: AuthProfile | null;
 *   profileByEmail: AuthProfile | null;
 * }} args
 * @returns {{
 *   status: "authorized" | "inactive" | "no-role";
 *   profile: AuthProfile | null;
 *   shouldLinkAuthUserId: boolean;
 *   redirectTo: string;
 *   roleCookieValue: string | null;
 * }}
 */
export function resolveAuthCallbackOutcome({
  profileByAuthUserId,
  profileByEmail,
}) {
  const profile = profileByAuthUserId ?? profileByEmail;

  if (!profile || !isAllowedAppRole(profile.role)) {
    return {
      status: "no-role",
      profile: null,
      shouldLinkAuthUserId: false,
      redirectTo: "/login?error=no-role",
      roleCookieValue: null,
    };
  }

  if (!profile.is_active) {
    return {
      status: "inactive",
      profile,
      shouldLinkAuthUserId: false,
      redirectTo: "/login?error=inactive",
      roleCookieValue: null,
    };
  }

  return {
    status: "authorized",
    profile,
    shouldLinkAuthUserId: !profileByAuthUserId && !!profileByEmail,
    redirectTo: "/home",
    roleCookieValue: profile.role,
  };
}
