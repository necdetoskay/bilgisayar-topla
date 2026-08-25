import assert from "node:assert/strict";
import test from "node:test";

import {
  applyExplanationGate,
  createDeterministicVerifiedBuildExplanations,
} from "./explanation-gate.js";
import { createPcBuildRun, validatePcBuildRun } from "./index.js";

function verifiedRun() {
  const run = createPcBuildRun({
    runId: "run-explanation",
    createdAt: "2026-08-25T06:30:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 icin kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });

  for (const stage of run.stages) {
    if (stage.stage === "explanation") continue;
    stage.status = "passed";
  }
  const verification = run.stages.find((item) => item.stage === "verification");
  assert.ok(verification);
  verification.evidenceRefs = [
    {
      evidenceId: "verification:fixture",
      kind: "validation",
    },
    {
      evidenceId: "product:cpu:sha-cpu",
      kind: "productPage",
      sourceUrl: "https://www.incehesap.com/cpu/",
      snapshotId: "sha-cpu",
    },
  ];

  run.selectedBuilds = [
    {
      buildId: "build-a",
      catalogProductIds: ["cpu", "board", "memory", "gpu", "storage", "psu", "case"],
      productProfileIds: [
        "profile-cpu",
        "profile-board",
        "profile-memory",
        "profile-gpu",
        "profile-storage",
        "profile-psu",
        "profile-case",
      ],
      totalPrice: 42_000,
      currency: "TRY",
      score: 92,
      verificationStatus: "passed",
    },
  ];
  return run;
}

test("deterministic explanation closes the canonical run", () => {
  const run = verifiedRun();
  const explanations = createDeterministicVerifiedBuildExplanations(run);

  assert.equal(explanations.length, 1);
  assert.match(explanations[0]?.summary ?? "", /independently verified/i);
  assert.equal(explanations[0]?.evidenceRefIds.length, 2);

  const completed = applyExplanationGate({
    run,
    explanations,
    at: "2026-08-25T06:30:01.000Z",
  });

  assert.equal(completed.status, "completed");
  assert.equal(
    completed.stages.find((item) => item.stage === "explanation")?.status,
    "passed",
  );
  assert.deepEqual(validatePcBuildRun(completed), { valid: true, issues: [] });
});

test("missing explanation evidence requires review", () => {
  const run = verifiedRun();
  const updated = applyExplanationGate({
    run,
    explanations: [
      {
        buildId: "build-a",
        summary: "Verified build.",
        evidenceRefIds: [],
      },
    ],
    at: "2026-08-25T06:30:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  assert.equal(
    updated.stages.find((item) => item.stage === "explanation")?.status,
    "reviewRequired",
  );
});

test("unknown explanation evidence fails closed", () => {
  const run = verifiedRun();
  const updated = applyExplanationGate({
    run,
    explanations: [
      {
        buildId: "build-a",
        summary: "Verified build.",
        evidenceRefIds: ["unknown-evidence"],
      },
    ],
    at: "2026-08-25T06:30:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "explanation");
  assert.equal(updated.firstFailure?.code, "EXPLANATION_UNKNOWN_EVIDENCE_REF");
});
