import test from "node:test";
import assert from "node:assert/strict";
import {
  createProductExtractionCostRecord,
  pricingForProductExtractorModel,
} from "./cost-ledger.js";

test("ULTEF: DeepSeek product extraction cost record estimates token cost", () => {
  const record = createProductExtractionCostRecord({
    model: "deepseek/deepseek-v4-flash",
    sourceUrl: "https://example.test/products/monitor",
    createdAt: "2026-08-13T00:00:00.000Z",
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    },
  });

  assert.equal(record.eventType, "productFeatureExtraction");
  assert.equal(record.provider, "openrouter");
  assert.equal(record.model, "deepseek/deepseek-v4-flash");
  assert.deepEqual(record.usage, {
    promptTokens: 1000,
    completionTokens: 500,
    totalTokens: 1500,
  });
  assert.equal(record.pricing.inputPricePerMillionUsd, 0.05);
  assert.equal(record.pricing.outputPricePerMillionUsd, 0.1);
  assert.equal(record.estimatedCostUsd, 0.0001);
});

test("ULTEF: product extraction pricing can be overridden from env", () => {
  const pricing = pricingForProductExtractorModel("deepseek/deepseek-v4-flash", {
    PRODUCT_EXTRACTOR_INPUT_PRICE_PER_MILLION_USD: "0.04",
    PRODUCT_EXTRACTOR_OUTPUT_PRICE_PER_MILLION_USD: "0.08",
  } as NodeJS.ProcessEnv);

  assert.deepEqual(pricing, {
    inputPricePerMillionUsd: 0.04,
    outputPricePerMillionUsd: 0.08,
  });
});
