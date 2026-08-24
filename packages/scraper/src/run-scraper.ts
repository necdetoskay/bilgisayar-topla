import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, Page } from "playwright";
import { probeCategoryChain, extractPageTotalPrice } from "./category-probe.js";
import { loadConfig } from "./config.js";
import { summarizeReport } from "./report.js";
import { createRunContext, writeReport } from "./snapshot.js";
import type { ScraperDiagnostic, ScraperReport, ScraperStep } from "./types.js";

async function collectVisibleTexts(page: Page, limit = 120): Promise<string[]> {
  return page.locator("h1,h2,h3,h4,h5,button,[role=button],label,summary").evaluateAll(
    (elements, maxItems) =>
      elements
        .map((element) => (element.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, Number(maxItems)),
    limit
  );
}

async function runProbe(): Promise<ScraperReport> {
  const config = loadConfig();
  const startedAt = new Date();
  const runContext = await createRunContext(config.runsDir, startedAt);
  const steps: ScraperStep[] = [];
  const diagnostics: ScraperDiagnostic[] = [];

  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(config.timeoutMs);

  try {
    steps.push({ name: "open_page", status: "running" });
    await page.goto(config.targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    steps[0] = { name: "open_page", status: "ok" };

    const categoryTexts = await collectVisibleTexts(page);
    const categoryProbe = await probeCategoryChain({ page, steps, diagnostics });
    const totalPrice = await extractPageTotalPrice(page);

    steps.push({
      name: "extract_total_price",
      status: totalPrice.text ? "ok" : "skipped",
      note: totalPrice.text
        ? `Detected total price: ${totalPrice.text}`
        : "Total price was not detected."
    });

    const cpuSelection = categoryProbe.categorySelections.find(
      (record) => record.category === "cpu"
    );
    const screenshotPath = await runContext.screenshot(page, "probe-result");
    const options = categoryProbe.optionsByCategory;

    const report: ScraperReport = {
      // Keep the original Sprint 1 probe-health meaning for backward compatibility.
      // Full catalog readiness is represented separately by fullCategoryChainReady.
      ok: options.cpu.length > 0,
      targetUrl: config.targetUrl,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      steps,
      diagnostics,
      categoryTexts,
      cpuOptions: options.cpu,
      motherboardOptions: options.motherboard,
      ramOptions: options.ram,
      gpuOptions: options.gpu,
      ssdOptions: options.ssd,
      psuOptions: options.psu,
      caseOptions: options.case,
      categorySelections: categoryProbe.categorySelections,
      coveredCategories: categoryProbe.coveredCategories,
      missingCategories: categoryProbe.missingCategories,
      fullCategoryChainReady: categoryProbe.fullCategoryChainReady,
      totalPriceText: totalPrice.text,
      totalPriceValue: totalPrice.value,
      selectedBy: cpuSelection?.selectedBy,
      motherboardDetected: options.motherboard.length > 0,
      screenshotPath
    };

    await writeReport(runContext, report);
    return report;
  } finally {
    await browser.close();
  }
}

export async function runScraperProbe(): Promise<ScraperReport> {
  return runProbe();
}

function isDirectRun(): boolean {
  const entryPath = process.argv[1];

  if (!entryPath) {
    return false;
  }

  return resolve(fileURLToPath(import.meta.url)) === resolve(entryPath);
}

if (isDirectRun()) {
  runProbe()
    .then((report) => {
      console.log(summarizeReport(report));
      process.exit(report.ok ? 0 : 1);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
