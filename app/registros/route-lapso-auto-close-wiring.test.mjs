import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("evidence API attempts route lapso close after inserting evidence", () => {
  const source = readFileSync("app/api/registros/evidencias/route.ts", "utf8");
  const insertIndex = source.indexOf('supabase.from("evidence").insert');
  const closeIndex = source.indexOf("closeRouteLapsoIfFullyRegisteredAfterRecord", insertIndex);

  assert.notEqual(insertIndex, -1);
  assert.ok(closeIndex > insertIndex);
});

test("createRegistroAction attempts route lapso close after uploading evidence rows", () => {
  const source = readFileSync("app/registros/actions.ts", "utf8");
  const uploadIndex = source.indexOf("const uploadResult = await uploadEvidenceRows", source.indexOf("createRegistroAction"));
  const closeIndex = source.indexOf("closeRouteLapsoIfFullyRegisteredAfterRecord", uploadIndex);

  assert.notEqual(uploadIndex, -1);
  assert.ok(closeIndex > uploadIndex);
});

test("createRegistroAction attempts route lapso close when manual evidence count is zero", () => {
  const source = readFileSync("app/registros/actions.ts", "utf8");
  const zeroManualIndex = source.indexOf("finalEvidenceCount === 0", source.indexOf("createRegistroAction"));
  const closeIndex = source.indexOf("closeRouteLapsoIfFullyRegisteredAfterRecord", zeroManualIndex);

  assert.notEqual(zeroManualIndex, -1);
  assert.ok(closeIndex > zeroManualIndex);
});

test("updateRegistroAction attempts route lapso close when no delayed evidence upload will run", () => {
  const source = readFileSync("app/registros/actions.ts", "utf8");
  const noNewFilesIndex = source.indexOf("newFilesCount === 0", source.indexOf("updateRegistroAction"));
  const closeIndex = source.indexOf("closeRouteLapsoIfFullyRegisteredAfterRecord", noNewFilesIndex);

  assert.notEqual(noNewFilesIndex, -1);
  assert.ok(closeIndex > noNewFilesIndex);
});
