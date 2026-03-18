/**
 * @typedef {object} ForgotPasswordState
 * @property {string | null} error
 * @property {boolean} success
 * @property {string} email
 */

/**
 * @param {string} email
 * @returns {ForgotPasswordState}
 */
export function createForgotPasswordPendingState(email) {
  return {
    error: null,
    success: false,
    email,
  };
}

/**
 * Always returns a generic success state to avoid exposing whether the email exists.
 *
 * @param {string} email
 * @returns {ForgotPasswordState}
 */
export function createForgotPasswordSuccessState(email) {
  return {
    error: null,
    success: true,
    email,
  };
}

/**
 * @param {{ password: string; confirmPassword: string }} args
 * @returns {string | null}
 */
export function validateResetPasswordForm({ password, confirmPassword }) {
  if (password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres.";
  }

  if (password !== confirmPassword) {
    return "Las contrasenas no coinciden.";
  }

  return null;
}
