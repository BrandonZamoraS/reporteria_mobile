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
