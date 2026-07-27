import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Page } from "playwright";
import { RunContext, ScraperReport } from "./types.js";

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function createRunContext(baseDir: string, startedAt: Date): Promise<RunContext> {
  const runDir = path.join(baseDir, formatTimestamp(startedAt));
  await mkdir(runDir, { recursive: true });

  return {
    runDir,
    async screenshot(page: Page, name: string): Promise<string> {
      const screenshotPath = path.join(runDir, `${name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      return screenshotPath;
    }
  };
}

export async function writeReport(context: RunContext, report: ScraperReport): Promise<string> {
  const reportPath = path.join(context.runDir, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}
