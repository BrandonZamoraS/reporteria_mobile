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

test("manual create resolves lapso from the actual record timestamp", () => {
  const createStart = source.indexOf("export async function createRegistroAction");
  const insertStart = source.indexOf('.from("check_record")', createStart);
  const createBody = source.slice(createStart, insertStart);

  assert.match(createBody, /const\s+recordTimeDateIso\s*=/);
  assert.match(createBody, /const\s+lapsoLookupInstantIso\s*=\s*new Date\(\)\.toISOString\(\)/);
  assert.match(createBody, /resolveWritableRouteContext\(auth, routeId, lapsoLookupInstantIso\)/);
  assert.match(source, /\.lte\("start_at",\s*lapsoLookupInstantIso\)/);
  assert.match(source, /\.gt\("end_at",\s*lapsoLookupInstantIso\)/);
});

test("database trigger enforces check_record lapso consistency", () => {
  const migration = readFileSync(
    new URL("../../supabase/migrations/20260622000000_enforce_check_record_lapso_consistency.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create or replace function public\.enforce_check_record_lapso_consistency\(\)/);
  assert.match(migration, /new\.time_date at time zone 'America\/Costa_Rica'/);
  assert.match(migration, /start_at <= v_record_instant/);
  assert.match(migration, /end_at > v_record_instant/);
  assert.match(migration, /before insert or update of time_date, lapso_id, user_id, establishment_id/);
  assert.match(migration, /create trigger trg_enforce_check_record_lapso_consistency/);
});

test("normal edit preserves the existing lapso and timestamp", () => {
  const updateStart = source.indexOf("export async function updateRegistroAction");
  const updateBody = source.slice(updateStart);
  const updatePayloadStart = updateBody.indexOf(".update({");
  const updatePayloadEnd = updateBody.indexOf("})", updatePayloadStart);
  const updatePayload = updateBody.slice(updatePayloadStart, updatePayloadEnd);

  assert.match(updateBody, /\.select\("record_id, user_id, product_id, establishment_id, lapso_id, time_date"\)/);
  assert.doesNotMatch(updatePayload, /lapso_id\s*:/);
  assert.doesNotMatch(updatePayload, /time_date\s*:/);
});

test("registro writes no longer use current-week lapso selection", () => {
  assert.doesNotMatch(source, /getRouteLapsoWeekStartAt/);
  assert.doesNotMatch(source, /\.gte\("start_at", currentWeekStartIso\)/);
});
