import assert from "node:assert/strict";
import test from "node:test";

import type { BuildVerificationResult } from "@bilgisayar-topla/verification";

import {
  applyVerificationResults,
  createPcBuildProofChainReport,
} from "./verification-gate.js";
import { createPcBuildRun } from "./index.js";

function runReadyForVerification() {
  const run = createPcBuildRun({
    runId: "run-verification",
    createdAt: "2026-08-25T05:30:00.000Z",
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
    "compatibility",
    "scoring",
  ] as const) {
    const stage = run.stages.find((item) => item.stage === name);
    assert.ok(stage);
    stage.status = "passed";
  }

  run.selectedBuilds = [
    {
      buildId: "build-a",
      catalogProductIds: ["cpu-a", "board-a"],
      productProfileIds: ["profile-cpu-a", "profile-board-a"],
      totalPrice: 42_000,
      currency: "TRY",
      score: 91,
      verificationStatus: "reviewRequired",
    },
    {
      buildId: "build-b",
      catalogProductIds: ["cpu-b", "board-b"],
      productProfileIds: ["profile-cpu-b", "profile-board-b"],
      totalPrice: 43_000,
      currency: "TRY",
      score: 90,
      verificationStatus: "reviewRequired",
    },
  ];

  return run;
}

function verification(
  buildId: string,
  status: BuildVerificationResult["status"],
  code?: string,
): BuildVerificationResult {
  return {
    verificationId: `verification-${buildId}`,
    schemaVersion: "1.0.0",
    buildId,
    status,
    diagnostics: code
      ? [
          {
            code,
            message: `fixture ${code}`,
            severity: status === "FAIL" ? "error" : "warning",
          },
        ]
      : [],
    catalogLineage: [
      {
        catalogProductId: `cpu-${buildId}`,
        profileId: `profile-${buildId}`,
        category: "cpu",
        catalogPrice: 9_000,
        currency: "TRY",
        productPageUrl: `https://www.incehesap.com/${buildId}/`,
        productPageSnapshotSha256: `product-sha-${buildId}`,
      },
    ],
    requirementLineage: [
      {
        targetId: "target-cpu",
        sourceId: "source-autocad",
        requirementId: "req-autocad",
        field: "recommended.cpu",
        sourceUrl: "https://www.autodesk.com/support/system-requirements/autocad-2022",
        sourceSnapshotSha256: "official-sha",
        observedValue: "3.0 GHz 4 core",
      },
    ],
  };
}

test("one verified build survives while a failed alternative is removed", () => {
  const updated = applyVerificationResults({
    run: runReadyForVerification(),
    results: [
      verification("build-a", "PASS"),
      verification("build-b", "FAIL", "VERIFICATION_BUILD_PRICE_MISMATCH"),
    ],
    at: "2026-08-25T05:30:01.000Z",
  });

  assert.equal(updated.status, "running");
  assert.equal(
    updated.stages.find((item) => item.stage === "verification")?.status,
    "passed",
  );
  assert.deepEqual(
    updated.stages.find((item) => item.stage === "verification")?.outputRefIds,
    ["build-a"],
  );
  assert.equal(updated.selectedBuilds.length, 1);
  assert.equal(updated.selectedBuilds[0]?.buildId, "build-a");
  assert.equal(updated.selectedBuilds[0]?.verificationStatus, "passed");
  assert.equal(
    updated.stages.find((item) => item.stage === "explanation")?.status,
    "pending",
  );
});

test("all failed selected builds fail at the verification stage", () => {
  const updated = applyVerificationResults({
    run: runReadyForVerification(),
    results: [
      verification("build-a", "FAIL", "VERIFICATION_RECOMPUTE_HARD_GATE_FAILED"),
      verification("build-b", "FAIL", "VERIFICATION_BUILD_PRICE_MISMATCH"),
    ],
    at: "2026-08-25T05:30:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "verification");
  assert.equal(
    updated.firstFailure?.code,
    "VERIFICATION_RECOMPUTE_HARD_GATE_FAILED",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "explanation")?.status,
    "pending",
  );
});

test("review-only verification stops without inventing a hard failure", () => {
  const updated = applyVerificationResults({
    run: runReadyForVerification(),
    results: [
      verification(
        "build-a",
        "REVIEW_REQUIRED",
        "VERIFICATION_PRODUCT_PAGE_SNAPSHOT_MISSING",
      ),
      verification(
        "build-b",
        "REVIEW_REQUIRED",
        "VERIFICATION_TARGET_SOURCE_SNAPSHOT_MISSING",
      ),
    ],
    at: "2026-08-25T05:30:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  assert.equal(
    updated.stages.find((item) => item.stage === "verification")?.status,
    "reviewRequired",
  );
});

test("missing verification result requires review when no build is verified", () => {
  const updated = applyVerificationResults({
    run: runReadyForVerification(),
    results: [
      verification("build-a", "FAIL", "VERIFICATION_BUILD_PRICE_MISMATCH"),
    ],
    at: "2026-08-25T05:30:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  assert.equal(
    updated.stages.find((item) => item.stage === "verification")?.diagnostics.some(
      (code) => code === "VERIFICATION_RESULT_MISSING:build-b",
    ),
    true,
  );
});

test("proof-chain report preserves stages, verification evidence and AI usage totals", () => {
  const run = runReadyForVerification();
  run.aiUsage = [
    {
      capability: "productExtraction",
      provider: "openrouter",
      model: "deepseek/deepseek-v4-flash",
      inputTokens: 1_000,
      outputTokens: 300,
      estimatedCostUsd: 0.00008,
      latencyMs: 900,
      outcome: "success",
    },
    {
      capability: "productExtraction",
      provider: "openrouter",
      model: "deepseek/deepseek-v4-flash",
      inputTokens: 500,
      outputTokens: 200,
      reasoningTokens: 50,
      estimatedCostUsd: 0.000045,
      latencyMs: 600,
      outcome: "success",
    },
  ];

  const verifiedRun = applyVerificationResults({
    run,
    results: [verification("build-a", "PASS")],
    at: "2026-08-25T05:30:01.000Z",
  });
  const report = createPcBuildProofChainReport({
    run: verifiedRun,
    verifications: [verification("build-a", "PASS")],
    generatedAt: "2026-08-25T05:30:02.000Z",
  });

  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.selectedBuilds[0]?.verificationStatus, "passed");
  assert.equal(report.verifications[0]?.status, "PASS");
  assert.equal(report.aiUsageTotals.inputTokens, 1_500);
  assert.equal(report.aiUsageTotals.outputTokens, 500);
  assert.equal(report.aiUsageTotals.reasoningTokens, 50);
  assert.equal(report.aiUsageTotals.estimatedCostUsd, 0.000125);
  assert.equal(report.aiUsageTotals.latencyMs, 1_500);
});
