import test from "node:test";
import assert from "node:assert/strict";

import { buildWazeUrl, isGoogleMapsReady } from "./map-runtime.mjs";

test("treats Google Maps as ready when the SDK already exists on window after remount", () => {
  const result = isGoogleMapsReady({
    hasApiKey: true,
    hasScriptError: false,
    isScriptLoaded: false,
    hasGoogleMapsObject: true,
  });

  assert.equal(result, true);
});

test("builds a Waze navigation URL for an establishment marker", () => {
  const result = buildWazeUrl({ lat: 9.932542, lng: -84.079578 });

  assert.equal(
    result,
    "https://www.waze.com/ul?ll=9.932542%2C-84.079578&navigate=yes",
  );
});
