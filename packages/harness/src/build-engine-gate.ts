import type {
  BuildCandidateEvaluation,
  BuildEngineResult,
} from "@bilgisayar-topla/build-engine";

import type {
  PcBuildRun,
  PcBuildStage,
  StageEvidenceRef,
} from "./index.js";

export function applyBuildEngineResult(args: {
  run: PcBuildRun;
  result: BuildEngineResult;
  at: string;
}): PcBuildRun {
  const run = cloneRun(args.run);
  const productExtraction = stage(run, "productExtraction");
  if (productExtraction.status !== "passed") {
    throw new Error(
      "build engine gate requires productExtraction stage to be passed",
    );
  }

  run.updatedAt = args.at;
  run.firstFailure = undefined;
  run.selectedBuilds = [];
  resetFrom(run, "candidateGeneration");

  const candidateGeneration = stage(run, "candidateGeneration");
  candidateGeneration.startedAt = args.at;
  candidateGeneration.completedAt = args.at;
  candidateGeneration.outputRefIds = args.result.evaluations.map(
    (evaluation) => evaluation.candidateId,
  );
  candidateGeneration.evidenceRefs = args.result.evaluations.map(
    (evaluation) => ({
      evidenceId: `candidate:${evaluation.candidateId}`,
      kind: "validation" as const,
    }),
  );
  candidateGeneration.diagnostics = unique(
    args.result.diagnostics.map((diagnostic) => diagnostic.code),
  );

  if (args.result.evaluations.length === 0) {
    if (args.result.status === "reviewRequired") {
      candidateGeneration.status = "reviewRequired";
      run.status = "reviewRequired";
      return run;
    }

    candidateGeneration.status = "failed";
    run.status = "failed";
    run.firstFailure = {
      stage: "candidateGeneration",
      code: firstErrorDiagnostic(args.result) ?? "CANDIDATE_GENERATION_FAILED",
      message: "Build engine did not produce any candidate combinations.",
    };
    return run;
  }

  candidateGeneration.status = "passed";

  const compatibility = stage(run, "compatibility");
  compatibility.startedAt = args.at;
  compatibility.completedAt = args.at;
  compatibility.evidenceRefs = compatibilityEvidence(args.result.evaluations);

  const compatibilityPassed = args.result.evaluations.filter(
    (evaluation) => evaluation.compatibility.status === "PASS",
  );
  const compatibilityReview = args.result.evaluations.filter(
    (evaluation) => evaluation.compatibility.status === "REVIEW_REQUIRED",
  );
  compatibility.outputRefIds = compatibilityPassed.map(
    (evaluation) => evaluation.candidateId,
  );
  compatibility.diagnostics = unique(
    args.result.evaluations.flatMap((evaluation) =>
      evaluation.compatibility.status === "PASS"
        ? []
        : [
            evaluation.compatibility.firstBlockingCheck?.code ??
              "COMPATIBILITY_NOT_PASS",
          ],
    ),
  );

  if (compatibilityPassed.length === 0) {
    resetAfter(run, "compatibility");
    if (compatibilityReview.length > 0) {
      compatibility.status = "reviewRequired";
      run.status = "reviewRequired";
      return run;
    }

    compatibility.status = "failed";
    run.status = "failed";
    const first = args.result.evaluations[0];
    run.firstFailure = {
      stage: "compatibility",
      code:
        first?.compatibility.firstBlockingCheck?.code ??
        "ALL_CANDIDATES_INCOMPATIBLE",
      message:
        first?.compatibility.firstBlockingCheck?.message ??
        "All generated candidates failed deterministic compatibility checks.",
    };
    return run;
  }

  compatibility.status = "passed";

  const scoring = stage(run, "scoring");
  scoring.startedAt = args.at;
  scoring.completedAt = args.at;
  scoring.evidenceRefs = scoringEvidence(args.result.evaluations);
  scoring.diagnostics = scoringDiagnostics(args.result.evaluations);

  const scored = args.result.evaluations.filter(
    (evaluation) => evaluation.outcome === "scored",
  );
  const scoringReview = args.result.evaluations.filter(
    (evaluation) => evaluation.outcome === "targetReviewRequired",
  );

  if (scored.length === 0) {
    resetAfter(run, "scoring");
    if (scoringReview.length > 0) {
      scoring.status = "reviewRequired";
      run.status = "reviewRequired";
      return run;
    }

    scoring.status = "failed";
    run.status = "failed";
    const failure = scoringFailure(args.result.evaluations);
    run.firstFailure = {
      stage: "scoring",
      code: failure.code,
      message: failure.message,
    };
    return run;
  }

  const topCandidates = args.result.topCandidates.filter(
    (candidate) => candidate.outcome === "scored",
  );
  scoring.status = "passed";
  scoring.outputRefIds = topCandidates.map((candidate) => candidate.candidateId);
  run.selectedBuilds = topCandidates.map((candidate) => ({
    buildId: candidate.candidateId,
    catalogProductIds: [...candidate.productIds],
    productProfileIds: [...candidate.productProfileIds],
    totalPrice: candidate.totalPrice,
    currency: candidate.currency,
    score: candidate.score,
    verificationStatus: "reviewRequired",
  }));
  resetAfter(run, "scoring");
  run.status = "running";
  run.firstFailure = undefined;
  return run;
}

function scoringFailure(
  evaluations: BuildCandidateEvaluation[],
): { code: string; message: string } {
  if (
    evaluations.some(
      (evaluation) =>
        evaluation.compatibility.status === "PASS" &&
        evaluation.outcome === "overBudget",
    )
  ) {
    return {
      code: "NO_UNDER_BUDGET_COMPATIBLE_CANDIDATE",
      message:
        "Compatible candidates exist, but none satisfy the V1 hard budget gate.",
    };
  }

  const targetFailure = evaluations
    .filter((evaluation) => evaluation.compatibility.status === "PASS")
    .flatMap((evaluation) => evaluation.targetChecks)
    .find((check) => check.status === "FAIL");
  if (targetFailure) {
    return {
      code: targetFailure.code,
      message: targetFailure.message,
    };
  }

  return {
    code: "NO_SCORABLE_CANDIDATE",
    message:
      "No compatibility-passing candidate survived the deterministic scoring gates.",
  };
}

function compatibilityEvidence(
  evaluations: BuildCandidateEvaluation[],
): StageEvidenceRef[] {
  const refs = new Map<string, StageEvidenceRef>();
  for (const evaluation of evaluations) {
    for (const check of evaluation.compatibility.checks) {
      for (const evidence of check.evidenceRefs) {
        const evidenceId = [
          "compatibility",
          evaluation.candidateId,
          check.ruleId,
          evidence.catalogProductId,
          evidence.profileId,
          evidence.featureKey ?? "component",
        ].join(":");
        refs.set(evidenceId, {
          evidenceId,
          kind: "validation",
        });
      }
    }
  }
  return [...refs.values()];
}

function scoringEvidence(
  evaluations: BuildCandidateEvaluation[],
): StageEvidenceRef[] {
  const refs = new Map<string, StageEvidenceRef>();
  for (const evaluation of evaluations) {
    for (const targetCheck of evaluation.targetChecks) {
      for (const evidence of targetCheck.targetEvidence) {
        const evidenceId = [
          "target",
          evidence.sourceId,
          evidence.requirementId,
          evidence.field,
        ].join(":");
        refs.set(evidenceId, {
          evidenceId,
          kind: "derivedTarget",
        });
      }
    }
  }
  return [...refs.values()];
}

function scoringDiagnostics(
  evaluations: BuildCandidateEvaluation[],
): string[] {
  return unique(
    evaluations.flatMap((evaluation) => {
      if (evaluation.outcome === "overBudget") {
        return ["CANDIDATE_OVER_BUDGET"];
      }
      if (
        evaluation.outcome === "targetFailed" ||
        evaluation.outcome === "targetReviewRequired"
      ) {
        const blocking = evaluation.targetChecks.find(
          (check) =>
            check.status === "FAIL" || check.status === "REVIEW_REQUIRED",
        );
        return blocking ? [blocking.code] : ["TARGET_SCORING_NOT_PASS"];
      }
      return [];
    }),
  );
}

function firstErrorDiagnostic(result: BuildEngineResult): string | undefined {
  return result.diagnostics.find((diagnostic) => diagnostic.severity === "error")
    ?.code;
}

function stage(run: PcBuildRun, name: PcBuildStage) {
  const found = run.stages.find((item) => item.stage === name);
  if (!found) throw new Error(`Missing canonical stage ${name}`);
  return found;
}

function resetFrom(run: PcBuildRun, name: PcBuildStage): void {
  const index = run.stages.findIndex((item) => item.stage === name);
  if (index < 0) throw new Error(`Missing canonical stage ${name}`);
  for (const current of run.stages.slice(index)) {
    current.status = "pending";
    current.startedAt = undefined;
    current.completedAt = undefined;
    current.evidenceRefs = [];
    current.outputRefIds = [];
    current.diagnostics = [];
  }
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

function unique(values: string[]): string[] {
  return [...new Set(values)];
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
    selectedBuilds: run.selectedBuilds.map((build) => ({
      ...build,
      catalogProductIds: build.catalogProductIds
        ? [...build.catalogProductIds]
        : undefined,
      productProfileIds: [...build.productProfileIds],
    })),
    firstFailure: run.firstFailure ? { ...run.firstFailure } : undefined,
  };
}
