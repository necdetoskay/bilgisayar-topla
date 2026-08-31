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
import type {
  HardwareTarget,
  OfficialSourceRecord,
  SoftwareRequirementProfile,
} from "@bilgisayar-topla/requirements";
import type {
  ProductFeature,
  ProductFeatureProfile,
} from "@bilgisayar-topla/shared-contracts";

import {
  verifySelectedBuild,
  type VerificationSelection,
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
    sourceRefIds: [`page-${key.split(".")[0]}`],
    clauseEligible: false,
  };
}

function profile(
  id: string,
  productUrl: string,
  features: ProductFeature[],
): ProductFeatureProfile {
  return {
    profileId: `profile-${id}`,
    schemaVersion: "1.0.0",
    productCategory: "other",
    sourceMode: "productExtractor",
    createdAt: "2026-08-25T05:00:00.000Z",
    identity: { title: id, sourceUrl: productUrl },
    features,
    evidence: [
      {
        evidenceId: `page-${id}`,
        sourceType: "productPage",
        url: productUrl,
        checkedAt: "2026-08-25T05:00:00.000Z",
        snapshotSha256: `sha-${id}`,
        qualityState: "ready",
      },
    ],
    gaps: [],
    readiness: "readyForSpecification",
  };
}

function product(
  category: CatalogCategory,
  id: string,
  price: number,
  features: ProductFeature[],
): BuildEngineProduct {
  const productUrl = `https://www.incehesap.com/${id}/`;
  return {
    catalogProductId: id,
    componentCategory: category,
    status: "ready",
    profile: profile(id, productUrl, features),
    price: { amount: price, currency: "TRY" },
  };
}

function products(): BuildEngineProduct[] {
  return [
    product("cpu", "cpu", 9_000, [
      feature("cpu.socket", "Socket", "AM5"),
      feature("cpu.base-clock", "Base Clock", 3.8, "GHz"),
      feature("cpu.cores", "Core Count", 6),
    ]),
    product("motherboard", "board", 6_000, [
      feature("board.socket", "CPU Socket", "AM5"),
      feature("board.memory", "Memory Type", "DDR5"),
      feature("board.form-factor", "Form Factor", "ATX"),
      feature("board.storage", "Storage Support", "2x M.2 PCIe NVMe, 4x SATA"),
    ]),
    product("memory", "memory", 3_000, [
      feature("memory.type", "RAM Type", "DDR5"),
      feature("memory.capacity", "Memory Capacity", 16, "GB"),
    ]),
    product("gpu", "gpu", 17_000, [
      feature("gpu.length", "GPU Length", 300, "mm"),
      feature("gpu.psu", "Recommended PSU", 650, "W"),
      feature("gpu.vram", "VRAM", 8, "GB"),
      feature("gpu.directx", "DirectX", "DirectX 12"),
    ]),
    product("storage", "storage", 2_500, [
      feature("storage.interface", "Interface", "NVMe M.2 PCIe"),
      feature("storage.capacity", "SSD Capacity", 512, "GB"),
    ]),
    product("psu", "psu", 2_500, [
      feature("psu.power", "Total Power", 750, "W"),
    ]),
    product("case", "case", 2_000, [
      feature("case.board", "Motherboard Support", "ATX, Micro-ATX, Mini-ITX"),
      feature("case.gpu", "Max GPU Length", 340, "mm"),
    ]),
  ];
}

function catalog(engineProducts: BuildEngineProduct[]): CatalogSnapshot {
  const catalogProducts: CatalogProduct[] = engineProducts.map((item) => ({
    catalogProductId: item.catalogProductId,
    category: item.componentCategory,
    name: `Fixture ${item.catalogProductId}`,
    price: { amount: item.price.amount, currency: "TRY" },
    availability: "available",
    source: {
      sourceType: "incehesapConfigurator",
      targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
      productUrl: item.profile.identity.sourceUrl,
      observedAt: "2026-08-25T05:00:00.000Z",
      scraperRunId: "scraper-run-fixture",
      rawText: `Fixture ${item.catalogProductId}`,
      priceText: `${item.price.amount} TL`,
    },
  }));

  return {
    snapshotId: "catalog-fixture",
    schemaVersion: "1.0.0",
    sourceType: "incehesapConfigurator",
    targetUrl: "https://www.incehesap.com/oyun-bilgisayari-toplama/",
    observedAt: "2026-08-25T05:00:00.000Z",
    scraperRunId: "scraper-run-fixture",
    products: catalogProducts,
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

function officialSources(): OfficialSourceRecord[] {
  return [
    {
      sourceId: "source-autocad",
      vendor: "Autodesk",
      url: "https://www.autodesk.com/support/system-requirements/autocad-2022",
      checkedAt: "2026-08-25T05:00:00.000Z",
      snapshotSha256: "official-source-sha",
      trustState: "official",
    },
  ];
}

function requirements(): SoftwareRequirementProfile[] {
  return [
    {
      requirementId: "req-autocad",
      software: "AutoCAD",
      version: "2022",
      sourceId: "source-autocad",
      extractionRunId: "extract-autocad",
      minimum: {
        cpu: "2.5 GHz",
        ram: "8 GB",
        gpu: "1 GB VRAM DirectX 11",
        storage: "10 GB",
      },
      recommended: {
        cpu: "3.0 GHz 4 core",
        ram: "16 GB",
        gpu: "4 GB VRAM DirectX 12",
        storage: "10 GB",
      },
      qualityState: "ready",
    },
  ];
}

function targets(): HardwareTarget[] {
  const evidence = (field: string) => [
    {
      sourceId: "source-autocad",
      requirementId: "req-autocad",
      field,
    },
  ];
  return [
    {
      targetId: "target-cpu",
      component: "cpu",
      target: "3.0+ GHz, at least 4 cores",
      reason: "Official recommended CPU requirement",
      policy: "recommendedAggregateV1",
      evidence: evidence("recommended.cpu"),
      state: "ready",
    },
    {
      targetId: "target-memory",
      component: "memory",
      target: "16 GB RAM or more",
      reason: "Official recommended memory requirement",
      policy: "recommendedAggregateV1",
      evidence: evidence("recommended.ram"),
      state: "ready",
    },
    {
      targetId: "target-gpu",
      component: "gpu",
      target: "4 GB VRAM or more, DirectX 12 compliant",
      reason: "Official recommended GPU requirement",
      policy: "recommendedAggregateV1",
      evidence: evidence("recommended.gpu"),
      state: "ready",
    },
    {
      targetId: "hardware-target-storage-app-space",
      component: "storage",
      target: "10 GB application space minimum",
      reason: "Sum of official application installation-space requirements.",
      policy: "recommendedAggregateV1",
      evidence: evidence("recommended.storage"),
      state: "ready",
    },
  ];
}

function validContext() {
  const engineProducts = products();
  const hardwareTargets = targets();
  const engine = generateAndScoreBuilds({
    products: engineProducts,
    targets: hardwareTargets,
    budgetAmount: 50_000,
    currency: "TRY",
    maxProductsPerCategory: 1,
    maxCandidates: 1,
    topN: 1,
  });
  const candidate = engine.topCandidates[0];
  assert.ok(candidate);

  const selection: VerificationSelection = {
    buildId: candidate.candidateId,
    catalogProductIds: [...candidate.productIds],
    productProfileIds: [...candidate.productProfileIds],
    totalPrice: candidate.totalPrice,
    currency: candidate.currency,
    score: candidate.score,
  };

  return {
    selection,
    catalog: catalog(engineProducts),
    products: engineProducts,
    targets: hardwareTargets,
    officialSources: officialSources(),
    requirements: requirements(),
    budgetAmount: 50_000,
    currency: "TRY",
  };
}

test("fully grounded selected build passes independent verification", () => {
  const result = verifySelectedBuild(validContext());

  assert.equal(result.status, "PASS");
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.catalogLineage.length, 7);
  assert.equal(result.requirementLineage.length, 4);
  assert.equal(result.recomputed?.outcome, "scored");
  assert.equal(result.recomputed?.compatibility.status, "PASS");
});

test("legacy selection without catalog product ids requires review", () => {
  const context = validContext();
  context.selection.catalogProductIds = undefined;

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(
    result.diagnostics[0]?.code,
    "VERIFICATION_SELECTION_CATALOG_LINEAGE_MISSING",
  );
});

test("tampered selected total price fails independent verification", () => {
  const context = validContext();
  context.selection.totalPrice -= 1_000;

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "FAIL");
  assert.equal(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "VERIFICATION_BUILD_PRICE_MISMATCH",
    ),
    true,
  );
});

test("missing product-page snapshot provenance requires review", () => {
  const context = validContext();
  const cpu = context.products.find((item) => item.componentCategory === "cpu");
  assert.ok(cpu);
  const evidence = cpu.profile.evidence[0];
  assert.ok(evidence);
  evidence.snapshotSha256 = undefined;

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "VERIFICATION_PRODUCT_PAGE_SNAPSHOT_MISSING",
    ),
    true,
  );
});

test("broken hardware-target official lineage fails verification", () => {
  const context = validContext();
  context.targets[0] = {
    ...context.targets[0]!,
    evidence: [
      {
        sourceId: "missing-source",
        requirementId: "req-autocad",
        field: "recommended.cpu",
      },
    ],
  };

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "FAIL");
  assert.equal(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "VERIFICATION_TARGET_EVIDENCE_REFERENCE_BROKEN",
    ),
    true,
  );
});

test("post-scoring compatibility mutation is caught by independent recomputation", () => {
  const context = validContext();
  const board = context.products.find(
    (item) => item.componentCategory === "motherboard",
  );
  assert.ok(board);
  const socket = board.profile.features.find((item) => item.key === "board.socket");
  assert.ok(socket);
  socket.value = "LGA1700";

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "FAIL");
  assert.equal(result.recomputed?.outcome, "compatibilityFailed");
  assert.equal(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "VERIFICATION_RECOMPUTE_HARD_GATE_FAILED",
    ),
    true,
  );
});

test("scorer score is not trusted as a verification gate", () => {
  const context = validContext();
  context.selection.score = 999_999;

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "PASS");
  assert.notEqual(result.recomputed?.score, context.selection.score);
});

test("catalog price and verification product price must have exact lineage", () => {
  const context = validContext();
  const gpu = context.products.find((item) => item.componentCategory === "gpu");
  assert.ok(gpu);
  gpu.price.amount += 500;

  const result = verifySelectedBuild(context);

  assert.equal(result.status, "FAIL");
  assert.equal(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "VERIFICATION_PRODUCT_PRICE_LINEAGE_MISMATCH",
    ),
    true,
  );
});
