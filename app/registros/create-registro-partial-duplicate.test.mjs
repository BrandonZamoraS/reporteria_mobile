import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

test("manual create resumes a partial duplicate instead of returning duplicate error", () => {
  assert.match(source, /function\s+getRecoverableExistingRecord/);
  assert.match(source, /resumedExistingRecord:\s*true/);
  assert.match(source, /resumeUploadFromIndex:\s*recoverableExistingRecord\.evidenceCount/);
});

test("manual create keeps duplicate error when the existing record has complete evidence", () => {
  assert.match(source, /recoverableExistingRecord\s*===\s*null/);
  assert.match(source, /DUPLICATE_REGISTRO_ERROR/);
});
