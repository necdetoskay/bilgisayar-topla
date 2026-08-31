import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogSnapshotFromScraperReport,
  type ScraperProductOptionLike,
} from "@bilgisayar-topla/catalog";

import { createPcBuildRun } from "./index.js";
import { applyCatalogGate, catalogStageByName } from "./catalog-gate.js";

function product(
  category: ScraperProductOptionLike["category"],
  name: string,
  priceValue: number,
): ScraperProductOptionLike {
  return {
    category,
    name,
    priceValue,
    priceText: `${priceValue} TL`,
    isAvailable: true,
  };
}

function runReadyForCatalog() {
  const run = createPcBuildRun({
    runId: "run-catalog-gate",
    createdAt: "2026-08-24T20:30:00.000Z",
    request: {
      rawIntent: "AutoCAD 2022 ve Microsoft 365 business icin sadece kasa",
      budgetAmount: 50_000,
      currency: "TRY",
      scope: "caseOnly",
    },
  });

  for (const stageName of [
    "intent",
    "requirementEvidence",
    "hardwareTarget",
  ] as const) {
    const stage = run.stages.find((candidate) => candidate.stage === stageName);
    assert.ok(stage);
    stage.status = "passed";
  }
  return run;
}

test("current CPU plus motherboard probe keeps catalog in reviewRequired", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:30:00.000Z",
    finishedAt: "2026-08-24T20:30:10.000Z",
    cpuOptions: [product("cpu", "CPU A", 10_000)],
    motherboardOptions: [product("motherboard", "Board A", 6_000)],
  });

  const gated = applyCatalogGate(
    runReadyForCatalog(),
    snapshot,
    "2026-08-24T20:31:00.000Z",
  );

  assert.equal(gated.status, "reviewRequired");
  assert.equal(catalogStageByName(gated, "catalog").status, "reviewRequired");
  assert.equal(catalogStageByName(gated, "productExtraction").status, "pending");
  assert.equal(
    catalogStageByName(gated, "catalog").diagnostics.includes(
      "CATALOG_REQUIRED_CATEGORY_MISSING",
    ),
    true,
  );
});

test("complete priced catalog passes and opens product extraction as next stage", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:40:00.000Z",
    finishedAt: "2026-08-24T20:40:10.000Z",
    cpuOptions: [product("cpu", "CPU A", 10_000)],
    motherboardOptions: [product("motherboard", "Board A", 6_000)],
    ramOptions: [product("ram", "RAM A", 3_000)],
    gpuOptions: [product("gpu", "GPU A", 15_000)],
    ssdOptions: [product("ssd", "SSD A", 2_500)],
    psuOptions: [product("psu", "PSU A", 2_000)],
    caseOptions: [product("case", "Case A", 1_500)],
  });

  const gated = applyCatalogGate(
    runReadyForCatalog(),
    snapshot,
    "2026-08-24T20:41:00.000Z",
  );

  assert.equal(gated.status, "running");
  assert.equal(catalogStageByName(gated, "catalog").status, "passed");
  assert.equal(catalogStageByName(gated, "productExtraction").status, "pending");
  assert.equal(catalogStageByName(gated, "catalog").outputRefIds.length, 7);
});

test("invalid catalog snapshot fails closed with catalog attribution", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T20:50:00.000Z",
    finishedAt: "2026-08-24T20:50:10.000Z",
    cpuOptions: [
      product("cpu", "Duplicate CPU", 10_000),
      product("cpu", "  Duplicate   CPU ", 10_500),
    ],
  });

  const gated = applyCatalogGate(
    runReadyForCatalog(),
    snapshot,
    "2026-08-24T20:51:00.000Z",
  );

  assert.equal(gated.status, "failed");
  assert.equal(catalogStageByName(gated, "catalog").status, "failed");
  assert.equal(gated.firstFailure?.stage, "catalog");
  assert.equal(gated.firstFailure?.code, "CATALOG_SNAPSHOT_INVALID");
});

test("catalog cannot run before hardware target passes", () => {
  const snapshot = catalogSnapshotFromScraperReport({
    ok: true,
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    startedAt: "2026-08-24T21:00:00.000Z",
    finishedAt: "2026-08-24T21:00:10.000Z",
  });
  const run = createPcBuildRun({
    runId: "run-catalog-too-early",
    createdAt: "2026-08-24T21:00:00.000Z",
    request: { rawIntent: "test", scope: "caseOnly" },
  });

  const gated = applyCatalogGate(run, snapshot, "2026-08-24T21:01:00.000Z");

  assert.equal(gated.status, "failed");
  assert.equal(
    gated.firstFailure?.code,
    "CATALOG_PREREQUISITE_HARDWARE_TARGET_NOT_PASSED",
  );
});
