import type {
  AiProductFeatureExtractionInput,
  AiProductFeatureExtractionOutput,
  AiProductFeatureExtractor,
} from "./index.js";
import { productExtractorModelFromEnv } from "./model-policy.js";

export type OpenRouterUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type OpenRouterExtractorAdapterOptions = {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
  usageSink?: (usage: OpenRouterUsage) => void;
};

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export function createOpenRouterProductFeatureExtractor(
  options: OpenRouterExtractorAdapterOptions,
): AiProductFeatureExtractor {
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? productExtractorModelFromEnv();

  return async (
    input: AiProductFeatureExtractionInput,
  ): Promise<AiProductFeatureExtractionOutput> => {
    const response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: productExtractionSystemPrompt(),
          },
          {
            role: "user",
            content: JSON.stringify({
              url: input.url,
              locale: input.locale,
              fetchedAt: input.fetchedAt,
              intendedUseSummary: input.intendedUseSummary,
              pageText: input.htmlText,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as OpenRouterChatResponse;
    options.usageSink?.({
      promptTokens: payload.usage?.prompt_tokens,
      completionTokens: payload.usage?.completion_tokens,
      totalTokens: payload.usage?.total_tokens,
    });

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter response did not include message content.");
    }

    return parseAiExtractionOutput(content);
  };
}

export function productExtractionSystemPrompt(): string {
  return [
    "You extract public-procurement-safe product features from a product page.",
    "Return only JSON. Do not include markdown.",
    "Do not invent missing values.",
    "Keep brand, model, SKU, serial, and seller identifiers in identity or informational fields only.",
    "Features must be technical, observable properties from the supplied product page text.",
    "Use this JSON shape:",
    "{",
    '  "productCategory": "desktopComputer|notebookComputer|monitor|printer|scanner|ups|networkDevice|other",',
    '  "identity": {"title": "string", "brand": "string", "model": "string", "manufacturer": "string"},',
    '  "features": [{"label": "string", "value": "string|number|boolean", "unit": "string"}],',
    '  "gaps": [{"code": "string", "message": "string", "severity": "info|warning|error"}]',
    "}",
  ].join("\n");
}

function parseAiExtractionOutput(content: string): AiProductFeatureExtractionOutput {
  const parsed = JSON.parse(content) as unknown;

  if (!isRecord(parsed) || !Array.isArray(parsed.features)) {
    throw new Error("AI extraction output must include a features array.");
  }

  return parsed as AiProductFeatureExtractionOutput;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
