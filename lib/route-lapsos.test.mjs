import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

test("does not complete Pali Centro when only one of three active products is registered", () => {
  assert.equal(
    hasRouteLapsoPendingItems({
      establishmentIds: [101],
      productRelations: [
        { establishment_id: 101, product_id: 1 },
        { establishment_id: 101, product_id: 2 },
        { establishment_id: 101, product_id: 3 },
      ],
      activeProductIds: [1, 2, 3],
      records: [{ establishment_id: 101, product_id: 1 }],
    }),
    true,
  );
});

test("auto close query does not filter products_establishment by missing is_active column", () => {
  const source = readFileSync("lib/route-lapsos.ts", "utf8");
  const relationQueryStart = source.indexOf('.from("products_establishment")');
  const relationQueryEnd = source.indexOf("const productIds", relationQueryStart);
  const relationQuery = source.slice(relationQueryStart, relationQueryEnd);

  assert.notEqual(relationQueryStart, -1);
  assert.doesNotMatch(relationQuery, /\.eq\("is_active", true\)/);
});

test("auto close fails closed when required Supabase queries return errors", () => {
  const source = readFileSync("lib/route-lapsos.ts", "utf8");

  for (const alias of [
    "recordError",
    "lapsoError",
    "establishmentsError",
    "relationsError",
    "productsError",
    "recordsError",
  ]) {
    assert.match(source, new RegExp(`\\b${alias}\\b`));
  }
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
