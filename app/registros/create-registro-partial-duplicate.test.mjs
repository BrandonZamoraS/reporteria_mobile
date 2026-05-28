import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

test("manual create treats a partial existing record as a duplicate instead of resuming it", () => {
  assert.doesNotMatch(source, /function\s+getRecoverableExistingRecord/);
  assert.doesNotMatch(source, /resumedExistingRecord:\s*true/);
  assert.doesNotMatch(source, /resumeUploadFromIndex/);
});

test("manual create checks any existing lapso record before inserting", () => {
  assert.match(source, /findExistingLapsoRecordId/);
  assert.match(source, /DUPLICATE_REGISTRO_ERROR/);
});

test("server-side evidence validation allows zero photos while keeping max limit", () => {
  assert.doesNotMatch(source, /finalEvidenceCount\s*<\s*1/);
  assert.doesNotMatch(source, /resultingEvidenceCount\s*<\s*1/);
  assert.doesNotMatch(source, /entre 1 y \$\{MAX_EVIDENCE_PER_RECORD\}/);
  assert.match(source, /finalEvidenceCount\s*<\s*0/);
  assert.match(source, /resultingEvidenceCount\s*<\s*0/);
  assert.match(source, /entre 0 y \$\{MAX_EVIDENCE_PER_RECORD\}/);
});
