import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { generateSpecificationDraft } from "@bilgisayar-topla/specification";

export type HarnessRunOptions = {
  fixturePath: string;
  outputRoot: string;
  runId?: string;
};

export type HarnessRunResult = {
  runId: string;
  runDir: string;
  draftPath: string;
  complianceReportPath: string;
  readiness: string;
};

export async function runSpecificationFixture(
  options: HarnessRunOptions,
): Promise<HarnessRunResult> {
  const runId = options.runId ?? createRunId();
  const runDir = resolve(options.outputRoot, runId);
  const fixture = JSON.parse(await readFile(options.fixturePath, "utf8")) as unknown;
  const result = generateSpecificationDraft(fixture);

  await mkdir(runDir, { recursive: true });

  const draftPath = join(runDir, "draft-specification.md");
  const complianceReportPath = join(runDir, "compliance-report.json");

  await writeFile(
    draftPath,
    result.draft?.markdown ?? "# Teknik Sartname Taslagi\n\nTaslak uretilemedi.\n",
    "utf8",
  );
  await writeFile(
    complianceReportPath,
    `${JSON.stringify(result.complianceReport, null, 2)}\n`,
    "utf8",
  );

  return {
    runId,
    runDir,
    draftPath,
    complianceReportPath,
    readiness: result.readiness,
  };
}

export function defaultOutputRoot(cwd = process.cwd()): string {
  return resolve(cwd, "runs", "local");
}

export function createRunId(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}
