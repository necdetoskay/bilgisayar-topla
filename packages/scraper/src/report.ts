import { ScraperReport } from "./types.js";

export function summarizeReport(report: ScraperReport): string {
  const lines = [
    `ok=${report.ok}`,
    `target=${report.targetUrl}`,
    `cpuOptions=${report.cpuOptions.length}`,
    `selectedBy=${report.selectedBy ?? "none"}`,
    `motherboardDetected=${report.motherboardDetected ?? false}`,
    `motherboardOptions=${report.motherboardOptions.length}`,
    `ramOptions=${report.ramOptions?.length ?? 0}`,
    `gpuOptions=${report.gpuOptions?.length ?? 0}`,
    `ssdOptions=${report.ssdOptions?.length ?? 0}`,
    `psuOptions=${report.psuOptions?.length ?? 0}`,
    `caseOptions=${report.caseOptions?.length ?? 0}`,
    `fullCategoryChainReady=${report.fullCategoryChainReady ?? false}`,
    `missingCategories=${report.missingCategories?.join(",") || "none"}`,
    `totalPrice=${report.totalPriceText ?? "none"}`,
    `screenshot=${report.screenshotPath ?? "none"}`
  ];

  return lines.join("\n");
}
