import assert from "node:assert/strict";
import test from "node:test";

import {
  PC_BUILD_STAGE_ORDER,
  createPcBuildRun,
  firstBlockingStage,
  provisionHarness,
  validatePcBuildRun,
  type PcBuildRun,
} from "./index.js";

test("product extraction receives a narrow task-aware harness", () => {
  const provision = provisionHarness("productExtraction");

  assert.deepEqual(provision.capabilities, ["browserRead", "productExtraction"]);
  assert.deepEqual(provision.tools, ["playwright", "productExtractor"]);
  assert.equal(provision.modelTier, "light");
  assert.equal(provision.capabilities.includes("compatibility"), false);
  assert.equal(provision.tools.includes("buildOptimizer"), false);
});

test("provisionHarness returns isolated mutable arrays", () => {
  const first = provisionHarness("productExtraction");
  first.capabilities.push("verification");

  const second = provisionHarness("productExtraction");
  assert.equal(second.capabilities.includes("verification"), false);
});

test("createPcBuildRun creates canonical stage order and PC-build provision", () => {
  const run = createPcBuildRun({
    runId: "run-001",
    createdAt: "2026-08-24T18:00:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 ve Office icin 50000 TL civari sadece kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
      locale: "tr-TR",
    },
  });

  assert.equal(run.status, "running");
  assert.equal(run.provision.taskClass, "pcBuild");
  assert.deepEqual(
    run.stages.map((stage) => stage.stage),
    PC_BUILD_STAGE_ORDER,
  );
  assert.equal(run.stages.every((stage) => stage.status === "pending"), true);
  assert.deepEqual(validatePcBuildRun(run), { valid: true, issues: [] });
});

test("completed run is rejected until every stage and selected build are verified", () => {
  const run = createPcBuildRun({
    runId: "run-002",
    createdAt: "2026-08-24T18:00:00.000Z",
    request: {
      rawIntent: "Oyun bilgisayari",
      scope: "caseOnly",
    },
  });

  const invalidCompleted: PcBuildRun = {
    ...run,
    status: "completed",
  };

  const result = validatePcBuildRun(invalidCompleted);
  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "completed_with_incomplete_stage"),
    true,
  );
  assert.equal(
    result.issues.some((issue) => issue.code === "completed_without_build"),
    true,
  );
});

test("failed run preserves earliest blocking stage attribution", () => {
  const run = createPcBuildRun({
    runId: "run-003",
    createdAt: "2026-08-24T18:00:00.000Z",
    request: {
      rawIntent: "Video kurgu bilgisayari",
      scope: "caseOnly",
    },
  });

  const compatibilityIndex = run.stages.findIndex(
    (stage) => stage.stage === "compatibility",
  );
  assert.notEqual(compatibilityIndex, -1);

  const compatibility = run.stages[compatibilityIndex];
  assert.ok(compatibility);
  compatibility.status = "failed";
  compatibility.diagnostics.push("GPU_CASE_CLEARANCE_MISSING");
  run.status = "failed";
  run.firstFailure = {
    stage: "compatibility",
    code: "GPU_CASE_CLEARANCE_MISSING",
    message: "GPU clearance evidence is missing",
  };

  assert.equal(firstBlockingStage(run)?.stage, "compatibility");
  assert.deepEqual(validatePcBuildRun(run), { valid: true, issues: [] });
});

test("invalid budget is rejected at run creation", () => {
  assert.throws(
    () =>
      createPcBuildRun({
        runId: "run-004",
        createdAt: "2026-08-24T18:00:00.000Z",
        request: {
          rawIntent: "Ofis bilgisayari",
          budgetAmount: 0,
          currency: "TRY",
          scope: "caseOnly",
        },
      }),
    /budgetAmount must be a positive finite number/,
  );
});
