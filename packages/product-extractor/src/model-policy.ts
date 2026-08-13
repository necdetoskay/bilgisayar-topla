export const DEFAULT_PRODUCT_EXTRACTOR_MODEL = "deepseek/deepseek-v4-flash";
export const MAX_PRODUCT_EXTRACTOR_INPUT_PRICE_PER_MILLION_USD = 0.1;

export type ModelPricingPolicy = {
  model: string;
  inputPricePerMillionUsd: number;
  outputPricePerMillionUsd?: number;
  maxInputPricePerMillionUsd?: number;
};

export type ModelPricingPolicyResult = {
  allowed: boolean;
  reason?: string;
};

export function evaluateModelPricingPolicy(
  policy: ModelPricingPolicy,
): ModelPricingPolicyResult {
  const maxInputPrice =
    policy.maxInputPricePerMillionUsd ??
    MAX_PRODUCT_EXTRACTOR_INPUT_PRICE_PER_MILLION_USD;

  if (policy.inputPricePerMillionUsd >= maxInputPrice) {
    return {
      allowed: false,
      reason: `${policy.model} input price ${policy.inputPricePerMillionUsd}/M is not below ${maxInputPrice}/M.`,
    };
  }

  return { allowed: true };
}

export function productExtractorModelFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.PRODUCT_EXTRACTOR_MODEL?.trim() || DEFAULT_PRODUCT_EXTRACTOR_MODEL;
}
