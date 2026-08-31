import { createHash } from "node:crypto";

import {
  generateAndScoreBuilds,
  type BuildCandidateEvaluation,
  type BuildEngineProduct,
} from "@bilgisayar-topla/build-engine";
import {
  validateCatalogSnapshot,
  type CatalogProduct,
  type CatalogSnapshot,
} from "@bilgisayar-topla/catalog";
import type {
  HardwareTarget,
  OfficialSourceRecord,
  RequirementFields,
  SoftwareRequirementProfile,
} from "@bilgisayar-topla/requirements";
import { validateProductFeatureProfile } from "@bilgisayar-topla/shared-contracts";

export const BUILD_VERIFICATION_SCHEMA_VERSION = "1.0.0" as const;
export type BuildVerificationStatus = "PASS" | "FAIL" | "REVIEW_REQUIRED";

export type VerificationSelection = {
  buildId: string;
  catalogProductIds?: string[];
  productProfileIds: string[];
  totalPrice: number;
  currency: string;
  score?: number;
};

export type VerificationDiagnostic = {
  code: string;
  message: string;
  severity: "error" | "warning";
  productId?: string;
  profileId?: string;
  targetId?: string;
};

export type CatalogLineageRecord = {
  catalogProductId: string;
  profileId: string;
  category: CatalogProduct["category"];
  catalogPrice: number;
  currency: string;
  productPageUrl: string;
  productPageSnapshotSha256: string;
};

export type RequirementLineageRecord = {
  targetId: string;
  sourceId: string;
  requirementId: string;
  field: string;
  sourceUrl: string;
  sourceSnapshotSha256: string;
  observedValue: string;
};

export type RecomputedVerification = {
  candidateId: string;
  totalPrice: number;
  currency: string;
  score?: number;
  outcome: BuildCandidateEvaluation["outcome"];
  compatibility: BuildCandidateEvaluation["compatibility"];
  targetChecks: BuildCandidateEvaluation["targetChecks"];
};

export type BuildVerificationResult = {
  verificationId: string;
  schemaVersion: typeof BUILD_VERIFICATION_SCHEMA_VERSION;
  buildId: string;
  status: BuildVerificationStatus;
  diagnostics: VerificationDiagnostic[];
  catalogLineage: CatalogLineageRecord[];
  requirementLineage: RequirementLineageRecord[];
  recomputed?: RecomputedVerification;
};

export function verifySelectedBuild(args: {
  selection: VerificationSelection;
  catalog: CatalogSnapshot;
  products: BuildEngineProduct[];
  targets: HardwareTarget[];
  officialSources: OfficialSourceRecord[];
  requirements: SoftwareRequirementProfile[];
  budgetAmount: number;
  currency?: string;
}): BuildVerificationResult {
  if (!Number.isFinite(args.budgetAmount) || args.budgetAmount <= 0) {
    throw new Error("budgetAmount must be a positive finite number");
  }

  const currency = args.currency?.trim() || args.selection.currency;
  const diagnostics: VerificationDiagnostic[] = [];
  const catalogLineage: CatalogLineageRecord[] = [];
  const requirementLineage: RequirementLineageRecord[] = [];
  const verificationId = stableVerificationId(
    args.selection.buildId,
    args.catalog.snapshotId,
  );

  const catalogValidation = validateCatalogSnapshot(args.catalog);
  if (!catalogValidation.valid) {
    diagnostics.push({
      code: "VERIFICATION_CATALOG_INVALID",
      message: `Catalog snapshot is invalid: ${catalogValidation.issues.map((issue) => issue.code).join(", ")}`,
      severity: "error",
    });
  }
  if (args.catalog.qualityState !== "ready") {
    diagnostics.push({
      code: "VERIFICATION_CATALOG_NOT_READY",
      message: `Catalog snapshot quality is ${args.catalog.qualityState}, not ready.`,
      severity: "warning",
    });
  }

  const selectedIds = args.selection.catalogProductIds;
  if (!selectedIds || selectedIds.length === 0) {
    diagnostics.push({
      code: "VERIFICATION_SELECTION_CATALOG_LINEAGE_MISSING",
      message: "Selected build does not preserve catalog product ids.",
      severity: "warning",
    });
    return result({
      verificationId,
      buildId: args.selection.buildId,
      diagnostics,
      catalogLineage,
      requirementLineage,
    });
  }

  if (new Set(selectedIds).size !== selectedIds.length) {
    diagnostics.push({
      code: "VERIFICATION_SELECTION_PRODUCT_ID_DUPLICATE",
      message: "Selected build contains duplicate catalog product ids.",
      severity: "error",
    });
  }

  const catalogById = new Map(
    args.catalog.products.map((product) => [product.catalogProductId, product] as const),
  );
  const engineProductById = new Map(
    args.products.map((product) => [product.catalogProductId, product] as const),
  );
  const selectedProducts: BuildEngineProduct[] = [];

  for (const productId of selectedIds) {
    const catalogProduct = catalogById.get(productId);
    if (!catalogProduct) {
      diagnostics.push({
        code: "VERIFICATION_CATALOG_PRODUCT_MISSING",
        message: `Selected product ${productId} is not present in the catalog snapshot.`,
        severity: "error",
        productId,
      });
      continue;
    }

    const engineProduct = engineProductById.get(productId);
    if (!engineProduct) {
      diagnostics.push({
        code: "VERIFICATION_PRODUCT_PROFILE_RECORD_MISSING",
        message: `Selected product ${productId} has no verification product/profile record.`,
        severity: "error",
        productId,
      });
      continue;
    }

    selectedProducts.push(engineProduct);
    verifyCatalogProductLineage(
      catalogProduct,
      engineProduct,
      diagnostics,
      catalogLineage,
    );
  }

  const expectedProfileIds = [...args.selection.productProfileIds].sort();
  const actualProfileIds = selectedProducts
    .map((product) => product.profile.profileId)
    .sort();
  if (!sameStrings(expectedProfileIds, actualProfileIds)) {
    diagnostics.push({
      code: "VERIFICATION_PROFILE_LINEAGE_MISMATCH",
      message: "Selected build profile ids do not match the catalog product/profile records used for verification.",
      severity: "error",
    });
  }

  verifyTargetLineage(
    args.targets,
    args.officialSources,
    args.requirements,
    diagnostics,
    requirementLineage,
  );

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return result({
      verificationId,
      buildId: args.selection.buildId,
      diagnostics,
      catalogLineage,
      requirementLineage,
    });
  }

  if (selectedProducts.length !== selectedIds.length) {
    diagnostics.push({
      code: "VERIFICATION_SELECTED_PRODUCT_SET_INCOMPLETE",
      message: "Not every selected catalog product could be rebound to a verification product record.",
      severity: "error",
    });
    return result({
      verificationId,
      buildId: args.selection.buildId,
      diagnostics,
      catalogLineage,
      requirementLineage,
    });
  }

  const engineResult = generateAndScoreBuilds({
    products: selectedProducts,
    targets: args.targets,
    budgetAmount: args.budgetAmount,
    currency,
    maxProductsPerCategory: 1,
    maxCandidates: 1,
    topN: 1,
  });
  const evaluation = engineResult.evaluations[0];

  if (!evaluation) {
    diagnostics.push({
      code: "VERIFICATION_RECOMPUTE_NO_CANDIDATE",
      message: "Independent recomputation did not produce the selected candidate.",
      severity: engineResult.status === "reviewRequired" ? "warning" : "error",
    });
    return result({
      verificationId,
      buildId: args.selection.buildId,
      diagnostics,
      catalogLineage,
      requirementLineage,
    });
  }

  const recomputed: RecomputedVerification = {
    candidateId: evaluation.candidateId,
    totalPrice: evaluation.totalPrice,
    currency: evaluation.currency,
    score: evaluation.score,
    outcome: evaluation.outcome,
    compatibility: evaluation.compatibility,
    targetChecks: evaluation.targetChecks,
  };

  if (evaluation.candidateId !== args.selection.buildId) {
    diagnostics.push({
      code: "VERIFICATION_BUILD_ID_MISMATCH",
      message: `Selected build id ${args.selection.buildId} does not match recomputed candidate id ${evaluation.candidateId}.`,
      severity: "error",
    });
  }

  if (evaluation.currency !== args.selection.currency) {
    diagnostics.push({
      code: "VERIFICATION_BUILD_CURRENCY_MISMATCH",
      message: `Selected build currency ${args.selection.currency} does not match recomputed currency ${evaluation.currency}.`,
      severity: "error",
    });
  }

  if (!sameMoney(evaluation.totalPrice, args.selection.totalPrice)) {
    diagnostics.push({
      code: "VERIFICATION_BUILD_PRICE_MISMATCH",
      message: `Selected build price ${args.selection.totalPrice} does not match independently recomputed price ${evaluation.totalPrice}.`,
      severity: "error",
    });
  }

  if (evaluation.outcome === "compatibilityReviewRequired" || evaluation.outcome === "targetReviewRequired") {
    diagnostics.push({
      code: "VERIFICATION_RECOMPUTE_REVIEW_REQUIRED",
      message: "Independent recomputation requires unresolved evidence review.",
      severity: "warning",
    });
  } else if (evaluation.outcome !== "scored") {
    diagnostics.push({
      code: "VERIFICATION_RECOMPUTE_HARD_GATE_FAILED",
      message: `Independent recomputation rejected the build with outcome ${evaluation.outcome}.`,
      severity: "error",
    });
  }

  return result({
    verificationId,
    buildId: args.selection.buildId,
    diagnostics,
    catalogLineage,
    requirementLineage,
    recomputed,
  });
}

function verifyCatalogProductLineage(
  catalogProduct: CatalogProduct,
  engineProduct: BuildEngineProduct,
  diagnostics: VerificationDiagnostic[],
  lineage: CatalogLineageRecord[],
): void {
  const productId = catalogProduct.catalogProductId;

  if (catalogProduct.availability !== "available") {
    diagnostics.push({
      code: "VERIFICATION_CATALOG_PRODUCT_UNAVAILABLE",
      message: `Selected catalog product ${productId} is unavailable.`,
      severity: "error",
      productId,
    });
  }

  if (!catalogProduct.price) {
    diagnostics.push({
      code: "VERIFICATION_CATALOG_PRICE_MISSING",
      message: `Selected catalog product ${productId} has no catalog price.`,
      severity: "error",
      productId,
    });
  } else {
    if (!sameMoney(catalogProduct.price.amount, engineProduct.price.amount)) {
      diagnostics.push({
        code: "VERIFICATION_PRODUCT_PRICE_LINEAGE_MISMATCH",
        message: `Verification product price for ${productId} does not match catalog price.`,
        severity: "error",
        productId,
      });
    }
    if (catalogProduct.price.currency !== engineProduct.price.currency) {
      diagnostics.push({
        code: "VERIFICATION_PRODUCT_CURRENCY_LINEAGE_MISMATCH",
        message: `Verification product currency for ${productId} does not match catalog currency.`,
        severity: "error",
        productId,
      });
    }
  }

  if (catalogProduct.category !== engineProduct.componentCategory) {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_CATEGORY_LINEAGE_MISMATCH",
      message: `Verification component category for ${productId} does not match catalog category.`,
      severity: "error",
      productId,
    });
  }

  if (engineProduct.status !== "ready") {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_RECORD_NOT_READY",
      message: `Verification product record ${productId} is ${engineProduct.status}.`,
      severity: "warning",
      productId,
      profileId: engineProduct.profile.profileId,
    });
  }

  const profileValidation = validateProductFeatureProfile(engineProduct.profile);
  if (!profileValidation.valid) {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_PROFILE_INVALID",
      message: `Product profile ${engineProduct.profile.profileId} failed shared-contract validation.`,
      severity: "error",
      productId,
      profileId: engineProduct.profile.profileId,
    });
  }

  if (engineProduct.profile.readiness !== "readyForSpecification") {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_PROFILE_NOT_READY",
      message: `Product profile ${engineProduct.profile.profileId} is not evidence-ready.`,
      severity: "warning",
      productId,
      profileId: engineProduct.profile.profileId,
    });
  }

  const productUrl = catalogProduct.source.productUrl;
  if (!productUrl) {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_PAGE_URL_MISSING",
      message: `Catalog product ${productId} has no product-page URL provenance.`,
      severity: "warning",
      productId,
    });
    return;
  }

  const pageEvidence = engineProduct.profile.evidence.find(
    (evidence) =>
      evidence.sourceType === "productPage" &&
      evidence.url === productUrl &&
      evidence.qualityState === "ready",
  );
  if (!pageEvidence) {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_PAGE_EVIDENCE_MISSING",
      message: `Profile ${engineProduct.profile.profileId} has no ready product-page evidence matching ${productUrl}.`,
      severity: "warning",
      productId,
      profileId: engineProduct.profile.profileId,
    });
    return;
  }

  if (!pageEvidence.snapshotSha256?.trim()) {
    diagnostics.push({
      code: "VERIFICATION_PRODUCT_PAGE_SNAPSHOT_MISSING",
      message: `Product-page evidence for ${productId} has no snapshot SHA-256.`,
      severity: "warning",
      productId,
      profileId: engineProduct.profile.profileId,
    });
    return;
  }

  if (!catalogProduct.price) return;
  lineage.push({
    catalogProductId: productId,
    profileId: engineProduct.profile.profileId,
    category: catalogProduct.category,
    catalogPrice: catalogProduct.price.amount,
    currency: catalogProduct.price.currency,
    productPageUrl: productUrl,
    productPageSnapshotSha256: pageEvidence.snapshotSha256,
  });
}

function verifyTargetLineage(
  targets: HardwareTarget[],
  sources: OfficialSourceRecord[],
  requirements: SoftwareRequirementProfile[],
  diagnostics: VerificationDiagnostic[],
  lineage: RequirementLineageRecord[],
): void {
  if (targets.length === 0) {
    diagnostics.push({
      code: "VERIFICATION_HARDWARE_TARGETS_MISSING",
      message: "No hardware targets were supplied for independent verification.",
      severity: "warning",
    });
    return;
  }

  const sourceById = new Map(sources.map((source) => [source.sourceId, source] as const));
  const requirementById = new Map(
    requirements.map((requirement) => [requirement.requirementId, requirement] as const),
  );

  for (const target of targets) {
    if (target.state !== "ready") {
      diagnostics.push({
        code: "VERIFICATION_HARDWARE_TARGET_NOT_READY",
        message: `Hardware target ${target.targetId} is ${target.state}.`,
        severity: "warning",
        targetId: target.targetId,
      });
    }

    if (target.evidence.length === 0) {
      diagnostics.push({
        code: "VERIFICATION_TARGET_EVIDENCE_MISSING",
        message: `Hardware target ${target.targetId} has no evidence lineage.`,
        severity: "warning",
        targetId: target.targetId,
      });
      continue;
    }

    for (const evidence of target.evidence) {
      const source = sourceById.get(evidence.sourceId);
      const requirement = requirementById.get(evidence.requirementId);

      if (!source || !requirement) {
        diagnostics.push({
          code: "VERIFICATION_TARGET_EVIDENCE_REFERENCE_BROKEN",
          message: `Target ${target.targetId} references an unknown source or requirement.`,
          severity: "error",
          targetId: target.targetId,
        });
        continue;
      }

      if (source.trustState !== "official") {
        diagnostics.push({
          code: "VERIFICATION_TARGET_SOURCE_NOT_OFFICIAL",
          message: `Target ${target.targetId} source ${source.sourceId} is not official.`,
          severity: "error",
          targetId: target.targetId,
        });
        continue;
      }

      if (!source.snapshotSha256?.trim()) {
        diagnostics.push({
          code: "VERIFICATION_TARGET_SOURCE_SNAPSHOT_MISSING",
          message: `Official source ${source.sourceId} has no snapshot SHA-256.`,
          severity: "warning",
          targetId: target.targetId,
        });
        continue;
      }

      if (requirement.sourceId !== source.sourceId || requirement.qualityState !== "ready") {
        diagnostics.push({
          code: "VERIFICATION_REQUIREMENT_SOURCE_LINEAGE_MISMATCH",
          message: `Requirement ${requirement.requirementId} is not a ready child of source ${source.sourceId}.`,
          severity: "error",
          targetId: target.targetId,
        });
        continue;
      }

      const observedValue = requirementField(requirement, evidence.field);
      if (!observedValue) {
        diagnostics.push({
          code: "VERIFICATION_REQUIREMENT_FIELD_LINEAGE_BROKEN",
          message: `Target ${target.targetId} references missing requirement field ${evidence.field}.`,
          severity: "error",
          targetId: target.targetId,
        });
        continue;
      }

      lineage.push({
        targetId: target.targetId,
        sourceId: source.sourceId,
        requirementId: requirement.requirementId,
        field: evidence.field,
        sourceUrl: source.url,
        sourceSnapshotSha256: source.snapshotSha256,
        observedValue,
      });
    }
  }
}

function requirementField(
  requirement: SoftwareRequirementProfile,
  fieldPath: string,
): string | undefined {
  const [bucket, key, ...rest] = fieldPath.split(".");
  if (bucket !== "minimum" && bucket !== "recommended") return undefined;
  if (!key) return undefined;

  const fields: RequirementFields = requirement[bucket];
  if (key === "other") {
    const otherKey = rest.join(".");
    return otherKey ? fields.other?.[otherKey] : undefined;
  }

  if (!isRequirementFieldKey(key)) return undefined;
  const value = fields[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRequirementFieldKey(
  value: string,
): value is Exclude<keyof RequirementFields, "other"> {
  return ["cpu", "ram", "gpu", "storage", "os", "display"].includes(value);
}

function result(args: {
  verificationId: string;
  buildId: string;
  diagnostics: VerificationDiagnostic[];
  catalogLineage: CatalogLineageRecord[];
  requirementLineage: RequirementLineageRecord[];
  recomputed?: RecomputedVerification;
}): BuildVerificationResult {
  const status: BuildVerificationStatus = args.diagnostics.some(
    (diagnostic) => diagnostic.severity === "error",
  )
    ? "FAIL"
    : args.diagnostics.some((diagnostic) => diagnostic.severity === "warning")
      ? "REVIEW_REQUIRED"
      : "PASS";

  return {
    verificationId: args.verificationId,
    schemaVersion: BUILD_VERIFICATION_SCHEMA_VERSION,
    buildId: args.buildId,
    status,
    diagnostics: args.diagnostics,
    catalogLineage: args.catalogLineage,
    requirementLineage: args.requirementLineage,
    recomputed: args.recomputed,
  };
}

function stableVerificationId(buildId: string, snapshotId: string): string {
  const digest = createHash("sha256")
    .update(`${buildId}|${snapshotId}`, "utf8")
    .digest("hex")
    .slice(0, 20);
  return `verification-${digest}`;
}

function sameStrings(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function sameMoney(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.0001;
}
