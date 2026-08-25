import assert from "node:assert/strict";
import test from "node:test";

import type {
  BuildCandidateEvaluation,
  BuildEngineResult,
  TargetFitCheck,
} from "@bilgisayar-topla/build-engine";
import type {
  CompatibilityResult,
  CompatibilityStatus,
} from "@bilgisayar-topla/compatibility";

import { applyBuildEngineResult } from "./build-engine-gate.js";
import { createPcBuildRun } from "./index.js";

function runReadyForBuildEngine() {
  const run = createPcBuildRun({
    runId: "run-build-engine-gate",
    createdAt: "2026-08-25T04:30:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 icin kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });

  for (const name of [
    "intent",
    "requirementEvidence",
    "hardwareTarget",
    "catalog",
    "productExtraction",
  ] as const) {
    const stage = run.stages.find((item) => item.stage === name);
    assert.ok(stage);
    stage.status = "passed";
  }
  return run;
}

function compatibility(
  status: CompatibilityStatus,
  code: string,
): CompatibilityResult {
  const check = {
    ruleId: "cpu-motherboard-socket" as const,
    status,
    code,
    message: `fixture ${code}`,
    evidenceRefs: [],
  };
  return {
    policyVersion: "1.0.0",
    status,
    checks: [check],
    firstBlockingCheck: status === "PASS" ? undefined : check,
  };
}

function targetCheck(
  status: TargetFitCheck["status"],
  code: string,
): TargetFitCheck {
  return {
    targetId: "target-memory",
    component: "memory",
    status,
    code,
    message: `fixture ${code}`,
    targetEvidence: [
      {
        sourceId: "source-1",
        requirementId: "req-1",
        field: "recommended.ram",
      },
    ],
    productProfileId: "profile-memory",
    featureKeys: ["memory.capacity"],
  };
}

function candidate(args: {
  id: string;
  outcome: BuildCandidateEvaluation["outcome"];
  compatibilityStatus?: CompatibilityStatus;
  compatibilityCode?: string;
  targetChecks?: TargetFitCheck[];
  totalPrice?: number;
  score?: number;
}): BuildCandidateEvaluation {
  const compatibilityStatus = args.compatibilityStatus ?? "PASS";
  return {
    candidateId: args.id,
    productIds: [`product-${args.id}`],
    productProfileIds: [`profile-${args.id}`],
    totalPrice: args.totalPrice ?? 40_000,
    currency: "TRY",
    budgetRemaining: 50_000 - (args.totalPrice ?? 40_000),
    compatibility: compatibility(
      compatibilityStatus,
      args.compatibilityCode ??
        (compatibilityStatus === "PASS"
          ? "CPU_MOTHERBOARD_SOCKET_MATCH"
          : "CPU_MOTHERBOARD_SOCKET_MISMATCH"),
    ),
    targetChecks: args.targetChecks ?? [],
    outcome: args.outcome,
    score: args.score,
    rankingReasons: [],
  };
}

function result(args: {
  status: BuildEngineResult["status"];
  evaluations: BuildCandidateEvaluation[];
  topCandidates?: BuildCandidateEvaluation[];
}): BuildEngineResult {
  return {
    policyVersion: "1.0.0",
    status: args.status,
    budgetAmount: 50_000,
    currency: "TRY",
    maxProductsPerCategory: 4,
    maxCandidates: 256,
    totalCombinationCount: args.evaluations.length,
    sampledCandidateCount: args.evaluations.length,
    diagnostics: [],
    evaluations: args.evaluations,
    topCandidates: args.topCandidates ?? [],
  };
}

test("one compatible scored candidate keeps the run alive even when another candidate fails", () => {
  const failed = candidate({
    id: "candidate-fail",
    outcome: "compatibilityFailed",
    compatibilityStatus: "FAIL",
    compatibilityCode: "CPU_MOTHERBOARD_SOCKET_MISMATCH",
  });
  const scored = candidate({
    id: "candidate-pass",
    outcome: "scored",
    targetChecks: [targetCheck("PASS", "MEMORY_MEETS_HARDWARE_TARGET")],
    score: 90,
  });

  const updated = applyBuildEngineResult({
    run: runReadyForBuildEngine(),
    result: result({
      status: "ready",
      evaluations: [failed, scored],
      topCandidates: [scored],
    }),
    at: "2026-08-25T04:30:01.000Z",
  });

  assert.equal(
    updated.stages.find((item) => item.stage === "candidateGeneration")?.status,
    "passed",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "compatibility")?.status,
    "passed",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "passed",
  );
  assert.deepEqual(
    updated.stages.find((item) => item.stage === "compatibility")?.outputRefIds,
    ["candidate-pass"],
  );
  assert.equal(updated.selectedBuilds.length, 1);
  assert.equal(updated.selectedBuilds[0]?.buildId, "candidate-pass");
  assert.equal(updated.selectedBuilds[0]?.verificationStatus, "reviewRequired");
  assert.equal(
    updated.stages.find((item) => item.stage === "verification")?.status,
    "pending",
  );
  assert.equal(updated.status, "running");
});

test("all incompatible candidates fail at compatibility and never open scoring", () => {
  const failed = candidate({
    id: "candidate-fail",
    outcome: "compatibilityFailed",
    compatibilityStatus: "FAIL",
    compatibilityCode: "MEMORY_MOTHERBOARD_GENERATION_MISMATCH",
  });

  const updated = applyBuildEngineResult({
    run: runReadyForBuildEngine(),
    result: result({ status: "blocked", evaluations: [failed] }),
    at: "2026-08-25T04:30:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "compatibility");
  assert.equal(
    updated.firstFailure?.code,
    "MEMORY_MOTHERBOARD_GENERATION_MISMATCH",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "pending",
  );
});

test("compatibility review blocks scoring without fabricating a hard failure", () => {
  const review = candidate({
    id: "candidate-review",
    outcome: "compatibilityReviewRequired",
    compatibilityStatus: "REVIEW_REQUIRED",
    compatibilityCode: "GPU_CASE_CLEARANCE_EVIDENCE_MISSING",
  });

  const updated = applyBuildEngineResult({
    run: runReadyForBuildEngine(),
    result: result({ status: "reviewRequired", evaluations: [review] }),
    at: "2026-08-25T04:30:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  assert.equal(
    updated.stages.find((item) => item.stage === "compatibility")?.status,
    "reviewRequired",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "pending",
  );
});

test("compatible but over-budget candidates fail at scoring", () => {
  const overBudget = candidate({
    id: "candidate-expensive",
    outcome: "overBudget",
    totalPrice: 55_000,
  });

  const updated = applyBuildEngineResult({
    run: runReadyForBuildEngine(),
    result: result({ status: "blocked", evaluations: [overBudget] }),
    at: "2026-08-25T04:30:01.000Z",
  });

  assert.equal(
    updated.stages.find((item) => item.stage === "compatibility")?.status,
    "passed",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "failed",
  );
  assert.equal(updated.firstFailure?.stage, "scoring");
  assert.equal(
    updated.firstFailure?.code,
    "NO_UNDER_BUDGET_COMPATIBLE_CANDIDATE",
  );
});

test("target review keeps scoring in reviewRequired", () => {
  const targetReviewCandidate = candidate({
    id: "candidate-target-review",
    outcome: "targetReviewRequired",
    targetChecks: [
      targetCheck("REVIEW_REQUIRED", "MEMORY_PRODUCT_TARGET_EVIDENCE_MISSING"),
    ],
  });

  const updated = applyBuildEngineResult({
    run: runReadyForBuildEngine(),
    result: result({
      status: "reviewRequired",
      evaluations: [targetReviewCandidate],
    }),
    at: "2026-08-25T04:30:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "reviewRequired",
  );
  assert.deepEqual(
    updated.stages.find((item) => item.stage === "scoring")?.diagnostics,
    ["MEMORY_PRODUCT_TARGET_EVIDENCE_MISSING"],
  );
});
