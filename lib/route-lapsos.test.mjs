import test from "node:test";
import assert from "node:assert/strict";

import {
  getCompleteRegisteredPairs,
  getCurrentCostaRicaMondayStartIso,
  getNextCostaRicaMondayStartIso,
  hasRouteLapsoPendingItems,
  isLapsoActiveAt,
  isRouteLapsoFullyRegistered,
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

test("does not complete a route lapso when one active product is missing", () => {
  assert.equal(
    isRouteLapsoFullyRegistered({
      requiredPairs: [
        { establishmentId: 10, productId: 1 },
        { establishmentId: 10, productId: 2 },
      ],
      registeredPairs: [{ establishmentId: 10, productId: 1 }],
    }),
    false,
  );
});

test("completes a route lapso when every active product in every active establishment is registered", () => {
  assert.equal(
    isRouteLapsoFullyRegistered({
      requiredPairs: [
        { establishmentId: 10, productId: 1 },
        { establishmentId: 11, productId: 2 },
      ],
      registeredPairs: [
        { establishmentId: 11, productId: 2 },
        { establishmentId: 10, productId: 1 },
      ],
    }),
    true,
  );
});

test("ignores inactive products and inactive establishments before checking completion", () => {
  assert.equal(
    isRouteLapsoFullyRegistered({
      requiredPairs: [
        { establishmentId: 10, productId: 1, establishmentActive: true, productActive: true },
        { establishmentId: 10, productId: 2, establishmentActive: true, productActive: false },
        { establishmentId: 11, productId: 3, establishmentActive: false, productActive: true },
      ],
      registeredPairs: [{ establishmentId: 10, productId: 1 }],
    }),
    true,
  );
});

test("does not complete a route lapso without required active product pairs", () => {
  assert.equal(
    isRouteLapsoFullyRegistered({
      requiredPairs: [
        { establishmentId: 10, productId: 1, establishmentActive: true, productActive: false },
        { establishmentId: 11, productId: 2, establishmentActive: false, productActive: true },
      ],
      registeredPairs: [
        { establishmentId: 10, productId: 1 },
        { establishmentId: 11, productId: 2 },
      ],
    }),
    false,
  );
});

test("does not count records without complete evidence as registered pairs", () => {
  assert.deepEqual(
    getCompleteRegisteredPairs([
      { establishmentId: 10, productId: 1, evidenceNum: 3, evidenceCount: 2 },
      { establishmentId: 10, productId: 2, evidenceNum: 1, evidenceCount: 0 },
    ]),
    [],
  );
});

test("counts records with complete evidence as registered pairs", () => {
  assert.deepEqual(
    getCompleteRegisteredPairs([
      { establishmentId: 10, productId: 1, evidenceNum: 3, evidenceCount: 3 },
      { establishmentId: 11, productId: 2, evidenceNum: 2, evidenceCount: 4 },
    ]),
    [
      { establishmentId: 10, productId: 1 },
      { establishmentId: 11, productId: 2 },
    ],
  );
});

test("does not complete when a required product only has a partial record", () => {
  const registeredPairs = getCompleteRegisteredPairs([
    { establishmentId: 10, productId: 1, evidenceNum: 2, evidenceCount: 2 },
    { establishmentId: 10, productId: 2, evidenceNum: 3, evidenceCount: 1 },
  ]);

  assert.equal(
    isRouteLapsoFullyRegistered({
      requiredPairs: [
        { establishmentId: 10, productId: 1 },
        { establishmentId: 10, productId: 2 },
      ],
      registeredPairs,
    }),
    false,
  );
});

test("completes when all required active pairs have complete records", () => {
  const registeredPairs = getCompleteRegisteredPairs([
    { establishmentId: 10, productId: 1, evidenceNum: 2, evidenceCount: 2 },
    { establishmentId: 10, productId: 2, evidenceNum: 3, evidenceCount: 3 },
  ]);

  assert.equal(
    isRouteLapsoFullyRegistered({
      requiredPairs: [
        { establishmentId: 10, productId: 1 },
        { establishmentId: 10, productId: 2 },
      ],
      registeredPairs,
    }),
    true,
  );
});

test("shared pending criterion remains pending when one establishment has unregistered active products", () => {
  assert.equal(
    hasRouteLapsoPendingItems({
      establishmentIds: [10, 11],
      productRelations: [
        { establishment_id: 10, product_id: 1 },
        { establishment_id: 11, product_id: 2 },
      ],
      activeProductIds: [1, 2],
      records: [{ establishment_id: 10, product_id: 1 }],
    }),
    true,
  );
});

test("shared pending criterion clears when every visible pending item is registered", () => {
  assert.equal(
    hasRouteLapsoPendingItems({
      establishmentIds: [10, 11],
      productRelations: [
        { establishment_id: 10, product_id: 1 },
        { establishment_id: 11, product_id: 2 },
      ],
      activeProductIds: [1, 2],
      records: [
        { establishment_id: 10, product_id: 1 },
        { establishment_id: 11, product_id: 2 },
      ],
    }),
    false,
  );
});

test("shared pending criterion matches pendientes classification for establishments without active products", () => {
  assert.equal(
    hasRouteLapsoPendingItems({
      establishmentIds: [10],
      productRelations: [],
      activeProductIds: [],
      records: [],
    }),
    true,
  );

  assert.equal(
    hasRouteLapsoPendingItems({
      establishmentIds: [10],
      productRelations: [],
      activeProductIds: [],
      records: [{ establishment_id: 10, product_id: 99 }],
    }),
    false,
  );
});
