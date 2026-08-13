import { extractProductFeatureProfile } from "./index.js";
import { productExtractorModelFromEnv } from "./model-policy.js";
import { createOpenRouterProductFeatureExtractor } from "./openrouter-adapter.js";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is required for the OpenRouter smoke test.");
}

const usageRecords: Array<{
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}> = [];

const result = await extractProductFeatureProfile({
  url: "https://example.test/products/monitor-smoke",
  html: `
    <html>
      <body>
        <h1>Example Brand Office Monitor 24</h1>
        <table>
          <tr><th>Marka</th><td>Example Brand</td></tr>
          <tr><th>Model</th><td>OB-24</td></tr>
          <tr><th>Ekran boyutu</th><td>24 inc</td></tr>
          <tr><th>Cozunurluk</th><td>1920x1080</td></tr>
        </table>
      </body>
    </html>
  `,
  fetchedAt: "2026-08-13T00:00:00.000Z",
  aiExtractor: createOpenRouterProductFeatureExtractor({
    apiKey,
    model: productExtractorModelFromEnv(),
    usageSink: (usage) => usageRecords.push(usage),
  }),
});

if (!result.validation.valid) {
  throw new Error(
    `OpenRouter smoke profile validation failed: ${JSON.stringify(
      result.validation.issues,
    )}`,
  );
}

if (result.profile.productCategory !== "monitor") {
  throw new Error(
    `Expected monitor category, got ${result.profile.productCategory}.`,
  );
}

if (result.profile.features.length === 0) {
  throw new Error("Expected at least one extracted feature.");
}

console.log(
  JSON.stringify({
    ok: true,
    model: productExtractorModelFromEnv(),
    extractionMode: result.extractionMode,
    productCategory: result.profile.productCategory,
    featureCount: result.profile.features.length,
    usage: usageRecords[0] ?? {},
  }),
);
