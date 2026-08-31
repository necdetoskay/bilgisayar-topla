import assert from "node:assert/strict";
import test from "node:test";

import type { CompatibilityResult } from "@bilgisayar-topla/compatibility";

import { applyCompatibilityGate } from "./compatibility-gate.js";
import { createPcBuildRun } from "./index.js";

function runReadyForCompatibility() {
  const run = createPcBuildRun({
    runId: "run-compatibility-gate",
    createdAt: "2026-08-24T22:10:00.000Z",
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
    "candidateGeneration",
  ] as const) {
    const stage = run.stages.find((item) => item.stage === name);
    assert.ok(stage);
    stage.status = "passed";
  }
  return run;
}

function result(
  status: CompatibilityResult["status"],
  code: string,
): CompatibilityResult {
  return {
    policyVersion: "1.0.0",
    status,
    checks: [
      {
        ruleId: "cpu-motherboard-socket",
        status,
        code,
        message: `fixture ${code}`,
        evidenceRefs: [
          {
            catalogProductId: "cpu-1",
            profileId: "profile-cpu-1",
            featureKey: "cpu.socket",
            sourceRefIds: ["cpu-page"],
          },
        ],
      },
    ],
    firstBlockingCheck:
      status === "PASS"
        ? undefined
        : {
            ruleId: "cpu-motherboard-socket",
            status,
            code,
            message: `fixture ${code}`,
            evidenceRefs: [],
          },
  };
}

test("PASS opens scoring as the next pending stage", () => {
  const input = runReadyForCompatibility();
  const updated = applyCompatibilityGate({
    run: input,
    candidateId: "candidate-1",
    result: result("PASS", "CPU_MOTHERBOARD_SOCKET_MATCH"),
    at: "2026-08-24T22:10:01.000Z",
  });

  assert.equal(
    updated.stages.find((item) => item.stage === "compatibility")?.status,
    "passed",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "pending",
  );
  assert.equal(updated.status, "running");
});

test("FAIL blocks scoring and preserves first compatibility failure", () => {
  const input = runReadyForCompatibility();
  const scoring = input.stages.find((item) => item.stage === "scoring");
  assert.ok(scoring);
  scoring.status = "running";

  const updated = applyCompatibilityGate({
    run: input,
    candidateId: "candidate-1",
    result: result("FAIL", "CPU_MOTHERBOARD_SOCKET_MISMATCH"),
    at: "2026-08-24T22:10:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "compatibility");
  assert.equal(updated.firstFailure?.code, "CPU_MOTHERBOARD_SOCKET_MISMATCH");
  assert.equal(
    updated.stages.find((item) => item.stage === "compatibility")?.status,
    "failed",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "pending",
  );
});

test("REVIEW_REQUIRED blocks scoring without inventing a hard failure", () => {
  const updated = applyCompatibilityGate({
    run: runReadyForCompatibility(),
    candidateId: "candidate-1",
    result: result("REVIEW_REQUIRED", "GPU_CASE_CLEARANCE_EVIDENCE_MISSING"),
    at: "2026-08-24T22:10:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  assert.deepEqual(
    updated.stages.find((item) => item.stage === "compatibility")?.diagnostics,
    ["GPU_CASE_CLEARANCE_EVIDENCE_MISSING"],
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "scoring")?.status,
    "pending",
  );
});

test("compatibility gate cannot run before candidate generation passes", () => {
  const run = createPcBuildRun({
    runId: "run-too-early",
    createdAt: "2026-08-24T22:10:00.000Z",
    request: {
      rawIntent: "Ofis bilgisayari",
      budgetAmount: 30_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });

  assert.throws(
    () =>
      applyCompatibilityGate({
        run,
        candidateId: "candidate-1",
        result: result("PASS", "CPU_MOTHERBOARD_SOCKET_MATCH"),
        at: "2026-08-24T22:10:01.000Z",
      }),
    /requires candidateGeneration stage to be passed/,
  );
});
