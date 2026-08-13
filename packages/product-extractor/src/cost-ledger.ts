export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ModelCostPricing = {
  inputPricePerMillionUsd: number;
  outputPricePerMillionUsd: number;
};

export type ProductExtractionCostRecord = {
  eventType: "productFeatureExtraction";
  provider: "openrouter";
  model: string;
  sourceUrl: string;
  createdAt: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  pricing: ModelCostPricing;
  estimatedCostUsd: number;
};

export type ProductExtractionCostLedger = {
  record: (record: ProductExtractionCostRecord) => void | Promise<void>;
};

export const DEFAULT_MODEL_COST_PRICING: Record<string, ModelCostPricing> = {
  "deepseek/deepseek-v4-flash": {
    inputPricePerMillionUsd: 0.05,
    outputPricePerMillionUsd: 0.1,
  },
};

export function pricingForProductExtractorModel(
  model: string,
  env: NodeJS.ProcessEnv = process.env,
): ModelCostPricing {
  const inputOverride = numberFromEnv(env.PRODUCT_EXTRACTOR_INPUT_PRICE_PER_MILLION_USD);
  const outputOverride = numberFromEnv(
    env.PRODUCT_EXTRACTOR_OUTPUT_PRICE_PER_MILLION_USD,
  );

  if (inputOverride !== undefined || outputOverride !== undefined) {
    const fallback = DEFAULT_MODEL_COST_PRICING[model] ?? {
      inputPricePerMillionUsd: 0,
      outputPricePerMillionUsd: 0,
    };

    return {
      inputPricePerMillionUsd: inputOverride ?? fallback.inputPricePerMillionUsd,
      outputPricePerMillionUsd: outputOverride ?? fallback.outputPricePerMillionUsd,
    };
  }

  return (
    DEFAULT_MODEL_COST_PRICING[model] ?? {
      inputPricePerMillionUsd: 0,
      outputPricePerMillionUsd: 0,
    }
  );
}

export function createProductExtractionCostRecord(input: {
  model: string;
  sourceUrl: string;
  usage: TokenUsage;
  pricing?: ModelCostPricing;
  createdAt?: string;
}): ProductExtractionCostRecord {
  const promptTokens = input.usage.promptTokens ?? 0;
  const completionTokens = input.usage.completionTokens ?? 0;
  const totalTokens =
    input.usage.totalTokens ?? promptTokens + completionTokens;
  const pricing = input.pricing ?? pricingForProductExtractorModel(input.model);
  const estimatedCostUsd =
    (promptTokens * pricing.inputPricePerMillionUsd +
      completionTokens * pricing.outputPricePerMillionUsd) /
    1_000_000;

  return {
    eventType: "productFeatureExtraction",
    provider: "openrouter",
    model: input.model,
    sourceUrl: input.sourceUrl,
    createdAt: input.createdAt ?? new Date().toISOString(),
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
    },
    pricing,
    estimatedCostUsd,
  };
}

function numberFromEnv(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
