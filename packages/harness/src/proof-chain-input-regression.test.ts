import assert from "node:assert/strict";
import test from "node:test";

import type { BuildVerificationResult } from "@bilgisayar-topla/verification";

import { applyExplanationGate } from "./explanation-gate.js";
import { createPcBuildRun } from "./index.js";
import { applyVerificationResults } from "./verification-gate.js";

function verificationReadyRun() {
  const run = createPcBuildRun({
    runId: "run-proof-input-guards",
    createdAt: "2026-08-25T07:45:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 icin kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });

  for (const stage of run.stages) {
    if (["verification", "explanation"].includes(stage.stage)) continue;
    stage.status = "passed";
  }
  run.selectedBuilds = [
    {
      buildId: "build-a",
      catalogProductIds: ["cpu-a"],
      productProfileIds: ["profile-cpu-a"],
      totalPrice: 10_000,
      currency: "TRY",
      verificationStatus: "reviewRequired",
    },
  ];
  return run;
}

function verificationResult(
  buildId: string,
  verificationId = `verification-${buildId}`,
): BuildVerificationResult {
  return {
    verificationId,
    schemaVersion: "1.0.0",
    buildId,
    status: "PASS",
    diagnostics: [],
    catalogLineage: [],
    requirementLineage: [],
  };
}

test("duplicate verification results for one selected build fail closed", () => {
  const updated = applyVerificationResults({
    run: verificationReadyRun(),
    results: [
      verificationResult("build-a", "verification-a-1"),
      verificationResult("build-a", "verification-a-2"),
    ],
    at: "2026-08-25T07:45:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "verification");
  assert.equal(
    updated.firstFailure?.code,
    "VERIFICATION_RESULT_BUILD_ID_DUPLICATE",
  );
});

test("verification result for an unselected build fails closed", () => {
  const updated = applyVerificationResults({
    run: verificationReadyRun(),
    results: [verificationResult("build-a"), verificationResult("build-unknown")],
    at: "2026-08-25T07:45:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.code, "VERIFICATION_RESULT_UNKNOWN_BUILD");
});

test("explanation record for an unselected build fails closed", () => {
  const run = verificationReadyRun();
  const verification = run.stages.find((stage) => stage.stage === "verification");
  assert.ok(verification);
  verification.status = "passed";
  verification.evidenceRefs = [
    { evidenceId: "verification:fixture", kind: "validation" },
  ];
  run.selectedBuilds[0]!.verificationStatus = "passed";

  const updated = applyExplanationGate({
    run,
    explanations: [
      {
        buildId: "build-a",
        summary: "Verified build.",
        evidenceRefIds: ["verification:fixture"],
      },
      {
        buildId: "build-unknown",
        summary: "Injected record.",
        evidenceRefIds: ["verification:fixture"],
      },
    ],
    at: "2026-08-25T07:45:02.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "explanation");
  assert.equal(updated.firstFailure?.code, "EXPLANATION_UNKNOWN_BUILD");
});
