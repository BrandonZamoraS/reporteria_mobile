import test from "node:test";
import assert from "node:assert/strict";

import {
  getCurrentCostaRicaMondayStartIso,
  getNextCostaRicaMondayStartIso,
  isLapsoActiveAt,
} from "./route-lapsos.mjs";

test("gets the current Monday midnight in Costa Rica for the active route week", () => {
  assert.equal(
    getCurrentCostaRicaMondayStartIso(new Date("2026-05-06T18:30:00.000Z")),
    "2026-05-04T06:00:00.000Z",
  );
});

test("sets a route lapso end at the next Monday midnight in Costa Rica", () => {
  assert.equal(
    getNextCostaRicaMondayStartIso(new Date("2026-05-06T18:30:00.000Z")),
    "2026-05-11T06:00:00.000Z",
  );
});

test("moves a Monday start to the following Monday", () => {
  assert.equal(
    getNextCostaRicaMondayStartIso(new Date("2026-05-04T06:00:00.000Z")),
    "2026-05-11T06:00:00.000Z",
  );
});

test("treats a lapso as inactive once it reaches its Monday cutoff", () => {
  assert.equal(
    isLapsoActiveAt("2026-05-11T06:00:00.000Z", new Date("2026-05-11T06:00:00.000Z")),
    false,
  );
});
