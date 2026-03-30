import test from "node:test";
import assert from "node:assert/strict";

import { getLoadingItems, getLoadingPreset } from "./loading-presets.mjs";

test("getLoadingItems normalizes invalid and excessive counts", () => {
  assert.deepEqual(getLoadingItems(undefined), [0, 1, 2, 3]);
  assert.deepEqual(getLoadingItems(0), [0, 1, 2, 3]);
  assert.deepEqual(getLoadingItems(3.8), [0, 1, 2]);
  assert.deepEqual(getLoadingItems(12), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("getLoadingPreset returns stable shapes for primary app screens", () => {
  assert.deepEqual(getLoadingPreset("home"), {
    title: "Inicio",
    cardCount: 3,
    showHero: true,
    showTabs: false,
    showTopAction: false,
    showFooterButton: false,
    showFloatingAction: true,
    showMap: false,
    showInfoCard: false,
    showForm: false,
  });

  assert.deepEqual(getLoadingPreset("zona-list"), {
    title: "Pendientes",
    cardCount: 5,
    showHero: false,
    showTabs: false,
    showTopAction: false,
    showFooterButton: true,
    showFloatingAction: false,
    showMap: false,
    showInfoCard: false,
    showForm: false,
  });

  assert.deepEqual(getLoadingPreset("registro-form"), {
    title: "Registro",
    cardCount: 6,
    showHero: false,
    showTabs: false,
    showTopAction: false,
    showFooterButton: true,
    showFloatingAction: false,
    showMap: false,
    showInfoCard: false,
    showForm: true,
  });
});
