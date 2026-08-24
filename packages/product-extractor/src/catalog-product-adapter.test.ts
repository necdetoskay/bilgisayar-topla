import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogProduct } from "@bilgisayar-topla/catalog";

import {
  extractCatalogProductFeatureRecord,
} from "./catalog-product-adapter.js";
import type { AiProductFeatureExtractor } from "./index.js";

function catalogProduct(overrides?: Partial<CatalogProduct>): CatalogProduct {
  return {
    catalogProductId: "product-cpu-fixture",
    category: "cpu",
    name: "Fixture CPU",
    price: { amount: 12_500, currency: "TRY" },
    availability: "available",
    source: {
      sourceType: "incehesapConfigurator",
      targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
      productUrl: "https://www.incehesap.com/fixture-cpu/",
      observedAt: "2026-08-24T21:30:00.000Z",
      scraperRunId: "scraper-run-fixture",
      rawText: "Fixture CPU 12.500 TL",
      priceText: "12.500 TL",
    },
    ...overrides,
  };
}

test("catalog product without product page URL stays reviewRequired and does not call AI", async () => {
  let aiCalls = 0;
  const aiExtractor: AiProductFeatureExtractor = async () => {
    aiCalls += 1;
    return { features: [] };
  };
  const product = catalogProduct({
    source: {
      ...catalogProduct().source,
      productUrl: undefined,
    },
  });

  const record = await extractCatalogProductFeatureRecord({
    product,
    html: "<html><body>ignored</body></html>",
    aiExtractor,
  });

  assert.equal(record.status, "reviewRequired");
  assert.equal(aiCalls, 0);
  assert.equal(record.profile, undefined);
  assert.equal(record.diagnostics[0]?.code, "CATALOG_PRODUCT_PAGE_URL_MISSING");
});

test("AI feature without raw sourceText cannot become authoritative", async () => {
  const aiExtractor: AiProductFeatureExtractor = async () => ({
    productCategory: "other",
    features: [
      {
        label: "RAM",
        value: 32,
        unit: "gb",
      },
    ],
  });

  const record = await extractCatalogProductFeatureRecord({
    product: catalogProduct(),
    html: `
      <html>
        <head><title>Fixture CPU RAM 32GB</title></head>
        <body><h1>Fixture CPU RAM 32GB</h1></body>
      </html>
    `,
    fetchedAt: "2026-08-24T21:31:00.000Z",
    aiExtractor,
  });

  assert.equal(record.status, "reviewRequired");
  assert.equal(record.profile?.features.length, 0);
  assert.equal(
    record.diagnostics.some(
      (diagnostic) => diagnostic.code === "AI_FEATURE_SOURCE_TEXT_MISSING",
    ),
    true,
  );
});

test("AI feature copied from structured product evidence is accepted", async () => {
  const aiExtractor: AiProductFeatureExtractor = async () => {
    const feature = {
      label: "Socket",
      value: "AM5",
      sourceText: "- Socket: AM5",
    };

    return {
      productCategory: "other",
      features: [feature],
    };
  };

  const record = await extractCatalogProductFeatureRecord({
    product: catalogProduct(),
    html: `
      <html>
        <body>
          <table>
            <tr><th>Socket</th><td>AM5</td></tr>
          </table>
        </body>
      </html>
    `,
    fetchedAt: "2026-08-24T21:32:00.000Z",
    aiExtractor,
  });

  assert.equal(record.status, "ready");
  assert.equal(record.componentCategory, "cpu");
  assert.equal(record.catalogProductId, "product-cpu-fixture");
  assert.equal(record.productPageUrl, "https://www.incehesap.com/fixture-cpu/");
  assert.equal(record.validation?.valid, true);
  assert.equal(record.profile?.features[0]?.label, "Socket");
  assert.equal(record.profile?.features[0]?.value, "AM5");
});

test("sourceText found only outside technical evidence package is rejected", async () => {
  const aiExtractor: AiProductFeatureExtractor = async () => {
    const feature = {
      label: "RAM",
      value: 32,
      unit: "gb",
      sourceText: "Product name: Fixture CPU RAM 32GB",
    };
    return {
      productCategory: "other",
      features: [feature],
    };
  };

  const record = await extractCatalogProductFeatureRecord({
    product: catalogProduct(),
    html: `
      <html>
        <head><title>Fixture CPU RAM 32GB</title></head>
        <body><h1>Fixture CPU RAM 32GB</h1></body>
      </html>
    `,
    fetchedAt: "2026-08-24T21:33:00.000Z",
    aiExtractor,
  });

  assert.equal(record.status, "reviewRequired");
  assert.equal(
    record.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "AI_FEATURE_SOURCE_TEXT_NOT_IN_TECHNICAL_EVIDENCE",
    ),
    true,
  );
});
