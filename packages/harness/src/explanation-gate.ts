import type {
  BuildSelection,
  PcBuildRun,
  PcBuildStage,
  StageEvidenceRef,
} from "./index.js";

export type BuildExplanationRecord = {
  buildId: string;
  summary: string;
  evidenceRefIds: string[];
};

export function createDeterministicVerifiedBuildExplanations(
  run: PcBuildRun,
): BuildExplanationRecord[] {
  const verification = stage(run, "verification");
  if (verification.status !== "passed") {
    throw new Error("deterministic explanation requires verification stage to be passed");
  }

  const evidenceRefIds = verification.evidenceRefs.map(
    (evidence) => evidence.evidenceId,
  );
  return run.selectedBuilds
    .filter((build) => build.verificationStatus === "passed")
    .map((build) => ({
      buildId: build.buildId,
      summary: deterministicSummary(build),
      evidenceRefIds: [...evidenceRefIds],
    }));
}

export function applyExplanationGate(args: {
  run: PcBuildRun;
  explanations: BuildExplanationRecord[];
  at: string;
}): PcBuildRun {
  const run = cloneRun(args.run);
  const verification = stage(run, "verification");
  if (verification.status !== "passed") {
    throw new Error("explanation gate requires verification stage to be passed");
  }
  if (
    run.selectedBuilds.length === 0 ||
    run.selectedBuilds.some((build) => build.verificationStatus !== "passed")
  ) {
    throw new Error("explanation gate requires independently verified selected builds");
  }

  run.updatedAt = args.at;
  run.firstFailure = undefined;
  const explanation = stage(run, "explanation");
  explanation.startedAt = args.at;
  explanation.completedAt = args.at;
  explanation.evidenceRefs = [];
  explanation.outputRefIds = [];
  explanation.diagnostics = [];

  const duplicateBuildId = firstDuplicate(
    args.explanations.map((record) => record.buildId),
  );
  if (duplicateBuildId) {
    explanation.status = "failed";
    explanation.diagnostics = [
      `EXPLANATION_BUILD_ID_DUPLICATE:${duplicateBuildId}`,
    ];
    run.status = "failed";
    run.firstFailure = {
      stage: "explanation",
      code: "EXPLANATION_BUILD_ID_DUPLICATE",
      message: `Build ${duplicateBuildId} has duplicate explanation records.`,
    };
    return run;
  }

  const selectedBuildIds = new Set(
    run.selectedBuilds.map((build) => build.buildId),
  );
  const unknownBuild = args.explanations.find(
    (record) => !selectedBuildIds.has(record.buildId),
  );
  if (unknownBuild) {
    explanation.status = "failed";
    explanation.diagnostics = [
      `EXPLANATION_UNKNOWN_BUILD:${unknownBuild.buildId}`,
    ];
    run.status = "failed";
    run.firstFailure = {
      stage: "explanation",
      code: "EXPLANATION_UNKNOWN_BUILD",
      message: `Explanation references unknown selected build ${unknownBuild.buildId}.`,
    };
    return run;
  }

  const knownEvidence = new Map<string, StageEvidenceRef>();
  for (const sourceStage of run.stages) {
    if (sourceStage.stage === "explanation") continue;
    for (const evidence of sourceStage.evidenceRefs) {
      knownEvidence.set(evidence.evidenceId, evidence);
    }
  }

  for (const build of run.selectedBuilds) {
    const record = args.explanations.find(
      (candidate) => candidate.buildId === build.buildId,
    );
    if (!record || !record.summary.trim() || record.evidenceRefIds.length === 0) {
      explanation.status = "reviewRequired";
      explanation.diagnostics.push(
        `EXPLANATION_RECORD_INCOMPLETE:${build.buildId}`,
      );
      run.status = "reviewRequired";
      return run;
    }

    const unknownEvidence = record.evidenceRefIds.find(
      (evidenceId) => !knownEvidence.has(evidenceId),
    );
    if (unknownEvidence) {
      explanation.status = "failed";
      explanation.diagnostics.push(
        `EXPLANATION_UNKNOWN_EVIDENCE_REF:${unknownEvidence}`,
      );
      run.status = "failed";
      run.firstFailure = {
        stage: "explanation",
        code: "EXPLANATION_UNKNOWN_EVIDENCE_REF",
        message: `Explanation for ${build.buildId} references unknown evidence ${unknownEvidence}.`,
      };
      return run;
    }

    explanation.outputRefIds.push(build.buildId);
    for (const evidenceId of record.evidenceRefIds) {
      const evidence = knownEvidence.get(evidenceId);
      if (evidence) explanation.evidenceRefs.push({ ...evidence });
    }
  }

  explanation.evidenceRefs = dedupeEvidence(explanation.evidenceRefs);
  explanation.outputRefIds = [...new Set(explanation.outputRefIds)];
  explanation.status = "passed";
  run.status = "completed";
  return run;
}

function deterministicSummary(build: BuildSelection): string {
  const scoreText = build.score === undefined ? "score not recorded" : `score ${build.score}`;
  return [
    `Build ${build.buildId} independently verified.`,
    `Total price: ${formatMoney(build.totalPrice)} ${build.currency}.`,
    `${build.productProfileIds.length} component profiles passed verification; ${scoreText}.`,
    "Compatibility, budget and evidence-backed hardware targets were rechecked before acceptance.",
  ].join(" ");
}

function formatMoney(value: number): string {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function dedupeEvidence(values: StageEvidenceRef[]): StageEvidenceRef[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.evidenceId)) return false;
    seen.add(value.evidenceId);
    return true;
  });
}

function firstDuplicate(values: string[]): string | undefined {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}

function stage(run: PcBuildRun, name: PcBuildStage) {
  const found = run.stages.find((item) => item.stage === name);
  if (!found) throw new Error(`Missing canonical stage ${name}`);
  return found;
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
