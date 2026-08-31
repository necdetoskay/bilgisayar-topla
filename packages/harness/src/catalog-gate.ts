import {
  validateCatalogSnapshot,
  type CatalogSnapshot,
} from "@bilgisayar-topla/catalog";

import type {
  PcBuildRun,
  PcBuildStage,
  PcBuildStageRecord,
  StageEvidenceRef,
  StageStatus,
} from "./index.js";

export function applyCatalogGate(
  inputRun: PcBuildRun,
  snapshot: CatalogSnapshot,
  at: string,
): PcBuildRun {
  const run = cloneRun(inputRun);
  run.updatedAt = at;

  const hardwareTargetStage = stageByName(run, "hardwareTarget");
  if (hardwareTargetStage.status !== "passed") {
    setStage(run, "catalog", "failed", at, {
      diagnostics: ["CATALOG_PREREQUISITE_HARDWARE_TARGET_NOT_PASSED"],
    });
    resetLaterStagesToPending(run, "catalog");
    run.status = "failed";
    run.firstFailure ??= {
      stage: "catalog",
      code: "CATALOG_PREREQUISITE_HARDWARE_TARGET_NOT_PASSED",
      message: "Catalog cannot be accepted before hardwareTarget passes.",
    };
    return run;
  }

  const validation = validateCatalogSnapshot(snapshot);
  const catalogEvidence: StageEvidenceRef[] = [
    {
      evidenceId: snapshot.snapshotId,
      kind: "pcBuilder",
      sourceUrl: snapshot.targetUrl,
      snapshotId: snapshot.snapshotId,
    },
  ];

  if (!validation.valid || snapshot.qualityState === "rejected") {
    const codes = validation.issues.map((issue) => issue.code);
    setStage(run, "catalog", "failed", at, {
      evidenceRefs: catalogEvidence,
      outputRefIds: snapshot.products.map((product) => product.catalogProductId),
      diagnostics: ["CATALOG_SNAPSHOT_INVALID", ...codes],
    });
    resetLaterStagesToPending(run, "catalog");
    run.status = "failed";
    run.firstFailure ??= {
      stage: "catalog",
      code: "CATALOG_SNAPSHOT_INVALID",
      message: `Catalog snapshot validation failed: ${codes.join(", ")}`,
    };
    return run;
  }

  if (snapshot.qualityState !== "ready") {
    setStage(run, "catalog", "reviewRequired", at, {
      evidenceRefs: catalogEvidence,
      outputRefIds: snapshot.products.map((product) => product.catalogProductId),
      diagnostics: [
        `CATALOG_${snapshot.qualityState.toUpperCase()}`,
        ...snapshot.diagnostics.map((diagnostic) => diagnostic.code),
      ],
    });
    resetLaterStagesToPending(run, "catalog");
    run.status = "reviewRequired";
    return run;
  }

  setStage(run, "catalog", "passed", at, {
    evidenceRefs: catalogEvidence,
    outputRefIds: snapshot.products.map((product) => product.catalogProductId),
  });
  resetLaterStagesToPending(run, "catalog");
  run.status = "running";
  return run;
}

export function catalogStageByName(
  run: PcBuildRun,
  stageName: PcBuildStage,
): PcBuildStageRecord {
  return stageByName(run, stageName);
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
  const stage = stageByName(run, stageName);
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

function stageByName(
  run: PcBuildRun,
  stageName: PcBuildStage,
): PcBuildStageRecord {
  const stage = run.stages.find((candidate) => candidate.stage === stageName);
  if (!stage) {
    throw new Error(`Missing canonical stage ${stageName}`);
  }
  return stage;
}
