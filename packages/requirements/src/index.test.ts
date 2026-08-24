import assert from "node:assert/strict";
import test from "node:test";

import {
  createBuildIntent,
  evaluateBuildIntentReadiness,
  validateBuildIntent,
  type BuildIntent,
} from "./index.js";

test("missing official evidence returns reviewRequired instead of inventing requirements", () => {
  const intent = createBuildIntent({
    intentId: "intent-001",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "AutoCAD 2022 ve Office icin 50000 TL civari sadece kasa",
    budgetAmount: 50_000,
    currency: "TRY",
    scope: "caseOnly",
    locale: "tr-TR",
  });

  assert.equal(intent.readiness, "reviewRequired");
  assert.deepEqual(validateBuildIntent(intent), { valid: true, issues: [] });
});

test("official evidence plus grounded hardware targets can become readyForBuild", () => {
  const source = {
    sourceId: "official-autocad-2022",
    vendor: "Autodesk",
    url: "https://example.invalid/autodesk-official-fixture",
    checkedAt: "2026-08-24T18:00:00.000Z",
    trustState: "official" as const,
  };

  const requirement = {
    requirementId: "req-autocad-2022",
    software: "AutoCAD",
    version: "2022",
    sourceId: source.sourceId,
    extractionRunId: "extract-001",
    minimum: { ram: "fixture minimum" },
    recommended: { ram: "fixture recommended" },
    qualityState: "ready" as const,
  };

  const target = {
    targetId: "target-memory",
    component: "memory" as const,
    target: "fixture memory target",
    reason: "Derived from the approved fixture requirement.",
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
    intentId: "intent-002",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "AutoCAD 2022 icin sadece kasa",
    budgetAmount: 50_000,
    currency: "TRY",
    scope: "caseOnly",
    sources: [source],
    softwareRequirements: [requirement],
    hardwareTargets: [target],
  });

  assert.equal(intent.readiness, "readyForBuild");
  assert.deepEqual(validateBuildIntent(intent), { valid: true, issues: [] });
});

test("ready requirement cannot be self-promoted without official source", () => {
  const intent = createBuildIntent({
    intentId: "intent-003",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "CAD bilgisayari",
    budgetAmount: 50_000,
    currency: "TRY",
    scope: "caseOnly",
    sources: [
      {
        sourceId: "community-source",
        vendor: "Unknown",
        url: "https://example.invalid/community",
        checkedAt: "2026-08-24T18:00:00.000Z",
        trustState: "trusted",
      },
    ],
    softwareRequirements: [
      {
        requirementId: "req-003",
        software: "CAD",
        sourceId: "community-source",
        extractionRunId: "extract-003",
        minimum: {},
        recommended: {},
        qualityState: "ready",
      },
    ],
  });

  const result = validateBuildIntent(intent);
  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some(
      (issue) => issue.code === "ready_requirement_without_official_source",
    ),
    true,
  );
  assert.equal(intent.readiness, "reviewRequired");
});

test("hardware target must preserve both source and requirement lineage", () => {
  const intent = createBuildIntent({
    intentId: "intent-004",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "Ofis bilgisayari",
    budgetAmount: 30_000,
    currency: "TRY",
    scope: "caseOnly",
    hardwareTargets: [
      {
        targetId: "target-cpu",
        component: "cpu",
        target: "fixture CPU target",
        reason: "fixture",
        policy: "fixture",
        evidence: [
          {
            sourceId: "missing-source",
            requirementId: "missing-requirement",
            field: "recommended.cpu",
          },
        ],
        state: "ready",
      },
    ],
  });

  const result = validateBuildIntent(intent);
  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "unknown_target_source"),
    true,
  );
  assert.equal(
    result.issues.some((issue) => issue.code === "unknown_target_requirement"),
    true,
  );
});

test("stored readiness cannot disagree with deterministic evaluation", () => {
  const intent = createBuildIntent({
    intentId: "intent-005",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "Ofis bilgisayari",
    scope: "unknown",
  });

  const mutated: BuildIntent = {
    ...intent,
    readiness: "readyForBuild",
  };

  const result = validateBuildIntent(mutated);
  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "readiness_mismatch"),
    true,
  );
});

test("hard error gap always blocks", () => {
  const readiness = evaluateBuildIntentReadiness({
    intentId: "intent-006",
    schemaVersion: "1.0.0",
    createdAt: "2026-08-24T18:00:00.000Z",
    rawIntent: "test",
    budgetAmount: 10_000,
    currency: "TRY",
    scope: "caseOnly",
    sources: [],
    softwareRequirements: [],
    hardwareTargets: [],
    gaps: [
      {
        code: "HARD_BLOCK",
        message: "fixture hard block",
        severity: "error",
      },
    ],
  });

  assert.equal(readiness, "blocked");
});
