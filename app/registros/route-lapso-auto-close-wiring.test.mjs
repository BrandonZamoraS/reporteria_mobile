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
