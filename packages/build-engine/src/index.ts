import { createHash } from "node:crypto";

import type { CatalogCategory } from "@bilgisayar-topla/catalog";
import {
  evaluateCompatibility,
  REQUIRED_COMPONENT_CATEGORIES,
  type CompatibilityComponent,
  type CompatibilityResult,
} from "@bilgisayar-topla/compatibility";
import type {
  HardwareTarget,
  HardwareTargetEvidenceRef,
} from "@bilgisayar-topla/requirements";
import type {
  ProductFeature,
  ProductFeatureProfile,
} from "@bilgisayar-topla/shared-contracts";

export const BUILD_ENGINE_POLICY_VERSION = "1.0.0" as const;
export const DEFAULT_MAX_PRODUCTS_PER_CATEGORY = 4;
export const DEFAULT_MAX_CANDIDATES = 256;
export const DEFAULT_TOP_N = 3;

export type BuildEngineStatus =
  | "ready"
  | "reviewRequired"
  | "blocked";

export type BuildEngineProduct = CompatibilityComponent & {
  price: {
    amount: number;
    currency: string;
  };
};

export type TargetFitStatus =
  | "PASS"
  | "FAIL"
  | "REVIEW_REQUIRED"
  | "SKIPPED";

export type TargetFitCheck = {
  targetId: string;
  component: HardwareTarget["component"];
  status: TargetFitStatus;
  code: string;
  message: string;
  targetEvidence: HardwareTargetEvidenceRef[];
  productProfileId?: string;
  featureKeys: string[];
  requiredSummary?: string;
  actualSummary?: string;
  headroomRatio?: number;
};

export type CandidateOutcome =
  | "scored"
  | "compatibilityFailed"
  | "compatibilityReviewRequired"
  | "overBudget"
  | "targetFailed"
  | "targetReviewRequired";

export type BuildCandidateEvaluation = {
  candidateId: string;
  productIds: string[];
  productProfileIds: string[];
  totalPrice: number;
  currency: string;
  budgetRemaining: number;
  compatibility: CompatibilityResult;
  targetChecks: TargetFitCheck[];
  outcome: CandidateOutcome;
  score?: number;
  rankingReasons: string[];
};

export type BuildEngineDiagnostic = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  category?: CatalogCategory;
  productId?: string;
};

export type BuildEngineResult = {
  policyVersion: typeof BUILD_ENGINE_POLICY_VERSION;
  status: BuildEngineStatus;
  budgetAmount: number;
  currency: string;
  maxProductsPerCategory: number;
  maxCandidates: number;
  totalCombinationCount: number;
  sampledCandidateCount: number;
  diagnostics: BuildEngineDiagnostic[];
  evaluations: BuildCandidateEvaluation[];
  topCandidates: BuildCandidateEvaluation[];
};

export function generateAndScoreBuilds(args: {
  products: BuildEngineProduct[];
  targets: HardwareTarget[];
  budgetAmount: number;
  currency?: string;
  maxProductsPerCategory?: number;
  maxCandidates?: number;
  topN?: number;
}): BuildEngineResult {
  if (!Number.isFinite(args.budgetAmount) || args.budgetAmount <= 0) {
    throw new Error("budgetAmount must be a positive finite number");
  }

  const currency = args.currency?.trim() || "TRY";
  const maxProductsPerCategory = positiveInteger(
    args.maxProductsPerCategory,
    DEFAULT_MAX_PRODUCTS_PER_CATEGORY,
  );
  const maxCandidates = positiveInteger(
    args.maxCandidates,
    DEFAULT_MAX_CANDIDATES,
  );
  const topN = Math.min(
    3,
    positiveInteger(args.topN, DEFAULT_TOP_N),
  );
  const diagnostics: BuildEngineDiagnostic[] = [];

  if (args.targets.length === 0) {
    return emptyResult({
      status: "reviewRequired",
      budgetAmount: args.budgetAmount,
      currency,
      maxProductsPerCategory,
      maxCandidates,
      diagnostics: [
        {
          code: "HARDWARE_TARGETS_MISSING",
          message: "At least one evidence-backed hardware target is required.",
          severity: "error",
        },
      ],
    });
  }

  const blockedTarget = args.targets.find((target) => target.state === "blocked");
  if (blockedTarget) {
    return emptyResult({
      status: "blocked",
      budgetAmount: args.budgetAmount,
      currency,
      maxProductsPerCategory,
      maxCandidates,
      diagnostics: [
        {
          code: "HARDWARE_TARGET_BLOCKED",
          message: `Hardware target ${blockedTarget.targetId} is blocked.`,
          severity: "error",
        },
      ],
    });
  }

  const reviewTarget = args.targets.find(
    (target) => target.state === "reviewRequired",
  );
  if (reviewTarget) {
    return emptyResult({
      status: "reviewRequired",
      budgetAmount: args.budgetAmount,
      currency,
      maxProductsPerCategory,
      maxCandidates,
      diagnostics: [
        {
          code: "HARDWARE_TARGET_REVIEW_REQUIRED",
          message: `Hardware target ${reviewTarget.targetId} requires review before candidate scoring.`,
          severity: "warning",
        },
      ],
    });
  }

  const groups = new Map<CatalogCategory, BuildEngineProduct[]>();
  const seenProductIds = new Map<string, CatalogCategory>();

  for (const category of REQUIRED_COMPONENT_CATEGORIES) {
    groups.set(category, []);
  }

  for (const product of args.products) {
    if (!REQUIRED_COMPONENT_CATEGORIES.includes(product.componentCategory)) {
      diagnostics.push({
        code: "PRODUCT_CATEGORY_OUTSIDE_V1_BUILD",
        message: `Product ${product.catalogProductId} is outside the V1 case-only component set.`,
        severity: "info",
        productId: product.catalogProductId,
      });
      continue;
    }

    const previousCategory = seenProductIds.get(product.catalogProductId);
    if (previousCategory) {
      diagnostics.push({
        code: "DUPLICATE_CATALOG_PRODUCT_ID",
        message: `Product id ${product.catalogProductId} appears more than once (${previousCategory}, ${product.componentCategory}).`,
        severity: "error",
        category: product.componentCategory,
        productId: product.catalogProductId,
      });
      continue;
    }
    seenProductIds.set(product.catalogProductId, product.componentCategory);

    if (product.status === "blocked") {
      diagnostics.push({
        code: "BLOCKED_PRODUCT_EXCLUDED",
        message: `Blocked product ${product.catalogProductId} was excluded before candidate generation.`,
        severity: "info",
        category: product.componentCategory,
        productId: product.catalogProductId,
      });
      continue;
    }

    if (
      !Number.isFinite(product.price.amount) ||
      product.price.amount < 0
    ) {
      diagnostics.push({
        code: "PRODUCT_PRICE_INVALID",
        message: `Product ${product.catalogProductId} has an invalid price.`,
        severity: "error",
        category: product.componentCategory,
        productId: product.catalogProductId,
      });
      continue;
    }

    if (product.price.currency !== currency) {
      diagnostics.push({
        code: "PRODUCT_CURRENCY_MISMATCH",
        message: `Product ${product.catalogProductId} uses ${product.price.currency}, expected ${currency}.`,
        severity: "error",
        category: product.componentCategory,
        productId: product.catalogProductId,
      });
      continue;
    }

    groups.get(product.componentCategory)?.push(product);
  }

  const selectedGroups: BuildEngineProduct[][] = [];
  for (const category of REQUIRED_COMPONENT_CATEGORIES) {
    const categoryProducts = groups.get(category) ?? [];
    if (categoryProducts.length === 0) {
      diagnostics.push({
        code: "NO_USABLE_PRODUCTS_FOR_CATEGORY",
        message: `No usable products are available for required category ${category}.`,
        severity: "error",
        category,
      });
      return emptyResult({
        status: "blocked",
        budgetAmount: args.budgetAmount,
        currency,
        maxProductsPerCategory,
        maxCandidates,
        diagnostics,
      });
    }

    const representatives = representativeProducts(
      categoryProducts,
      maxProductsPerCategory,
    );
    if (representatives.length < categoryProducts.length) {
      diagnostics.push({
        code: "CATEGORY_PRODUCT_POOL_BOUNDED",
        message: `${category} pool was bounded from ${categoryProducts.length} to ${representatives.length} representative products.`,
        severity: "info",
        category,
      });
    }
    selectedGroups.push(representatives);
  }

  const totalCombinationCount = safeCombinationCount(selectedGroups);
  const sampleCount = Math.min(totalCombinationCount, maxCandidates);
  const sampledIndexes = evenlySpacedIndexes(
    totalCombinationCount,
    sampleCount,
  );
  if (sampleCount < totalCombinationCount) {
    diagnostics.push({
      code: "CANDIDATE_SPACE_SAMPLED",
      message: `Candidate space ${totalCombinationCount} was deterministically sampled down to ${sampleCount}.`,
      severity: "info",
    });
  }

  const evaluations = sampledIndexes.map((flatIndex) =>
    evaluateCandidate({
      products: decodeCombination(flatIndex, selectedGroups),
      targets: args.targets,
      budgetAmount: args.budgetAmount,
      currency,
    }),
  );

  const scored = evaluations
    .filter((evaluation) => evaluation.outcome === "scored")
    .sort(compareCandidates);
  const reviewRequired = evaluations.some(
    (evaluation) =>
      evaluation.outcome === "compatibilityReviewRequired" ||
      evaluation.outcome === "targetReviewRequired",
  );

  const status: BuildEngineStatus = scored.length > 0
    ? "ready"
    : reviewRequired
      ? "reviewRequired"
      : "blocked";

  if (scored.length === 0) {
    diagnostics.push({
      code: reviewRequired
        ? "NO_SCORABLE_CANDIDATE_REVIEW_REQUIRED"
        : "NO_VIABLE_CANDIDATE",
      message: reviewRequired
        ? "No candidate can be scored until unresolved compatibility/target evidence is reviewed."
        : "All generated candidates were rejected by compatibility, budget, or hardware-target gates.",
      severity: reviewRequired ? "warning" : "error",
    });
  }

  return {
    policyVersion: BUILD_ENGINE_POLICY_VERSION,
    status,
    budgetAmount: args.budgetAmount,
    currency,
    maxProductsPerCategory,
    maxCandidates,
    totalCombinationCount,
    sampledCandidateCount: evaluations.length,
    diagnostics,
    evaluations,
    topCandidates: scored.slice(0, topN),
  };
}

function evaluateCandidate(args: {
  products: BuildEngineProduct[];
  targets: HardwareTarget[];
  budgetAmount: number;
  currency: string;
}): BuildCandidateEvaluation {
  const canonicalProducts = [...args.products].sort(
    (left, right) =>
      REQUIRED_COMPONENT_CATEGORIES.indexOf(left.componentCategory) -
      REQUIRED_COMPONENT_CATEGORIES.indexOf(right.componentCategory),
  );
  const candidateId = stableCandidateId(canonicalProducts);
  const totalPrice = canonicalProducts.reduce(
    (sum, product) => sum + product.price.amount,
    0,
  );
  const budgetRemaining = args.budgetAmount - totalPrice;
  const compatibility = evaluateCompatibility(
    canonicalProducts.map(toCompatibilityComponent),
  );

  const base: Omit<BuildCandidateEvaluation, "outcome" | "targetChecks" | "rankingReasons"> = {
    candidateId,
    productIds: canonicalProducts.map((product) => product.catalogProductId),
    productProfileIds: canonicalProducts.map(
      (product) => product.profile.profileId,
    ),
    totalPrice,
    currency: args.currency,
    budgetRemaining,
    compatibility,
  };

  if (compatibility.status === "FAIL") {
    return {
      ...base,
      targetChecks: [],
      outcome: "compatibilityFailed",
      rankingReasons: [
        `Rejected by compatibility: ${compatibility.firstBlockingCheck?.code ?? "COMPATIBILITY_FAILED"}.`,
      ],
    };
  }

  if (compatibility.status === "REVIEW_REQUIRED") {
    return {
      ...base,
      targetChecks: [],
      outcome: "compatibilityReviewRequired",
      rankingReasons: [
        `Compatibility evidence requires review: ${compatibility.firstBlockingCheck?.code ?? "COMPATIBILITY_REVIEW_REQUIRED"}.`,
      ],
    };
  }

  if (totalPrice > args.budgetAmount) {
    return {
      ...base,
      targetChecks: [],
      outcome: "overBudget",
      rankingReasons: [
        `Rejected by budget: ${formatMoney(totalPrice)} ${args.currency} exceeds ${formatMoney(args.budgetAmount)} ${args.currency}.`,
      ],
    };
  }

  const targetChecks = args.targets.map((target) =>
    evaluateTarget(target, canonicalProducts),
  );
  const failedTarget = targetChecks.find((check) => check.status === "FAIL");
  if (failedTarget) {
    return {
      ...base,
      targetChecks,
      outcome: "targetFailed",
      rankingReasons: [
        `Rejected by hardware target ${failedTarget.targetId}: ${failedTarget.code}.`,
      ],
    };
  }

  const unresolvedTarget = targetChecks.find(
    (check) => check.status === "REVIEW_REQUIRED",
  );
  if (unresolvedTarget) {
    return {
      ...base,
      targetChecks,
      outcome: "targetReviewRequired",
      rankingReasons: [
        `Hardware target ${unresolvedTarget.targetId} requires review: ${unresolvedTarget.code}.`,
      ],
    };
  }

  const score = scoreTargetHeadroom(targetChecks);
  const matchedTargets = targetChecks.filter(
    (check) => check.status === "PASS",
  ).length;
  const skippedTargets = targetChecks.filter(
    (check) => check.status === "SKIPPED",
  ).length;

  return {
    ...base,
    targetChecks,
    outcome: "scored",
    score,
    rankingReasons: [
      `${matchedTargets} evidence-backed hardware targets satisfied.`,
      `${formatMoney(budgetRemaining)} ${args.currency} budget headroom remains.`,
      ...(skippedTargets > 0
        ? [`${skippedTargets} non-purchase-capacity targets were explicitly excluded from scoring.`]
        : []),
    ],
  };
}

function evaluateTarget(
  target: HardwareTarget,
  products: BuildEngineProduct[],
): TargetFitCheck {
  if (target.state !== "ready") {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "TARGET_NOT_READY",
      "Hardware target is not ready for deterministic scoring.",
    );
  }

  if (isApplicationSpaceTarget(target)) {
    return targetCheck(
      target,
      "SKIPPED",
      "STORAGE_APP_SPACE_NOT_PURCHASE_CAPACITY",
      "Application installation-space evidence is preserved but is not converted into an SSD purchase-capacity target.",
    );
  }

  const product = products.find(
    (item) => item.componentCategory === target.component,
  );
  if (!product) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "TARGET_COMPONENT_NOT_IN_V1_CANDIDATE",
      `Target component ${target.component} is not represented by the V1 case-only candidate contract.`,
    );
  }

  switch (target.component) {
    case "cpu":
      return evaluateCpuTarget(target, product);
    case "memory":
      return evaluateMemoryTarget(target, product);
    case "gpu":
      return evaluateGpuTarget(target, product);
    case "storage":
      return evaluateStoragePurchaseTarget(target, product);
    default:
      return targetCheck(
        target,
        "REVIEW_REQUIRED",
        "TARGET_COMPONENT_SCORER_UNIMPLEMENTED",
        `No deterministic V1 target scorer exists for ${target.component}.`,
        product,
      );
  }
}

function evaluateCpuTarget(
  target: HardwareTarget,
  product: BuildEngineProduct,
): TargetFitCheck {
  const requiredClock = parseTargetClockGhz(target.target);
  const requiredCores = parseTargetCores(target.target);
  if (requiredClock === undefined && requiredCores === undefined) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "CPU_TARGET_UNPARSEABLE",
      `CPU target could not be normalized: ${target.target}`,
      product,
    );
  }

  const clockFeature = findFeature(product.profile, [
    "base clock",
    "base frequency",
    "processor frequency",
    "cpu clock",
    "clock speed",
    "islemci hizi",
    "temel frekans",
  ]);
  const coreFeature = findFeature(product.profile, [
    "core count",
    "cores",
    "cekirdek sayisi",
    "cekirdek",
  ]);
  const actualClock = requiredClock !== undefined && clockFeature
    ? parseGhz(clockFeature)
    : undefined;
  const actualCores = requiredCores !== undefined && coreFeature
    ? parseCount(coreFeature)
    : undefined;
  const featureKeys = [clockFeature?.key, coreFeature?.key].filter(
    (key): key is string => Boolean(key),
  );

  if (
    (requiredClock !== undefined && actualClock === undefined) ||
    (requiredCores !== undefined && actualCores === undefined)
  ) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "CPU_PRODUCT_TARGET_EVIDENCE_MISSING",
      "CPU product evidence does not expose every metric required by the hardware target.",
      product,
      featureKeys,
      target.target,
      cpuActualSummary(actualClock, actualCores),
    );
  }

  if (
    (requiredClock !== undefined && actualClock !== undefined && actualClock < requiredClock) ||
    (requiredCores !== undefined && actualCores !== undefined && actualCores < requiredCores)
  ) {
    return targetCheck(
      target,
      "FAIL",
      "CPU_BELOW_HARDWARE_TARGET",
      "CPU evidence is below an evidence-backed hardware target metric.",
      product,
      featureKeys,
      target.target,
      cpuActualSummary(actualClock, actualCores),
    );
  }

  const headroomRatio =
    requiredCores !== undefined && actualCores !== undefined
      ? boundedHeadroom(actualCores, requiredCores)
      : undefined;
  return targetCheck(
    target,
    "PASS",
    "CPU_MEETS_HARDWARE_TARGET",
    "CPU evidence satisfies the normalized hardware target.",
    product,
    featureKeys,
    target.target,
    cpuActualSummary(actualClock, actualCores),
    headroomRatio,
  );
}

function evaluateMemoryTarget(
  target: HardwareTarget,
  product: BuildEngineProduct,
): TargetFitCheck {
  const requiredGb = parseTargetCapacityGb(target.target);
  const capacityFeature = findFeature(product.profile, [
    "memory capacity",
    "ram capacity",
    "bellek kapasitesi",
    "kapasite",
  ]);
  const actualGb = capacityFeature ? parseCapacityGb(capacityFeature) : undefined;

  if (requiredGb === undefined) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "MEMORY_TARGET_UNPARSEABLE",
      `Memory target could not be normalized: ${target.target}`,
      product,
    );
  }
  if (actualGb === undefined) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "MEMORY_PRODUCT_TARGET_EVIDENCE_MISSING",
      "Memory product capacity evidence is missing.",
      product,
      capacityFeature ? [capacityFeature.key] : [],
      `${requiredGb} GB`,
    );
  }
  if (actualGb < requiredGb) {
    return targetCheck(
      target,
      "FAIL",
      "MEMORY_BELOW_HARDWARE_TARGET",
      `${actualGb} GB memory is below the ${requiredGb} GB target.`,
      product,
      [capacityFeature?.key].filter((key): key is string => Boolean(key)),
      `${requiredGb} GB`,
      `${actualGb} GB`,
    );
  }

  return targetCheck(
    target,
    "PASS",
    "MEMORY_MEETS_HARDWARE_TARGET",
    `${actualGb} GB memory satisfies the ${requiredGb} GB target.`,
    product,
    [capacityFeature?.key].filter((key): key is string => Boolean(key)),
    `${requiredGb} GB`,
    `${actualGb} GB`,
    boundedHeadroom(actualGb, requiredGb),
  );
}

function evaluateGpuTarget(
  target: HardwareTarget,
  product: BuildEngineProduct,
): TargetFitCheck {
  const requiredVram = parseTargetVramGb(target.target);
  const requiredDirectX = parseTargetDirectX(target.target);
  if (requiredVram === undefined && requiredDirectX === undefined) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "GPU_TARGET_UNPARSEABLE",
      `GPU target could not be normalized: ${target.target}`,
      product,
    );
  }

  const vramFeature = findFeature(product.profile, [
    "vram",
    "video memory",
    "graphics memory",
    "ekran karti bellegi",
    "gpu memory",
  ]);
  const directXFeature = findFeature(product.profile, [
    "directx",
    "direct x",
  ]);
  const actualVram = requiredVram !== undefined && vramFeature
    ? parseCapacityGb(vramFeature)
    : undefined;
  const actualDirectX = requiredDirectX !== undefined && directXFeature
    ? parseDirectX(directXFeature)
    : undefined;
  const featureKeys = [vramFeature?.key, directXFeature?.key].filter(
    (key): key is string => Boolean(key),
  );

  if (
    (requiredVram !== undefined && actualVram === undefined) ||
    (requiredDirectX !== undefined && actualDirectX === undefined)
  ) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "GPU_PRODUCT_TARGET_EVIDENCE_MISSING",
      "GPU product evidence does not expose every metric required by the hardware target.",
      product,
      featureKeys,
      target.target,
      gpuActualSummary(actualVram, actualDirectX),
    );
  }

  if (
    (requiredVram !== undefined && actualVram !== undefined && actualVram < requiredVram) ||
    (requiredDirectX !== undefined && actualDirectX !== undefined && actualDirectX < requiredDirectX)
  ) {
    return targetCheck(
      target,
      "FAIL",
      "GPU_BELOW_HARDWARE_TARGET",
      "GPU evidence is below an evidence-backed hardware target metric.",
      product,
      featureKeys,
      target.target,
      gpuActualSummary(actualVram, actualDirectX),
    );
  }

  const headroomRatio =
    requiredVram !== undefined && actualVram !== undefined
      ? boundedHeadroom(actualVram, requiredVram)
      : undefined;
  return targetCheck(
    target,
    "PASS",
    "GPU_MEETS_HARDWARE_TARGET",
    "GPU evidence satisfies the normalized hardware target.",
    product,
    featureKeys,
    target.target,
    gpuActualSummary(actualVram, actualDirectX),
    headroomRatio,
  );
}

function evaluateStoragePurchaseTarget(
  target: HardwareTarget,
  product: BuildEngineProduct,
): TargetFitCheck {
  const requiredGb = parseTargetCapacityGb(target.target);
  const capacityFeature = findFeature(product.profile, [
    "storage capacity",
    "ssd capacity",
    "disk capacity",
    "depolama kapasitesi",
    "kapasite",
  ]);
  const actualGb = capacityFeature ? parseCapacityGb(capacityFeature) : undefined;

  if (requiredGb === undefined) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "STORAGE_TARGET_UNPARSEABLE",
      `Storage purchase target could not be normalized: ${target.target}`,
      product,
    );
  }
  if (actualGb === undefined) {
    return targetCheck(
      target,
      "REVIEW_REQUIRED",
      "STORAGE_PRODUCT_TARGET_EVIDENCE_MISSING",
      "Storage product capacity evidence is missing.",
      product,
      capacityFeature ? [capacityFeature.key] : [],
      `${requiredGb} GB`,
    );
  }
  if (actualGb < requiredGb) {
    return targetCheck(
      target,
      "FAIL",
      "STORAGE_BELOW_HARDWARE_TARGET",
      `${actualGb} GB storage is below the ${requiredGb} GB purchase target.`,
      product,
      [capacityFeature?.key].filter((key): key is string => Boolean(key)),
      `${requiredGb} GB`,
      `${actualGb} GB`,
    );
  }

  return targetCheck(
    target,
    "PASS",
    "STORAGE_MEETS_HARDWARE_TARGET",
    `${actualGb} GB storage satisfies the ${requiredGb} GB purchase target.`,
    product,
    [capacityFeature?.key].filter((key): key is string => Boolean(key)),
    `${requiredGb} GB`,
    `${actualGb} GB`,
    boundedHeadroom(actualGb, requiredGb),
  );
}

function targetCheck(
  target: HardwareTarget,
  status: TargetFitStatus,
  code: string,
  message: string,
  product?: BuildEngineProduct,
  featureKeys: string[] = [],
  requiredSummary?: string,
  actualSummary?: string,
  headroomRatio?: number,
): TargetFitCheck {
  return {
    targetId: target.targetId,
    component: target.component,
    status,
    code,
    message,
    targetEvidence: target.evidence.map((evidence) => ({ ...evidence })),
    productProfileId: product?.profile.profileId,
    featureKeys,
    requiredSummary,
    actualSummary,
    headroomRatio,
  };
}

function scoreTargetHeadroom(checks: TargetFitCheck[]): number {
  const ratios = checks
    .filter((check) => check.status === "PASS")
    .map((check) => check.headroomRatio)
    .filter((value): value is number => value !== undefined);
  const averageHeadroom = ratios.length > 0
    ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length
    : 0;
  return round4(80 + averageHeadroom * 20);
}

function compareCandidates(
  left: BuildCandidateEvaluation,
  right: BuildCandidateEvaluation,
): number {
  const scoreDelta = (right.score ?? 0) - (left.score ?? 0);
  if (scoreDelta !== 0) return scoreDelta;
  const priceDelta = left.totalPrice - right.totalPrice;
  if (priceDelta !== 0) return priceDelta;
  return left.candidateId.localeCompare(right.candidateId);
}

function representativeProducts(
  products: BuildEngineProduct[],
  limit: number,
): BuildEngineProduct[] {
  const sorted = [...products].sort((left, right) => {
    const statusDelta = statusRank(left.status) - statusRank(right.status);
    if (statusDelta !== 0) return statusDelta;
    const priceDelta = left.price.amount - right.price.amount;
    if (priceDelta !== 0) return priceDelta;
    return left.catalogProductId.localeCompare(right.catalogProductId);
  });

  if (sorted.length <= limit) return sorted;
  return evenlySpacedIndexes(sorted.length, limit).map((index) => {
    const product = sorted[index];
    if (!product) throw new Error("representative product index invariant failed");
    return product;
  });
}

function decodeCombination(
  flatIndex: number,
  groups: BuildEngineProduct[][],
): BuildEngineProduct[] {
  let remainder = flatIndex;
  const result = new Array<BuildEngineProduct>(groups.length);

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (!group || group.length === 0) {
      throw new Error("candidate group invariant failed");
    }
    const choiceIndex = remainder % group.length;
    remainder = Math.floor(remainder / group.length);
    const product = group[choiceIndex];
    if (!product) throw new Error("candidate choice invariant failed");
    result[index] = product;
  }

  return result;
}

function evenlySpacedIndexes(total: number, count: number): number[] {
  if (count <= 0 || total <= 0) return [];
  if (count >= total) return Array.from({ length: total }, (_, index) => index);
  if (count === 1) return [Math.floor((total - 1) / 2)];

  const indexes = new Set<number>();
  for (let index = 0; index < count; index += 1) {
    indexes.add(Math.round((index * (total - 1)) / (count - 1)));
  }

  for (let index = 0; indexes.size < count && index < total; index += 1) {
    indexes.add(index);
  }
  return [...indexes].sort((left, right) => left - right).slice(0, count);
}

function safeCombinationCount(groups: BuildEngineProduct[][]): number {
  let total = 1;
  for (const group of groups) {
    if (group.length === 0) return 0;
    if (total > Number.MAX_SAFE_INTEGER / group.length) {
      return Number.MAX_SAFE_INTEGER;
    }
    total *= group.length;
  }
  return total;
}

function toCompatibilityComponent(
  product: BuildEngineProduct,
): CompatibilityComponent {
  return {
    catalogProductId: product.catalogProductId,
    componentCategory: product.componentCategory,
    status: product.status,
    profile: product.profile,
  };
}

function findFeature(
  profile: ProductFeatureProfile,
  aliases: string[],
): ProductFeature | undefined {
  const normalizedAliases = aliases.map(normalize);
  return profile.features.find((feature) => {
    const haystack = normalize(`${feature.key} ${feature.label}`);
    return normalizedAliases.some((alias) => haystack.includes(alias));
  });
}

function parseTargetClockGhz(value: string): number | undefined {
  const match = normalize(value).match(/(\d+(?:[.,]\d+)?)\s*\+?\s*ghz/i)?.[1];
  return match ? Number(match.replace(",", ".")) : undefined;
}

function parseTargetCores(value: string): number | undefined {
  const normalized = normalize(value);
  const match = normalized.match(/at least\s*(\d+)\s*cores?|(?:^|\D)(\d+)\s*\+?\s*cores?/i);
  const raw = match?.[1] ?? match?.[2];
  return raw ? Number(raw) : undefined;
}

function parseTargetCapacityGb(value: string): number | undefined {
  const match = normalize(value).match(/(\d+(?:[.,]\d+)?)\s*gb\b/i)?.[1];
  return match ? Number(match.replace(",", ".")) : undefined;
}

function parseTargetVramGb(value: string): number | undefined {
  const match = normalize(value).match(/(\d+(?:[.,]\d+)?)\s*gb\s*vram\b/i)?.[1];
  return match ? Number(match.replace(",", ".")) : undefined;
}

function parseTargetDirectX(value: string): number | undefined {
  const match = normalize(value).match(/directx\s*(\d+(?:[.,]\d+)?)/i)?.[1];
  return match ? Number(match.replace(",", ".")) : undefined;
}

function parseGhz(feature: ProductFeature): number | undefined {
  if (
    typeof feature.value === "number" &&
    /^ghz$/i.test(normalize(feature.unit ?? ""))
  ) {
    return feature.value;
  }
  const match = featureText(feature).match(/(\d+(?:[.,]\d+)?)\s*ghz/i)?.[1];
  return match ? Number(match.replace(",", ".")) : undefined;
}

function parseCount(feature: ProductFeature): number | undefined {
  if (typeof feature.value === "number" && Number.isFinite(feature.value)) {
    return feature.value;
  }
  const match = featureText(feature).match(/(\d+)\s*(?:core|cekirdek)/i)?.[1];
  return match ? Number(match) : undefined;
}

function parseCapacityGb(feature: ProductFeature): number | undefined {
  if (
    typeof feature.value === "number" &&
    /^gb$/i.test(normalize(feature.unit ?? ""))
  ) {
    return feature.value;
  }
  const match = featureText(feature).match(/(\d+(?:[.,]\d+)?)\s*gb\b/i)?.[1];
  return match ? Number(match.replace(",", ".")) : undefined;
}

function parseDirectX(feature: ProductFeature): number | undefined {
  const match = featureText(feature).match(/directx\s*(\d+(?:[.,]\d+)?)/i)?.[1];
  if (match) return Number(match.replace(",", "."));
  if (typeof feature.value === "number" && Number.isFinite(feature.value)) {
    return feature.value;
  }
  return undefined;
}

function featureText(feature: ProductFeature): string {
  return [feature.label, String(feature.value), feature.unit]
    .filter(Boolean)
    .join(" ");
}

function boundedHeadroom(actual: number, required: number): number {
  if (required <= 0 || actual <= required) return 0;
  return Math.min(1, (actual - required) / required);
}

function isApplicationSpaceTarget(target: HardwareTarget): boolean {
  const text = normalize(`${target.targetId} ${target.target} ${target.reason}`);
  return (
    text.includes("application space") ||
    text.includes("application installation-space") ||
    text.includes("application installation space") ||
    text.includes("uygulama kurulum")
  );
}

function cpuActualSummary(
  clockGhz: number | undefined,
  cores: number | undefined,
): string | undefined {
  const parts: string[] = [];
  if (clockGhz !== undefined) parts.push(`${clockGhz} GHz`);
  if (cores !== undefined) parts.push(`${cores} cores`);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function gpuActualSummary(
  vramGb: number | undefined,
  directX: number | undefined,
): string | undefined {
  const parts: string[] = [];
  if (vramGb !== undefined) parts.push(`${vramGb} GB VRAM`);
  if (directX !== undefined) parts.push(`DirectX ${directX}`);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function stableCandidateId(products: BuildEngineProduct[]): string {
  const identity = products
    .map((product) => `${product.componentCategory}:${product.catalogProductId}`)
    .join("|");
  const digest = createHash("sha256")
    .update(identity, "utf8")
    .digest("hex")
    .slice(0, 20);
  return `candidate-${digest}`;
}

function statusRank(status: BuildEngineProduct["status"]): number {
  switch (status) {
    case "ready":
      return 0;
    case "reviewRequired":
      return 1;
    case "blocked":
      return 2;
  }
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("candidate limits must be positive integers");
  }
  return value;
}

function formatMoney(value: number): string {
  return round4(value).toLocaleString("en-US", {
    maximumFractionDigits: 4,
    useGrouping: false,
  });
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function emptyResult(args: {
  status: BuildEngineStatus;
  budgetAmount: number;
  currency: string;
  maxProductsPerCategory: number;
  maxCandidates: number;
  diagnostics: BuildEngineDiagnostic[];
}): BuildEngineResult {
  return {
    policyVersion: BUILD_ENGINE_POLICY_VERSION,
    status: args.status,
    budgetAmount: args.budgetAmount,
    currency: args.currency,
    maxProductsPerCategory: args.maxProductsPerCategory,
    maxCandidates: args.maxCandidates,
    totalCombinationCount: 0,
    sampledCandidateCount: 0,
    diagnostics: args.diagnostics,
    evaluations: [],
    topCandidates: [],
  };
}

function normalize(value: string): string {
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
