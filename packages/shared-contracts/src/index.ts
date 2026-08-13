export const PRODUCT_FEATURE_PROFILE_SCHEMA_VERSION = "1.0.0" as const;

export type ProductCategory =
  | "desktopComputer"
  | "notebookComputer"
  | "monitor"
  | "printer"
  | "scanner"
  | "ups"
  | "networkDevice"
  | "other";

export type ProductSourceMode =
  | "pcBuilder"
  | "productExtractor"
  | "manualEntry"
  | "futurePlanner";

export type EvidenceSourceType =
  | "officialRequirement"
  | "productPage"
  | "pcBuilderOutput"
  | "manualEntry"
  | "legalSource"
  | "standard";

export type EvidenceQualityState =
  | "ready"
  | "warning"
  | "reviewRequired"
  | "rejected";

export type RequirementLevel = "required" | "preferred" | "informational";
export type LockInRisk = "none" | "low" | "medium" | "high";
export type ProfileReadiness =
  | "readyForSpecification"
  | "needsMoreFeatures"
  | "reviewRequired"
  | "blocked";

export type IntendedUse = {
  summary: string;
  department?: string;
  workload?: string;
};

export type ProductIdentity = {
  title?: string;
  brand?: string;
  model?: string;
  manufacturer?: string;
  seller?: string;
  sourceUrl?: string;
};

export type ProductFeature = {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  group?: string;
  requirementLevel?: RequirementLevel;
  sourceRefIds: string[];
  lockInRisk?: LockInRisk;
  clauseEligible: boolean;
};

export type EvidenceReference = {
  evidenceId: string;
  sourceType: EvidenceSourceType;
  url?: string;
  checkedAt?: string;
  snapshotSha256?: string;
  sourceLabel?: string;
  fieldPath?: string;
  qualityState: EvidenceQualityState;
};

export type ProfileGap = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  featureKey?: string;
};

export type ProductFeatureProfile = {
  profileId: string;
  schemaVersion: typeof PRODUCT_FEATURE_PROFILE_SCHEMA_VERSION;
  productCategory: ProductCategory;
  sourceMode: ProductSourceMode;
  createdAt: string;
  locale?: string;
  intendedUse?: IntendedUse;
  identity: ProductIdentity;
  features: ProductFeature[];
  evidence: EvidenceReference[];
  gaps: ProfileGap[];
  readiness: ProfileReadiness;
};

export type ValidationIssue = {
  code: string;
  message: string;
  path: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

const productCategories = new Set<ProductCategory>([
  "desktopComputer",
  "notebookComputer",
  "monitor",
  "printer",
  "scanner",
  "ups",
  "networkDevice",
  "other",
]);

const sourceModes = new Set<ProductSourceMode>([
  "pcBuilder",
  "productExtractor",
  "manualEntry",
  "futurePlanner",
]);

const evidenceSourceTypes = new Set<EvidenceSourceType>([
  "officialRequirement",
  "productPage",
  "pcBuilderOutput",
  "manualEntry",
  "legalSource",
  "standard",
]);

const evidenceQualityStates = new Set<EvidenceQualityState>([
  "ready",
  "warning",
  "reviewRequired",
  "rejected",
]);

const readinessStates = new Set<ProfileReadiness>([
  "readyForSpecification",
  "needsMoreFeatures",
  "reviewRequired",
  "blocked",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: "error" | "warning" = "error",
): void {
  issues.push({ code, path, message, severity });
}

export function validateProductFeatureProfile(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (typeof input === "string") {
    addIssue(
      issues,
      "raw_input_not_allowed",
      "$",
      "Specification inputs must be ProductFeatureProfile objects, not raw strings or URLs.",
    );
    return { valid: false, issues };
  }

  if (!isRecord(input)) {
    addIssue(issues, "invalid_profile", "$", "Profile must be an object.");
    return { valid: false, issues };
  }

  validateHeader(input, issues);
  validateIdentity(input.identity, issues);
  validateEvidence(input.evidence, issues);
  validateFeatures(input.features, input.evidence, issues);
  validateGaps(input.gaps, issues);

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

function validateHeader(
  input: Record<string, unknown>,
  issues: ValidationIssue[],
): void {
  if (!isNonEmptyString(input.profileId)) {
    addIssue(issues, "missing_profile_id", "$.profileId", "profileId is required.");
  }

  if (input.schemaVersion !== PRODUCT_FEATURE_PROFILE_SCHEMA_VERSION) {
    addIssue(
      issues,
      "unsupported_schema_version",
      "$.schemaVersion",
      "schemaVersion must be 1.0.0.",
    );
  }

  if (
    typeof input.productCategory !== "string" ||
    !productCategories.has(input.productCategory as ProductCategory)
  ) {
    addIssue(
      issues,
      "invalid_product_category",
      "$.productCategory",
      "productCategory is missing or unsupported.",
    );
  }

  if (
    typeof input.sourceMode !== "string" ||
    !sourceModes.has(input.sourceMode as ProductSourceMode)
  ) {
    addIssue(
      issues,
      "invalid_source_mode",
      "$.sourceMode",
      "sourceMode is missing or unsupported.",
    );
  }

  if (!isNonEmptyString(input.createdAt)) {
    addIssue(issues, "missing_created_at", "$.createdAt", "createdAt is required.");
  }

  if (
    typeof input.readiness !== "string" ||
    !readinessStates.has(input.readiness as ProfileReadiness)
  ) {
    addIssue(
      issues,
      "invalid_readiness",
      "$.readiness",
      "readiness is missing or unsupported.",
    );
  }
}

function validateIdentity(
  identity: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(identity)) {
    addIssue(issues, "invalid_identity", "$.identity", "identity must be an object.");
  }
}

function validateEvidence(
  evidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(evidence)) {
    addIssue(issues, "invalid_evidence", "$.evidence", "evidence must be an array.");
    return;
  }

  const ids = new Set<string>();

  evidence.forEach((item, index) => {
    const path = `$.evidence[${index}]`;

    if (!isRecord(item)) {
      addIssue(issues, "invalid_evidence_item", path, "Evidence item must be an object.");
      return;
    }

    if (!isNonEmptyString(item.evidenceId)) {
      addIssue(issues, "missing_evidence_id", `${path}.evidenceId`, "evidenceId is required.");
    } else if (ids.has(item.evidenceId)) {
      addIssue(issues, "duplicate_evidence_id", `${path}.evidenceId`, "evidenceId must be unique.");
    } else {
      ids.add(item.evidenceId);
    }

    if (
      typeof item.sourceType !== "string" ||
      !evidenceSourceTypes.has(item.sourceType as EvidenceSourceType)
    ) {
      addIssue(issues, "invalid_source_type", `${path}.sourceType`, "sourceType is unsupported.");
    }

    if (
      typeof item.qualityState !== "string" ||
      !evidenceQualityStates.has(item.qualityState as EvidenceQualityState)
    ) {
      addIssue(
        issues,
        "invalid_quality_state",
        `${path}.qualityState`,
        "qualityState is unsupported.",
      );
    }
  });
}

function validateFeatures(
  features: unknown,
  evidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(features)) {
    addIssue(issues, "invalid_features", "$.features", "features must be an array.");
    return;
  }

  const evidenceIds = new Set<string>();
  if (Array.isArray(evidence)) {
    for (const item of evidence) {
      if (isRecord(item) && isNonEmptyString(item.evidenceId)) {
        evidenceIds.add(item.evidenceId);
      }
    }
  }

  features.forEach((item, index) => {
    const path = `$.features[${index}]`;

    if (!isRecord(item)) {
      addIssue(issues, "invalid_feature_item", path, "Feature item must be an object.");
      return;
    }

    if (!isNonEmptyString(item.key)) {
      addIssue(issues, "missing_feature_key", `${path}.key`, "Feature key is required.");
    }

    if (!isNonEmptyString(item.label)) {
      addIssue(issues, "missing_feature_label", `${path}.label`, "Feature label is required.");
    }

    if (!["string", "number", "boolean"].includes(typeof item.value)) {
      addIssue(
        issues,
        "invalid_feature_value",
        `${path}.value`,
        "Feature value must be string, number, or boolean.",
      );
    }

    if (!Array.isArray(item.sourceRefIds) || item.sourceRefIds.length === 0) {
      addIssue(
        issues,
        "missing_feature_evidence",
        `${path}.sourceRefIds`,
        "Feature must reference at least one evidence item.",
      );
    } else {
      item.sourceRefIds.forEach((sourceRefId, refIndex) => {
        if (!isNonEmptyString(sourceRefId) || !evidenceIds.has(sourceRefId)) {
          addIssue(
            issues,
            "unknown_feature_evidence",
            `${path}.sourceRefIds[${refIndex}]`,
            "Feature references an unknown evidence item.",
          );
        }
      });
    }

    if (typeof item.clauseEligible !== "boolean") {
      addIssue(
        issues,
        "invalid_clause_eligible",
        `${path}.clauseEligible`,
        "clauseEligible must be boolean.",
      );
    }

    if (item.lockInRisk === "high" && item.clauseEligible === true) {
      addIssue(
        issues,
        "high_lock_in_clause_feature",
        `${path}.clauseEligible`,
        "High lock-in risk features cannot be clause eligible.",
      );
    }
  });
}

function validateGaps(gaps: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(gaps)) {
    addIssue(issues, "invalid_gaps", "$.gaps", "gaps must be an array.");
  }
}
