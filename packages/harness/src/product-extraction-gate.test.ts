import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogCategory } from "@bilgisayar-topla/catalog";

import {
  applyProductExtractionGate,
  type ProductExtractionGateRecord,
} from "./product-extraction-gate.js";
import { createPcBuildRun } from "./index.js";

const categories: CatalogCategory[] = [
  "cpu",
  "motherboard",
  "memory",
  "gpu",
  "storage",
  "psu",
  "case",
];

function runWithCatalogPassed() {
  const run = createPcBuildRun({
    runId: "run-extraction-gate",
    createdAt: "2026-08-25T06:00:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 icin kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });
  for (const name of ["intent", "requirementEvidence", "hardwareTarget", "catalog"] as const) {
    const stage = run.stages.find((item) => item.stage === name);
    assert.ok(stage);
    stage.status = "passed";
  }
  return run;
}

function record(
  category: CatalogCategory,
  options?: {
    suffix?: string;
    status?: ProductExtractionGateRecord["status"];
    snapshot?: string;
    validation?: boolean;
    readiness?: string;
  },
): ProductExtractionGateRecord {
  const suffix = options?.suffix ?? "a";
  const id = `${category}-${suffix}`;
  const productUrl = `https://www.incehesap.com/${id}/`;
  return {
    recordId: `record-${id}`,
    catalogProductId: id,
    componentCategory: category,
    productPageUrl,
    status: options?.status ?? "ready",
    diagnostics: [],
    profile: {
      profileId: `profile-${id}`,
      readiness: options?.readiness ?? "readyForSpecification",
      evidence: [
        {
          evidenceId: `page-${id}`,
          sourceType: "productPage",
          url: productUrl,
          snapshotSha256: options?.snapshot === undefined ? `sha-${id}` : options.snapshot,
          qualityState: "ready",
        },
      ],
    },
    validation: { valid: options?.validation ?? true },
  };
}

function readySet(): ProductExtractionGateRecord[] {
  return categories.map((category) => record(category));
}

test("one evidence-ready product per required category opens candidate generation", () => {
  const updated = applyProductExtractionGate({
    run: runWithCatalogPassed(),
    records: readySet(),
    at: "2026-08-25T06:00:01.000Z",
  });

  assert.equal(updated.status, "running");
  assert.equal(
    updated.stages.find((item) => item.stage === "productExtraction")?.status,
    "passed",
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "productExtraction")?.outputRefIds.length,
    7,
  );
  assert.equal(
    updated.stages.find((item) => item.stage === "candidateGeneration")?.status,
    "pending",
  );
});

test("adapter-ready record with missing snapshot becomes reviewRequired, not a hard availability failure", () => {
  const records = readySet();
  const gpu = records.find((item) => item.componentCategory === "gpu");
  assert.ok(gpu);
  gpu.profile!.evidence[0]!.snapshotSha256 = "";

  const updated = applyProductExtractionGate({
    run: runWithCatalogPassed(),
    records,
    at: "2026-08-25T06:00:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(updated.firstFailure, undefined);
  const stage = updated.stages.find((item) => item.stage === "productExtraction");
  assert.equal(stage?.status, "reviewRequired");
  assert.equal(
    stage?.diagnostics.includes(
      "PRODUCT_EXTRACTION_READY_RECORD_EVIDENCE_INVALID:gpu-a",
    ),
    true,
  );
});

test("explicit reviewRequired record keeps the stage in review", () => {
  const records = readySet();
  const memory = records.find((item) => item.componentCategory === "memory");
  assert.ok(memory);
  memory.status = "reviewRequired";
  memory.diagnostics = [
    { code: "PRODUCT_EVIDENCE_INSUFFICIENT", message: "fixture" },
  ];

  const updated = applyProductExtractionGate({
    run: runWithCatalogPassed(),
    records,
    at: "2026-08-25T06:00:01.000Z",
  });

  assert.equal(updated.status, "reviewRequired");
  assert.equal(
    updated.stages.find((item) => item.stage === "productExtraction")?.diagnostics.includes(
      "PRODUCT_EVIDENCE_INSUFFICIENT:memory-a",
    ),
    true,
  );
});

test("blocked-only required category fails extraction readiness", () => {
  const records = readySet();
  const psu = records.find((item) => item.componentCategory === "psu");
  assert.ok(psu);
  psu.status = "blocked";
  psu.diagnostics = [{ code: "PRODUCT_UNAVAILABLE", message: "fixture" }];

  const updated = applyProductExtractionGate({
    run: runWithCatalogPassed(),
    records,
    at: "2026-08-25T06:00:01.000Z",
  });

  assert.equal(updated.status, "failed");
  assert.equal(updated.firstFailure?.stage, "productExtraction");
  assert.equal(
    updated.firstFailure?.code,
    "PRODUCT_EXTRACTION_REQUIRED_CATEGORY_UNAVAILABLE",
  );
});

test("review alternative does not block a ready product in the same category", () => {
  const records = [
    ...readySet(),
    record("gpu", { suffix: "review", status: "reviewRequired" }),
  ];

  const updated = applyProductExtractionGate({
    run: runWithCatalogPassed(),
    records,
    at: "2026-08-25T06:00:01.000Z",
  });

  assert.equal(updated.status, "running");
  assert.equal(
    updated.stages.find((item) => item.stage === "productExtraction")?.status,
    "passed",
  );
});
