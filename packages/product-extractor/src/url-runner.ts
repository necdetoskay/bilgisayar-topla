import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { generateSpecificationDraft } from "@bilgisayar-topla/specification";
import type { ProductFeatureProfile } from "@bilgisayar-topla/shared-contracts";
import {
  type ProductExtractionCostLedger,
  type ProductExtractionCostRecord,
} from "./cost-ledger.js";
import { extractProductFeatureProfile } from "./index.js";
import { productExtractorModelFromEnv } from "./model-policy.js";
import { createOpenRouterProductFeatureExtractor } from "./openrouter-adapter.js";

export type UrlRunnerOptions = {
  url: string;
  outputRoot?: string;
  runId?: string;
  locale?: string;
  intendedUseSummary?: string;
  fetchedAt?: string;
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
};

export type UrlRunnerResult = {
  runId: string;
  runDir: string;
  extractionMode: "ai" | "structuredFallback";
  productCategory: string;
  profilePath: string;
  draftPath: string;
  complianceReportPath: string;
  suitabilityReportPath: string;
  costLedgerPath?: string;
  readiness: string;
};

type SuitabilityReport = {
  summary: {
    include: number;
    review: number;
    exclude: number;
  };
  included: SuitabilityReportItem[];
  reviewRequired: SuitabilityReportItem[];
  excluded: SuitabilityReportItem[];
};

type SuitabilityReportItem = {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  featureClass?: string;
  decision?: string;
  riskLevel?: string;
  confidence?: number;
  reason?: string;
  suggestedClauseText?: string;
};

export async function runProductExtractionFromUrl(
  options: UrlRunnerOptions,
): Promise<UrlRunnerResult> {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const runId = options.runId ?? createRunId(new Date(fetchedAt));
  const outputRoot = options.outputRoot ?? defaultUrlRunOutputRoot();
  const runDir = resolve(outputRoot, runId);
  const costRecords: ProductExtractionCostRecord[] = [];
  const apiKey = env.OPENROUTER_API_KEY;

  const pageResponse = await fetchImpl(options.url);
  if (!pageResponse.ok) {
    throw new Error(`Product page fetch failed with status ${pageResponse.status}.`);
  }

  const html = await pageResponse.text();
  const extraction = await extractProductFeatureProfile({
    url: options.url,
    html,
    fetchedAt,
    locale: options.locale ?? "tr-TR",
    intendedUseSummary: options.intendedUseSummary,
    aiExtractor: apiKey
      ? createOpenRouterProductFeatureExtractor({
          apiKey,
          model: productExtractorModelFromEnv(env),
          fetchImpl,
          costLedger: createInMemoryCostLedger(costRecords),
        })
      : undefined,
  });
  const specification = generateSpecificationDraft(extraction.profile);

  await mkdir(runDir, { recursive: true });

  const profilePath = join(runDir, "profile.json");
  const draftPath = join(runDir, "draft-specification.md");
  const complianceReportPath = join(runDir, "compliance-report.json");
  const suitabilityReportPath = join(runDir, "suitability-report.json");
  const costLedgerPath = costRecords.length ? join(runDir, "cost-ledger.jsonl") : undefined;

  await writeJson(profilePath, extraction.profile);
  await writeFile(
    draftPath,
    specification.draft?.markdown ?? "# Teknik Sartname Taslagi\n\nTaslak uretilemedi.\n",
    "utf8",
  );
  await writeJson(complianceReportPath, specification.complianceReport);
  await writeJson(suitabilityReportPath, createSuitabilityReport(extraction.profile));

  if (costLedgerPath) {
    await writeFile(
      costLedgerPath,
      `${costRecords.map((record) => JSON.stringify(record)).join("\n")}\n`,
      "utf8",
    );
  }

  return {
    runId,
    runDir,
    extractionMode: extraction.extractionMode,
    productCategory: extraction.profile.productCategory,
    profilePath,
    draftPath,
    complianceReportPath,
    suitabilityReportPath,
    costLedgerPath,
    readiness: specification.readiness,
  };
}

export function defaultUrlRunOutputRoot(cwd = process.cwd()): string {
  return resolve(cwd, "runs", "product-extraction");
}

export function createRunId(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function createInMemoryCostLedger(
  records: ProductExtractionCostRecord[],
): ProductExtractionCostLedger {
  return {
    record: (record) => {
      records.push(record);
    },
  };
}

function createSuitabilityReport(profile: ProductFeatureProfile): SuitabilityReport {
  const report: SuitabilityReport = {
    summary: {
      include: 0,
      review: 0,
      exclude: 0,
    },
    included: [],
    reviewRequired: [],
    excluded: [],
  };

  for (const feature of profile.features) {
    const item: SuitabilityReportItem = {
      key: feature.key,
      label: feature.label,
      value: feature.value,
      unit: feature.unit,
      featureClass: feature.specSuitability?.featureClass,
      decision: feature.specSuitability?.decision,
      riskLevel: feature.specSuitability?.riskLevel,
      confidence: feature.specSuitability?.confidence,
      reason: feature.specSuitability?.reason,
      suggestedClauseText: feature.specSuitability?.suggestedClauseText,
    };

    if (feature.specSuitability?.decision === "include") {
      report.summary.include += 1;
      report.included.push(item);
    } else if (feature.specSuitability?.decision === "review") {
      report.summary.review += 1;
      report.reviewRequired.push(item);
    } else {
      report.summary.exclude += 1;
      report.excluded.push(item);
    }
  }

  return report;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
