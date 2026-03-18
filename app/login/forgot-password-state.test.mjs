import test from "node:test";
import assert from "node:assert/strict";

import {
  createForgotPasswordPendingState,
  createForgotPasswordSuccessState,
  validateResetPasswordForm,
} from "./forgot-password-state.mjs";

test("forgot-password keeps a success response generic for security", () => {
  const result = createForgotPasswordSuccessState("rutero@empresa.com");

  assert.deepEqual(result, {
    error: null,
    success: true,
    email: "rutero@empresa.com",
  });
});

test("forgot-password pending state clears old errors", () => {
  const result = createForgotPasswordPendingState("rutero@empresa.com");

  assert.deepEqual(result, {
    error: null,
    success: false,
    email: "rutero@empresa.com",
  });
});

test("reset password validation requires matching passwords with min length", () => {
  assert.equal(
    validateResetPasswordForm({
      password: "1234567",
      confirmPassword: "1234567",
    }),
    "La contrasena debe tener al menos 8 caracteres.",
  );

  assert.equal(
    validateResetPasswordForm({
      password: "12345678",
      confirmPassword: "87654321",
    }),
    "Las contrasenas no coinciden.",
  );

  assert.equal(
    validateResetPasswordForm({
      password: "12345678",
      confirmPassword: "12345678",
    }),
    null,
  );
});
