import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PRODUCT_EXTRACTOR_MODEL,
  evaluateModelPricingPolicy,
  productExtractorModelFromEnv,
} from "./model-policy.js";

test("ULTEF: DeepSeek V4 Flash is the default product extractor model", () => {
  assert.equal(
    productExtractorModelFromEnv({}),
    DEFAULT_PRODUCT_EXTRACTOR_MODEL,
  );
  assert.equal(DEFAULT_PRODUCT_EXTRACTOR_MODEL, "deepseek/deepseek-v4-flash");
});

test("ULTEF: model pricing policy allows input price below 0.1 USD per million", () => {
  const result = evaluateModelPricingPolicy({
    model: "deepseek/deepseek-v4-flash",
    inputPricePerMillionUsd: 0.09,
    outputPricePerMillionUsd: 0.18,
  });

  assert.equal(result.allowed, true);
});

test("ULTEF: model pricing policy rejects input price at or above 0.1 USD per million", () => {
  const result = evaluateModelPricingPolicy({
    model: "poolside/laguna-s-2.1",
    inputPricePerMillionUsd: 0.1,
    outputPricePerMillionUsd: 0.2,
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason ?? "", /not below 0.1/);
});

test("ULTEF: product extractor model can be overridden from env", () => {
  assert.equal(
    productExtractorModelFromEnv({
      PRODUCT_EXTRACTOR_MODEL: "poolside/laguna-xs-2.1",
    }),
    "poolside/laguna-xs-2.1",
  );
});
