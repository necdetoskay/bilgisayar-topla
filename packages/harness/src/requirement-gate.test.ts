import assert from "node:assert/strict";
import test from "node:test";

import {
  createBuildIntent,
  type BuildIntent,
} from "@bilgisayar-topla/requirements";

import { createPcBuildRun } from "./index.js";
import { applyBuildIntentGate, stageByName } from "./requirement-gate.js";

test("AutoCAD Office bootstrap stops before catalog when official evidence is unresolved", () => {
  const run = createPcBuildRun({
    runId: "run-autocad-bootstrap",
    createdAt: "2026-08-24T18:00:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 ve Office icin 50000 TL civarinda sadece kasa istiyorum.",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
      locale: "tr-TR",
    },
  });

  const intent = createBuildIntent({
    intentId: "intent-autocad-bootstrap",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: run.request.rawIntent,
    budgetAmount: 50_000,
    currency: "TRY",
    scope: "caseOnly",
    locale: "tr-TR",
  });

  const gated = applyBuildIntentGate(
    run,
    intent,
    "2026-08-24T18:01:00.000Z",
  );

  assert.equal(gated.status, "reviewRequired");
  assert.equal(stageByName(gated, "intent").status, "passed");
  assert.equal(
    stageByName(gated, "requirementEvidence").status,
    "reviewRequired",
  );
  assert.deepEqual(stageByName(gated, "requirementEvidence").diagnostics, [
    "OFFICIAL_REQUIREMENT_EVIDENCE_UNRESOLVED",
  ]);
  assert.equal(stageByName(gated, "hardwareTarget").status, "pending");
  assert.equal(stageByName(gated, "catalog").status, "pending");
});

test("fully grounded build intent opens catalog as the next pending stage", () => {
  const source = {
    sourceId: "official-autocad",
    vendor: "Autodesk",
    url: "https://example.invalid/autodesk-official-fixture",
    checkedAt: "2026-08-24T18:00:00.000Z",
    snapshotSha256: "fixture-snapshot",
    trustState: "official" as const,
  };
  const requirement = {
    requirementId: "req-autocad",
    software: "AutoCAD",
    version: "2022",
    sourceId: source.sourceId,
    extractionRunId: "extract-autocad",
    minimum: { ram: "fixture minimum" },
    recommended: { ram: "fixture recommended" },
    qualityState: "ready" as const,
  };
  const target = {
    targetId: "target-memory",
    component: "memory" as const,
    target: "fixture target",
    reason: "fixture",
    policy: "fixture-policy",
    evidence: [
      {
        sourceId: source.sourceId,
        requirementId: requirement.requirementId,
        field: "recommended.ram",
      },
    ],
    state: "ready" as const,
  };

  const intent = createBuildIntent({
    intentId: "intent-grounded",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "AutoCAD 2022 icin sadece kasa",
    budgetAmount: 50_000,
    currency: "TRY",
    scope: "caseOnly",
    sources: [source],
    softwareRequirements: [requirement],
    hardwareTargets: [target],
  });
  const run = createPcBuildRun({
    runId: "run-grounded",
    createdAt: "2026-08-24T18:00:00.000Z",
    request: {
      rawIntent: intent.rawIntent,
      budgetAmount: intent.budgetAmount,
      currency: intent.currency,
      scope: intent.scope,
    },
  });

  const gated = applyBuildIntentGate(
    run,
    intent,
    "2026-08-24T18:01:00.000Z",
  );

  assert.equal(gated.status, "running");
  assert.equal(stageByName(gated, "intent").status, "passed");
  assert.equal(stageByName(gated, "requirementEvidence").status, "passed");
  assert.equal(stageByName(gated, "hardwareTarget").status, "passed");
  assert.equal(stageByName(gated, "catalog").status, "pending");
  assert.deepEqual(stageByName(gated, "requirementEvidence").outputRefIds, [
    requirement.requirementId,
  ]);
  assert.equal(
    stageByName(gated, "requirementEvidence").evidenceRefs[0]?.snapshotId,
    "fixture-snapshot",
  );
});

test("invalid mutated intent fails closed at the intent stage", () => {
  const run = createPcBuildRun({
    runId: "run-invalid-intent",
    createdAt: "2026-08-24T18:00:00.000Z",
    request: {
      rawIntent: "Ofis bilgisayari",
      budgetAmount: 30_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });
  const base = createBuildIntent({
    intentId: "intent-invalid",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: run.request.rawIntent,
    budgetAmount: 30_000,
    currency: "TRY",
    scope: "caseOnly",
  });
  const invalid: BuildIntent = {
    ...base,
    readiness: "readyForBuild",
  };

  const gated = applyBuildIntentGate(
    run,
    invalid,
    "2026-08-24T18:01:00.000Z",
  );

  assert.equal(gated.status, "failed");
  assert.equal(stageByName(gated, "intent").status, "failed");
  assert.equal(gated.firstFailure?.stage, "intent");
  assert.equal(gated.firstFailure?.code, "BUILD_INTENT_INVALID");
  assert.equal(stageByName(gated, "catalog").status, "pending");
});
