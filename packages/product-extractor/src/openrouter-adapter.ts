import type {
  AiProductFeatureExtractionInput,
  AiProductFeatureExtractionOutput,
  AiProductFeatureExtractor,
} from "./index.js";
import {
  createProductExtractionCostRecord,
  pricingForProductExtractorModel,
  type ProductExtractionCostLedger,
} from "./cost-ledger.js";
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
  costLedger?: ProductExtractionCostLedger;
  requestTimeoutMs?: number;
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
  const requestTimeoutMs = options.requestTimeoutMs ?? 120_000;

  return async (
    input: AiProductFeatureExtractionInput,
  ): Promise<AiProductFeatureExtractionOutput> => {
    const response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(requestTimeoutMs),
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
    const usage: OpenRouterUsage = {
      promptTokens: payload.usage?.prompt_tokens,
      completionTokens: payload.usage?.completion_tokens,
      totalTokens: payload.usage?.total_tokens,
    };
    options.usageSink?.(usage);
    await options.costLedger?.record(
      createProductExtractionCostRecord({
        model,
        sourceUrl: input.url,
        usage,
        pricing: pricingForProductExtractorModel(model),
      }),
    );

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter response did not include message content.");
    }

    return parseAiExtractionOutput(content);
  };
}

export function productExtractionSystemPrompt(): string {
  return [
    "ROLE",
    "You are a product feature extraction and public-procurement specification suitability assessor for Turkish IT purchasing workflows.",
    "You convert product-page evidence into normalized technical features and decide whether each feature may safely become a draft technical specification clause.",
    "",
    "OUTPUT RULES",
    "Return only valid JSON. Do not include markdown, comments, prose outside JSON, or trailing commas.",
    "Do not invent missing values. Do not infer a value from general product knowledge.",
    "Use the supplied product title only for identity and broad category hints. Do not extract technical feature values from the title alone.",
    "Extract technical feature values only from product information sections, feature tables, bullet specifications, description/specification text, or other explicit page content.",
    "If a value appears only in the title and not in a product information/specification area, add a gap or review item instead of an include feature.",
    "Preserve raw observable page values, but classify every feature before it can become a clause.",
    "",
    "FEATURE CLASSIFICATION",
    "technicalRequired: objective, measurable, category-relevant technical properties such as RAM capacity, SSD capacity, screen size, resolution, duplex printing, port count, power rating.",
    "technicalPreferred: technical data that may be useful but can narrow competition or needs generalization, such as exact CPU/GPU model, exact chipset, exact vendor technology name.",
    "identity: brand, model, SKU, serial, part number, manufacturer identity, exact product family, seller identity.",
    "commercial: price, discount, campaign, coupon, basket offer, stock quantity, shipping, delivery, seller score, overseas sale flags, marketplace availability.",
    "cosmetic: color, appearance, decorative material/finish, style variants, unless the intended use explicitly requires it.",
    "marketing: subjective or promotional claims such as excellent, professional experience, gaming-ready, ultra performance, silent, premium, best, perfect, superior.",
    "standardOrCompliance: warranty, certificate, CE/TSE/ISO/RoHS, energy class, origin/country, compliance symbols; usually review unless the requirement is explicit and lawful.",
    "unknown: marketplace variant selectors, ambiguous labels, mixed values, unrelated page fragments, or data that cannot be safely classified.",
    "",
    "SPECIFICATION SUITABILITY DECISIONS",
    "include: safe, measurable, product-neutral enough for a draft clause. Use only for technicalRequired features with low or none lock-in risk.",
    "review: potentially relevant but needs human/legal/category review before clause generation.",
    "exclude: must not become a specification clause.",
    "Mark identity and commercial features as exclude.",
    "Mark marketplace variant selectors such as Seçenek, Varyant, color/model alternatives, and compatibility-option lists as review with high risk.",
    "Mark cosmetic, warranty, certificate, origin, and exact CPU/GPU/vendor technology features as review unless the intended use clearly makes them mandatory.",
    "Mark marketing claims as exclude.",
    "",
    "PUBLIC PROCUREMENT SAFETY",
    "Do not copy brand, model, seller, exact product code, SKU, serial, or marketplace-only option text into suggestedClauseText.",
    "Do not write a final/legal specification. This output is advisory and must remain reviewable.",
    "For include features, suggestedClauseText should be measurable, product-neutral, and inspection-friendly.",
    "Use 'en az' only when a minimum threshold is genuinely appropriate. For boolean support features, use 'desteklemelidir' or equivalent neutral wording.",
    "If copying the product's exact value would point to one product, use review instead of include.",
    "",
    "EXPECTED BEHAVIOR EXAMPLES",
    "RAM 16 GB from a specification table -> include, low risk, suggested clause: 'Bilgisayar en az 16 GB sistem bellegine sahip olmalidir.'",
    "SSD 512 GB from a specification table -> include, low risk.",
    "Intel Core Ultra 5 226V -> review, high risk, because exact processor model/vendor wording should be generalized.",
    "Lenovo, Samsung, Apple, model code, SKU -> exclude, high risk.",
    "Renk: Gri -> review, medium risk.",
    "Stok adedi, fiyat, sepette indirim, satici -> exclude, high risk.",
    "Seçenek: Galaxy Tab A9 Plus 11 inç -> review, high risk, because this is a marketplace variant/compatibility selector.",
    "",
    "JSON SHAPE",
    "{",
    '  "productCategory": "desktopComputer|notebookComputer|monitor|printer|scanner|ups|networkDevice|other",',
    '  "identity": {"title": "string", "brand": "string", "model": "string", "manufacturer": "string"},',
    '  "features": [{',
    '    "label": "string",',
    '    "value": "string|number|boolean",',
    '    "unit": "string",',
    '    "specSuitability": {',
    '      "featureClass": "technicalRequired|technicalPreferred|identity|commercial|cosmetic|marketing|standardOrCompliance|unknown",',
    '      "decision": "include|review|exclude",',
    '      "reason": "short reason tied to page evidence and procurement safety",',
    '      "riskLevel": "none|low|medium|high",',
    '      "suggestedClauseText": "string; omit or empty unless decision is include",',
    '      "confidence": 0.0',
    "    }",
    "  }],",
    '  "gaps": [{"code": "string", "message": "string", "severity": "info|warning|error", "featureKey": "string"}]',
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
