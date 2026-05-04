import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEvidenceStampLines,
  chooseEvidenceCompressionAttempt,
} from "./evidence-stamp.mjs";

test("buildEvidenceStampLines includes required and suggested fields", () => {
  const lines = buildEvidenceStampLines({
    establishmentName: "Supermercado Central",
    userName: "Ana Torres",
    capturedAt: "2026-02-27T14:05:11.000Z",
    lat: 4.711,
    lng: -74.0721,
    accuracy: 12.34,
    locale: "es-CO",
    timeZone: "America/Bogota",
  });

  assert.equal(lines.length, 4);
  assert.equal(lines[0], "Supermercado Central");
  assert.equal(lines[1], "Ana Torres");
  assert.doesNotMatch(lines[2], /^Fecha\/Hora: /);
  assert.equal(lines[3], "GPS: 4.711000, -74.072100 (+/-12m)");
});

test("buildEvidenceStampLines uses safe fallbacks when optional values are missing", () => {
  const lines = buildEvidenceStampLines({
    establishmentName: "",
    userName: " ",
    capturedAt: "invalid",
    lat: 19.4326,
    lng: -99.1332,
    accuracy: null,
  });

  assert.equal(lines[0], "Sin establecimiento");
  assert.equal(lines[1], "Usuario");
  assert.equal(lines[2], "invalid");
  assert.equal(lines[3], "GPS: 19.432600, -99.133200");
});

test("chooseEvidenceCompressionAttempt accepts files at or below the target", () => {
  assert.deepEqual(
    chooseEvidenceCompressionAttempt({
      size: 900_000,
      targetBytes: 900_000,
      quality: 0.82,
      minQuality: 0.5,
    }),
    { status: "ok" },
  );
});

test("chooseEvidenceCompressionAttempt reduces quality while it can", () => {
  assert.deepEqual(
    chooseEvidenceCompressionAttempt({
      size: 1_100_000,
      targetBytes: 900_000,
      quality: 0.82,
      minQuality: 0.5,
    }),
    { status: "retry", quality: 0.74 },
  );
});

test("chooseEvidenceCompressionAttempt rejects oversized files after minimum quality", () => {
  assert.deepEqual(
    chooseEvidenceCompressionAttempt({
      size: 1_100_000,
      targetBytes: 900_000,
      quality: 0.5,
      minQuality: 0.5,
    }),
    { status: "too-large" },
  );
});
