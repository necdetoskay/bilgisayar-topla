import assert from "node:assert/strict";
import test from "node:test";

import { catalogSnapshotFromScraperReport } from "./index.js";

test("scraper product URL is preserved separately from configurator URL", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T21:40:00.000Z",
    finishedAt: "2026-08-24T21:40:10.000Z",
    cpuOptions: [
      {
        category: "cpu",
        name: "Fixture CPU",
        productUrl: "https://www.incehesap.com/fixture-cpu/",
        priceText: "12.500 TL",
        priceValue: 12_500,
        isAvailable: true,
        rawText: "Fixture CPU 12.500 TL",
      },
    ],
  });

  const product = snapshot.products[0];
  assert.ok(product);
  assert.equal(
    product.source.targetUrl,
    "https://www.incehesap.com/oyun-bilgisayari-toplama/",
  );
  assert.equal(
    product.source.productUrl,
    "https://www.incehesap.com/fixture-cpu/",
  );
});
