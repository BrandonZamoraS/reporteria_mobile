# Login OAuth Reset Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add login UX improvements, Google OAuth callback handling, forgot-password flow, and password reset flow without changing the app's visual language.

**Architecture:** Keep the existing email/password login action as the source of truth for server-side validation, add a focused client helper for URL-driven auth errors, and implement the external auth callback in `app/auth/callback/route.ts`. Reuse the existing Supabase server client and `user_profile` role checks so Google sign-in, recovery links, and protected-route redirection all follow the same authorization rules.

**Tech Stack:** Next.js App Router, React 19, Server Actions, Route Handlers, Supabase SSR/Auth, TypeScript, Node test runner

---

### Task 1: Login state and auth helper tests

**Files:**
- Modify: `app/login-form-state.test.mjs`
- Create: `app/auth/auth-flow.test.mjs`
- Create: `app/auth/auth-flow.mjs`

**Step 1: Write the failing tests**

Add tests that cover:
- preserving the submitted email on login errors
- mapping `?error=` query params to user-facing messages
- computing the site URL fallback
- deriving callback outcomes for OAuth profile lookup and password recovery

**Step 2: Run tests to verify they fail**

Run: `node --test app/login-form-state.test.mjs app/auth/auth-flow.test.mjs`
Expected: FAIL because new helpers and expectations do not exist yet.

**Step 3: Write minimal implementation**

Implement small pure helpers in `app/auth/auth-flow.mjs` and adjust login state helpers so the tests can pass.

**Step 4: Run tests to verify they pass**

Run: `node --test app/login-form-state.test.mjs app/auth/auth-flow.test.mjs`
Expected: PASS

### Task 2: Login UI and forgot-password tests

**Files:**
- Create: `app/login/forgot-password-state.test.mjs`
- Create: `app/login/forgot-password-state.mjs`
- Modify: `app/login-form.tsx`
- Modify: `app/login/page.tsx`
- Create: `app/login/login-url-error.tsx`
- Create: `app/login/olvide-contrasena/actions.ts`
- Create: `app/login/olvide-contrasena/page.tsx`

**Step 1: Write the failing tests**

Add tests for:
- forgot-password action state transitions
- success state that never reveals whether an email exists
- login URL error mapping including `token-expired`

**Step 2: Run tests to verify they fail**

Run: `node --test app/login/forgot-password-state.test.mjs app/login-form-state.test.mjs app/auth/auth-flow.test.mjs`
Expected: FAIL because the new state helper does not exist yet.

**Step 3: Write minimal implementation**

Update the login form to:
- use `defaultValue={state.email ?? ""}`
- preserve the existing styling while adding the forgot-password link, separator, and Google button
- disable submit and Google button coherently while pending

Create the forgot-password route and server action with a success-only response shape.

**Step 4: Run tests to verify they pass**

Run: `node --test app/login/forgot-password-state.test.mjs app/login-form-state.test.mjs app/auth/auth-flow.test.mjs`
Expected: PASS

### Task 3: OAuth callback and reset-password flow

**Files:**
- Create: `app/auth/callback/route.ts`
- Create: `app/auth/reset-contrasena/page.tsx`
- Modify: `lib/supabase/proxy.ts`
- Modify: `.env.local`

**Step 1: Write the failing test**

Extend `app/auth/auth-flow.test.mjs` to cover:
- inactive profile handling
- no-role handling
- fallback profile linking by email
- redirect target selection

**Step 2: Run test to verify it fails**

Run: `node --test app/auth/auth-flow.test.mjs`
Expected: FAIL because the decision helper lacks the new branches.

**Step 3: Write minimal implementation**

Implement the callback handler and reset-password page:
- recovery tokens -> `verifyOtp` -> redirect to `/auth/reset-contrasena`
- OAuth `code` -> `exchangeCodeForSession`
- profile lookup by `auth_user_id`, then by normalized email, linking `auth_user_id` on first Google login
- sign out and redirect on invalid/inactive/no-role states
- insert `user_session_log`, set role cookie for 8 hours, redirect to `/home`
- add public route exceptions in the proxy for callback/reset/forgot-password paths

**Step 4: Run tests to verify they pass**

Run: `node --test app/auth/auth-flow.test.mjs app/login/forgot-password-state.test.mjs app/login-form-state.test.mjs`
Expected: PASS

### Task 4: Typecheck and lint verification

**Files:**
- Verify all touched files

**Step 1: Run focused tests**

Run: `node --test app/login-form-state.test.mjs app/auth/auth-flow.test.mjs app/login/forgot-password-state.test.mjs`
Expected: PASS

**Step 2: Run static verification**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npx eslint app/login-actions.ts app/login-form.tsx app/login/page.tsx app/login/login-url-error.tsx app/login/olvide-contrasena/actions.ts app/login/olvide-contrasena/page.tsx app/auth/callback/route.ts app/auth/reset-contrasena/page.tsx app/auth/auth-flow.mjs app/auth/auth-flow.test.mjs app/login/forgot-password-state.mjs app/login/forgot-password-state.test.mjs lib/supabase/proxy.ts`
Expected: PASS
