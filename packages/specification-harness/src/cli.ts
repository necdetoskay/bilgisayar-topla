import { resolve } from "node:path";
import { defaultOutputRoot, runSpecificationFixture } from "./index.js";

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

async function main(): Promise<void> {
  const invocationCwd = process.env.INIT_CWD ?? process.cwd();
  const fixturePath =
    readArg("fixture") ??
    "packages/specification-harness/fixtures/printer-basic.json";
  const outputRoot = readArg("out") ?? defaultOutputRoot(invocationCwd);

  const result = await runSpecificationFixture({
    fixturePath: resolve(invocationCwd, fixturePath),
    outputRoot: resolve(outputRoot),
  });

  console.log(`runId=${result.runId}`);
  console.log(`readiness=${result.readiness}`);
  console.log(`draft=${result.draftPath}`);
  console.log(`compliance=${result.complianceReportPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
