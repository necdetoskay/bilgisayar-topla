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
  timingReportPath: string;
  aiAttemptReportPath?: string;
  readiness: string;
};

type AiAttemptReport = {
  attempts: AiAttemptReportItem[];
  summary: {
    attempted: number;
    succeeded: number;
    failed: number;
    billableFailed: number;
    estimatedCostUsd: number;
  };
};

type AiAttemptReportItem = {
  model: string;
  status: "succeeded" | "failed";
  durationMs: number;
  error?: string;
  costRecordCount: number;
  estimatedCostUsd: number;
};

type TimingReport = {
  fetchMs: number;
  htmlReadMs: number;
  extractionMs: number;
  specificationMs: number;
  totalMs: number;
  aiTimeoutMs?: number;
  model?: string;
  attemptedModels?: string[];
  successfulModel?: string;
  extractionMode?: "ai" | "structuredFallback";
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
  const model = productExtractorModelFromEnv(env);
  const modelCandidates = productExtractorModelCandidatesFromEnv(env, model);
  const attemptedModels: string[] = [];
  const aiAttempts: AiAttemptReportItem[] = [];
  let successfulModel: string | undefined;
  const aiTimeoutMs = productExtractorTimeoutFromEnv(env);
  const startedAtMs = nowMs();

  await mkdir(runDir, { recursive: true });

  const fetchStartedAtMs = nowMs();
  const pageResponse = await fetchProductPage(fetchImpl, options.url);
  const fetchFinishedAtMs = nowMs();
  if (!pageResponse.ok) {
    await writeJson(join(runDir, "fetch-error.json"), {
      url: options.url,
      status: pageResponse.status,
      statusText: pageResponse.statusText,
      fetchedAt,
      reason: "Product page fetch failed before feature extraction.",
    });
    throw new Error(`Product page fetch failed with status ${pageResponse.status}.`);
  }

  const htmlReadStartedAtMs = nowMs();
  const html = await pageResponse.text();
  const htmlReadFinishedAtMs = nowMs();
  const extractionStartedAtMs = nowMs();
  const extraction = await extractProductFeatureProfile({
    url: options.url,
    html,
    fetchedAt,
    locale: options.locale ?? "tr-TR",
    intendedUseSummary: options.intendedUseSummary,
    aiExtractor: apiKey
      ? async (input) => {
          const errors: string[] = [];
          for (const candidate of modelCandidates) {
            attemptedModels.push(candidate);
            const attemptStartedAtMs = nowMs();
            const costRecordStartIndex = costRecords.length;
            try {
              const output = await createOpenRouterProductFeatureExtractor({
                apiKey,
                model: candidate,
                fetchImpl,
                costLedger: createInMemoryCostLedger(costRecords),
                requestTimeoutMs: aiTimeoutMs,
              })(input);
              successfulModel = candidate;
              aiAttempts.push(
                createAiAttemptReportItem({
                  model: candidate,
                  status: "succeeded",
                  durationMs: elapsedMs(attemptStartedAtMs, nowMs()),
                  costRecords: costRecords.slice(costRecordStartIndex),
                }),
              );
              return output;
            } catch (error) {
              const message = errorMessage(error);
              aiAttempts.push(
                createAiAttemptReportItem({
                  model: candidate,
                  status: "failed",
                  durationMs: elapsedMs(attemptStartedAtMs, nowMs()),
                  error: message,
                  costRecords: costRecords.slice(costRecordStartIndex),
                }),
              );
              errors.push(`${candidate}: ${message}`);
            }
          }

          throw new Error(`All OpenRouter model attempts failed. ${errors.join(" | ")}`);
        }
      : undefined,
  });
  const extractionFinishedAtMs = nowMs();
  const specificationStartedAtMs = nowMs();
  const specification = generateSpecificationDraft(extraction.profile);
  const specificationFinishedAtMs = nowMs();

  const profilePath = join(runDir, "profile.json");
  const draftPath = join(runDir, "draft-specification.md");
  const complianceReportPath = join(runDir, "compliance-report.json");
  const suitabilityReportPath = join(runDir, "suitability-report.json");
  const costLedgerPath = costRecords.length ? join(runDir, "cost-ledger.jsonl") : undefined;
  const timingReportPath = join(runDir, "timing-report.json");
  const aiAttemptReportPath = aiAttempts.length ? join(runDir, "ai-attempts.json") : undefined;
  const timingReport: TimingReport = {
    fetchMs: elapsedMs(fetchStartedAtMs, fetchFinishedAtMs),
    htmlReadMs: elapsedMs(htmlReadStartedAtMs, htmlReadFinishedAtMs),
    extractionMs: elapsedMs(extractionStartedAtMs, extractionFinishedAtMs),
    specificationMs: elapsedMs(specificationStartedAtMs, specificationFinishedAtMs),
    totalMs: elapsedMs(startedAtMs, nowMs()),
    aiTimeoutMs: apiKey ? aiTimeoutMs : undefined,
    model: apiKey ? model : undefined,
    attemptedModels: apiKey ? attemptedModels : undefined,
    successfulModel,
    extractionMode: extraction.extractionMode,
  };

  await writeJson(profilePath, extraction.profile);
  await writeFile(
    draftPath,
    specification.draft?.markdown ?? "# Teknik Sartname Taslagi\n\nTaslak uretilemedi.\n",
    "utf8",
  );
  await writeJson(complianceReportPath, specification.complianceReport);
  await writeJson(suitabilityReportPath, createSuitabilityReport(extraction.profile));
  await writeJson(timingReportPath, timingReport);
  if (aiAttemptReportPath) {
    await writeJson(aiAttemptReportPath, createAiAttemptReport(aiAttempts));
  }

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
    timingReportPath,
    aiAttemptReportPath,
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

function createAiAttemptReport(attempts: AiAttemptReportItem[]): AiAttemptReport {
  const estimatedCostUsd = attempts.reduce(
    (sum, attempt) => sum + attempt.estimatedCostUsd,
    0,
  );
  const failedAttempts = attempts.filter((attempt) => attempt.status === "failed");

  return {
    attempts,
    summary: {
      attempted: attempts.length,
      succeeded: attempts.filter((attempt) => attempt.status === "succeeded").length,
      failed: failedAttempts.length,
      billableFailed: failedAttempts.filter((attempt) => attempt.costRecordCount > 0)
        .length,
      estimatedCostUsd,
    },
  };
}

function createAiAttemptReportItem(input: {
  model: string;
  status: AiAttemptReportItem["status"];
  durationMs: number;
  error?: string;
  costRecords: ProductExtractionCostRecord[];
}): AiAttemptReportItem {
  return {
    model: input.model,
    status: input.status,
    durationMs: input.durationMs,
    error: input.error,
    costRecordCount: input.costRecords.length,
    estimatedCostUsd: input.costRecords.reduce(
      (sum, record) => sum + record.estimatedCostUsd,
      0,
    ),
  };
}

function productExtractorTimeoutFromEnv(env: NodeJS.ProcessEnv): number {
  const rawValue = env.PRODUCT_EXTRACTOR_AI_TIMEOUT_MS;
  if (!rawValue) {
    return 15_000;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : 15_000;
}

function productExtractorModelCandidatesFromEnv(
  env: NodeJS.ProcessEnv,
  primaryModel: string,
): string[] {
  const retryCount = productExtractorRetryCountFromEnv(env);
  const fallbackModels = (env.PRODUCT_EXTRACTOR_FALLBACK_MODELS ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [
    ...Array.from({ length: retryCount + 1 }, () => primaryModel),
    ...fallbackModels,
  ];
}

function productExtractorRetryCountFromEnv(env: NodeJS.ProcessEnv): number {
  const rawValue = env.PRODUCT_EXTRACTOR_MODEL_RETRY_COUNT;
  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAtMs: number, finishedAtMs: number): number {
  return Math.max(0, Math.round(finishedAtMs - startedAtMs));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

function fetchProductPage(fetchImpl: typeof fetch, url: string): Promise<Response> {
  return fetchImpl(url, {
    headers: {
      "accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    },
  });
}
