import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogCategory } from "@bilgisayar-topla/catalog";
import type { ProductFeature, ProductFeatureProfile } from "@bilgisayar-topla/shared-contracts";

import {
  evaluateCompatibility,
  type CompatibilityComponent,
} from "./index.js";

function feature(
  key: string,
  label: string,
  value: string | number | boolean,
  unit?: string,
): ProductFeature {
  return {
    key,
    label,
    value,
    unit,
    sourceRefIds: [`evidence-${key}`],
    clauseEligible: false,
  };
}

function profile(
  id: string,
  features: ProductFeature[],
): ProductFeatureProfile {
  return {
    profileId: id,
    schemaVersion: "1.0.0",
    productCategory: "other",
    sourceMode: "productExtractor",
    createdAt: "2026-08-24T22:00:00.000Z",
    identity: { title: id },
    features,
    evidence: [
      {
        evidenceId: `page-${id}`,
        sourceType: "productPage",
        url: `https://www.incehesap.com/${id}/`,
        qualityState: "ready",
      },
    ],
    gaps: [],
    readiness: "readyForSpecification",
  };
}

function component(
  category: CatalogCategory,
  features: ProductFeature[],
): CompatibilityComponent {
  return {
    catalogProductId: `catalog-${category}`,
    componentCategory: category,
    status: "ready",
    profile: profile(`profile-${category}`, features),
  };
}

function compatibleCandidate(): CompatibilityComponent[] {
  return [
    component("cpu", [feature("cpu.socket", "Socket", "AM5")]),
    component("motherboard", [
      feature("board.socket", "CPU Socket", "AM5"),
      feature("board.memory", "Memory Type", "DDR5"),
      feature("board.form-factor", "Form Factor", "ATX"),
      feature("board.storage", "Storage Support", "2x M.2 PCIe NVMe, 4x SATA"),
    ]),
    component("memory", [feature("memory.type", "RAM Type", "DDR5")]),
    component("gpu", [
      feature("gpu.length", "GPU Length", 300, "mm"),
      feature("gpu.psu", "Recommended PSU", 650, "W"),
    ]),
    component("storage", [feature("storage.interface", "Interface", "NVMe M.2 PCIe")]),
    component("psu", [feature("psu.power", "Total Power", 750, "W")]),
    component("case", [
      feature("case.board", "Motherboard Support", "ATX, Micro-ATX, Mini-ITX"),
      feature("case.gpu", "Max GPU Length", 340, "mm"),
    ]),
  ];
}

function replaceFeature(
  components: CompatibilityComponent[],
  category: CatalogCategory,
  featureKey: string,
  value: string | number | boolean,
  unit?: string,
): void {
  const target = components.find((item) => item.componentCategory === category);
  assert.ok(target);
  const targetFeature = target.profile.features.find((item) => item.key === featureKey);
  assert.ok(targetFeature);
  targetFeature.value = value;
  if (unit !== undefined) targetFeature.unit = unit;
}

test("fully evidenced compatible candidate passes every deterministic rule", () => {
  const result = evaluateCompatibility(compatibleCandidate());

  assert.equal(result.status, "PASS");
  assert.equal(result.firstBlockingCheck, undefined);
  assert.equal(result.checks.length, 8);
  assert.equal(result.checks.every((item) => item.status === "PASS"), true);
});

test("incompatible CPU socket fails with a stable diagnostic", () => {
  const candidate = compatibleCandidate();
  replaceFeature(candidate, "motherboard", "board.socket", "LGA1700");

  const result = evaluateCompatibility(candidate);

  assert.equal(result.status, "FAIL");
  const socketCheck = result.checks.find(
    (item) => item.ruleId === "cpu-motherboard-socket",
  );
  assert.equal(socketCheck?.status, "FAIL");
  assert.equal(socketCheck?.code, "CPU_MOTHERBOARD_SOCKET_MISMATCH");
});

test("DDR4 memory on a DDR5-only motherboard fails deterministically", () => {
  const candidate = compatibleCandidate();
  replaceFeature(candidate, "memory", "memory.type", "DDR4");

  const result = evaluateCompatibility(candidate);

  assert.equal(result.status, "FAIL");
  assert.equal(
    result.checks.find((item) => item.ruleId === "memory-motherboard-generation")?.code,
    "MEMORY_MOTHERBOARD_GENERATION_MISMATCH",
  );
});

test("PSU below the GPU's evidenced recommendation fails", () => {
  const candidate = compatibleCandidate();
  replaceFeature(candidate, "psu", "psu.power", 550, "W");

  const result = evaluateCompatibility(candidate);

  assert.equal(result.status, "FAIL");
  assert.equal(
    result.checks.find((item) => item.ruleId === "gpu-psu-capacity")?.code,
    "PSU_CAPACITY_BELOW_GPU_RECOMMENDATION",
  );
});

test("missing GPU clearance evidence returns REVIEW_REQUIRED instead of guessing", () => {
  const candidate = compatibleCandidate();
  const gpu = candidate.find((item) => item.componentCategory === "gpu");
  assert.ok(gpu);
  gpu.profile.features = gpu.profile.features.filter((item) => item.key !== "gpu.length");

  const result = evaluateCompatibility(candidate);

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(
    result.firstBlockingCheck?.code,
    "GPU_CASE_CLEARANCE_EVIDENCE_MISSING",
  );
});

test("candidate missing a required component fails before pairwise rules", () => {
  const candidate = compatibleCandidate().filter(
    (item) => item.componentCategory !== "case",
  );

  const result = evaluateCompatibility(candidate);

  assert.equal(result.status, "FAIL");
  assert.equal(result.checks.length, 1);
  assert.equal(result.firstBlockingCheck?.code, "REQUIRED_COMPONENT_MISSING");
});

test("blocked component profile fails before compatibility scoring can occur", () => {
  const candidate = compatibleCandidate();
  const gpu = candidate.find((item) => item.componentCategory === "gpu");
  assert.ok(gpu);
  gpu.status = "blocked";

  const result = evaluateCompatibility(candidate);

  assert.equal(result.status, "FAIL");
  assert.equal(result.firstBlockingCheck?.code, "COMPONENT_PROFILE_BLOCKED");
});
