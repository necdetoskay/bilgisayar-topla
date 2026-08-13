import { resolve } from "node:path";
import {
  defaultUrlRunOutputRoot,
  runProductExtractionFromUrl,
} from "./url-runner.js";
import { loadEnvFiles } from "./env-file.js";

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

function readUrlArg(): string | undefined {
  return process.argv.slice(2).find((arg) => !arg.startsWith("--"));
}

async function main(): Promise<void> {
  const invocationCwd = process.env.INIT_CWD ?? process.cwd();
  await loadEnvFiles(invocationCwd);
  const url = readUrlArg() ?? readArg("url");

  if (!url) {
    throw new Error(
      "Product URL is required. Usage: product-extractor-url <url> [--out=runs/product-extraction]",
    );
  }

  const outputRoot = readArg("out")
    ? resolve(invocationCwd, readArg("out") ?? "")
    : defaultUrlRunOutputRoot(invocationCwd);

  const result = await runProductExtractionFromUrl({
    url,
    outputRoot,
    locale: readArg("locale") ?? "tr-TR",
    intendedUseSummary: readArg("intendedUse"),
  });

  console.log(`runId=${result.runId}`);
  console.log(`readiness=${result.readiness}`);
  console.log(`extractionMode=${result.extractionMode}`);
  console.log(`productCategory=${result.productCategory}`);
  console.log(`profile=${result.profilePath}`);
  console.log(`suitability=${result.suitabilityReportPath}`);
  console.log(`draft=${result.draftPath}`);
  console.log(`compliance=${result.complianceReportPath}`);
  if (result.costLedgerPath) {
    console.log(`costLedger=${result.costLedgerPath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
