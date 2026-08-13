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
  const draft = await readFile(result.draftPath, "utf8");

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(result.readiness, "draftReady");
  assert.equal(result.costLedgerPath, undefined);
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
