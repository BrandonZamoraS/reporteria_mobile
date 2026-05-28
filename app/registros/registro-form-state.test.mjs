import assert from "node:assert/strict";
import { test } from "node:test";

import { isRegistroSubmitDisabled } from "./registro-form-state.mjs";

const VALID_SUBMIT_STATE = {
  pending: false,
  hasClientError: false,
  hasLockedSelection: false,
  routeId: 1,
  establishmentId: 2,
  productId: 3,
};

test("allows submit with zero evidences", () => {
  assert.equal(
    isRegistroSubmitDisabled({
      ...VALID_SUBMIT_STATE,
      totalEvidenceCount: 0,
    }),
    false,
  );
});

test("still rejects invalid evidence counts", () => {
  assert.equal(
    isRegistroSubmitDisabled({
      ...VALID_SUBMIT_STATE,
      totalEvidenceCount: -1,
    }),
    true,
  );
  assert.equal(
    isRegistroSubmitDisabled({
      ...VALID_SUBMIT_STATE,
      totalEvidenceCount: 7,
    }),
    true,
  );
});
