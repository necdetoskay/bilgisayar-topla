import { createHash } from "node:crypto";

export const CATALOG_SNAPSHOT_SCHEMA_VERSION = "1.0.0" as const;

export type CatalogCategory =
  | "cpu"
  | "motherboard"
  | "memory"
  | "gpu"
  | "storage"
  | "psu"
  | "case";

export const REQUIRED_BUILD_CATEGORIES: readonly CatalogCategory[] = [
  "cpu",
  "motherboard",
  "memory",
  "gpu",
  "storage",
  "psu",
  "case",
] as const;

export type CatalogAvailability = "available" | "unavailable";
export type CatalogQualityState = "ready" | "partial" | "reviewRequired" | "rejected";

export type CatalogProductSource = {
  sourceType: "incehesapConfigurator";
  targetUrl: string;
  productUrl?: string;
  observedAt: string;
  scraperRunId: string;
  rawText?: string;
  priceText?: string;
};

export type CatalogProduct = {
  catalogProductId: string;
  category: CatalogCategory;
  name: string;
  price?: {
    amount: number;
    currency: "TRY";
  };
  availability: CatalogAvailability;
  source: CatalogProductSource;
};

export type CatalogDiagnostic = {
  code: string;
  message: string;
  category?: CatalogCategory;
  productId?: string;
};

export type CatalogSnapshot = {
  snapshotId: string;
  schemaVersion: typeof CATALOG_SNAPSHOT_SCHEMA_VERSION;
  sourceType: "incehesapConfigurator";
  targetUrl: string;
  observedAt: string;
  scraperRunId: string;
  products: CatalogProduct[];
  coveredCategories: CatalogCategory[];
  missingRequiredCategories: CatalogCategory[];
  selectionChainReady?: boolean;
  diagnostics: CatalogDiagnostic[];
  qualityState: CatalogQualityState;
};

export type ScraperProductOptionLike = {
  category: "cpu" | "motherboard" | "ram" | "gpu" | "ssd" | "psu" | "case";
  name: string;
  productUrl?: string;
  priceText?: string;
  priceValue?: number;
  isAvailable: boolean;
  rawText?: string;
};

export type ScraperReportLike = {
  ok: boolean;
  targetUrl: string;
  startedAt: string;
  finishedAt: string;
  cpuOptions?: ScraperProductOptionLike[];
  motherboardOptions?: ScraperProductOptionLike[];
  ramOptions?: ScraperProductOptionLike[];
  gpuOptions?: ScraperProductOptionLike[];
  ssdOptions?: ScraperProductOptionLike[];
  psuOptions?: ScraperProductOptionLike[];
  caseOptions?: ScraperProductOptionLike[];
  fullCategoryChainReady?: boolean;
  diagnostics?: Array<{ code: string; message: string }>;
};

export type CatalogValidationResult = {
  valid: boolean;
  issues: CatalogDiagnostic[];
};

export function catalogSnapshotFromScraperReport(
  report: ScraperReportLike,
): CatalogSnapshot {
  const scraperRunId = stableId("scraper-run", `${report.targetUrl}|${report.startedAt}`);
  const snapshotId = stableId(
    "catalog",
    `${report.targetUrl}|${report.startedAt}|${report.finishedAt}`,
  );

  const sourceGroups: ScraperProductOptionLike[][] = [
    report.cpuOptions ?? [],
    report.motherboardOptions ?? [],
    report.ramOptions ?? [],
    report.gpuOptions ?? [],
    report.ssdOptions ?? [],
    report.psuOptions ?? [],
    report.caseOptions ?? [],
  ];

  const diagnostics: CatalogDiagnostic[] = (report.diagnostics ?? []).map(
    (diagnostic) => ({
      code: `SCRAPER_${diagnostic.code}`,
      message: diagnostic.message,
    }),
  );

  const products = sourceGroups
    .flat()
    .map((option) => normalizeProduct(option, report, scraperRunId, diagnostics));

  const coveredCategories = REQUIRED_BUILD_CATEGORIES.filter((category) =>
    products.some((product) => product.category === category),
  );
  const missingRequiredCategories = REQUIRED_BUILD_CATEGORIES.filter(
    (category) => !coveredCategories.includes(category),
  );

  for (const category of missingRequiredCategories) {
    diagnostics.push({
      code: "CATALOG_REQUIRED_CATEGORY_MISSING",
      category,
      message: `required catalog category ${category} has no observed products`,
    });
  }

  const selectionChainIncomplete = report.fullCategoryChainReady === false;
  if (selectionChainIncomplete) {
    diagnostics.push({
      code: "CATALOG_SELECTION_CHAIN_INCOMPLETE",
      message:
        "scraper category selection chain did not complete; catalog cannot be treated as ready",
    });
  }

  const availableProductWithoutPrice = products.find(
    (product) => product.availability === "available" && !product.price,
  );
  if (availableProductWithoutPrice) {
    diagnostics.push({
      code: "CATALOG_AVAILABLE_PRODUCT_PRICE_MISSING",
      category: availableProductWithoutPrice.category,
      productId: availableProductWithoutPrice.catalogProductId,
      message: `available product ${availableProductWithoutPrice.name} has no normalized price`,
    });
  }

  const qualityState: CatalogQualityState = !report.ok
    ? "reviewRequired"
    : missingRequiredCategories.length > 0
      ? "partial"
      : selectionChainIncomplete
        ? "reviewRequired"
        : availableProductWithoutPrice
          ? "reviewRequired"
          : "ready";

  return {
    snapshotId,
    schemaVersion: CATALOG_SNAPSHOT_SCHEMA_VERSION,
    sourceType: "incehesapConfigurator",
    targetUrl: report.targetUrl,
    observedAt: report.finishedAt,
    scraperRunId,
    products,
    coveredCategories,
    missingRequiredCategories,
    selectionChainReady: report.fullCategoryChainReady,
    diagnostics,
    qualityState,
  };
}

export function validateCatalogSnapshot(
  snapshot: CatalogSnapshot,
): CatalogValidationResult {
  const issues: CatalogDiagnostic[] = [];

  if (snapshot.schemaVersion !== CATALOG_SNAPSHOT_SCHEMA_VERSION) {
    issues.push({
      code: "CATALOG_SCHEMA_VERSION_UNSUPPORTED",
      message: `schemaVersion must be ${CATALOG_SNAPSHOT_SCHEMA_VERSION}`,
    });
  }

  if (!snapshot.targetUrl.trim()) {
    issues.push({
      code: "CATALOG_TARGET_URL_MISSING",
      message: "targetUrl is required",
    });
  }

  const productIds = new Set<string>();
  for (const product of snapshot.products) {
    if (!product.name.trim()) {
      issues.push({
        code: "CATALOG_PRODUCT_NAME_MISSING",
        productId: product.catalogProductId,
        category: product.category,
        message: "catalog product name is required",
      });
    }
    if (productIds.has(product.catalogProductId)) {
      issues.push({
        code: "CATALOG_PRODUCT_ID_DUPLICATE",
        productId: product.catalogProductId,
        category: product.category,
        message: `duplicate product id ${product.catalogProductId}`,
      });
    }
    productIds.add(product.catalogProductId);

    if (product.price && (!Number.isFinite(product.price.amount) || product.price.amount < 0)) {
      issues.push({
        code: "CATALOG_PRODUCT_PRICE_INVALID",
        productId: product.catalogProductId,
        category: product.category,
        message: "product price must be a finite non-negative number",
      });
    }
  }

  const expectedMissing = REQUIRED_BUILD_CATEGORIES.filter(
    (category) => !snapshot.products.some((product) => product.category === category),
  );
  if (!sameCategorySet(expectedMissing, snapshot.missingRequiredCategories)) {
    issues.push({
      code: "CATALOG_MISSING_CATEGORY_STATE_MISMATCH",
      message: "missingRequiredCategories does not match observed products",
    });
  }

  if (snapshot.qualityState === "ready" && expectedMissing.length > 0) {
    issues.push({
      code: "CATALOG_READY_WITH_MISSING_CATEGORY",
      message: "ready catalog snapshot cannot miss a required build category",
    });
  }

  if (snapshot.qualityState === "ready" && snapshot.selectionChainReady === false) {
    issues.push({
      code: "CATALOG_READY_WITH_INCOMPLETE_SELECTION_CHAIN",
      message: "ready catalog snapshot cannot have an incomplete selection chain",
    });
  }

  return { valid: issues.length === 0, issues };
}

function normalizeProduct(
  option: ScraperProductOptionLike,
  report: ScraperReportLike,
  scraperRunId: string,
  diagnostics: CatalogDiagnostic[],
): CatalogProduct {
  const category = mapCategory(option.category);
  const normalizedName = option.name.trim();
  const catalogProductId = stableId(
    "product",
    `${category}|${normalizeIdentityText(normalizedName)}`,
  );

  if (!normalizedName) {
    diagnostics.push({
      code: "CATALOG_PRODUCT_NAME_MISSING",
      category,
      productId: catalogProductId,
      message: "scraper product option has an empty name",
    });
  }

  const price =
    option.priceValue !== undefined &&
    Number.isFinite(option.priceValue) &&
    option.priceValue >= 0
      ? { amount: option.priceValue, currency: "TRY" as const }
      : undefined;

  return {
    catalogProductId,
    category,
    name: normalizedName,
    price,
    availability: option.isAvailable ? "available" : "unavailable",
    source: {
      sourceType: "incehesapConfigurator",
      targetUrl: report.targetUrl,
      productUrl: option.productUrl,
      observedAt: report.finishedAt,
      scraperRunId,
      rawText: option.rawText,
      priceText: option.priceText,
    },
  };
}

function mapCategory(category: ScraperProductOptionLike["category"]): CatalogCategory {
  switch (category) {
    case "ram":
      return "memory";
    case "ssd":
      return "storage";
    default:
      return category;
  }
}

function stableId(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value, "utf8").digest("hex").slice(0, 20);
  return `${prefix}-${digest}`;
}

function normalizeIdentityText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})?\s*(?:tl|try|₺)/gi, " ")
    .replace(/(?:^|\s)(?:sepete\s+ekle|seç|sec|ekle)(?=\s|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameCategorySet(
  left: readonly CatalogCategory[],
  right: readonly CatalogCategory[],
): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((category) => rightSet.has(category));
}
