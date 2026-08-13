import { createHash } from "node:crypto";
import {
  PRODUCT_FEATURE_PROFILE_SCHEMA_VERSION,
  type LockInRisk,
  type ProductCategory,
  type ProductFeature,
  type ProductFeatureProfile,
  type SpecFeatureClass,
  type SpecSuitabilityDecision,
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
  specSuitability?: ExtractedSpecSuitability;
};

export type ExtractedSpecSuitability = {
  featureClass: SpecFeatureClass;
  decision: SpecSuitabilityDecision;
  reason: string;
  riskLevel?: LockInRisk;
  suggestedClauseText?: string;
  confidence?: number;
};

type HepsiburadaProductState = {
  brand?: unknown;
  sku?: unknown;
  barcode?: unknown;
  name?: unknown;
  categories?: unknown;
  variants?: unknown;
};

const MAX_AI_PAGE_TEXT_CHARS = 60_000;

export async function extractProductFeatureProfile(
  input: ProductExtractionInput,
): Promise<ProductExtractionResult> {
  const checkedAt = input.fetchedAt ?? new Date().toISOString();
  const evidenceId = "product-page-001";
  const url = parseUrl(input.url);
  const html = input.html ?? "";
  const hepsiburadaProduct = extractHepsiburadaProductState(html);
  const structuredSpecs = dedupeSpecs([
    ...extractHepsiburadaSpecs(hepsiburadaProduct),
    ...extractTableSpecs(html),
  ]);
  const aiOutput = input.aiExtractor
    ? await input.aiExtractor({
        url: input.url,
        htmlText: prepareAiPageText(normalizeText(html)),
        fetchedAt: checkedAt,
        locale: input.locale ?? "tr-TR",
        intendedUseSummary: input.intendedUseSummary,
      })
    : undefined;
  const productCategory =
    aiOutput?.productCategory ??
    inferCategory(hepsiburadaCategoryText(hepsiburadaProduct) || html);
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
      title:
        aiOutput?.identity?.title ??
        stringValue(hepsiburadaProduct?.name) ??
        extractTitle(html),
      brand:
        aiOutput?.identity?.brand ?? stringValue(hepsiburadaProduct?.brand),
      model:
        aiOutput?.identity?.model ??
        stringValue(hepsiburadaProduct?.sku) ??
        stringValue(hepsiburadaProduct?.barcode),
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

function extractHepsiburadaProductState(
  html: string,
): HepsiburadaProductState | undefined {
  const stateJson = html.match(
    /<script[^>]+id=["']reduxStore["'][^>]*>\s*([\s\S]*?)\s*<\/script>/i,
  )?.[1];
  if (!stateJson) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(stateJson) as unknown;
    if (!isRecord(parsed)) {
      return undefined;
    }
    const productState = parsed.productState;
    if (!isRecord(productState) || !isRecord(productState.product)) {
      return undefined;
    }
    return productState.product as HepsiburadaProductState;
  } catch {
    return undefined;
  }
}

function extractHepsiburadaSpecs(
  product: HepsiburadaProductState | undefined,
): ExtractedSpec[] {
  if (!product || !Array.isArray(product.variants)) {
    return [];
  }

  return product.variants.flatMap((variant) => {
    if (!isRecord(variant)) {
      return [];
    }
    if (Array.isArray(variant.properties)) {
      return variant.properties.flatMap(extractHepsiburadaVariantProperty);
    }

    return extractHepsiburadaVariantProperty(variant);
  });
}

function extractHepsiburadaVariantProperty(variant: unknown): ExtractedSpec[] {
  if (!isRecord(variant)) {
    return [];
  }

    const label = stringValue(variant.displayName) ?? stringValue(variant.name);
    const valueObject = variant.valueObject;
    const rawValue = isRecord(valueObject)
      ? stringValue(valueObject.actualValue)
      : stringValue(variant.value);
    const normalized = normalizeValue(rawValue);
    if (!label || !normalized) {
      return [];
    }

  return [
    {
      label,
      value: normalized.value,
      unit: normalized.unit,
    },
  ];
}

function hepsiburadaCategoryText(
  product: HepsiburadaProductState | undefined,
): string {
  if (!product) {
    return "";
  }

  const categoryNames = Array.isArray(product.categories)
    ? product.categories.flatMap((category) => {
        if (!isRecord(category)) {
          return [];
        }
        return [
          stringValue(category.categoryName),
          stringValue(category.breadcrumbTitle),
          stringValue(category.urlKeyword),
        ].filter(Boolean);
      })
    : [];

  return [stringValue(product.name), ...categoryNames].filter(Boolean).join(" ");
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
  const suitability = assessSpecSuitability(spec);
  const risk = suitability.riskLevel;

  return {
    key: `${category}.${slug(spec.label)}`,
    label: spec.label,
    value: spec.value,
    unit: spec.unit,
    group: category,
    requirementLevel:
      suitability.decision === "include"
        ? "required"
        : suitability.decision === "review"
          ? "preferred"
          : "informational",
    sourceRefIds: [evidenceId],
    lockInRisk: risk,
    clauseEligible: suitability.decision === "include" && risk !== "high",
    specSuitability: suitability,
  };
}

function assessSpecSuitability(
  spec: ExtractedSpec,
): NonNullable<ProductFeature["specSuitability"]> {
  const aiSuitability = normalizeAiSuitability(spec.specSuitability);
  if (aiSuitability) {
    return aiSuitability;
  }

  const label = spec.label.toLocaleLowerCase("tr-TR");
  const value = String(spec.value).toLocaleLowerCase("tr-TR");
  const text = `${label} ${value}`;

  if (/(secenek|seçenek|varyant|variant)/i.test(label)) {
    return {
      featureClass: "unknown",
      decision: "review",
      reason: "Marketplace variant selectors may contain alternative products, colors or brand/model compatibility options and should not automatically become specification clauses.",
      riskLevel: "high",
      confidence: 0.9,
    };
  }

  if (/\b(intel|amd|nvidia|rtx|ryzen|core ultra|core i[3579])\b/i.test(text)) {
    return {
      featureClass: "technicalPreferred",
      decision: "review",
      reason: "Exact processor, GPU or vendor technology names can create product lock-in and should be generalized before clause generation.",
      riskLevel: "high",
      confidence: 0.9,
    };
  }

  if (/\b(marka|brand|model|sku|part number|urun kodu|ürün kodu|seri|satici|satıcı)\b/i.test(text)) {
    return {
      featureClass: "identity",
      decision: "exclude",
      reason: "Brand, model, SKU, serial or seller identifiers can create product lock-in.",
      riskLevel: "high",
      confidence: 0.95,
    };
  }

  if (/(fiyat|kampanya|indirim|stok|kargo|teslimat|taksit|kupon|sepet|yurt disi satis|yurt dışı satış)/i.test(text)) {
    return {
      featureClass: "commercial",
      decision: "exclude",
      reason: "Commercial page data is not a stable technical specification criterion.",
      riskLevel: "high",
      confidence: 0.92,
    };
  }

  if (/(mensei|menşei|origin|ulke|ülke)/i.test(label)) {
    return {
      featureClass: "unknown",
      decision: "review",
      reason: "Country-of-origin data is not a technical performance requirement and should only be used when a lawful procurement reason exists.",
      riskLevel: "medium",
      confidence: 0.82,
    };
  }

  if (/(renk|color|tasarim|tasarım|görünüm|gorunum)/i.test(text)) {
    return {
      featureClass: "cosmetic",
      decision: "review",
      reason: "Cosmetic properties are usually not technical requirements unless the need explicitly depends on them.",
      riskLevel: "medium",
      confidence: 0.8,
    };
  }

  if (/(mukemmel|mükemmel|ustun|üstün|profesyonel deneyim|oyuncular icin|oyuncular için)/i.test(text)) {
    return {
      featureClass: "marketing",
      decision: "exclude",
      reason: "Marketing claims are subjective and not directly measurable during acceptance.",
      riskLevel: "medium",
      confidence: 0.85,
    };
  }

  if (/(ce\b|eac\b|rohs|iso|tse|garanti|enerji sinifi|enerji sınıfı|sertifika)/i.test(text)) {
    return {
      featureClass: "standardOrCompliance",
      decision: "review",
      reason: "Standards, warranty and compliance details can be useful but should be checked against category policy and current rules.",
      riskLevel: "medium",
      confidence: 0.78,
    };
  }

  return {
    featureClass: "technicalRequired",
    decision: "include",
    reason: "The feature appears to be an observable technical property.",
    riskLevel: "low",
    confidence: 0.82,
  };
}

function normalizeAiSuitability(
  suitability: ExtractedSpecSuitability | undefined,
): NonNullable<ProductFeature["specSuitability"]> | undefined {
  if (!suitability || !suitability.reason) {
    return undefined;
  }

  const riskLevel = suitability.riskLevel ?? decisionToRisk(suitability.decision);
  const decision =
    riskLevel === "high" && suitability.decision === "include"
      ? "review"
      : suitability.decision;

  return {
    featureClass: suitability.featureClass,
    decision,
    reason: suitability.reason,
    riskLevel,
    suggestedClauseText: suitability.suggestedClauseText,
    confidence: suitability.confidence,
  };
}

function decisionToRisk(decision: SpecSuitabilityDecision): LockInRisk {
  if (decision === "exclude") {
    return "high";
  }
  if (decision === "review") {
    return "medium";
  }
  return "low";
}

function inferCategory(text: string): ProductCategory {
  const normalized = text.toLocaleLowerCase("tr-TR");

  if (/(all in one|aio|hepsi bir arada).*(bilgisayar|computer)|(bilgisayar|computer).*(all in one|aio|hepsi bir arada)/i.test(normalized)) {
    return "desktopComputer";
  }
  if (/(tablet|ipad).*(kilif|kılıf|kapak|stand)|(kilif|kılıf|kapak).*(tablet|ipad)/i.test(normalized)) {
    return "other";
  }
  if (/(notebook|laptop|dizustu|dizüstü).*(sogutucu|soğutucu|stand|aksesuar)|(sogutucu|soğutucu|stand|aksesuar).*(notebook|laptop|dizustu|dizüstü)/i.test(normalized)) {
    return "other";
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
  if (/(monitor|ekran)/i.test(normalized)) {
    return "monitor";
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

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function prepareAiPageText(text: string): string {
  if (text.length <= MAX_AI_PAGE_TEXT_CHARS) {
    return text;
  }

  const productInfoIndex = findFirstIndex(text, [
    "Ürün Bilgileri",
    "Urun Bilgileri",
    "Ürün özellikleri",
    "Urun ozellikleri",
    "Teknik Özellikler",
    "Teknik Ozellikler",
  ]);

  if (productInfoIndex >= 0) {
    const prefix = text.slice(0, 8_000);
    const featureWindow = text.slice(
      Math.max(0, productInfoIndex - 2_000),
      productInfoIndex + MAX_AI_PAGE_TEXT_CHARS - prefix.length,
    );
    return `${prefix}\n\n${featureWindow}`.slice(0, MAX_AI_PAGE_TEXT_CHARS);
  }

  return text.slice(0, MAX_AI_PAGE_TEXT_CHARS);
}

function findFirstIndex(text: string, needles: string[]): number {
  const indexes = needles
    .map((needle) => text.indexOf(needle))
    .filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
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
