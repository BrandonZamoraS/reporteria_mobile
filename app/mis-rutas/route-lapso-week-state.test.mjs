import test from "node:test";
import assert from "node:assert/strict";

import {
  canStartCurrentWeekRoute,
  getCurrentWeekLapsoLabel,
  getStartRouteResultForExistingLapso,
} from "./route-lapso-week-state.mjs";

test("does not show start route when the current week lapso is completed", () => {
  assert.equal(
    canStartCurrentWeekRoute({
      canStartRoute: true,
      lapso: { status: "completado" },
    }),
    false,
  );
});

test("shows completed label for a completed current week lapso", () => {
  assert.equal(
    getCurrentWeekLapsoLabel({
      status: "completado",
      dayLabel: "Dia 2/7",
      progressPercent: 100,
    }),
    "Ruta completada esta semana",
  );
});

test("keeps start route available when there is no current week lapso", () => {
  assert.equal(
    canStartCurrentWeekRoute({
      canStartRoute: true,
      lapso: null,
    }),
    true,
  );
});

test("returns a clear error instead of inserting when current week lapso is completed", () => {
  assert.deepEqual(
    getStartRouteResultForExistingLapso({ status: "completado" }),
    {
      error:
        "Esta ruta ya fue completada esta semana. Podras iniciarla de nuevo el proximo lunes.",
      success: false,
    },
  );
});

test("treats an active current week lapso as an idempotent start success", () => {
  assert.deepEqual(getStartRouteResultForExistingLapso({ status: "en_curso" }), {
    error: null,
    success: true,
  });
});
