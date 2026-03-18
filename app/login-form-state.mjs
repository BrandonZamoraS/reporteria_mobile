/**
 * @typedef {object} LoginFormActionState
 * @property {string | null} error
 * @property {boolean} success
 * @property {boolean} resetPassword
 * @property {number} passwordResetNonce
 * @property {string | undefined} [email]
 */

/**
 * Builds the canonical login action state used by the form and server action.
 *
 * @param {{
 *   prevState: LoginFormActionState;
 *   email?: string;
 *   error: string | null;
 *   success?: boolean;
 *   resetPassword?: boolean;
 * }} args
 * @returns {LoginFormActionState}
 */
export function buildLoginActionState({
  prevState,
  email = "",
  error,
  success = false,
  resetPassword = false,
}) {
  return {
    error,
    success,
    resetPassword,
    passwordResetNonce: resetPassword && !success
      ? prevState.passwordResetNonce + 1
      : prevState.passwordResetNonce,
    email,
  };
}

/**
 * Clears the password only after a real credential rejection.
 *
 * @param {LoginFormActionState} state
 * @returns {boolean}
 */
export function shouldClearPasswordAfterLoginAttempt(state) {
  return state.resetPassword && !state.success;
}

/**
 * Returns a stable key for the password input that changes only when the
 * password should be cleared after a failed login attempt.
 *
 * @param {LoginFormActionState} state
 * @returns {string}
 */
export function getPasswordInputKey(state) {
  return `password-${state.passwordResetNonce}`;
}
