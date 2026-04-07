import test from "node:test";
import assert from "node:assert/strict";

import { getEstablishmentRouteStatus } from "./zona-summary-state.mjs";

test("classifies an establishment as pending when it still has products left to register", () => {
  assert.equal(
    getEstablishmentRouteStatus({
      totalProducts: 3,
      completedProducts: 0,
      hasRecordedProducts: false,
    }),
    "pending",
  );
});

test("classifies an establishment as in progress when it has partial product coverage", () => {
  assert.equal(
    getEstablishmentRouteStatus({
      totalProducts: 3,
      completedProducts: 1,
      hasRecordedProducts: true,
    }),
    "in_progress",
  );
});

test("classifies an establishment as completed when all active products were registered", () => {
  assert.equal(
    getEstablishmentRouteStatus({
      totalProducts: 3,
      completedProducts: 3,
      hasRecordedProducts: true,
    }),
    "completed",
  );
});

test("classifies an establishment as completed when it has no active products left but already recorded the active-window products", () => {
  assert.equal(
    getEstablishmentRouteStatus({
      totalProducts: 0,
      completedProducts: 0,
      hasRecordedProducts: true,
    }),
    "completed",
  );
});
