import { createHash } from "node:crypto";
import {
  PRODUCT_FEATURE_PROFILE_SCHEMA_VERSION,
  type LockInRisk,
  type ProductCategory,
  type ProductFeature,
  type ProductFeatureProfile,
  type ValidationResult,
  validateProductFeatureProfile,
} from "@bilgisayar-topla/shared-contracts";

export type ProductExtractionInput = {
  url: string;
  html: string;
  fetchedAt?: string;
  locale?: string;
  intendedUseSummary?: string;
  aiExtractor?: AiProductFeatureExtractor;
};

export type ProductExtractionResult = {
  profile: ProductFeatureProfile;
  validation: ValidationResult;
  extractionMode: "ai" | "structuredFallback";
};

export type AiProductFeatureExtractor = (
  input: AiProductFeatureExtractionInput,
) => Promise<AiProductFeatureExtractionOutput>;

export type AiProductFeatureExtractionInput = {
  url: string;
  htmlText: string;
  fetchedAt: string;
  locale: string;
  intendedUseSummary?: string;
};

export type AiProductFeatureExtractionOutput = {
  productCategory?: ProductCategory;
  identity?: {
    title?: string;
    brand?: string;
    model?: string;
    manufacturer?: string;
  };
  features: ExtractedSpec[];
  gaps?: Array<{
    code: string;
    message: string;
    severity: "info" | "warning" | "error";
    featureKey?: string;
  }>;
};

export type ExtractedSpec = {
  label: string;
  value: string | number | boolean;
  unit?: string;
};

export async function extractProductFeatureProfile(
  input: ProductExtractionInput,
): Promise<ProductExtractionResult> {
  const checkedAt = input.fetchedAt ?? new Date().toISOString();
  const evidenceId = "product-page-001";
  const url = parseUrl(input.url);
  const html = input.html ?? "";
  const structuredSpecs = extractTableSpecs(html);
  const aiOutput = input.aiExtractor
    ? await input.aiExtractor({
        url: input.url,
        htmlText: normalizeText(html),
        fetchedAt: checkedAt,
        locale: input.locale ?? "tr-TR",
        intendedUseSummary: input.intendedUseSummary,
      })
    : undefined;
  const productCategory = aiOutput?.productCategory ?? inferCategory(html);
  const specs = dedupeSpecs(
    aiOutput?.features?.length ? aiOutput.features : structuredSpecs,
  );
  const snapshotSha256 = sha256(html);

  const profile: ProductFeatureProfile = {
    profileId: `profile-${productCategory}-${snapshotSha256.slice(0, 12)}`,
    schemaVersion: PRODUCT_FEATURE_PROFILE_SCHEMA_VERSION,
    productCategory,
    sourceMode: "productExtractor",
    createdAt: checkedAt,
    locale: input.locale ?? "tr-TR",
    intendedUse: input.intendedUseSummary
      ? { summary: input.intendedUseSummary }
      : undefined,
    identity: {
      title: aiOutput?.identity?.title ?? extractTitle(html),
      brand: aiOutput?.identity?.brand,
      model: aiOutput?.identity?.model,
      manufacturer: aiOutput?.identity?.manufacturer,
      sourceUrl: url?.href,
    },
    features: specs.map((spec) =>
      toProductFeature(productCategory, spec, evidenceId),
    ),
    evidence: [
      {
        evidenceId,
        sourceType: "productPage",
        url: url?.href,
        checkedAt,
        snapshotSha256,
        sourceLabel: url?.hostname ?? "product page fixture",
        qualityState: specs.length > 0 && url ? "ready" : "reviewRequired",
      },
    ],
    gaps: aiOutput?.gaps ?? [],
    readiness: specs.length > 0 && url ? "readyForSpecification" : "reviewRequired",
  };

  if (!url) {
    profile.gaps.push({
      code: "invalid_source_url",
      message: "Product page URL could not be parsed.",
      severity: "error",
    });
    profile.readiness = "blocked";
    const productPageEvidence = profile.evidence[0];
    if (productPageEvidence) {
      productPageEvidence.qualityState = "rejected";
    }
  }

  if (specs.length === 0) {
    profile.gaps.push({
      code: "no_product_features_found",
      message: "No structured product features were found in the supplied HTML.",
      severity: "warning",
    });
  }

  return {
    profile,
    validation: validateProductFeatureProfile(profile),
    extractionMode: aiOutput ? "ai" : "structuredFallback",
  };
}

function parseUrl(rawUrl: string): URL | undefined {
  try {
    return new URL(rawUrl);
  } catch {
    return undefined;
  }
}

function extractTableSpecs(html: string): ExtractedSpec[] {
  const specs: ExtractedSpec[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const rowHtml = rowMatch[1] ?? "";
    const cells = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => normalizeText(cell[1] ?? ""))
      .filter(Boolean);

    if (cells.length < 2) {
      continue;
    }

    const normalized = normalizeValue(cells.slice(1).join(" "));
    if (!normalized) {
      continue;
    }

    specs.push({
      label: cells[0] ?? "",
      value: normalized.value,
      unit: normalized.unit,
    });
  }

  return specs;
}

function toProductFeature(
  category: ProductCategory,
  spec: ExtractedSpec,
  evidenceId: string,
): ProductFeature {
  const risk = lockInRisk(spec);

  return {
    key: `${category}.${slug(spec.label)}`,
    label: spec.label,
    value: spec.value,
    unit: spec.unit,
    group: category,
    requirementLevel: risk === "high" ? "informational" : "required",
    sourceRefIds: [evidenceId],
    lockInRisk: risk,
    clauseEligible: risk !== "high",
  };
}

function lockInRisk(spec: ExtractedSpec): LockInRisk {
  const label = spec.label.toLocaleLowerCase("tr-TR");
  if (/\b(marka|brand|model|sku|part number|urun kodu|seri)\b/i.test(label)) {
    return "high";
  }
  return "low";
}

function inferCategory(text: string): ProductCategory {
  const normalized = text.toLocaleLowerCase("tr-TR");

  if (/(monitor|ekran)/i.test(normalized)) {
    return "monitor";
  }
  if (/(printer|yazici|yazıcı)/i.test(normalized)) {
    return "printer";
  }
  if (/(scanner|tarayici|tarayıcı)/i.test(normalized)) {
    return "scanner";
  }
  if (/(notebook|laptop|dizustu|dizüstü)/i.test(normalized)) {
    return "notebookComputer";
  }
  if (/(switch|router|modem|access point|network|ag cihazi|ağ cihazı)/i.test(normalized)) {
    return "networkDevice";
  }
  if (/\bups\b|kesintisiz guc|kesintisiz güç/i.test(normalized)) {
    return "ups";
  }
  if (/(desktop|masaustu|masaüstü|bilgisayar)/i.test(normalized)) {
    return "desktopComputer";
  }
  return "other";
}

function normalizeValue(
  value: string | undefined,
): { value: string | number | boolean; unit?: string } | undefined {
  if (!value) {
    return undefined;
  }

  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  if (/^(var|evet|true|yes)$/i.test(text)) {
    return { value: true };
  }
  if (/^(yok|hayir|hayır|false|no)$/i.test(text)) {
    return { value: false };
  }

  const numeric = text.match(
    /^(\d+(?:[.,]\d+)?)\s*(inc|inch|inç|gb|tb|mb|w|hz)$/i,
  );
  if (numeric) {
    const numericValue = numeric[1] ?? "";
    const numericUnit = numeric[2] ?? "";
    return {
      value: Number(numericValue.replace(",", ".")),
      unit: normalizeUnit(numericUnit),
    };
  }

  return { value: text };
}

function normalizeUnit(unit: string): string {
  const normalized = unit.toLocaleLowerCase("tr-TR");
  if (normalized === "inç" || normalized === "inch") {
    return "inc";
  }
  return normalized;
}

function dedupeSpecs(specs: ExtractedSpec[]): ExtractedSpec[] {
  const seen = new Set<string>();
  const result: ExtractedSpec[] = [];

  for (const spec of specs) {
    const key = `${slug(spec.label)}:${String(spec.value).toLocaleLowerCase("tr-TR")}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(spec);
  }

  return result;
}

function extractTitle(html: string): string | undefined {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? normalizeText(title) : undefined;
}

function normalizeText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
