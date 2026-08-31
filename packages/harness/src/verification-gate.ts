import type { BuildVerificationResult } from "@bilgisayar-topla/verification";

import type {
  AiUsageRecord,
  BuildSelection,
  PcBuildRun,
  PcBuildStage,
  StageEvidenceRef,
} from "./index.js";

export const PC_BUILD_PROOF_REPORT_SCHEMA_VERSION = "1.0.0" as const;

export type PcBuildProofChainReport = {
  schemaVersion: typeof PC_BUILD_PROOF_REPORT_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  runStatus: PcBuildRun["status"];
  request: PcBuildRun["request"];
  stages: PcBuildRun["stages"];
  selectedBuilds: BuildSelection[];
  verifications: BuildVerificationResult[];
  aiUsage: AiUsageRecord[];
  aiUsageTotals: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
  firstFailure?: PcBuildRun["firstFailure"];
};

export function applyVerificationResults(args: {
  run: PcBuildRun;
  results: BuildVerificationResult[];
  at: string;
}): PcBuildRun {
  const run = cloneRun(args.run);
  const scoring = stage(run, "scoring");
  if (scoring.status !== "passed") {
    throw new Error("verification gate requires scoring stage to be passed");
  }
  if (run.selectedBuilds.length === 0) {
    throw new Error("verification gate requires at least one selected build");
  }

  run.updatedAt = args.at;
  run.firstFailure = undefined;
  const verification = stage(run, "verification");
  verification.startedAt = args.at;
  verification.completedAt = args.at;
  verification.evidenceRefs = verificationEvidence(args.results);
  verification.diagnostics = [];
  verification.outputRefIds = [];

  const duplicateBuildId = firstDuplicate(
    args.results.map((result) => result.buildId),
  );
  const duplicateVerificationId = firstDuplicate(
    args.results.map((result) => result.verificationId),
  );
  const selectedBuildIds = new Set(
    run.selectedBuilds.map((build) => build.buildId),
  );
  const unknownResult = args.results.find(
    (result) => !selectedBuildIds.has(result.buildId),
  );

  if (duplicateBuildId || duplicateVerificationId || unknownResult) {
    const code = duplicateBuildId
      ? "VERIFICATION_RESULT_BUILD_ID_DUPLICATE"
      : duplicateVerificationId
        ? "VERIFICATION_RESULT_ID_DUPLICATE"
        : "VERIFICATION_RESULT_UNKNOWN_BUILD";
    const detail = duplicateBuildId ?? duplicateVerificationId ?? unknownResult?.buildId ?? "unknown";
    verification.status = "failed";
    verification.diagnostics = [`${code}:${detail}`];
    resetAfter(run, "verification");
    run.status = "failed";
    run.firstFailure = {
      stage: "verification",
      code,
      message: duplicateBuildId
        ? `Multiple verification results were supplied for selected build ${duplicateBuildId}.`
        : duplicateVerificationId
          ? `Verification id ${duplicateVerificationId} is duplicated across the result set.`
          : `Verification result references unknown selected build ${detail}.`,
    };
    return run;
  }

  const resultByBuild = new Map(
    args.results.map((result) => [result.buildId, result] as const),
  );
  const verifiedBuilds: BuildSelection[] = [];
  let hasReview = false;
  let firstFailure: BuildVerificationResult | undefined;

  for (const build of run.selectedBuilds) {
    const result = resultByBuild.get(build.buildId);
    if (!result) {
      build.verificationStatus = "reviewRequired";
      hasReview = true;
      verification.diagnostics.push(
        `VERIFICATION_RESULT_MISSING:${build.buildId}`,
      );
      continue;
    }

    verification.diagnostics.push(
      ...result.diagnostics.map(
        (diagnostic) => `${diagnostic.code}:${build.buildId}`,
      ),
    );

    if (result.status === "PASS") {
      build.verificationStatus = "passed";
      verifiedBuilds.push(build);
      verification.outputRefIds.push(build.buildId);
      continue;
    }

    if (result.status === "REVIEW_REQUIRED") {
      build.verificationStatus = "reviewRequired";
      hasReview = true;
      continue;
    }

    build.verificationStatus = "failed";
    firstFailure ??= result;
  }

  verification.diagnostics = unique(verification.diagnostics);
  resetAfter(run, "verification");

  if (verifiedBuilds.length > 0) {
    run.selectedBuilds = verifiedBuilds.map(cloneBuild);
    verification.status = "passed";
    run.status = "running";
    run.firstFailure = undefined;
    return run;
  }

  if (hasReview) {
    verification.status = "reviewRequired";
    run.status = "reviewRequired";
    return run;
  }

  verification.status = "failed";
  run.status = "failed";
  run.firstFailure = {
    stage: "verification",
    code:
      firstFailure?.diagnostics.find(
        (diagnostic) => diagnostic.severity === "error",
      )?.code ?? "ALL_SELECTED_BUILDS_FAILED_VERIFICATION",
    message:
      firstFailure?.diagnostics.find(
        (diagnostic) => diagnostic.severity === "error",
      )?.message ?? "All selected builds failed independent verification.",
  };
  return run;
}

export function createPcBuildProofChainReport(args: {
  run: PcBuildRun;
  verifications: BuildVerificationResult[];
  generatedAt: string;
}): PcBuildProofChainReport {
  const run = cloneRun(args.run);
  const aiUsage = run.aiUsage.map((usage) => ({ ...usage }));

  return {
    schemaVersion: PC_BUILD_PROOF_REPORT_SCHEMA_VERSION,
    generatedAt: args.generatedAt,
    runId: run.runId,
    runStatus: run.status,
    request: { ...run.request },
    stages: run.stages,
    selectedBuilds: run.selectedBuilds.map(cloneBuild),
    verifications: args.verifications.map(cloneVerification),
    aiUsage,
    aiUsageTotals: {
      inputTokens: sum(aiUsage, "inputTokens"),
      outputTokens: sum(aiUsage, "outputTokens"),
      reasoningTokens: sum(aiUsage, "reasoningTokens"),
      estimatedCostUsd: round8(sum(aiUsage, "estimatedCostUsd")),
      latencyMs: sum(aiUsage, "latencyMs"),
    },
    firstFailure: run.firstFailure ? { ...run.firstFailure } : undefined,
  };
}

function verificationEvidence(
  results: BuildVerificationResult[],
): StageEvidenceRef[] {
  const refs = new Map<string, StageEvidenceRef>();

  for (const result of results) {
    refs.set(`verification:${result.verificationId}`, {
      evidenceId: `verification:${result.verificationId}`,
      kind: "validation",
    });

    for (const product of result.catalogLineage) {
      const evidenceId = `product:${product.catalogProductId}:${product.productPageSnapshotSha256}`;
      refs.set(evidenceId, {
        evidenceId,
        kind: "productPage",
        sourceUrl: product.productPageUrl,
        snapshotId: product.productPageSnapshotSha256,
      });
    }

    for (const requirement of result.requirementLineage) {
      const evidenceId = [
        "requirement",
        requirement.sourceId,
        requirement.requirementId,
        requirement.field,
      ].join(":");
      refs.set(evidenceId, {
        evidenceId,
        kind: "officialRequirement",
        sourceUrl: requirement.sourceUrl,
        snapshotId: requirement.sourceSnapshotSha256,
      });
    }
  }

  return [...refs.values()];
}

function stage(run: PcBuildRun, name: PcBuildStage) {
  const found = run.stages.find((item) => item.stage === name);
  if (!found) throw new Error(`Missing canonical stage ${name}`);
  return found;
}

function resetAfter(run: PcBuildRun, name: PcBuildStage): void {
  const index = run.stages.findIndex((item) => item.stage === name);
  if (index < 0) throw new Error(`Missing canonical stage ${name}`);
  for (const later of run.stages.slice(index + 1)) {
    later.status = "pending";
    later.startedAt = undefined;
    later.completedAt = undefined;
    later.evidenceRefs = [];
    later.outputRefIds = [];
    later.diagnostics = [];
  }
}

function sum(
  usage: AiUsageRecord[],
  key:
    | "inputTokens"
    | "outputTokens"
    | "reasoningTokens"
    | "estimatedCostUsd"
    | "latencyMs",
): number {
  return usage.reduce((total, record) => total + (record[key] ?? 0), 0);
}

function round8(value: number): number {
  return Math.round(value * 100_000_000) / 100_000_000;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function firstDuplicate(values: string[]): string | undefined {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}

function cloneBuild(build: BuildSelection): BuildSelection {
  return {
    ...build,
    catalogProductIds: build.catalogProductIds
      ? [...build.catalogProductIds]
      : undefined,
    productProfileIds: [...build.productProfileIds],
  };
}

function cloneVerification(
  verification: BuildVerificationResult,
): BuildVerificationResult {
  return {
    ...verification,
    diagnostics: verification.diagnostics.map((diagnostic) => ({ ...diagnostic })),
    catalogLineage: verification.catalogLineage.map((lineage) => ({ ...lineage })),
    requirementLineage: verification.requirementLineage.map((lineage) => ({ ...lineage })),
    recomputed: verification.recomputed
      ? {
          ...verification.recomputed,
          compatibility: {
            ...verification.recomputed.compatibility,
            checks: verification.recomputed.compatibility.checks.map((check) => ({
              ...check,
              evidenceRefs: check.evidenceRefs.map((evidence) => ({
                ...evidence,
                sourceRefIds: [...evidence.sourceRefIds],
              })),
            })),
            firstBlockingCheck: verification.recomputed.compatibility.firstBlockingCheck
              ? {
                  ...verification.recomputed.compatibility.firstBlockingCheck,
                  evidenceRefs:
                    verification.recomputed.compatibility.firstBlockingCheck.evidenceRefs.map(
                      (evidence) => ({
                        ...evidence,
                        sourceRefIds: [...evidence.sourceRefIds],
                      }),
                    ),
                }
              : undefined,
          },
          targetChecks: verification.recomputed.targetChecks.map((check) => ({
            ...check,
            targetEvidence: check.targetEvidence.map((evidence) => ({ ...evidence })),
            featureKeys: [...check.featureKeys],
          })),
        }
      : undefined,
  };
}

function cloneRun(run: PcBuildRun): PcBuildRun {
  return {
    ...run,
    request: { ...run.request },
    provision: {
      ...run.provision,
      capabilities: [...run.provision.capabilities],
      tools: [...run.provision.tools],
      contextKeys: [...run.provision.contextKeys],
    },
    stages: run.stages.map((item) => ({
      ...item,
      evidenceRefs: item.evidenceRefs.map((evidence) => ({ ...evidence })),
      outputRefIds: [...item.outputRefIds],
      diagnostics: [...item.diagnostics],
    })),
    aiUsage: run.aiUsage.map((usage) => ({ ...usage })),
    selectedBuilds: run.selectedBuilds.map(cloneBuild),
    firstFailure: run.firstFailure ? { ...run.firstFailure } : undefined,
  };
}
