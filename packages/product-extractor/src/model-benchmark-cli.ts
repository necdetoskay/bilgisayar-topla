import { resolve } from "node:path";
import { loadEnvFiles } from "./env-file.js";
import { runModelBenchmark } from "./model-benchmark.js";

const DEFAULT_BENCHMARK_MODELS = [
  "deepseek/deepseek-v4-flash",
  "~deepseek/deepseek-v4-flash-latest",
];

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

function readUrlArg(): string | undefined {
  return process.argv.slice(2).find((arg) => !arg.startsWith("--"));
}

function readModels(): string[] {
  const rawValue = readArg("models") ?? process.env.PRODUCT_EXTRACTOR_BENCHMARK_MODELS;
  const models = rawValue
    ? rawValue.split(",").map((model) => model.trim()).filter(Boolean)
    : DEFAULT_BENCHMARK_MODELS;

  return [...new Set(models)];
}

async function main(): Promise<void> {
  const invocationCwd = process.env.INIT_CWD ?? process.cwd();
  await loadEnvFiles(invocationCwd);
  const url = readUrlArg() ?? readArg("url");

  if (!url) {
    throw new Error(
      "Product URL is required. Usage: product-extractor-model-benchmark <url> [--models=model-a,model-b] [--out=runs/model-benchmark]",
    );
  }

  const outputRoot = readArg("out")
    ? resolve(invocationCwd, readArg("out") ?? "")
    : resolve(invocationCwd, "runs", "product-extraction-model-benchmark");

  const result = await runModelBenchmark({
    url,
    outputRoot,
    locale: readArg("locale") ?? "tr-TR",
    intendedUseSummary: readArg("intendedUse"),
    models: readModels(),
  });

  console.log(`benchmarkRoot=${result.runRoot}`);
  console.log(`benchmarkSummary=${result.summaryPath}`);
  console.log("MODEL_BENCHMARK_START");
  for (const row of result.rows) {
    console.log(
      [
        `model=${row.model}`,
        `ok=${row.ok}`,
        `mode=${row.extractionMode ?? ""}`,
        `category=${row.productCategory ?? ""}`,
        `features=${row.featureCount ?? ""}`,
        `include=${row.suitabilityInclude ?? ""}`,
        `review=${row.suitabilityReview ?? ""}`,
        `exclude=${row.suitabilityExclude ?? ""}`,
        `fetchMs=${row.fetchMs ?? ""}`,
        `extractionMs=${row.extractionMs ?? ""}`,
        `totalMs=${row.totalMs ?? ""}`,
        `tokens=${row.totalTokens ?? ""}`,
        `usd=${row.estimatedCostUsd ?? ""}`,
        `error=${row.error ?? ""}`,
      ].join(" "),
    );
  }
  console.log("MODEL_BENCHMARK_END");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
