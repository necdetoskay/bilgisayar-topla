import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHardwareTargets,
  createBuildIntent,
  type OfficialSourceRecord,
  type SoftwareRequirementProfile,
} from "@bilgisayar-topla/requirements";

import { createPcBuildRun } from "./index.js";
import { applyBuildIntentGate, stageByName } from "./requirement-gate.js";

const sources: OfficialSourceRecord[] = [
  {
    sourceId: "autodesk-autocad-2022-system-requirements",
    vendor: "Autodesk",
    url: "https://www.autodesk.com/fixture",
    checkedAt: "2026-08-24T19:45:00.000Z",
    snapshotSha256: "autocad-sha",
    trustState: "official",
  },
  {
    sourceId: "microsoft-365-business-education-government-system-requirements",
    vendor: "Microsoft",
    url: "https://support.microsoft.com/fixture",
    checkedAt: "2026-08-24T19:45:00.000Z",
    snapshotSha256: "m365-sha",
    trustState: "official",
  },
];

const profiles: SoftwareRequirementProfile[] = [
  {
    requirementId: "req-autocad-2022",
    software: "AutoCAD",
    version: "2022",
    sourceId: sources[0]!.sourceId,
    extractionRunId: "extract-autocad",
    minimum: {
      cpu: "2.5–2.9 GHz processor",
      ram: "8 GB",
      gpu: "1 GB GPU with DirectX 11 compliant",
      storage: "10.0 GB",
    },
    recommended: {
      cpu: "3+ GHz processor",
      ram: "16 GB",
      gpu: "4 GB GPU with DirectX 12 compliant",
    },
    qualityState: "ready",
  },
  {
    requirementId: "req-m365-business",
    software: "Microsoft 365",
    sourceId: sources[1]!.sourceId,
    extractionRunId: "extract-m365",
    minimum: {
      cpu: "1.6 GHz or faster, 2-core",
      ram: "4 GB RAM; 2 GB RAM (32-bit)",
      storage: "4 GB available disk space",
    },
    recommended: {},
    qualityState: "ready",
  },
];

test("evidence-linked targets make the catalog stage reachable", () => {
  const targetResult = buildHardwareTargets({ sources, profiles });
  assert.equal(targetResult.readiness, "ready");

  const intent = createBuildIntent({
    intentId: "intent-autocad-m365-ready",
    createdAt: "2026-08-24T19:45:00.000Z",
    rawIntent:
      "AutoCAD 2022 ve Microsoft 365 business icin 50000 TL civarinda sadece kasa",
    budgetAmount: 50_000,
    currency: "TRY",
    scope: "caseOnly",
    locale: "tr-TR",
    sources,
    softwareRequirements: profiles,
    hardwareTargets: targetResult.targets,
  });

  assert.equal(intent.readiness, "readyForBuild");

  const run = createPcBuildRun({
    runId: "run-autocad-m365-ready",
    createdAt: "2026-08-24T19:45:00.000Z",
    request: {
      rawIntent: intent.rawIntent,
      budgetAmount: intent.budgetAmount,
      currency: intent.currency,
      scope: intent.scope,
      locale: intent.locale,
    },
  });

  const gated = applyBuildIntentGate(
    run,
    intent,
    "2026-08-24T19:46:00.000Z",
  );

  assert.equal(gated.status, "running");
  assert.equal(stageByName(gated, "intent").status, "passed");
  assert.equal(stageByName(gated, "requirementEvidence").status, "passed");
  assert.equal(stageByName(gated, "hardwareTarget").status, "passed");
  assert.equal(stageByName(gated, "catalog").status, "pending");
  assert.equal(
    stageByName(gated, "hardwareTarget").outputRefIds.includes(
      "hardware-target-memory",
    ),
    true,
  );
});
