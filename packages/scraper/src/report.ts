import { ScraperReport } from "./types.js";

export function summarizeReport(report: ScraperReport): string {
  const lines = [
    `ok=${report.ok}`,
    `target=${report.targetUrl}`,
    `cpuOptions=${report.cpuOptions.length}`,
    `selectedBy=${report.selectedBy ?? "none"}`,
    `motherboardDetected=${report.motherboardDetected ?? false}`,
    `screenshot=${report.screenshotPath ?? "none"}`
  ];

  return lines.join("\n");
}
