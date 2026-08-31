import { REQUIRED_BUILD_CATEGORIES, type CatalogCategory } from "@bilgisayar-topla/catalog";

import type {
  PcBuildRun,
  PcBuildStage,
  StageEvidenceRef,
} from "./index.js";

export type ProductExtractionGateRecord = {
  recordId: string;
  catalogProductId: string;
  componentCategory: CatalogCategory;
  productPageUrl?: string;
  status: "ready" | "reviewRequired" | "blocked";
  diagnostics: Array<{ code: string; message: string }>;
  profile?: {
    profileId: string;
    readiness: string;
    evidence: Array<{
      evidenceId: string;
      sourceType: string;
      url?: string;
      snapshotSha256?: string;
      qualityState: string;
    }>;
  };
  validation?: {
    valid: boolean;
  };
};

type GateReadiness = "ready" | "reviewRequired" | "blocked";

export function applyProductExtractionGate(args: {
  run: PcBuildRun;
  records: ProductExtractionGateRecord[];
  at: string;
}): PcBuildRun {
  const run = cloneRun(args.run);
  const catalog = stage(run, "catalog");
  if (catalog.status !== "passed") {
    throw new Error("product extraction gate requires catalog stage to be passed");
  }

  run.updatedAt = args.at;
  run.firstFailure = undefined;
  resetFrom(run, "productExtraction");

  const extraction = stage(run, "productExtraction");
  extraction.startedAt = args.at;
  extraction.completedAt = args.at;

  const duplicateRecordId = firstDuplicate(args.records.map((record) => record.recordId));
  const duplicateProductId = firstDuplicate(
    args.records.map((record) => record.catalogProductId),
  );
  if (duplicateRecordId || duplicateProductId) {
    extraction.status = "failed";
    extraction.diagnostics = [
      duplicateRecordId
        ? `PRODUCT_EXTRACTION_RECORD_ID_DUPLICATE:${duplicateRecordId}`
        : `PRODUCT_EXTRACTION_PRODUCT_ID_DUPLICATE:${duplicateProductId}`,
    ];
    run.status = "failed";
    run.firstFailure = {
      stage: "productExtraction",
      code: duplicateRecordId
        ? "PRODUCT_EXTRACTION_RECORD_ID_DUPLICATE"
        : "PRODUCT_EXTRACTION_PRODUCT_ID_DUPLICATE",
      message: "Product extraction records must have unique record and catalog product identities.",
    };
    return run;
  }

  const classified = args.records.map((record) => ({
    record,
    readiness: gateReadiness(record),
  }));
  const readyRecords = classified
    .filter((item) => item.readiness === "ready")
    .map((item) => item.record)
    .filter(isReadyRecord);

  extraction.outputRefIds = readyRecords.map((record) => record.profile.profileId);
  extraction.evidenceRefs = productEvidence(readyRecords);
  extraction.diagnostics = unique(
    classified.flatMap(({ record, readiness }) => {
      const existing = record.diagnostics.map(
        (diagnostic) => `${diagnostic.code}:${record.catalogProductId}`,
      );
      if (record.status === "ready" && readiness === "reviewRequired") {
        return [
          ...existing,
          `PRODUCT_EXTRACTION_READY_RECORD_EVIDENCE_INVALID:${record.catalogProductId}`,
        ];
      }
      return record.status === "ready" ? [] : existing;
    }),
  );

  const missingReadyCategories = REQUIRED_BUILD_CATEGORIES.filter(
    (category) =>
      !readyRecords.some((record) => record.componentCategory === category),
  );

  if (missingReadyCategories.length === 0) {
    extraction.status = "passed";
    run.status = "running";
    return run;
  }

  for (const category of missingReadyCategories) {
    extraction.diagnostics.push(`PRODUCT_EXTRACTION_CATEGORY_NOT_READY:${category}`);
  }
  extraction.diagnostics = unique(extraction.diagnostics);

  const unresolvedCategory = missingReadyCategories.find((category) =>
    classified.some(
      (item) =>
        item.record.componentCategory === category &&
        item.readiness === "reviewRequired",
    ),
  );

  if (unresolvedCategory) {
    extraction.status = "reviewRequired";
    run.status = "reviewRequired";
    return run;
  }

  extraction.status = "failed";
  run.status = "failed";
  run.firstFailure = {
    stage: "productExtraction",
    code: "PRODUCT_EXTRACTION_REQUIRED_CATEGORY_UNAVAILABLE",
    message: `No compatibility-ready product profile exists for required categories: ${missingReadyCategories.join(", ")}.`,
  };
  return run;
}

function gateReadiness(record: ProductExtractionGateRecord): GateReadiness {
  if (record.status === "blocked") return "blocked";
  if (record.status === "reviewRequired") return "reviewRequired";
  return isReadyRecord(record) ? "ready" : "reviewRequired";
}

function isReadyRecord(
  record: ProductExtractionGateRecord,
): record is ProductExtractionGateRecord & {
  profile: NonNullable<ProductExtractionGateRecord["profile"]>;
} {
  if (
    record.status !== "ready" ||
    !record.profile ||
    record.validation?.valid !== true ||
    record.profile.readiness !== "readyForSpecification" ||
    !record.productPageUrl
  ) {
    return false;
  }

  return record.profile.evidence.some(
    (evidence) =>
      evidence.sourceType === "productPage" &&
      evidence.url === record.productPageUrl &&
      evidence.qualityState === "ready" &&
      Boolean(evidence.snapshotSha256?.trim()),
  );
}

function productEvidence(
  records: Array<
    ProductExtractionGateRecord & {
      profile: NonNullable<ProductExtractionGateRecord["profile"]>;
    }
  >,
): StageEvidenceRef[] {
  return records.flatMap((record) =>
    record.profile.evidence
      .filter(
        (evidence) =>
          evidence.sourceType === "productPage" &&
          evidence.url === record.productPageUrl &&
          evidence.qualityState === "ready" &&
          Boolean(evidence.snapshotSha256?.trim()),
      )
      .map((evidence) => ({
        evidenceId: `product:${record.catalogProductId}:${evidence.evidenceId}`,
        kind: "productPage" as const,
        sourceUrl: evidence.url,
        snapshotId: evidence.snapshotSha256,
      })),
  );
}

function firstDuplicate(values: string[]): string | undefined {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}

function stage(run: PcBuildRun, name: PcBuildStage) {
  const found = run.stages.find((item) => item.stage === name);
  if (!found) throw new Error(`Missing canonical stage ${name}`);
  return found;
}

function resetFrom(run: PcBuildRun, name: PcBuildStage): void {
  const index = run.stages.findIndex((item) => item.stage === name);
  if (index < 0) throw new Error(`Missing canonical stage ${name}`);
  for (const current of run.stages.slice(index)) {
    current.status = "pending";
    current.startedAt = undefined;
    current.completedAt = undefined;
    current.evidenceRefs = [];
    current.outputRefIds = [];
    current.diagnostics = [];
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function cloneRun(run: PcBuildRun): PcBuildRun {
  return {
    ...run,
    request: { ...run.request },
    provision: {
      ...run.provision,
      capabilities: [...run.provision.capabilities],
      tools: [...run.provision.tools],
      contextKeys: [...run.provision.contextKeys],
    },
    stages: run.stages.map((item) => ({
      ...item,
      evidenceRefs: item.evidenceRefs.map((evidence) => ({ ...evidence })),
      outputRefIds: [...item.outputRefIds],
      diagnostics: [...item.diagnostics],
    })),
    aiUsage: run.aiUsage.map((usage) => ({ ...usage })),
    selectedBuilds: run.selectedBuilds.map((build) => ({
      ...build,
      catalogProductIds: build.catalogProductIds
        ? [...build.catalogProductIds]
        : undefined,
      productProfileIds: [...build.productProfileIds],
    })),
    firstFailure: run.firstFailure ? { ...run.firstFailure } : undefined,
  };
}
