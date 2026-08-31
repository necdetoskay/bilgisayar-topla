import assert from "node:assert/strict";
import test from "node:test";

import {
  generateAndScoreBuilds,
  type BuildEngineProduct,
} from "@bilgisayar-topla/build-engine";
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogSnapshot,
} from "@bilgisayar-topla/catalog";
import {
  createBuildIntent,
  type HardwareTarget,
  type OfficialSourceRecord,
  type SoftwareRequirementProfile,
} from "@bilgisayar-topla/requirements";
import { verifySelectedBuild } from "@bilgisayar-topla/verification";

import { applyBuildEngineResult } from "./build-engine-gate.js";
import { applyCatalogGate } from "./catalog-gate.js";
import {
  applyExplanationGate,
  createDeterministicVerifiedBuildExplanations,
} from "./explanation-gate.js";
import {
  createPcBuildRun,
  validatePcBuildRun,
  type PcBuildRun,
} from "./index.js";
import {
  applyProductExtractionGate,
  type ProductExtractionGateRecord,
} from "./product-extraction-gate.js";
import { applyBuildIntentGate } from "./requirement-gate.js";
import {
  applyVerificationResults,
  createPcBuildProofChainReport,
} from "./verification-gate.js";

const NOW = "2026-08-25T06:45:00.000Z";
const CONFIGURATOR_URL = "https://www.incehesap.com/oyun-bilgisayari-toplama/";

type Feature = BuildEngineProduct["profile"]["features"][number];

function feature(
  category: CatalogCategory,
  key: string,
  label: string,
  value: string | number | boolean,
  unit?: string,
): Feature {
  return {
    key,
    label,
    value,
    unit,
    sourceRefIds: [`page-${category}`],
    clauseEligible: false,
  };
}

function product(
  category: CatalogCategory,
  price: number,
  features: Feature[],
): BuildEngineProduct {
  const id = category;
  const productUrl = `https://www.incehesap.com/fixture-${category}/`;
  return {
    catalogProductId: id,
    componentCategory: category,
    status: "ready",
    price: { amount: price, currency: "TRY" },
    profile: {
      profileId: `profile-${category}`,
      schemaVersion: "1.0.0",
      productCategory: "other",
      sourceMode: "productExtractor",
      createdAt: NOW,
      identity: {
        title: `Fixture ${category}`,
        sourceUrl: productUrl,
      },
      features,
      evidence: [
        {
          evidenceId: `page-${category}`,
          sourceType: "productPage",
          url: productUrl,
          checkedAt: NOW,
          snapshotSha256: `product-page-sha-${category}`,
          qualityState: "ready",
        },
      ],
      gaps: [],
      readiness: "readyForSpecification",
    },
  };
}

function baseProducts(): BuildEngineProduct[] {
  return [
    product("cpu", 9_000, [
      feature("cpu", "cpu.socket", "Socket", "AM5"),
      feature("cpu", "cpu.base-clock", "Base Clock", 3.8, "GHz"),
      feature("cpu", "cpu.cores", "Core Count", 6),
    ]),
    product("motherboard", 6_000, [
      feature("motherboard", "board.socket", "CPU Socket", "AM5"),
      feature("motherboard", "board.memory", "Memory Type", "DDR5"),
      feature("motherboard", "board.form-factor", "Form Factor", "ATX"),
      feature(
        "motherboard",
        "board.storage",
        "Storage Support",
        "2x M.2 PCIe NVMe, 4x SATA",
      ),
    ]),
    product("memory", 3_000, [
      feature("memory", "memory.type", "RAM Type", "DDR5"),
      feature("memory", "memory.capacity", "Memory Capacity", 16, "GB"),
    ]),
    product("gpu", 17_000, [
      feature("gpu", "gpu.length", "GPU Length", 300, "mm"),
      feature("gpu", "gpu.psu", "Recommended PSU", 650, "W"),
      feature("gpu", "gpu.vram", "VRAM", 8, "GB"),
      feature("gpu", "gpu.directx", "DirectX", "DirectX 12"),
    ]),
    product("storage", 2_500, [
      feature("storage", "storage.interface", "Interface", "NVMe M.2 PCIe"),
      feature("storage", "storage.capacity", "SSD Capacity", 512, "GB"),
    ]),
    product("psu", 2_500, [
      feature("psu", "psu.power", "Total Power", 750, "W"),
    ]),
    product("case", 2_000, [
      feature(
        "case",
        "case.board",
        "Motherboard Support",
        "ATX, Micro-ATX, Mini-ITX",
      ),
      feature("case", "case.gpu", "Max GPU Length", 340, "mm"),
    ]),
  ];
}

function sources(): OfficialSourceRecord[] {
  // Synthetic official fixtures: values/URLs are test data, not live claims.
  return [
    {
      sourceId: "source-autocad-2022",
      vendor: "Autodesk fixture",
      url: "https://fixture.autodesk.example/autocad-2022",
      checkedAt: NOW,
      snapshotSha256: "official-sha-autocad",
      trustState: "official",
    },
    {
      sourceId: "source-m365-business",
      vendor: "Microsoft fixture",
      url: "https://fixture.microsoft.example/m365-business",
      checkedAt: NOW,
      snapshotSha256: "official-sha-m365",
      trustState: "official",
    },
  ];
}

function requirements(): SoftwareRequirementProfile[] {
  return [
    {
      requirementId: "req-autocad-2022",
      software: "AutoCAD",
      version: "2022",
      sourceId: "source-autocad-2022",
      extractionRunId: "extract-autocad",
      minimum: {
        cpu: "2.5 GHz, 2 cores",
        ram: "8 GB",
        gpu: "2 GB VRAM DirectX 11",
        storage: "10 GB",
      },
      recommended: {
        cpu: "3.0 GHz, 4 cores",
        ram: "16 GB",
        gpu: "4 GB VRAM DirectX 12",
        storage: "10 GB",
      },
      qualityState: "ready",
    },
    {
      requirementId: "req-m365-business",
      software: "Microsoft 365 Business",
      sourceId: "source-m365-business",
      extractionRunId: "extract-m365",
      minimum: {
        cpu: "1.6 GHz, 2 cores",
        ram: "4 GB",
        storage: "4 GB",
      },
      recommended: {
        cpu: "1.6 GHz, 2 cores",
        ram: "4 GB",
        storage: "4 GB",
      },
      qualityState: "ready",
    },
  ];
}

function targets(): HardwareTarget[] {
  return [
    {
      targetId: "target-cpu",
      component: "cpu",
      target: "3.0+ GHz, at least 4 cores",
      reason: "Synthetic aggregate recommended CPU target.",
      policy: "recommendedAggregateV1",
      evidence: [
        {
          sourceId: "source-autocad-2022",
          requirementId: "req-autocad-2022",
          field: "recommended.cpu",
        },
        {
          sourceId: "source-m365-business",
          requirementId: "req-m365-business",
          field: "recommended.cpu",
        },
      ],
      state: "ready",
    },
    {
      targetId: "target-memory",
      component: "memory",
      target: "16 GB RAM or more",
      reason: "Synthetic aggregate recommended memory target.",
      policy: "recommendedAggregateV1",
      evidence: [
        {
          sourceId: "source-autocad-2022",
          requirementId: "req-autocad-2022",
          field: "recommended.ram",
        },
        {
          sourceId: "source-m365-business",
          requirementId: "req-m365-business",
          field: "recommended.ram",
        },
      ],
      state: "ready",
    },
    {
      targetId: "target-gpu",
      component: "gpu",
      target: "4 GB VRAM or more, DirectX 12 compliant",
      reason: "Synthetic AutoCAD recommended GPU target.",
      policy: "recommendedAggregateV1",
      evidence: [
        {
          sourceId: "source-autocad-2022",
          requirementId: "req-autocad-2022",
          field: "recommended.gpu",
        },
      ],
      state: "ready",
    },
    {
      targetId: "hardware-target-storage-app-space",
      component: "storage",
      target: "14 GB application space minimum",
      reason: "Sum of synthetic application installation-space requirements.",
      policy: "applicationSpaceEvidenceOnlyV1",
      evidence: [
        {
          sourceId: "source-autocad-2022",
          requirementId: "req-autocad-2022",
          field: "recommended.storage",
        },
        {
          sourceId: "source-m365-business",
          requirementId: "req-m365-business",
          field: "recommended.storage",
        },
      ],
      state: "ready",
    },
  ];
}

function catalogSnapshot(engineProducts = baseProducts()): CatalogSnapshot {
  const products: CatalogProduct[] = engineProducts.map((item) => ({
    catalogProductId: item.catalogProductId,
    category: item.componentCategory,
    name: `Fixture ${item.componentCategory}`,
    price: { amount: item.price.amount, currency: "TRY" },
    availability: "available",
    source: {
      sourceType: "incehesapConfigurator",
      targetUrl: CONFIGURATOR_URL,
      productUrl: item.profile.identity.sourceUrl,
      observedAt: NOW,
      scraperRunId: "scraper-fixture",
      rawText: `Fixture ${item.componentCategory}`,
      priceText: `${item.price.amount} TL`,
    },
  }));

  return {
    snapshotId: "catalog-v1-golden",
    schemaVersion: "1.0.0",
    sourceType: "incehesapConfigurator",
    targetUrl: CONFIGURATOR_URL,
    observedAt: NOW,
    scraperRunId: "scraper-fixture",
    products,
    coveredCategories: [
      "cpu",
      "motherboard",
      "memory",
      "gpu",
      "storage",
      "psu",
      "case",
    ],
    missingRequiredCategories: [],
    selectionChainReady: true,
    diagnostics: [],
    qualityState: "ready",
  };
}

function extractionRecords(
  engineProducts: BuildEngineProduct[],
): ProductExtractionGateRecord[] {
  return engineProducts.map((item) => ({
    recordId: `record-${item.catalogProductId}`,
    catalogProductId: item.catalogProductId,
    componentCategory: item.componentCategory,
    productPageUrl: item.profile.identity.sourceUrl,
    status: item.status,
    diagnostics: [],
    profile: {
      profileId: item.profile.profileId,
      readiness: item.profile.readiness,
      evidence: item.profile.evidence.map((evidence) => ({
        evidenceId: evidence.evidenceId,
        sourceType: evidence.sourceType,
        url: evidence.url,
        snapshotSha256: evidence.snapshotSha256,
        qualityState: evidence.qualityState,
      })),
    },
    validation: { valid: true },
  }));
}

function startRun(budgetAmount = 50_000): PcBuildRun {
  const request = {
    rawIntent:
      "AutoCAD 2022 ve Microsoft 365 Business icin 50.000 TL civarinda sadece kasa istiyorum.",
    budgetAmount,
    currency: "TRY",
    scope: "caseOnly" as const,
    locale: "tr-TR",
  };
  const run = createPcBuildRun({
    runId: `run-v1-golden-${budgetAmount}`,
    createdAt: NOW,
    request,
  });
  const intent = createBuildIntent({
    intentId: `intent-v1-golden-${budgetAmount}`,
    createdAt: NOW,
    ...request,
    sources: sources(),
    softwareRequirements: requirements(),
    hardwareTargets: targets(),
  });
  assert.equal(intent.readiness, "readyForBuild");
  return applyBuildIntentGate(run, intent, "2026-08-25T06:45:01.000Z");
}

function runThroughExtraction(args?: {
  budgetAmount?: number;
  engineProducts?: BuildEngineProduct[];
  catalog?: CatalogSnapshot;
  records?: ProductExtractionGateRecord[];
}): {
  run: PcBuildRun;
  products: BuildEngineProduct[];
  catalog: CatalogSnapshot;
} {
  const products = args?.engineProducts ?? baseProducts();
  const snapshot = args?.catalog ?? catalogSnapshot(products);
  let run = startRun(args?.budgetAmount ?? 50_000);
  run = applyCatalogGate(run, snapshot, "2026-08-25T06:45:02.000Z");
  run = applyProductExtractionGate({
    run,
    records: args?.records ?? extractionRecords(products),
    at: "2026-08-25T06:45:03.000Z",
  });
  return { run, products, catalog: snapshot };
}

function runBuildEngine(
  run: PcBuildRun,
  products: BuildEngineProduct[],
  budgetAmount: number,
): PcBuildRun {
  const engine = generateAndScoreBuilds({
    products,
    targets: targets(),
    budgetAmount,
    currency: "TRY",
  });
  return applyBuildEngineResult({
    run,
    result: engine,
    at: "2026-08-25T06:45:04.000Z",
  });
}

test("V1 golden vertical completes all ten canonical stages without paid/live dependencies", () => {
  const context = runThroughExtraction();
  let run = runBuildEngine(context.run, context.products, 50_000);

  assert.equal(
    run.stages.find((stage) => stage.stage === "scoring")?.status,
    "passed",
  );
  assert.equal(run.selectedBuilds.length, 1);

  const verificationResults = run.selectedBuilds.map((selection) =>
    verifySelectedBuild({
      selection,
      catalog: context.catalog,
      products: context.products,
      targets: targets(),
      officialSources: sources(),
      requirements: requirements(),
      budgetAmount: 50_000,
      currency: "TRY",
    }),
  );
  assert.equal(verificationResults.every((result) => result.status === "PASS"), true);

  run = applyVerificationResults({
    run,
    results: verificationResults,
    at: "2026-08-25T06:45:05.000Z",
  });
  const explanations = createDeterministicVerifiedBuildExplanations(run);
  run = applyExplanationGate({
    run,
    explanations,
    at: "2026-08-25T06:45:06.000Z",
  });

  assert.equal(run.status, "completed");
  assert.equal(run.stages.every((stage) => stage.status === "passed"), true);
  assert.equal(run.selectedBuilds.length, 1);
  assert.equal(run.selectedBuilds[0]?.verificationStatus, "passed");
  assert.equal((run.selectedBuilds[0]?.totalPrice ?? Infinity) <= 50_000, true);
  assert.deepEqual(validatePcBuildRun(run), { valid: true, issues: [] });

  const report = createPcBuildProofChainReport({
    run,
    verifications: verificationResults,
    generatedAt: "2026-08-25T06:45:07.000Z",
  });
  assert.equal(report.runStatus, "completed");
  assert.equal(report.verifications[0]?.status, "PASS");
  assert.equal(report.verifications[0]?.catalogLineage.length, 7);
  assert.equal(report.verifications[0]?.requirementLineage.length, 7);
});

test("golden socket trap stops at compatibility", () => {
  const products = baseProducts();
  const board = products.find((item) => item.componentCategory === "motherboard");
  assert.ok(board);
  const socket = board.profile.features.find((item) => item.key === "board.socket");
  assert.ok(socket);
  socket.value = "LGA1700";

  const context = runThroughExtraction({ engineProducts: products });
  const run = runBuildEngine(context.run, products, 50_000);

  assert.equal(run.status, "failed");
  assert.equal(run.firstFailure?.stage, "compatibility");
  assert.equal(run.firstFailure?.code, "CPU_MOTHERBOARD_SOCKET_MISMATCH");
  assert.equal(
    run.stages.find((stage) => stage.stage === "scoring")?.status,
    "pending",
  );
});

test("golden RAM generation trap stops at compatibility", () => {
  const products = baseProducts();
  const memory = products.find((item) => item.componentCategory === "memory");
  assert.ok(memory);
  const type = memory.profile.features.find((item) => item.key === "memory.type");
  assert.ok(type);
  type.value = "DDR4";

  const context = runThroughExtraction({ engineProducts: products });
  const run = runBuildEngine(context.run, products, 50_000);

  assert.equal(run.status, "failed");
  assert.equal(run.firstFailure?.stage, "compatibility");
  assert.equal(
    run.firstFailure?.code,
    "MEMORY_MOTHERBOARD_GENERATION_MISMATCH",
  );
});

test("golden insufficient PSU trap stops at compatibility", () => {
  const products = baseProducts();
  const psu = products.find((item) => item.componentCategory === "psu");
  assert.ok(psu);
  const watt = psu.profile.features.find((item) => item.key === "psu.power");
  assert.ok(watt);
  watt.value = 550;

  const context = runThroughExtraction({ engineProducts: products });
  const run = runBuildEngine(context.run, products, 50_000);

  assert.equal(run.status, "failed");
  assert.equal(run.firstFailure?.stage, "compatibility");
  assert.equal(
    run.firstFailure?.code,
    "PSU_CAPACITY_BELOW_GPU_RECOMMENDATION",
  );
});

test("golden product evidence gap stops at productExtraction review", () => {
  const products = baseProducts();
  const records = extractionRecords(products);
  const gpu = records.find((item) => item.componentCategory === "gpu");
  assert.ok(gpu?.profile);
  gpu.profile.evidence[0]!.snapshotSha256 = "";

  const context = runThroughExtraction({
    engineProducts: products,
    records,
  });

  assert.equal(context.run.status, "reviewRequired");
  assert.equal(context.run.firstFailure, undefined);
  assert.equal(
    context.run.stages.find((stage) => stage.stage === "productExtraction")?.status,
    "reviewRequired",
  );
  assert.equal(
    context.run.stages.find((stage) => stage.stage === "candidateGeneration")?.status,
    "pending",
  );
});

test("golden missing catalog category stops at catalog review", () => {
  const products = baseProducts();
  const snapshot = catalogSnapshot(products);
  snapshot.products = snapshot.products.filter((product) => product.category !== "case");
  snapshot.coveredCategories = snapshot.coveredCategories.filter(
    (category) => category !== "case",
  );
  snapshot.missingRequiredCategories = ["case"];
  snapshot.qualityState = "partial";
  snapshot.diagnostics = [
    {
      code: "CATALOG_REQUIRED_CATEGORY_MISSING",
      category: "case",
      message: "fixture missing case",
    },
  ];

  const run = applyCatalogGate(
    startRun(),
    snapshot,
    "2026-08-25T06:45:02.000Z",
  );

  assert.equal(run.status, "reviewRequired");
  assert.equal(
    run.stages.find((stage) => stage.stage === "catalog")?.status,
    "reviewRequired",
  );
  assert.equal(
    run.stages.find((stage) => stage.stage === "productExtraction")?.status,
    "pending",
  );
});

test("golden budget overflow stops at scoring", () => {
  const context = runThroughExtraction({ budgetAmount: 40_000 });
  const run = runBuildEngine(context.run, context.products, 40_000);

  assert.equal(run.status, "failed");
  assert.equal(run.firstFailure?.stage, "scoring");
  assert.equal(
    run.firstFailure?.code,
    "NO_UNDER_BUDGET_COMPATIBLE_CANDIDATE",
  );
  assert.equal(
    run.stages.find((stage) => stage.stage === "verification")?.status,
    "pending",
  );
});
