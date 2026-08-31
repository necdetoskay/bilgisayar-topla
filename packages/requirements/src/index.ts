export const BUILD_INTENT_SCHEMA_VERSION = "1.0.0" as const;

export type SourceTrustState =
  | "official"
  | "trusted"
  | "manualReviewRequired";

export type RequirementQualityState =
  | "ready"
  | "warning"
  | "reviewRequired"
  | "rejected";

export type BuildIntentReadiness =
  | "readyForBuild"
  | "needsClarification"
  | "reviewRequired"
  | "blocked";

export type OfficialSourceRecord = {
  sourceId: string;
  vendor: string;
  url: string;
  checkedAt: string;
  snapshotSha256?: string;
  language?: string;
  trustState: SourceTrustState;
};

export type RequirementFields = {
  cpu?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
  os?: string;
  display?: string;
  other?: Record<string, string>;
};

export type SoftwareRequirementProfile = {
  requirementId: string;
  software: string;
  version?: string;
  sourceId: string;
  extractionRunId: string;
  minimum: RequirementFields;
  recommended: RequirementFields;
  qualityState: RequirementQualityState;
};

export type HardwareTargetComponent =
  | "cpu"
  | "memory"
  | "gpu"
  | "storage"
  | "motherboard"
  | "psu"
  | "case"
  | "cooling"
  | "network"
  | "operatingSystem";

export type HardwareTargetEvidenceRef = {
  sourceId: string;
  requirementId: string;
  field: string;
};

export type HardwareTarget = {
  targetId: string;
  component: HardwareTargetComponent;
  target: string;
  reason: string;
  policy: string;
  evidence: HardwareTargetEvidenceRef[];
  state: "ready" | "reviewRequired" | "blocked";
};

export type BuildIntentGap = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type BuildIntent = {
  intentId: string;
  schemaVersion: typeof BUILD_INTENT_SCHEMA_VERSION;
  createdAt: string;
  rawIntent: string;
  budgetAmount?: number;
  currency?: string;
  scope: "caseOnly" | "fullSet" | "unknown";
  locale?: string;
  sources: OfficialSourceRecord[];
  softwareRequirements: SoftwareRequirementProfile[];
  hardwareTargets: HardwareTarget[];
  gaps: BuildIntentGap[];
  readiness: BuildIntentReadiness;
};

export type BuildIntentValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type BuildIntentValidationResult = {
  valid: boolean;
  issues: BuildIntentValidationIssue[];
};

export function evaluateBuildIntentReadiness(
  intent: Omit<BuildIntent, "readiness">,
): BuildIntentReadiness {
  if (intent.gaps.some((gap) => gap.severity === "error")) {
    return "blocked";
  }

  if (
    intent.softwareRequirements.some(
      (requirement) => requirement.qualityState === "rejected",
    ) ||
    intent.hardwareTargets.some((target) => target.state === "blocked")
  ) {
    return "blocked";
  }

  const sourceById = new Map(
    intent.sources.map((source) => [source.sourceId, source] as const),
  );

  const unresolvedEvidence = intent.softwareRequirements.some((requirement) => {
    const source = sourceById.get(requirement.sourceId);
    return (
      !source ||
      source.trustState !== "official" ||
      requirement.qualityState === "reviewRequired" ||
      requirement.qualityState === "warning"
    );
  });

  if (
    unresolvedEvidence ||
    intent.hardwareTargets.some((target) => target.state === "reviewRequired") ||
    intent.hardwareTargets.length === 0
  ) {
    return "reviewRequired";
  }

  if (
    intent.budgetAmount === undefined ||
    !Number.isFinite(intent.budgetAmount) ||
    intent.budgetAmount <= 0 ||
    intent.scope === "unknown"
  ) {
    return "needsClarification";
  }

  return "readyForBuild";
}

export function createBuildIntent(args: {
  intentId: string;
  createdAt: string;
  rawIntent: string;
  budgetAmount?: number;
  currency?: string;
  scope: "caseOnly" | "fullSet" | "unknown";
  locale?: string;
  sources?: OfficialSourceRecord[];
  softwareRequirements?: SoftwareRequirementProfile[];
  hardwareTargets?: HardwareTarget[];
  gaps?: BuildIntentGap[];
}): BuildIntent {
  if (args.intentId.trim().length === 0) {
    throw new Error("intentId must not be empty");
  }

  if (args.rawIntent.trim().length === 0) {
    throw new Error("rawIntent must not be empty");
  }

  if (
    args.budgetAmount !== undefined &&
    (!Number.isFinite(args.budgetAmount) || args.budgetAmount <= 0)
  ) {
    throw new Error("budgetAmount must be a positive finite number when provided");
  }

  const draft: Omit<BuildIntent, "readiness"> = {
    intentId: args.intentId,
    schemaVersion: BUILD_INTENT_SCHEMA_VERSION,
    createdAt: args.createdAt,
    rawIntent: args.rawIntent,
    budgetAmount: args.budgetAmount,
    currency: args.currency,
    scope: args.scope,
    locale: args.locale,
    sources: [...(args.sources ?? [])],
    softwareRequirements: [...(args.softwareRequirements ?? [])],
    hardwareTargets: [...(args.hardwareTargets ?? [])],
    gaps: [...(args.gaps ?? [])],
  };

  return {
    ...draft,
    readiness: evaluateBuildIntentReadiness(draft),
  };
}

export function validateBuildIntent(
  intent: BuildIntent,
): BuildIntentValidationResult {
  const issues: BuildIntentValidationIssue[] = [];

  if (intent.schemaVersion !== BUILD_INTENT_SCHEMA_VERSION) {
    issues.push({
      code: "unsupported_schema_version",
      path: "$.schemaVersion",
      message: `schemaVersion must be ${BUILD_INTENT_SCHEMA_VERSION}`,
    });
  }

  if (intent.intentId.trim().length === 0) {
    issues.push({
      code: "missing_intent_id",
      path: "$.intentId",
      message: "intentId is required",
    });
  }

  if (intent.rawIntent.trim().length === 0) {
    issues.push({
      code: "missing_raw_intent",
      path: "$.rawIntent",
      message: "rawIntent is required",
    });
  }

  const sourceIds = new Set<string>();
  for (const [index, source] of intent.sources.entries()) {
    if (source.sourceId.trim().length === 0) {
      issues.push({
        code: "missing_source_id",
        path: `$.sources[${index}].sourceId`,
        message: "sourceId is required",
      });
    }

    if (sourceIds.has(source.sourceId)) {
      issues.push({
        code: "duplicate_source_id",
        path: `$.sources[${index}].sourceId`,
        message: `duplicate sourceId ${source.sourceId}`,
      });
    }
    sourceIds.add(source.sourceId);

    if (source.url.trim().length === 0) {
      issues.push({
        code: "missing_source_url",
        path: `$.sources[${index}].url`,
        message: "source URL is required",
      });
    }
  }

  const requirementIds = new Set<string>();
  for (const [index, requirement] of intent.softwareRequirements.entries()) {
    if (requirementIds.has(requirement.requirementId)) {
      issues.push({
        code: "duplicate_requirement_id",
        path: `$.softwareRequirements[${index}].requirementId`,
        message: `duplicate requirementId ${requirement.requirementId}`,
      });
    }
    requirementIds.add(requirement.requirementId);

    if (!sourceIds.has(requirement.sourceId)) {
      issues.push({
        code: "missing_requirement_source",
        path: `$.softwareRequirements[${index}].sourceId`,
        message: `unknown sourceId ${requirement.sourceId}`,
      });
    }

    const source = intent.sources.find(
      (candidate) => candidate.sourceId === requirement.sourceId,
    );
    if (
      requirement.qualityState === "ready" &&
      source?.trustState !== "official"
    ) {
      issues.push({
        code: "ready_requirement_without_official_source",
        path: `$.softwareRequirements[${index}].qualityState`,
        message: "ready software requirements must be grounded in an official source",
      });
    }
  }

  for (const [index, target] of intent.hardwareTargets.entries()) {
    if (target.target.trim().length === 0) {
      issues.push({
        code: "empty_hardware_target",
        path: `$.hardwareTargets[${index}].target`,
        message: "hardware target must not be empty",
      });
    }

    if (target.evidence.length === 0) {
      issues.push({
        code: "hardware_target_without_evidence",
        path: `$.hardwareTargets[${index}].evidence`,
        message: "hardware target must preserve requirement evidence references",
      });
    }

    for (const [evidenceIndex, evidence] of target.evidence.entries()) {
      if (!sourceIds.has(evidence.sourceId)) {
        issues.push({
          code: "unknown_target_source",
          path: `$.hardwareTargets[${index}].evidence[${evidenceIndex}].sourceId`,
          message: `unknown sourceId ${evidence.sourceId}`,
        });
      }
      if (!requirementIds.has(evidence.requirementId)) {
        issues.push({
          code: "unknown_target_requirement",
          path: `$.hardwareTargets[${index}].evidence[${evidenceIndex}].requirementId`,
          message: `unknown requirementId ${evidence.requirementId}`,
        });
      }
    }
  }

  const expectedReadiness = evaluateBuildIntentReadiness({
    intentId: intent.intentId,
    schemaVersion: intent.schemaVersion,
    createdAt: intent.createdAt,
    rawIntent: intent.rawIntent,
    budgetAmount: intent.budgetAmount,
    currency: intent.currency,
    scope: intent.scope,
    locale: intent.locale,
    sources: intent.sources,
    softwareRequirements: intent.softwareRequirements,
    hardwareTargets: intent.hardwareTargets,
    gaps: intent.gaps,
  });

  if (intent.readiness !== expectedReadiness) {
    issues.push({
      code: "readiness_mismatch",
      path: "$.readiness",
      message: `expected readiness ${expectedReadiness}, received ${intent.readiness}`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
