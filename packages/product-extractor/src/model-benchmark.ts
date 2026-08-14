import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRunId, runProductExtractionFromUrl } from "./url-runner.js";

export type ModelBenchmarkOptions = {
  url: string;
  models: string[];
  outputRoot?: string;
  locale?: string;
  intendedUseSummary?: string;
  fetchedAt?: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
};

export type ModelBenchmarkResult = {
  runRoot: string;
  summaryPath: string;
  rows: ModelBenchmarkRow[];
};

export type ModelBenchmarkRow = {
  model: string;
  runId?: string;
  runDir?: string;
  ok: boolean;
  extractionMode?: "ai" | "structuredFallback";
  productCategory?: string;
  readiness?: string;
  featureCount?: number;
  suitabilityInclude?: number;
  suitabilityReview?: number;
  suitabilityExclude?: number;
  fetchMs?: number;
  extractionMs?: number;
  totalMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  error?: string;
};

type TimingReport = {
  fetchMs?: number;
  extractionMs?: number;
  totalMs?: number;
};

type ProfileReport = {
  productCategory?: string;
  features?: unknown[];
};

type SuitabilityReport = {
  summary?: {
    include?: number;
    review?: number;
    exclude?: number;
  };
};

type CostRecord = {
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  estimatedCostUsd?: number;
};

export async function runModelBenchmark(
  options: ModelBenchmarkOptions,
): Promise<ModelBenchmarkResult> {
  if (!options.models.length) {
    throw new Error("At least one model is required for product extraction benchmark.");
  }

  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const runRoot = resolve(
    options.outputRoot ?? join(process.cwd(), "runs", "product-extraction-model-benchmark"),
    createRunId(new Date(fetchedAt)),
  );
  await mkdir(runRoot, { recursive: true });

  const rows: ModelBenchmarkRow[] = [];
  for (const model of options.models) {
    const modelRunId = safeRunId(model);
    try {
      const result = await runProductExtractionFromUrl({
        url: options.url,
        outputRoot: runRoot,
        runId: modelRunId,
        locale: options.locale,
        intendedUseSummary: options.intendedUseSummary,
        fetchedAt,
        fetchImpl: options.fetchImpl,
        env: {
          ...(options.env ?? process.env),
          PRODUCT_EXTRACTOR_MODEL: model,
        },
      });

      rows.push(await createBenchmarkRow(model, result.runId, result.runDir, result));
    } catch (error) {
      rows.push({
        model,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const summaryPath = join(runRoot, "model-benchmark-summary.json");
  await writeFile(summaryPath, `${JSON.stringify({ rows }, null, 2)}\n`, "utf8");

  return {
    runRoot,
    summaryPath,
    rows,
  };
}

async function createBenchmarkRow(
  model: string,
  runId: string,
  runDir: string,
  result: Awaited<ReturnType<typeof runProductExtractionFromUrl>>,
): Promise<ModelBenchmarkRow> {
  const profile = await readJson<ProfileReport>(join(runDir, "profile.json"));
  const suitability = await readJson<SuitabilityReport>(
    join(runDir, "suitability-report.json"),
  );
  const timing = await readJson<TimingReport>(join(runDir, "timing-report.json"));
  const costRecord = result.costLedgerPath
    ? await readCostRecord(result.costLedgerPath)
    : undefined;

  return {
    model,
    runId,
    runDir,
    ok: true,
    extractionMode: result.extractionMode,
    productCategory: result.productCategory,
    readiness: result.readiness,
    featureCount: profile.features?.length ?? 0,
    suitabilityInclude: suitability.summary?.include ?? 0,
    suitabilityReview: suitability.summary?.review ?? 0,
    suitabilityExclude: suitability.summary?.exclude ?? 0,
    fetchMs: timing.fetchMs,
    extractionMs: timing.extractionMs,
    totalMs: timing.totalMs,
    promptTokens: costRecord?.usage?.promptTokens,
    completionTokens: costRecord?.usage?.completionTokens,
    totalTokens: costRecord?.usage?.totalTokens,
    estimatedCostUsd: costRecord?.estimatedCostUsd,
  };
}

async function readCostRecord(path: string): Promise<CostRecord | undefined> {
  const text = (await readFile(path, "utf8")).trim();
  const firstLine = text.split("\n").find(Boolean);
  return firstLine ? (JSON.parse(firstLine) as CostRecord) : undefined;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function safeRunId(model: string): string {
  return model
    .toLocaleLowerCase("tr-TR")
    .replace(/^~/, "latest-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
