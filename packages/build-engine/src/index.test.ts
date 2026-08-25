import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogCategory } from "@bilgisayar-topla/catalog";
import type { HardwareTarget } from "@bilgisayar-topla/requirements";
import type {
  ProductFeature,
  ProductFeatureProfile,
} from "@bilgisayar-topla/shared-contracts";

import {
  generateAndScoreBuilds,
  type BuildEngineProduct,
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
    createdAt: "2026-08-25T04:00:00.000Z",
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

function product(
  category: CatalogCategory,
  id: string,
  price: number,
  features: ProductFeature[],
): BuildEngineProduct {
  return {
    catalogProductId: id,
    componentCategory: category,
    status: "ready",
    profile: profile(`profile-${id}`, features),
    price: { amount: price, currency: "TRY" },
  };
}

function baseProducts(memoryGb = 16): BuildEngineProduct[] {
  return [
    product("cpu", "cpu-a", 9_000, [
      feature("cpu.socket", "Socket", "AM5"),
      feature("cpu.base-clock", "Base Clock", 3.8, "GHz"),
      feature("cpu.cores", "Core Count", 6),
    ]),
    product("motherboard", "board-a", 6_000, [
      feature("board.socket", "CPU Socket", "AM5"),
      feature("board.memory", "Memory Type", "DDR5"),
      feature("board.form-factor", "Form Factor", "ATX"),
      feature(
        "board.storage",
        "Storage Support",
        "2x M.2 PCIe NVMe, 4x SATA",
      ),
    ]),
    product("memory", `memory-${memoryGb}`, 3_000, [
      feature("memory.type", "RAM Type", "DDR5"),
      feature("memory.capacity", "Memory Capacity", memoryGb, "GB"),
    ]),
    product("gpu", "gpu-a", 17_000, [
      feature("gpu.length", "GPU Length", 300, "mm"),
      feature("gpu.psu", "Recommended PSU", 650, "W"),
      feature("gpu.vram", "VRAM", 8, "GB"),
      feature("gpu.directx", "DirectX", "DirectX 12"),
    ]),
    product("storage", "ssd-a", 2_500, [
      feature("storage.interface", "Interface", "NVMe M.2 PCIe"),
      feature("storage.capacity", "SSD Capacity", 512, "GB"),
    ]),
    product("psu", "psu-a", 2_500, [
      feature("psu.power", "Total Power", 750, "W"),
    ]),
    product("case", "case-a", 2_000, [
      feature(
        "case.board",
        "Motherboard Support",
        "ATX, Micro-ATX, Mini-ITX",
      ),
      feature("case.gpu", "Max GPU Length", 340, "mm"),
    ]),
  ];
}

function target(
  targetId: string,
  component: HardwareTarget["component"],
  value: string,
  reason = "fixture evidence-backed target",
): HardwareTarget {
  return {
    targetId,
    component,
    target: value,
    reason,
    policy: "recommendedAggregateV1",
    evidence: [
      {
        sourceId: `source-${targetId}`,
        requirementId: `requirement-${targetId}`,
        field: `recommended.${component}`,
      },
    ],
    state: "ready",
  };
}

function baseTargets(): HardwareTarget[] {
  return [
    target("target-cpu", "cpu", "3.0+ GHz, at least 4 cores"),
    target("target-memory", "memory", "16 GB RAM or more"),
    target("target-gpu", "gpu", "6 GB VRAM or more, DirectX 12 compliant"),
    target(
      "hardware-target-storage-app-space",
      "storage",
      "120 GB application space minimum",
      "Sum of official application installation-space requirements.",
    ),
  ];
}

test("compatible under-budget candidate is scored and ranked", () => {
  const result = generateAndScoreBuilds({
    products: baseProducts(),
    targets: baseTargets(),
    budgetAmount: 50_000,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.evaluations.length, 1);
  assert.equal(result.topCandidates.length, 1);
  assert.equal(result.topCandidates[0]?.outcome, "scored");
  assert.equal(result.topCandidates[0]?.compatibility.status, "PASS");
  assert.equal(result.topCandidates[0]?.totalPrice, 42_000);
  assert.equal(result.topCandidates[0]?.budgetRemaining, 8_000);
  assert.equal((result.topCandidates[0]?.score ?? 0) > 80, true);
});

test("incompatible socket candidate never enters scoring", () => {
  const products = baseProducts();
  const board = products.find((item) => item.componentCategory === "motherboard");
  assert.ok(board);
  const socket = board.profile.features.find((item) => item.key === "board.socket");
  assert.ok(socket);
  socket.value = "LGA1700";

  const result = generateAndScoreBuilds({
    products,
    targets: baseTargets(),
    budgetAmount: 50_000,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.topCandidates.length, 0);
  assert.equal(result.evaluations[0]?.outcome, "compatibilityFailed");
  assert.equal(
    result.evaluations[0]?.compatibility.firstBlockingCheck?.code,
    "CPU_MOTHERBOARD_SOCKET_MISMATCH",
  );
});

test("over-budget compatible candidate is rejected before target scoring", () => {
  const result = generateAndScoreBuilds({
    products: baseProducts(),
    targets: baseTargets(),
    budgetAmount: 40_000,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.evaluations[0]?.outcome, "overBudget");
  assert.deepEqual(result.evaluations[0]?.targetChecks, []);
  assert.equal(result.topCandidates.length, 0);
});

test("candidate below evidence-backed memory target is rejected", () => {
  const result = generateAndScoreBuilds({
    products: baseProducts(8),
    targets: baseTargets(),
    budgetAmount: 50_000,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.evaluations[0]?.outcome, "targetFailed");
  assert.equal(
    result.evaluations[0]?.targetChecks.find(
      (check) => check.targetId === "target-memory",
    )?.code,
    "MEMORY_BELOW_HARDWARE_TARGET",
  );
});

test("missing target-fit evidence returns reviewRequired instead of guessing", () => {
  const products = baseProducts();
  const memory = products.find((item) => item.componentCategory === "memory");
  assert.ok(memory);
  memory.profile.features = memory.profile.features.filter(
    (item) => item.key !== "memory.capacity",
  );

  const result = generateAndScoreBuilds({
    products,
    targets: baseTargets(),
    budgetAmount: 50_000,
  });

  assert.equal(result.status, "reviewRequired");
  assert.equal(result.evaluations[0]?.outcome, "targetReviewRequired");
  assert.equal(
    result.evaluations[0]?.targetChecks.find(
      (check) => check.targetId === "target-memory",
    )?.code,
    "MEMORY_PRODUCT_TARGET_EVIDENCE_MISSING",
  );
});

test("application installation space is never promoted to SSD purchase capacity", () => {
  const targets = baseTargets().map((item) =>
    item.targetId === "hardware-target-storage-app-space"
      ? {
          ...item,
          target: "9999 GB application space minimum",
        }
      : item,
  );

  const result = generateAndScoreBuilds({
    products: baseProducts(),
    targets,
    budgetAmount: 50_000,
  });

  assert.equal(result.status, "ready");
  const storageCheck = result.topCandidates[0]?.targetChecks.find(
    (check) => check.targetId === "hardware-target-storage-app-space",
  );
  assert.equal(storageCheck?.status, "SKIPPED");
  assert.equal(storageCheck?.code, "STORAGE_APP_SPACE_NOT_PURCHASE_CAPACITY");
});

test("higher measurable target headroom ranks ahead while staying under budget", () => {
  const products = [
    ...baseProducts(),
    product("memory", "memory-32", 4_500, [
      feature("memory.type", "RAM Type", "DDR5"),
      feature("memory.capacity", "Memory Capacity", 32, "GB"),
    ]),
  ];

  const result = generateAndScoreBuilds({
    products,
    targets: baseTargets(),
    budgetAmount: 50_000,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.topCandidates.length, 2);
  assert.equal(result.topCandidates[0]?.productIds.includes("memory-32"), true);
  assert.equal(
    (result.topCandidates[0]?.score ?? 0) > (result.topCandidates[1]?.score ?? 0),
    true,
  );
});

test("bounded sampling is deterministic regardless of input order", () => {
  const base = baseProducts();
  const cpus = [1, 2, 3, 4].map((index) =>
    product("cpu", `cpu-${index}`, 7_000 + index * 500, [
      feature(`cpu-${index}.socket`, "Socket", "AM5"),
      feature(`cpu-${index}.base-clock`, "Base Clock", 3 + index * 0.2, "GHz"),
      feature(`cpu-${index}.cores`, "Core Count", 4 + index),
    ]),
  );
  const gpus = [1, 2, 3, 4].map((index) =>
    product("gpu", `gpu-${index}`, 12_000 + index * 1_000, [
      feature(`gpu-${index}.length`, "GPU Length", 280 + index * 5, "mm"),
      feature(`gpu-${index}.psu`, "Recommended PSU", 650, "W"),
      feature(`gpu-${index}.vram`, "VRAM", 6 + index * 2, "GB"),
      feature(`gpu-${index}.directx`, "DirectX", "DirectX 12"),
    ]),
  );
  const fixed = base.filter(
    (item) => item.componentCategory !== "cpu" && item.componentCategory !== "gpu",
  );
  const products = [...cpus, ...gpus, ...fixed];

  const first = generateAndScoreBuilds({
    products,
    targets: baseTargets(),
    budgetAmount: 60_000,
    maxProductsPerCategory: 4,
    maxCandidates: 5,
  });
  const second = generateAndScoreBuilds({
    products: [...products].reverse(),
    targets: baseTargets(),
    budgetAmount: 60_000,
    maxProductsPerCategory: 4,
    maxCandidates: 5,
  });

  assert.equal(first.totalCombinationCount, 16);
  assert.equal(first.sampledCandidateCount, 5);
  assert.deepEqual(
    first.evaluations.map((item) => item.candidateId),
    second.evaluations.map((item) => item.candidateId),
  );
});
