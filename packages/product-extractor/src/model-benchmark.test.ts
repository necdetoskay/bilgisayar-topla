import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runModelBenchmark } from "./model-benchmark.js";

test("ULTEF: model benchmark compares extraction timing, quality and cost rows", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "product-model-benchmark-"));
  const pageHtml = `
    <html>
      <head><title>Example Office Monitor</title></head>
      <body>
        <h1>Example Office Monitor</h1>
        <table>
          <tr><th>Ekran boyutu</th><td>24 inc</td></tr>
          <tr><th>Çözünürlük</th><td>1920 x 1080</td></tr>
        </table>
      </body>
    </html>
  `;
  const fetchImpl: typeof fetch = async (url, init) => {
    if (String(url).includes("openrouter.ai")) {
      const body = JSON.parse(String(init?.body)) as { model: string };
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  productCategory: "monitor",
                  identity: { title: "Example Office Monitor" },
                  features: [
                    {
                      label: "Ekran boyutu",
                      value: body.model.includes("latest") ? 27 : 24,
                      unit: "inc",
                    },
                  ],
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: body.model.includes("latest") ? 120 : 100,
            completion_tokens: 40,
            total_tokens: body.model.includes("latest") ? 160 : 140,
          },
        }),
        { status: 200 },
      );
    }

    return new Response(pageHtml, { status: 200 });
  };

  const result = await runModelBenchmark({
    url: "https://example.test/products/monitor",
    outputRoot,
    fetchedAt: "2026-08-14T00:00:00.000Z",
    fetchImpl,
    env: {
      OPENROUTER_API_KEY: "test-key",
      PRODUCT_EXTRACTOR_AI_TIMEOUT_MS: "5000",
    },
    models: [
      "deepseek/deepseek-v4-flash",
      "~deepseek/deepseek-v4-flash-latest",
    ],
  });
  const summary = JSON.parse(await readFile(result.summaryPath, "utf8")) as {
    rows: Array<{
      model: string;
      ok: boolean;
      extractionMode: string;
      featureCount: number;
      totalMs: number;
      totalTokens: number;
      estimatedCostUsd: number;
    }>;
  };

  assert.equal(result.rows.length, 2);
  assert.equal(summary.rows.length, 2);
  assert.deepEqual(
    summary.rows.map((row) => row.model),
    [
      "deepseek/deepseek-v4-flash",
      "~deepseek/deepseek-v4-flash-latest",
    ],
  );
  assert.equal(summary.rows.every((row) => row.ok), true);
  assert.equal(summary.rows.every((row) => row.extractionMode === "ai"), true);
  assert.equal(summary.rows.every((row) => row.featureCount === 1), true);
  assert.equal(summary.rows.every((row) => typeof row.totalMs === "number"), true);
  assert.deepEqual(
    summary.rows.map((row) => row.totalTokens),
    [140, 160],
  );
  assert.equal(summary.rows[0]?.estimatedCostUsd, 0.000009);
});
