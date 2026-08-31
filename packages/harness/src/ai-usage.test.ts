import assert from "node:assert/strict";
import test from "node:test";

import { appendProductExtractionAiTrace } from "./ai-usage.js";
import { createPcBuildRun } from "./index.js";

test("product extraction trace is appended to PcBuildRun aiUsage without mutating input", () => {
  const run = createPcBuildRun({
    runId: "run-ai-usage",
    createdAt: "2026-08-24T21:50:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 icin kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });

  const updated = appendProductExtractionAiTrace(
    run,
    {
      capability: "productExtraction",
      provider: "openrouter",
      model: "deepseek/deepseek-v4-flash",
      inputTokens: 900,
      outputTokens: 140,
      estimatedCostUsd: 0.000059,
      latencyMs: 850,
      outcome: "success",
    },
    "2026-08-24T21:50:01.000Z",
  );

  assert.equal(run.aiUsage.length, 0);
  assert.equal(updated.aiUsage.length, 1);
  assert.deepEqual(updated.aiUsage[0], {
    capability: "productExtraction",
    provider: "openrouter",
    model: "deepseek/deepseek-v4-flash",
    inputTokens: 900,
    outputTokens: 140,
    estimatedCostUsd: 0.000059,
    latencyMs: 850,
    outcome: "success",
  });
  assert.equal(updated.updatedAt, "2026-08-24T21:50:01.000Z");
});
