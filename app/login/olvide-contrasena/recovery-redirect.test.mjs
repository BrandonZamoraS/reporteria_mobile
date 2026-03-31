import test from "node:test";
import assert from "node:assert/strict";

import { getAdminResetPasswordRedirectUrl } from "./recovery-redirect.mjs";

test("defaults the recovery redirect to the admin reset page", () => {
  assert.equal(
    getAdminResetPasswordRedirectUrl(undefined),
    "https://admin.hmsucomer.com/auth/reset-contrasena",
  );
});

test("builds the admin recovery redirect from a configured admin base URL", () => {
  assert.equal(
    getAdminResetPasswordRedirectUrl("https://admin.hmsucomer.com/"),
    "https://admin.hmsucomer.com/auth/reset-contrasena",
  );
});
