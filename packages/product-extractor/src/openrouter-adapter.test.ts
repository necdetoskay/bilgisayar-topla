import test from "node:test";
import assert from "node:assert/strict";
import {
  createOpenRouterProductFeatureExtractor,
  productExtractionSystemPrompt,
  type OpenRouterUsage,
} from "./openrouter-adapter.js";
import type { ProductExtractionCostRecord } from "./cost-ledger.js";

test("ULTEF: OpenRouter adapter calls configured DeepSeek model and parses JSON", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body)),
    });

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                productCategory: "monitor",
                identity: {
                  title: "Example Monitor",
                },
                features: [
                  {
                    label: "Ekran boyutu",
                    value: 24,
                    unit: "inc",
                  },
                ],
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 40,
          total_tokens: 140,
        },
      }),
      { status: 200 },
    );
  };
  const usages: OpenRouterUsage[] = [];
  const costRecords: ProductExtractionCostRecord[] = [];

  const extractor = createOpenRouterProductFeatureExtractor({
    apiKey: "test-key",
    model: "deepseek/deepseek-v4-flash",
    fetchImpl,
    usageSink: (usage) => usages.push(usage),
    costLedger: {
      record: (record) => {
        costRecords.push(record);
      },
    },
  });

  const result = await extractor({
    url: "https://example.test/products/monitor",
    htmlText: "Example Monitor Ekran boyutu 24 inc",
    fetchedAt: "2026-08-13T00:00:00.000Z",
    locale: "tr-TR",
  });

  assert.equal(result.productCategory, "monitor");
  assert.equal(result.features.length, 1);
  assert.equal(calls[0]?.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal((calls[0]?.body as { model?: string }).model, "deepseek/deepseek-v4-flash");
  assert.deepEqual(usages[0], {
    promptTokens: 100,
    completionTokens: 40,
    totalTokens: 140,
  });
  assert.equal(costRecords[0]?.model, "deepseek/deepseek-v4-flash");
  assert.equal(costRecords[0]?.sourceUrl, "https://example.test/products/monitor");
  assert.deepEqual(costRecords[0]?.usage, {
    promptTokens: 100,
    completionTokens: 40,
    totalTokens: 140,
  });
  assert.equal(costRecords[0]?.estimatedCostUsd, 0.000009);
});

test("ULTEF: product extraction prompt blocks invented values and brand/model clauses", () => {
  const prompt = productExtractionSystemPrompt();

  assert.match(prompt, /Do not invent missing values/);
  assert.match(prompt, /brand, model, SKU/);
  assert.match(prompt, /Return only JSON/);
});
