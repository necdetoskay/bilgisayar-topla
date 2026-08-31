import type {
  CatalogCategory,
  CatalogProduct,
} from "@bilgisayar-topla/catalog";
import type {
  ProductFeatureProfile,
  ValidationResult,
} from "@bilgisayar-topla/shared-contracts";

import {
  extractProductFeatureProfile,
  type AiProductFeatureExtractionOutput,
  type AiProductFeatureExtractor,
  type ExtractedSpec,
  type ProductExtractionResult,
} from "./index.js";

export type CatalogProductFeatureStatus =
  | "ready"
  | "reviewRequired"
  | "blocked";

export type CatalogProductFeatureDiagnostic = {
  code: string;
  message: string;
  featureLabel?: string;
};

export type CatalogProductFeatureRecord = {
  recordId: string;
  catalogProductId: string;
  componentCategory: CatalogCategory;
  productPageUrl?: string;
  status: CatalogProductFeatureStatus;
  diagnostics: CatalogProductFeatureDiagnostic[];
  profile?: ProductFeatureProfile;
  validation?: ValidationResult;
  extractionMode?: ProductExtractionResult["extractionMode"];
};

type EvidenceBoundExtractedSpec = ExtractedSpec & {
  sourceText?: string;
};

export async function extractCatalogProductFeatureRecord(args: {
  product: CatalogProduct;
  html: string;
  fetchedAt?: string;
  locale?: string;
  intendedUseSummary?: string;
  aiExtractor?: AiProductFeatureExtractor;
}): Promise<CatalogProductFeatureRecord> {
  const diagnostics: CatalogProductFeatureDiagnostic[] = [];
  const recordId = `catalog-feature-${args.product.catalogProductId}`;
  const productPageUrl = args.product.source.productUrl;

  if (args.product.availability !== "available") {
    return {
      recordId,
      catalogProductId: args.product.catalogProductId,
      componentCategory: args.product.category,
      productPageUrl,
      status: "blocked",
      diagnostics: [
        {
          code: "CATALOG_PRODUCT_UNAVAILABLE",
          message: "Unavailable catalog products are not sent to technical feature extraction.",
        },
      ],
    };
  }

  if (!productPageUrl) {
    return {
      recordId,
      catalogProductId: args.product.catalogProductId,
      componentCategory: args.product.category,
      status: "reviewRequired",
      diagnostics: [
        {
          code: "CATALOG_PRODUCT_PAGE_URL_MISSING",
          message:
            "A product-page URL is required before catalog technical features can become authoritative.",
        },
      ],
    };
  }

  if (!args.html.trim()) {
    return {
      recordId,
      catalogProductId: args.product.catalogProductId,
      componentCategory: args.product.category,
      productPageUrl,
      status: "reviewRequired",
      diagnostics: [
        {
          code: "CATALOG_PRODUCT_PAGE_BODY_MISSING",
          message:
            "Product-page body evidence is required before feature extraction can run.",
        },
      ],
    };
  }

  const guardedAiExtractor = args.aiExtractor
    ? createEvidenceGuardedCatalogAiExtractor(args.aiExtractor, (diagnostic) =>
        diagnostics.push(diagnostic),
      )
    : undefined;

  const extraction = await extractProductFeatureProfile({
    url: productPageUrl,
    html: args.html,
    fetchedAt: args.fetchedAt,
    locale: args.locale,
    intendedUseSummary: args.intendedUseSummary,
    aiExtractor: guardedAiExtractor,
  });

  const evidenceReady = extraction.profile.evidence.some(
    (evidence) => evidence.sourceType === "productPage" && evidence.qualityState === "ready",
  );
  const status: CatalogProductFeatureStatus =
    extraction.validation.valid &&
    extraction.profile.features.length > 0 &&
    evidenceReady
      ? "ready"
      : "reviewRequired";

  if (status !== "ready") {
    diagnostics.push({
      code: "CATALOG_PRODUCT_PROFILE_NOT_READY",
      message:
        "Catalog product profile did not pass the evidence/validation/readiness gate.",
    });
  }

  return {
    recordId,
    catalogProductId: args.product.catalogProductId,
    componentCategory: args.product.category,
    productPageUrl,
    status,
    diagnostics,
    profile: extraction.profile,
    validation: extraction.validation,
    extractionMode: extraction.extractionMode,
  };
}

export function createEvidenceGuardedCatalogAiExtractor(
  baseExtractor: AiProductFeatureExtractor,
  diagnosticSink?: (diagnostic: CatalogProductFeatureDiagnostic) => void,
): AiProductFeatureExtractor {
  return async (input) => {
    const output = await baseExtractor(input);
    const technicalEvidence = technicalEvidenceOnly(input.htmlText);
    const acceptedFeatures: ExtractedSpec[] = [];
    const gaps: NonNullable<AiProductFeatureExtractionOutput["gaps"]> = [
      ...(output.gaps ?? []),
    ];

    for (const feature of output.features) {
      const evidenceBoundFeature = feature as EvidenceBoundExtractedSpec;
      const sourceText = evidenceBoundFeature.sourceText?.trim();
      const rejection = validateAiFeatureEvidence(
        evidenceBoundFeature,
        sourceText,
        technicalEvidence,
      );

      if (rejection) {
        diagnosticSink?.({
          code: rejection.code,
          message: rejection.message,
          featureLabel: feature.label,
        });
        gaps.push({
          code: rejection.code.toLocaleLowerCase("en-US"),
          message: rejection.message,
          severity: "warning",
          featureKey: feature.label,
        });
        continue;
      }

      acceptedFeatures.push(feature);
    }

    return {
      ...output,
      features: acceptedFeatures,
      gaps,
    };
  };
}

function validateAiFeatureEvidence(
  feature: EvidenceBoundExtractedSpec,
  sourceText: string | undefined,
  technicalEvidence: string,
): CatalogProductFeatureDiagnostic | undefined {
  if (!sourceText) {
    return {
      code: "AI_FEATURE_SOURCE_TEXT_MISSING",
      message: `AI feature ${feature.label} was rejected because it has no raw sourceText evidence.`,
      featureLabel: feature.label,
    };
  }

  const normalizedEvidence = normalizeEvidenceText(technicalEvidence);
  const normalizedSourceText = normalizeEvidenceText(sourceText);
  if (!normalizedEvidence || !normalizedEvidence.includes(normalizedSourceText)) {
    return {
      code: "AI_FEATURE_SOURCE_TEXT_NOT_IN_TECHNICAL_EVIDENCE",
      message: `AI feature ${feature.label} was rejected because its sourceText is not present in structured specs or product-information snippets.`,
      featureLabel: feature.label,
    };
  }

  const normalizedLabel = normalizeEvidenceText(feature.label);
  if (!normalizedSourceText.includes(normalizedLabel)) {
    return {
      code: "AI_FEATURE_SOURCE_TEXT_LABEL_MISMATCH",
      message: `AI feature ${feature.label} was rejected because sourceText does not contain the observed feature label.`,
      featureLabel: feature.label,
    };
  }

  if (typeof feature.value !== "boolean") {
    const normalizedValue = normalizeEvidenceText(String(feature.value));
    if (normalizedValue && !normalizedSourceText.includes(normalizedValue)) {
      return {
        code: "AI_FEATURE_SOURCE_TEXT_VALUE_MISMATCH",
        message: `AI feature ${feature.label} was rejected because sourceText does not contain the extracted value.`,
        featureLabel: feature.label,
      };
    }
  }

  return undefined;
}

function technicalEvidenceOnly(evidencePackage: string): string {
  const specsMarker = "Structured specs:";
  const summaryMarker = "Visible page summary:";
  const snippetsMarker = "Visible product-information snippets:";

  const specsStart = evidencePackage.indexOf(specsMarker);
  const summaryStart = evidencePackage.indexOf(summaryMarker);
  const snippetsStart = evidencePackage.indexOf(snippetsMarker);

  const structuredSpecs =
    specsStart >= 0 && summaryStart > specsStart
      ? evidencePackage.slice(specsStart, summaryStart)
      : "";
  const productInformationSnippets =
    snippetsStart >= 0 ? evidencePackage.slice(snippetsStart) : "";

  return `${structuredSpecs}\n${productInformationSnippets}`.trim();
}

function normalizeEvidenceText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}
