import assert from "node:assert/strict";
import test from "node:test";

import type {
  OfficialSourceRecord,
  SoftwareRequirementProfile,
} from "./index.js";
import { buildHardwareTargets } from "./hardware-target-builder.js";

const sources: OfficialSourceRecord[] = [
  {
    sourceId: "autodesk-autocad-2022-system-requirements",
    vendor: "Autodesk",
    url: "https://www.autodesk.com/fixture",
    checkedAt: "2026-08-24T19:30:00.000Z",
    snapshotSha256: "autocad-sha",
    trustState: "official",
  },
  {
    sourceId: "microsoft-365-business-education-government-system-requirements",
    vendor: "Microsoft",
    url: "https://support.microsoft.com/fixture",
    checkedAt: "2026-08-24T19:30:00.000Z",
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

test("AutoCAD plus Microsoft 365 produces deterministic baseline targets", () => {
  const result = buildHardwareTargets({ sources, profiles });

  assert.equal(result.readiness, "ready");
  assert.deepEqual(result.issues, []);

  const cpu = result.targets.find((target) => target.component === "cpu");
  const memory = result.targets.find((target) => target.component === "memory");
  const gpu = result.targets.find((target) => target.component === "gpu");
  const storage = result.targets.find((target) => target.component === "storage");

  assert.equal(cpu?.target, "3+ GHz, at least 2 cores");
  assert.equal(memory?.target, "16 GB RAM or more");
  assert.equal(gpu?.target, "4 GB VRAM or more, DirectX 12 compliant");
  assert.equal(storage?.target, "14 GB application space minimum");
  assert.equal(
    cpu?.evidence.some(
      (ref) =>
        ref.requirementId === "req-autocad-2022" &&
        ref.field === "recommended.cpu",
    ),
    true,
  );
  assert.equal(
    cpu?.evidence.some(
      (ref) =>
        ref.requirementId === "req-m365-business" &&
        ref.field === "minimum.cpu",
    ),
    true,
  );
  assert.equal(storage?.evidence.length, 2);
});

test("recommended field wins over minimum within the same software profile", () => {
  const result = buildHardwareTargets({
    sources: [sources[0]!],
    profiles: [profiles[0]!],
  });

  assert.equal(
    result.targets.find((target) => target.component === "memory")?.target,
    "16 GB RAM or more",
  );
  assert.equal(
    result.targets.find((target) => target.component === "gpu")?.target,
    "4 GB VRAM or more, DirectX 12 compliant",
  );
});

test("non-official source blocks target derivation", () => {
  const result = buildHardwareTargets({
    sources: [{ ...sources[0]!, trustState: "trusted" }],
    profiles: [profiles[0]!],
  });

  assert.equal(result.readiness, "blocked");
  assert.equal(result.targets.length, 0);
  assert.equal(
    result.issues.some(
      (issue) => issue.code === "REQUIREMENT_PROFILE_SOURCE_NOT_OFFICIAL",
    ),
    true,
  );
});

test("non-ready requirement profile blocks target derivation", () => {
  const result = buildHardwareTargets({
    sources: [sources[0]!],
    profiles: [{ ...profiles[0]!, qualityState: "reviewRequired" }],
  });

  assert.equal(result.readiness, "blocked");
  assert.equal(result.targets.length, 0);
  assert.equal(
    result.issues.some((issue) => issue.code === "REQUIREMENT_PROFILE_NOT_READY"),
    true,
  );
});

test("unparseable official requirement is held for review rather than guessed", () => {
  const result = buildHardwareTargets({
    sources: [sources[0]!],
    profiles: [
      {
        ...profiles[0]!,
        recommended: {
          ...profiles[0]!.recommended,
          cpu: "modern high performance processor",
        },
      },
    ],
  });

  assert.equal(result.readiness, "reviewRequired");
  assert.equal(
    result.issues.some((issue) => issue.code === "CPU_REQUIREMENT_UNPARSEABLE"),
    true,
  );
});

test("empty profile set cannot create targets", () => {
  const result = buildHardwareTargets({ sources, profiles: [] });

  assert.equal(result.readiness, "reviewRequired");
  assert.equal(result.targets.length, 0);
  assert.equal(result.issues[0]?.code, "NO_READY_REQUIREMENT_PROFILES");
});
