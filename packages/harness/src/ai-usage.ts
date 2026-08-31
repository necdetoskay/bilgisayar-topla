import type { AiUsageRecord, PcBuildRun } from "./index.js";

export type ProductExtractionAiTraceLike = {
  capability: "productExtraction";
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  outcome: "success" | "validationFailed" | "providerFailed";
};

export function aiUsageRecordFromProductExtractionTrace(
  trace: ProductExtractionAiTraceLike,
): AiUsageRecord {
  return {
    capability: trace.capability,
    provider: trace.provider,
    model: trace.model,
    inputTokens: trace.inputTokens,
    outputTokens: trace.outputTokens,
    estimatedCostUsd: trace.estimatedCostUsd,
    latencyMs: trace.latencyMs,
    outcome: trace.outcome,
  };
}

export function appendProductExtractionAiTrace(
  run: PcBuildRun,
  trace: ProductExtractionAiTraceLike,
  at?: string,
): PcBuildRun {
  return {
    ...run,
    updatedAt: at ?? run.updatedAt,
    aiUsage: [
      ...run.aiUsage.map((usage) => ({ ...usage })),
      aiUsageRecordFromProductExtractionTrace(trace),
    ],
  };
}
