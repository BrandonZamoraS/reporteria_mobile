import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLoginActionState,
  shouldClearPasswordAfterLoginAttempt,
} from "./login-form-state.mjs";

test("clears only the password after invalid credentials", () => {
  const result = shouldClearPasswordAfterLoginAttempt({
    error: "No fue posible iniciar sesion con esas credenciales.",
    success: false,
    resetPassword: true,
    passwordResetNonce: 1,
  });

  assert.equal(result, true);
});

test("keeps the password when the error is not an auth failure", () => {
  const result = shouldClearPasswordAfterLoginAttempt({
    error: "La contrasena debe tener al menos 8 caracteres.",
    success: false,
    resetPassword: false,
    passwordResetNonce: 0,
  });

  assert.equal(result, false);
});

test("preserves the submitted email on login errors", () => {
  const result = buildLoginActionState({
    prevState: {
      error: null,
      success: false,
      resetPassword: false,
      passwordResetNonce: 2,
    },
    email: "rutero@empresa.com",
    error: "No fue posible iniciar sesion con esas credenciales.",
    resetPassword: true,
  });

  assert.equal(result.email, "rutero@empresa.com");
  assert.equal(result.passwordResetNonce, 3);
});
