import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogSnapshotFromScraperReport,
  validateCatalogSnapshot,
  type ScraperProductOptionLike,
} from "./index.js";

function product(
  category: ScraperProductOptionLike["category"],
  name: string,
  priceValue: number,
): ScraperProductOptionLike {
  return {
    category,
    name,
    priceText: `${priceValue.toLocaleString("tr-TR")} TL`,
    priceValue,
    isAvailable: true,
    rawText: `${name} ${priceValue} TL`,
  };
}

test("current CPU plus motherboard probe becomes an explicit partial catalog", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:00:00.000Z",
    finishedAt: "2026-08-24T20:00:10.000Z",
    cpuOptions: [product("cpu", "Fixture CPU", 10_000)],
    motherboardOptions: [product("motherboard", "Fixture Motherboard", 6_000)],
  });

  assert.equal(snapshot.qualityState, "partial");
  assert.deepEqual(snapshot.coveredCategories, ["cpu", "motherboard"]);
  assert.deepEqual(snapshot.missingRequiredCategories, [
    "memory",
    "gpu",
    "storage",
    "psu",
    "case",
  ]);
  assert.equal(snapshot.products.length, 2);
  assert.deepEqual(validateCatalogSnapshot(snapshot), { valid: true, issues: [] });
});

test("all required configurator categories with prices produce a ready catalog snapshot", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:10:00.000Z",
    finishedAt: "2026-08-24T20:10:10.000Z",
    cpuOptions: [product("cpu", "CPU A", 10_000)],
    motherboardOptions: [product("motherboard", "Board A", 6_000)],
    ramOptions: [product("ram", "RAM A", 3_000)],
    gpuOptions: [product("gpu", "GPU A", 15_000)],
    ssdOptions: [product("ssd", "SSD A", 2_500)],
    psuOptions: [product("psu", "PSU A", 2_000)],
    caseOptions: [product("case", "Case A", 1_500)],
  });

  assert.equal(snapshot.qualityState, "ready");
  assert.deepEqual(snapshot.missingRequiredCategories, []);
  assert.equal(snapshot.products.length, 7);
  assert.equal(
    snapshot.products.find((item) => item.name === "RAM A")?.category,
    "memory",
  );
  assert.equal(
    snapshot.products.find((item) => item.name === "SSD A")?.category,
    "storage",
  );
  assert.deepEqual(validateCatalogSnapshot(snapshot), { valid: true, issues: [] });
});

test("available product without normalized price is held for review", () => {
  const missingPrice = product("gpu", "GPU price missing", 15_000);
  missingPrice.priceValue = undefined;

  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:20:00.000Z",
    finishedAt: "2026-08-24T20:20:10.000Z",
    cpuOptions: [product("cpu", "CPU A", 10_000)],
    motherboardOptions: [product("motherboard", "Board A", 6_000)],
    ramOptions: [product("ram", "RAM A", 3_000)],
    gpuOptions: [missingPrice],
    ssdOptions: [product("ssd", "SSD A", 2_500)],
    psuOptions: [product("psu", "PSU A", 2_000)],
    caseOptions: [product("case", "Case A", 1_500)],
  });

  assert.equal(snapshot.qualityState, "reviewRequired");
  assert.equal(
    snapshot.diagnostics.some(
      (diagnostic) => diagnostic.code === "CATALOG_AVAILABLE_PRODUCT_PRICE_MISSING",
    ),
    true,
  );
});

test("failed scraper report cannot produce a ready snapshot", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: false,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:30:00.000Z",
    finishedAt: "2026-08-24T20:30:10.000Z",
    cpuOptions: [product("cpu", "CPU A", 10_000)],
    motherboardOptions: [product("motherboard", "Board A", 6_000)],
    ramOptions: [product("ram", "RAM A", 3_000)],
    gpuOptions: [product("gpu", "GPU A", 15_000)],
    ssdOptions: [product("ssd", "SSD A", 2_500)],
    psuOptions: [product("psu", "PSU A", 2_000)],
    caseOptions: [product("case", "Case A", 1_500)],
  });

  assert.equal(snapshot.qualityState, "reviewRequired");
});

test("duplicate normalized product identity is invalid", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:40:00.000Z",
    finishedAt: "2026-08-24T20:40:10.000Z",
    cpuOptions: [
      product("cpu", "Same CPU", 10_000),
      product("cpu", "  Same   CPU  ", 10_500),
    ],
  });

  const validation = validateCatalogSnapshot(snapshot);
  assert.equal(validation.valid, false);
  assert.equal(
    validation.issues.some((issue) => issue.code === "CATALOG_PRODUCT_ID_DUPLICATE"),
    true,
  );
});
