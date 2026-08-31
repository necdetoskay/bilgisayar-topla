export const PC_BUILD_RUN_SCHEMA_VERSION = "1.0.0" as const;

export const PC_BUILD_STAGE_ORDER = [
  "intent",
  "requirementEvidence",
  "hardwareTarget",
  "catalog",
  "productExtraction",
  "candidateGeneration",
  "compatibility",
  "scoring",
  "verification",
  "explanation",
] as const;

export type PcBuildStage = (typeof PC_BUILD_STAGE_ORDER)[number];

export type StageStatus =
  | "pending"
  | "running"
  | "passed"
  | "reviewRequired"
  | "failed"
  | "skipped";

export type PcBuildRunStatus =
  | "running"
  | "reviewRequired"
  | "failed"
  | "completed";

export type HarnessTaskClass =
  | "productExtraction"
  | "requirementResolution"
  | "pcBuild";

export type HarnessCapability =
  | "browserRead"
  | "productExtraction"
  | "requirementEvidence"
  | "hardwareTarget"
  | "catalogRead"
  | "compatibility"
  | "candidateGeneration"
  | "scoring"
  | "verification"
  | "explanation";

export type HarnessTool =
  | "playwright"
  | "officialSourceResolver"
  | "productExtractor"
  | "catalogReader"
  | "compatibilityEngine"
  | "buildOptimizer";

export type ModelTier = "none" | "light" | "medium" | "strong";

export type HarnessProvision = {
  taskClass: HarnessTaskClass;
  capabilities: HarnessCapability[];
  tools: HarnessTool[];
  modelTier: ModelTier;
  contextKeys: string[];
  maxAttempts: number;
  allowCapabilityEscalation: boolean;
};

const PRODUCT_EXTRACTION_PROVISION: HarnessProvision = {
  taskClass: "productExtraction",
  capabilities: ["browserRead", "productExtraction"],
  tools: ["playwright", "productExtractor"],
  modelTier: "light",
  contextKeys: ["sourceUrl", "productCategoryHint", "rawProductEvidence"],
  maxAttempts: 2,
  allowCapabilityEscalation: true,
};

const REQUIREMENT_RESOLUTION_PROVISION: HarnessProvision = {
  taskClass: "requirementResolution",
  capabilities: ["browserRead", "requirementEvidence", "hardwareTarget"],
  tools: ["officialSourceResolver"],
  modelTier: "medium",
  contextKeys: ["userIntent", "softwareCandidates", "officialEvidence"],
  maxAttempts: 2,
  allowCapabilityEscalation: true,
};

const PC_BUILD_PROVISION: HarnessProvision = {
  taskClass: "pcBuild",
  capabilities: [
    "requirementEvidence",
    "hardwareTarget",
    "catalogRead",
    "productExtraction",
    "candidateGeneration",
    "compatibility",
    "scoring",
    "verification",
    "explanation",
  ],
  tools: [
    "officialSourceResolver",
    "catalogReader",
    "productExtractor",
    "compatibilityEngine",
    "buildOptimizer",
  ],
  modelTier: "medium",
  contextKeys: [
    "userIntent",
    "budget",
    "officialEvidence",
    "hardwareTarget",
    "candidateProducts",
    "compatibilityResults",
  ],
  maxAttempts: 2,
  allowCapabilityEscalation: true,
};

export function provisionHarness(taskClass: HarnessTaskClass): HarnessProvision {
  switch (taskClass) {
    case "productExtraction":
      return cloneProvision(PRODUCT_EXTRACTION_PROVISION);
    case "requirementResolution":
      return cloneProvision(REQUIREMENT_RESOLUTION_PROVISION);
    case "pcBuild":
      return cloneProvision(PC_BUILD_PROVISION);
  }
}

function cloneProvision(provision: HarnessProvision): HarnessProvision {
  return {
    ...provision,
    capabilities: [...provision.capabilities],
    tools: [...provision.tools],
    contextKeys: [...provision.contextKeys],
  };
}

export type PcBuildRequest = {
  rawIntent: string;
  budgetAmount?: number;
  currency?: string;
  scope: "caseOnly" | "fullSet" | "unknown";
  locale?: string;
};

export type StageEvidenceRef = {
  evidenceId: string;
  kind:
    | "officialRequirement"
    | "productPage"
    | "pcBuilder"
    | "derivedTarget"
    | "validation"
    | "userInput";
  sourceUrl?: string;
  snapshotId?: string;
};

export type PcBuildStageRecord = {
  stage: PcBuildStage;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  evidenceRefs: StageEvidenceRef[];
  outputRefIds: string[];
  diagnostics: string[];
};

export type AiUsageRecord = {
  capability: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  estimatedCostUsd?: number;
  latencyMs?: number;
  outcome:
    | "success"
    | "validationFailed"
    | "reviewRequired"
    | "providerFailed";
};

export type BuildSelection = {
  buildId: string;
  /**
   * Catalog product identity is optional for backward compatibility with
   * pre-verification run records. The verification gate requires it and
   * returns reviewRequired when the lineage is absent.
   */
  catalogProductIds?: string[];
  productProfileIds: string[];
  totalPrice: number;
  currency: string;
  score?: number;
  verificationStatus: "passed" | "reviewRequired" | "failed";
};

export type FailureAttribution = {
  stage: PcBuildStage;
  code: string;
  message: string;
};

export type PcBuildRun = {
  runId: string;
  schemaVersion: typeof PC_BUILD_RUN_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  status: PcBuildRunStatus;
  request: PcBuildRequest;
  provision: HarnessProvision;
  stages: PcBuildStageRecord[];
  aiUsage: AiUsageRecord[];
  selectedBuilds: BuildSelection[];
  firstFailure?: FailureAttribution;
};

export type PcBuildRunValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type PcBuildRunValidationResult = {
  valid: boolean;
  issues: PcBuildRunValidationIssue[];
};

export function createPcBuildRun(args: {
  runId: string;
  createdAt: string;
  request: PcBuildRequest;
}): PcBuildRun {
  if (args.runId.trim().length === 0) {
    throw new Error("runId must not be empty");
  }

  if (args.request.rawIntent.trim().length === 0) {
    throw new Error("request.rawIntent must not be empty");
  }

  if (
    args.request.budgetAmount !== undefined &&
    (!Number.isFinite(args.request.budgetAmount) || args.request.budgetAmount <= 0)
  ) {
    throw new Error("budgetAmount must be a positive finite number when provided");
  }

  return {
    runId: args.runId,
    schemaVersion: PC_BUILD_RUN_SCHEMA_VERSION,
    createdAt: args.createdAt,
    updatedAt: args.createdAt,
    status: "running",
    request: { ...args.request },
    provision: provisionHarness("pcBuild"),
    stages: PC_BUILD_STAGE_ORDER.map((stage) => ({
      stage,
      status: "pending" as const,
      evidenceRefs: [],
      outputRefIds: [],
      diagnostics: [],
    })),
    aiUsage: [],
    selectedBuilds: [],
  };
}

export function validatePcBuildRun(run: PcBuildRun): PcBuildRunValidationResult {
  const issues: PcBuildRunValidationIssue[] = [];

  if (run.schemaVersion !== PC_BUILD_RUN_SCHEMA_VERSION) {
    issues.push({
      code: "unsupported_schema_version",
      path: "$.schemaVersion",
      message: `schemaVersion must be ${PC_BUILD_RUN_SCHEMA_VERSION}`,
    });
  }

  if (run.runId.trim().length === 0) {
    issues.push({
      code: "missing_run_id",
      path: "$.runId",
      message: "runId is required",
    });
  }

  if (run.request.rawIntent.trim().length === 0) {
    issues.push({
      code: "missing_raw_intent",
      path: "$.request.rawIntent",
      message: "rawIntent is required",
    });
  }

  if (run.stages.length !== PC_BUILD_STAGE_ORDER.length) {
    issues.push({
      code: "invalid_stage_count",
      path: "$.stages",
      message: "run must contain exactly one record for every PC build stage",
    });
  }

  for (let index = 0; index < PC_BUILD_STAGE_ORDER.length; index += 1) {
    const expected = PC_BUILD_STAGE_ORDER[index];
    const actual = run.stages[index]?.stage;
    if (actual !== expected) {
      issues.push({
        code: "invalid_stage_order",
        path: `$.stages[${index}].stage`,
        message: `expected ${expected ?? "unknown"}, received ${actual ?? "missing"}`,
      });
    }
  }

  const failedStage = run.stages.find((stage) => stage.status === "failed");
  if (run.status === "failed" && !run.firstFailure) {
    issues.push({
      code: "missing_failure_attribution",
      path: "$.firstFailure",
      message: "failed runs must preserve firstFailure attribution",
    });
  }

  if (run.firstFailure && failedStage && run.firstFailure.stage !== failedStage.stage) {
    issues.push({
      code: "failure_attribution_mismatch",
      path: "$.firstFailure.stage",
      message: "firstFailure must point to the earliest failed stage",
    });
  }

  if (run.status === "completed") {
    const incompleteStage = run.stages.find((stage) => stage.status !== "passed");
    if (incompleteStage) {
      issues.push({
        code: "completed_with_incomplete_stage",
        path: "$.status",
        message: `completed run contains non-passed stage ${incompleteStage.stage}`,
      });
    }

    if (run.selectedBuilds.length === 0) {
      issues.push({
        code: "completed_without_build",
        path: "$.selectedBuilds",
        message: "completed run must contain at least one selected build",
      });
    }

    const unverifiedBuild = run.selectedBuilds.find(
      (build) => build.verificationStatus !== "passed",
    );
    if (unverifiedBuild) {
      issues.push({
        code: "completed_with_unverified_build",
        path: "$.selectedBuilds",
        message: `build ${unverifiedBuild.buildId} is not verified`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function firstBlockingStage(run: PcBuildRun): PcBuildStageRecord | undefined {
  return run.stages.find(
    (stage) => stage.status === "failed" || stage.status === "reviewRequired",
  );
}
