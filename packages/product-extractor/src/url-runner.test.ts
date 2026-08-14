import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runProductExtractionFromUrl } from "./url-runner.js";

test("ULTEF: URL runner writes profile, suitability report and draft", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "product-url-runner-"));
  const fetchImpl: typeof fetch = async () =>
    new Response(
      `
        <html>
          <head><title>Frisby FNC-5260ST Notebook Sogutucu Stand</title></head>
          <body>
            <h1>Frisby FNC-5260ST 6 Fanli Notebook Sogutucu Stand 17 Uyumlu</h1>
            <table>
              <tr><th>Marka</th><td>Frisby</td></tr>
              <tr><th>Fan sayisi</th><td>6</td></tr>
              <tr><th>Notebook uyumlulugu</th><td>17 inc</td></tr>
              <tr><th>Stok Adedi</th><td>20 adetten az</td></tr>
              <tr><th>Renk</th><td>Gri</td></tr>
            </table>
          </body>
        </html>
      `,
      { status: 200 },
    );

  const result = await runProductExtractionFromUrl({
    url: "https://example.test/products/notebook-cooler",
    outputRoot,
    runId: "url-runner-test",
    fetchedAt: "2026-08-13T00:00:00.000Z",
    fetchImpl,
    env: {},
  });

  const profile = JSON.parse(await readFile(result.profilePath, "utf8")) as {
    features: Array<{ label: string; clauseEligible: boolean }>;
  };
  const suitability = JSON.parse(
    await readFile(result.suitabilityReportPath, "utf8"),
  ) as {
    summary: { include: number; review: number; exclude: number };
  };
  const timing = JSON.parse(await readFile(result.timingReportPath, "utf8")) as {
    fetchMs: number;
    htmlReadMs: number;
    extractionMs: number;
    specificationMs: number;
    totalMs: number;
    extractionMode: string;
  };
  const draft = await readFile(result.draftPath, "utf8");

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(result.readiness, "draftReady");
  assert.equal(result.costLedgerPath, undefined);
  assert.equal(timing.extractionMode, "structuredFallback");
  assert.equal(typeof timing.fetchMs, "number");
  assert.equal(typeof timing.extractionMs, "number");
  assert.equal(typeof timing.totalMs, "number");
  assert.equal(
    profile.features.find((feature) => feature.label === "Marka")?.clauseEligible,
    false,
  );
  assert.deepEqual(suitability.summary, {
    include: 2,
    review: 1,
    exclude: 2,
  });
  assert.match(draft, /Fan sayisi/);
  assert.doesNotMatch(draft, /Frisby|Stok Adedi|Renk/);
});

test("ULTEF: URL runner retries OpenRouter model before structured fallback", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "product-url-runner-retry-"));
  const openRouterRequests: unknown[] = [];
  let openRouterCallCount = 0;
  const fetchImpl: typeof fetch = async (url, init) => {
    if (String(url) === "https://openrouter.ai/api/v1/chat/completions") {
      openRouterCallCount += 1;
      openRouterRequests.push(JSON.parse(String(init?.body)));
      if (openRouterCallCount === 1) {
        return new Response("temporary upstream timeout", { status: 504 });
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  productCategory: "desktopComputer",
                  identity: { title: "Example All In One" },
                  features: [
                    {
                      label: "Bellek",
                      value: 16,
                      unit: "GB",
                      specSuitability: {
                        featureClass: "technicalRequired",
                        decision: "include",
                        reason: "Specification table value.",
                        riskLevel: "low",
                        suggestedClauseText:
                          "Bilgisayar en az 16 GB sistem bellegine sahip olmalidir.",
                        confidence: 0.9,
                      },
                    },
                  ],
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 1000,
            completion_tokens: 200,
            total_tokens: 1200,
          },
        }),
        { status: 200 },
      );
    }

    return new Response(
      `
        <html>
          <body>
            <h1>Example All In One</h1>
            <table><tr><th>Bellek</th><td>16 GB</td></tr></table>
          </body>
        </html>
      `,
      { status: 200 },
    );
  };

  const result = await runProductExtractionFromUrl({
    url: "https://example.test/products/aio",
    outputRoot,
    runId: "url-runner-retry-test",
    fetchedAt: "2026-08-13T00:00:00.000Z",
    fetchImpl,
    env: {
      OPENROUTER_API_KEY: "test-key",
      PRODUCT_EXTRACTOR_MODEL: "deepseek/deepseek-v4-flash",
      PRODUCT_EXTRACTOR_AI_TIMEOUT_MS: "30000",
      PRODUCT_EXTRACTOR_MODEL_RETRY_COUNT: "1",
    },
  });

  const timing = JSON.parse(await readFile(result.timingReportPath, "utf8")) as {
    attemptedModels: string[];
    successfulModel: string;
  };
  const costLedger = await readFile(result.costLedgerPath ?? "", "utf8");

  assert.equal(result.extractionMode, "ai");
  assert.equal(openRouterCallCount, 2);
  assert.deepEqual(
    openRouterRequests.map((request) => (request as { model: string }).model),
    ["deepseek/deepseek-v4-flash", "deepseek/deepseek-v4-flash"],
  );
  assert.deepEqual(timing.attemptedModels, [
    "deepseek/deepseek-v4-flash",
    "deepseek/deepseek-v4-flash",
  ]);
  assert.equal(timing.successfulModel, "deepseek/deepseek-v4-flash");
  assert.match(costLedger, /"totalTokens":1200/);
  assert.match(costLedger, /"estimatedCostUsd":0.00007/);
});

test("ULTEF: URL runner records billable failed OpenRouter attempts", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "product-url-runner-attempts-"));
  const fetchImpl: typeof fetch = async (url) => {
    if (String(url) === "https://openrouter.ai/api/v1/chat/completions") {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "{not valid json" } }],
          usage: {
            prompt_tokens: 1000,
            completion_tokens: 20,
            total_tokens: 1020,
          },
        }),
        { status: 200 },
      );
    }

    return new Response(
      `
        <html>
          <body>
            <h1>Example All In One</h1>
            <table><tr><th>Bellek</th><td>16 GB</td></tr></table>
          </body>
        </html>
      `,
      { status: 200 },
    );
  };

  const result = await runProductExtractionFromUrl({
    url: "https://example.test/products/aio",
    outputRoot,
    runId: "url-runner-attempts-test",
    fetchedAt: "2026-08-13T00:00:00.000Z",
    fetchImpl,
    env: {
      OPENROUTER_API_KEY: "test-key",
      PRODUCT_EXTRACTOR_MODEL: "deepseek/deepseek-v4-flash",
    },
  });

  const attempts = JSON.parse(
    await readFile(result.aiAttemptReportPath ?? "", "utf8"),
  ) as {
    attempts: Array<{
      model: string;
      status: string;
      error: string;
      costRecordCount: number;
      estimatedCostUsd: number;
    }>;
    summary: {
      attempted: number;
      succeeded: number;
      failed: number;
      billableFailed: number;
      estimatedCostUsd: number;
    };
  };
  const timing = JSON.parse(await readFile(result.timingReportPath, "utf8")) as {
    aiTimeoutMs: number;
    attemptedModels: string[];
    successfulModel?: string;
  };
  const costLedger = await readFile(result.costLedgerPath ?? "", "utf8");

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(timing.aiTimeoutMs, 15000);
  assert.deepEqual(timing.attemptedModels, ["deepseek/deepseek-v4-flash"]);
  assert.equal(timing.successfulModel, undefined);
  assert.equal(attempts.summary.attempted, 1);
  assert.equal(attempts.summary.succeeded, 0);
  assert.equal(attempts.summary.failed, 1);
  assert.equal(attempts.summary.billableFailed, 1);
  assert.equal(attempts.attempts[0]?.status, "failed");
  assert.match(attempts.attempts[0]?.error ?? "", /JSON/);
  assert.equal(attempts.attempts[0]?.costRecordCount, 1);
  assert.equal(attempts.attempts[0]?.estimatedCostUsd, 0.000052);
  assert.match(costLedger, /"totalTokens":1020/);
});
