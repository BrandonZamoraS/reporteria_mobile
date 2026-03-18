import test from "node:test";
import assert from "node:assert/strict";

import {
  filterMobileSelectOptions,
  getMobileSelectQueryOnOpen,
  shouldFocusSearchInputImmediately,
  shouldUseSearchableMobileSelect,
} from "./mobile-select-field-state.mjs";

test("uses searchable mode only when there are more than ten options", () => {
  assert.equal(shouldUseSearchableMobileSelect(10), false);
  assert.equal(shouldUseSearchableMobileSelect(11), true);
});

test("opens with the full list even when there is already a selected label", () => {
  assert.equal(getMobileSelectQueryOnOpen("Ruta Centro"), "");
  assert.equal(getMobileSelectQueryOnOpen(""), "");
});

test("returns the full list when the query is empty", () => {
  const options = [
    { value: "1", label: "Ruta Centro" },
    { value: "2", label: "Ruta Norte" },
    { value: "3", label: "Ruta Sur" },
  ];

  assert.deepEqual(filterMobileSelectOptions(options, ""), options);
  assert.deepEqual(filterMobileSelectOptions(options, "   "), options);
});

test("filters options in real time using the typed text", () => {
  const options = [
    { value: "1", label: "Supermercado Central" },
    { value: "2", label: "Bodega Norte" },
    { value: "3", label: "Supermercado Sur" },
  ];

  assert.deepEqual(filterMobileSelectOptions(options, "super"), [
    { value: "1", label: "Supermercado Central" },
    { value: "3", label: "Supermercado Sur" },
  ]);
});

test("focuses the search input immediately on touch interactions", () => {
  assert.equal(shouldFocusSearchInputImmediately("pointerdown"), true);
  assert.equal(shouldFocusSearchInputImmediately("click"), false);
});
