import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./registro-form.tsx", import.meta.url), "utf8");

test("evidence previews use native img elements instead of next image", () => {
  assert.equal(source.includes('import Image from "next/image";'), false);
  assert.equal(source.includes("<Image"), false);
  assert.match(source, /<img\s/);
});

test("failed evidence preview loads render a controlled fallback", () => {
  assert.match(source, /No se pudo cargar/);
  assert.match(source, /onError=/);
});
