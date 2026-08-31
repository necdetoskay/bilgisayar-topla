import {
  validateBuildIntent,
  type BuildIntent,
} from "@bilgisayar-topla/requirements";

import type {
  PcBuildRun,
  PcBuildStage,
  PcBuildStageRecord,
  StageEvidenceRef,
  StageStatus,
} from "./index.js";

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
    stages: run.stages.map((stage) => ({
      ...stage,
      evidenceRefs: stage.evidenceRefs.map((evidence) => ({ ...evidence })),
      outputRefIds: [...stage.outputRefIds],
      diagnostics: [...stage.diagnostics],
    })),
    aiUsage: run.aiUsage.map((usage) => ({ ...usage })),
    selectedBuilds: run.selectedBuilds.map((build) => ({
      ...build,
      productProfileIds: [...build.productProfileIds],
    })),
    firstFailure: run.firstFailure ? { ...run.firstFailure } : undefined,
  };
}

function setStage(
  run: PcBuildRun,
  stageName: PcBuildStage,
  status: StageStatus,
  at: string,
  options?: {
    evidenceRefs?: StageEvidenceRef[];
    outputRefIds?: string[];
    diagnostics?: string[];
  },
): void {
  const stage = run.stages.find((candidate) => candidate.stage === stageName);
  if (!stage) {
    throw new Error(`Missing canonical stage ${stageName}`);
  }

  stage.status = status;
  stage.startedAt ??= at;
  if (status !== "running" && status !== "pending") {
    stage.completedAt = at;
  }
  if (options?.evidenceRefs) {
    stage.evidenceRefs = options.evidenceRefs.map((evidence) => ({ ...evidence }));
  }
  if (options?.outputRefIds) {
    stage.outputRefIds = [...options.outputRefIds];
  }
  if (options?.diagnostics) {
    stage.diagnostics = [...options.diagnostics];
  }
}

function resetLaterStagesToPending(run: PcBuildRun, after: PcBuildStage): void {
  const index = run.stages.findIndex((stage) => stage.stage === after);
  if (index < 0) {
    throw new Error(`Missing canonical stage ${after}`);
  }

  for (let current = index + 1; current < run.stages.length; current += 1) {
    const stage = run.stages[current];
    if (!stage) continue;
    stage.status = "pending";
    stage.startedAt = undefined;
    stage.completedAt = undefined;
    stage.evidenceRefs = [];
    stage.outputRefIds = [];
    stage.diagnostics = [];
  }
}

function officialRequirementEvidenceRefs(intent: BuildIntent): StageEvidenceRef[] {
  return intent.sources
    .filter((source) => source.trustState === "official")
    .map((source) => ({
      evidenceId: source.sourceId,
      kind: "officialRequirement" as const,
      sourceUrl: source.url,
      snapshotId: source.snapshotSha256,
    }));
}

function hasResolvedOfficialRequirementEvidence(intent: BuildIntent): boolean {
  if (intent.softwareRequirements.length === 0) {
    return false;
  }

  const sourceById = new Map(
    intent.sources.map((source) => [source.sourceId, source] as const),
  );

  return intent.softwareRequirements.every((requirement) => {
    const source = sourceById.get(requirement.sourceId);
    return requirement.qualityState === "ready" && source?.trustState === "official";
  });
}

export function applyBuildIntentGate(
  inputRun: PcBuildRun,
  intent: BuildIntent,
  at: string,
): PcBuildRun {
  const run = cloneRun(inputRun);
  run.updatedAt = at;
  run.firstFailure = undefined;

  const validation = validateBuildIntent(intent);
  if (!validation.valid) {
    const codes = validation.issues.map((issue) => issue.code);
    setStage(run, "intent", "failed", at, {
      outputRefIds: [intent.intentId],
      diagnostics: ["BUILD_INTENT_INVALID", ...codes],
    });
    resetLaterStagesToPending(run, "intent");
    run.status = "failed";
    run.firstFailure = {
      stage: "intent",
      code: "BUILD_INTENT_INVALID",
      message: `Build intent validation failed: ${codes.join(", ")}`,
    };
    return run;
  }

  if (intent.readiness === "needsClarification") {
    setStage(run, "intent", "reviewRequired", at, {
      outputRefIds: [intent.intentId],
      diagnostics: ["BUILD_INTENT_NEEDS_CLARIFICATION"],
    });
    resetLaterStagesToPending(run, "intent");
    run.status = "reviewRequired";
    return run;
  }

  setStage(run, "intent", "passed", at, {
    outputRefIds: [intent.intentId],
  });

  if (intent.readiness === "blocked") {
    setStage(run, "requirementEvidence", "failed", at, {
      evidenceRefs: officialRequirementEvidenceRefs(intent),
      outputRefIds: intent.softwareRequirements.map(
        (requirement) => requirement.requirementId,
      ),
      diagnostics: ["BUILD_INTENT_BLOCKED"],
    });
    resetLaterStagesToPending(run, "requirementEvidence");
    run.status = "failed";
    run.firstFailure = {
      stage: "requirementEvidence",
      code: "BUILD_INTENT_BLOCKED",
      message: "Build intent contains a hard blocking requirement or evidence state.",
    };
    return run;
  }

  const evidenceResolved = hasResolvedOfficialRequirementEvidence(intent);
  if (!evidenceResolved) {
    setStage(run, "requirementEvidence", "reviewRequired", at, {
      evidenceRefs: officialRequirementEvidenceRefs(intent),
      outputRefIds: intent.softwareRequirements.map(
        (requirement) => requirement.requirementId,
      ),
      diagnostics: ["OFFICIAL_REQUIREMENT_EVIDENCE_UNRESOLVED"],
    });
    resetLaterStagesToPending(run, "requirementEvidence");
    run.status = "reviewRequired";
    return run;
  }

  setStage(run, "requirementEvidence", "passed", at, {
    evidenceRefs: officialRequirementEvidenceRefs(intent),
    outputRefIds: intent.softwareRequirements.map(
      (requirement) => requirement.requirementId,
    ),
  });

  if (
    intent.readiness === "reviewRequired" ||
    intent.hardwareTargets.length === 0 ||
    intent.hardwareTargets.some((target) => target.state !== "ready")
  ) {
    setStage(run, "hardwareTarget", "reviewRequired", at, {
      evidenceRefs: intent.hardwareTargets.map((target) => ({
        evidenceId: target.targetId,
        kind: "derivedTarget" as const,
      })),
      outputRefIds: intent.hardwareTargets.map((target) => target.targetId),
      diagnostics: ["HARDWARE_TARGET_UNRESOLVED"],
    });
    resetLaterStagesToPending(run, "hardwareTarget");
    run.status = "reviewRequired";
    return run;
  }

  setStage(run, "hardwareTarget", "passed", at, {
    evidenceRefs: intent.hardwareTargets.map((target) => ({
      evidenceId: target.targetId,
      kind: "derivedTarget" as const,
    })),
    outputRefIds: intent.hardwareTargets.map((target) => target.targetId),
  });

  resetLaterStagesToPending(run, "hardwareTarget");
  run.status = "running";
  return run;
}

export function stageByName(
  run: PcBuildRun,
  stageName: PcBuildStage,
): PcBuildStageRecord {
  const stage = run.stages.find((candidate) => candidate.stage === stageName);
  if (!stage) {
    throw new Error(`Missing canonical stage ${stageName}`);
  }
  return stage;
}
