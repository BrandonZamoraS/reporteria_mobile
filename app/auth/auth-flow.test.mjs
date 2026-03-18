import test from "node:test";
import assert from "node:assert/strict";

import {
  getLoginUrlErrorMessage,
  getSiteUrl,
  resolveAuthCallbackOutcome,
} from "./auth-flow.mjs";

test("maps token-expired query param to the reset-link message", () => {
  assert.equal(
    getLoginUrlErrorMessage("token-expired"),
    "El enlace ha expirado o ya fue usado. Solicita uno nuevo.",
  );
});

test("falls back to localhost when NEXT_PUBLIC_SITE_URL is missing", () => {
  assert.equal(getSiteUrl(undefined), "http://localhost:3000");
  assert.equal(getSiteUrl(""), "http://localhost:3000");
});

test("authorizes a profile matched directly by auth_user_id", () => {
  const result = resolveAuthCallbackOutcome({
    profileByAuthUserId: {
      user_id: 10,
      role: "rutero",
      is_active: true,
      auth_user_id: "auth-1",
      email: "rutero@empresa.com",
    },
    profileByEmail: null,
  });

  assert.deepEqual(result, {
    status: "authorized",
    profile: {
      user_id: 10,
      role: "rutero",
      is_active: true,
      auth_user_id: "auth-1",
      email: "rutero@empresa.com",
    },
    shouldLinkAuthUserId: false,
    redirectTo: "/home",
    roleCookieValue: "rutero",
  });
});

test("links the first google login through the email fallback", () => {
  const result = resolveAuthCallbackOutcome({
    profileByAuthUserId: null,
    profileByEmail: {
      user_id: 11,
      role: "admin",
      is_active: true,
      auth_user_id: null,
      email: "admin@empresa.com",
    },
  });

  assert.equal(result.status, "authorized");
  assert.equal(result.shouldLinkAuthUserId, true);
  assert.equal(result.roleCookieValue, "admin");
});

test("rejects the callback when no allowed profile exists", () => {
  const result = resolveAuthCallbackOutcome({
    profileByAuthUserId: null,
    profileByEmail: null,
  });

  assert.deepEqual(result, {
    status: "no-role",
    profile: null,
    shouldLinkAuthUserId: false,
    redirectTo: "/login?error=no-role",
    roleCookieValue: null,
  });
});

test("rejects inactive profiles even when the role is allowed", () => {
  const result = resolveAuthCallbackOutcome({
    profileByAuthUserId: {
      user_id: 12,
      role: "rutero",
      is_active: false,
      auth_user_id: "auth-2",
      email: "inactivo@empresa.com",
    },
    profileByEmail: null,
  });

  assert.deepEqual(result, {
    status: "inactive",
    profile: {
      user_id: 12,
      role: "rutero",
      is_active: false,
      auth_user_id: "auth-2",
      email: "inactivo@empresa.com",
    },
    shouldLinkAuthUserId: false,
    redirectTo: "/login?error=inactive",
    roleCookieValue: null,
  });
});
