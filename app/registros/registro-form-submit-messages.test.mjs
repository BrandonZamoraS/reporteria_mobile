import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./registro-form.tsx", import.meta.url), "utf8");

test("duplicate selection message is not rendered while submit remains locked", () => {
  assert.match(source, /hasLockedSelection/);
  assert.doesNotMatch(source, /DUPLICATE_REGISTRO_ERROR/);
  assert.doesNotMatch(source, /showSelectionLockMessage/);
});

test("partial duplicate does not resume uploads from a later image index", () => {
  assert.doesNotMatch(source, /resumeUploadFromIndex/);
  assert.doesNotMatch(source, /const\s+uploadStartIndex/);
  assert.match(source, /for\s*\(\s*let\s+i\s*=\s*0/);
  assert.match(source, /Subiendo imagen \$\{i \+ 1\} de \$\{totalFiles\}/);
});
