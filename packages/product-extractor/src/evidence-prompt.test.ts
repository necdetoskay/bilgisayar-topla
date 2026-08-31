import assert from "node:assert/strict";
import test from "node:test";

import { productExtractionSystemPrompt } from "./openrouter-adapter.js";

test("catalog extraction prompt requires raw technical sourceText evidence", () => {
  const prompt = productExtractionSystemPrompt();

  assert.match(prompt, /every returned feature include sourceText/i);
  assert.match(prompt, /Do not paraphrase sourceText/i);
  assert.match(prompt, /Structured specs/);
  assert.match(prompt, /Visible product-information snippets/);
  assert.match(prompt, /Do not use Product name, Brand, SKU, Barcode/i);
});
