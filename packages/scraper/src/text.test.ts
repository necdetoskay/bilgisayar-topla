import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanProductName,
  includesAnyNormalized,
  includesNormalizedKeyword,
} from "./text.js";

test("short RAM keyword does not match inside program", () => {
  assert.equal(includesNormalizedKeyword("Program seçenekleri", "ram"), false);
  assert.equal(includesNormalizedKeyword("32 GB RAM seçenekleri", "ram"), true);
});

test("Turkish category phrases normalize deterministically", () => {
  assert.equal(
    includesAnyNormalized("Güç Kaynağı Seçimi", ["guc kaynagi", "power supply"]),
    true,
  );
  assert.equal(
    includesAnyNormalized("Ekran Kartı Seçimi", ["ekran karti", "gpu"]),
    true,
  );
});

test("product identity text drops price and common action labels", () => {
  assert.equal(
    cleanProductName(
      "AMD Ryzen 7 9700X 12.499,00 TL Sepete Ekle",
      "12.499,00 TL",
    ),
    "AMD Ryzen 7 9700X",
  );
});

test("product name fallback never returns empty text", () => {
  assert.equal(cleanProductName("12.499,00 TL", "12.499,00 TL"), "12.499,00 TL");
});
