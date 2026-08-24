import type { CompatibilityResult } from "@bilgisayar-topla/compatibility";

import type {
  PcBuildRun,
  PcBuildStage,
  StageEvidenceRef,
} from "./index.js";

export function applyCompatibilityGate(args: {
  run: PcBuildRun;
  candidateId: string;
  result: CompatibilityResult;
  at: string;
}): PcBuildRun {
  const run = cloneRun(args.run);
  const candidateGeneration = stage(run, "candidateGeneration");
  if (candidateGeneration.status !== "passed") {
    throw new Error(
      "compatibility gate requires candidateGeneration stage to be passed",
    );
  }

  run.updatedAt = args.at;
  const compatibility = stage(run, "compatibility");
  compatibility.startedAt ??= args.at;
  compatibility.completedAt = args.at;
  compatibility.outputRefIds = [args.candidateId];
  compatibility.evidenceRefs = compatibilityEvidence(args.result);
  compatibility.diagnostics = args.result.checks
    .filter((item) => item.status !== "PASS")
    .map((item) => item.code);

  if (args.result.status === "PASS") {
    compatibility.status = "passed";
    resetAfter(run, "compatibility");
    run.status = "running";
    run.firstFailure = undefined;
    return run;
  }

  if (args.result.status === "REVIEW_REQUIRED") {
    compatibility.status = "reviewRequired";
    resetAfter(run, "compatibility");
    run.status = "reviewRequired";
    run.firstFailure = undefined;
    return run;
  }

  compatibility.status = "failed";
  resetAfter(run, "compatibility");
  run.status = "failed";
  run.firstFailure = {
    stage: "compatibility",
    code: args.result.firstBlockingCheck?.code ?? "COMPATIBILITY_FAILED",
    message:
      args.result.firstBlockingCheck?.message ??
      "Candidate failed deterministic compatibility validation.",
  };
  return run;
}

function compatibilityEvidence(
  result: CompatibilityResult,
): StageEvidenceRef[] {
  const refs = new Map<string, StageEvidenceRef>();
  for (const check of result.checks) {
    for (const evidence of check.evidenceRefs) {
      const evidenceId = [
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
      productProfileIds: [...build.productProfileIds],
    })),
    firstFailure: run.firstFailure ? { ...run.firstFailure } : undefined,
  };
}
