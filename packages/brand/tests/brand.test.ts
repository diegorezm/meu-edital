import assert from "node:assert/strict";
import test from "node:test";
import { cssVariables, palette } from "../src";

test("cssVariables declara uma variável por cor", () => {
  assert.equal(cssVariables({ bg: "#FFF", text: "#000" }), "--bg: #FFF; --text: #000;");
  assert.ok(cssVariables().includes(`--lavender: ${palette.lavender};`));
});
