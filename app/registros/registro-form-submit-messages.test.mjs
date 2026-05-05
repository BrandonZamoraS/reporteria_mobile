import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./registro-form.tsx", import.meta.url), "utf8");

test("duplicate selection message is hidden while the form is submitting", () => {
  assert.match(source, /showSelectionLockMessage\s*=\s*!isSubmitting\s*&&\s*selectionLockMessage/);
  assert.match(source, /showSelectionLockMessage\s*\?/);
});
