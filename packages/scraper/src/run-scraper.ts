import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, Locator, Page } from "playwright";
import { loadConfig } from "./config.js";
import { findFirstPrice, parseTurkishPrice, PRICE_PATTERN } from "./price.js";
import { summarizeReport } from "./report.js";
import { createRunContext, writeReport } from "./snapshot.js";
import { selectorGroups } from "./selectors.js";
import { compactText, normalizeText } from "./text.js";
import {
  CategorySelectionRecord,
  ComponentCategory,
  ProductOption,
  ScraperDiagnostic,
  ScraperReport,
  ScraperStep
} from "./types.js";

const CATEGORY_FLOW: ReadonlyArray<{
  category: ComponentCategory;
  keywords: string[];
  selectToAdvance: boolean;
}> = [
  { category: "cpu", keywords: ["cpu", "islemci", "processor"], selectToAdvance: true },
  {
    category: "motherboard",
    keywords: ["anakart", "motherboard", "mainboard"],
    selectToAdvance: true
  },
  { category: "ram", keywords: ["ram", "bellek", "memory"], selectToAdvance: true },
  {
    category: "gpu",
    keywords: ["ekran karti", "gpu", "graphics card", "display card"],
    selectToAdvance: true
  },
  { category: "ssd", keywords: ["ssd", "depolama", "storage"], selectToAdvance: true },
  {
    category: "psu",
    keywords: ["guc kaynagi", "power supply", "psu"],
    selectToAdvance: true
  },
  { category: "case", keywords: ["kasa", "case", "chassis"], selectToAdvance: false }
];

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

async function findBlockByKeywords(page: Page, keywords: string[]): Promise<Locator | undefined> {
  const candidates = page.locator("section,article,div,li");
  const count = Math.min(await candidates.count(), 700);

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const text = normalizeText((await candidate.textContent({ timeout: 500 }).catch(() => "")) ?? "");

    if (keywords.some((keyword) => text.includes(keyword)) && PRICE_PATTERN.test(text)) {
      return candidate;
    }
  }

  return undefined;
}

async function extractProductOptions(
  block: Locator,
  category: ProductOption["category"],
  limit = 12
): Promise<ProductOption[]> {
  const cardSelectors = selectorGroups.productCards.candidates.map((candidate) => candidate.selector);
  const options: ProductOption[] = [];

  for (const selector of cardSelectors) {
    const cards = block.locator(selector);
    const count = Math.min(await cards.count().catch(() => 0), limit);

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      const rawText = compactText((await card.textContent({ timeout: 500 }).catch(() => "")) ?? "");

      if (!rawText || !PRICE_PATTERN.test(rawText)) {
        continue;
      }

      options.push({
        category,
        name: rawText.slice(0, 180),
        priceText: findFirstPrice(rawText),
        priceValue: parseTurkishPrice(rawText),
        isAvailable: !normalizeText(rawText).includes("stokta yok"),
        rawText
      });
    }

    if (options.length > 0) {
      return deduplicateOptions(options).slice(0, limit);
    }
  }

  return options;
}

function deduplicateOptions(options: ProductOption[]): ProductOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = `${option.category}|${normalizeText(option.name)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function extractPageTotalPrice(page: Page): Promise<{ text?: string; value?: number }> {
  for (const candidate of selectorGroups.totalPrice.candidates) {
    const blocks = page.locator(candidate.selector);
    const count = Math.min(await blocks.count().catch(() => 0), 100);

    for (let index = 0; index < count; index += 1) {
      const rawText = compactText((await blocks.nth(index).textContent({ timeout: 500 }).catch(() => "")) ?? "");
      const normalized = normalizeText(rawText);

      if (!normalized.includes("toplam") && !normalized.includes("total")) {
        continue;
      }

      const priceText = findFirstPrice(rawText);

      if (priceText) {
        return {
          text: priceText,
          value: parseTurkishPrice(priceText)
        };
      }
    }
  }

  return {};
}

async function trySelectFirstOption(block: Locator): Promise<string | undefined> {
  for (const candidate of selectorGroups.selectButton.candidates) {
    const button = block.locator(candidate.selector).first();

    if ((await button.count().catch(() => 0)) === 0) {
      continue;
    }

    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 3_000 });
      return candidate.name;
    }
  }

  return undefined;
}

function emptyOptionsByCategory(): Record<ComponentCategory, ProductOption[]> {
  return {
    cpu: [],
    motherboard: [],
    ram: [],
    gpu: [],
    ssd: [],
    psu: [],
    case: []
  };
}

async function runProbe(): Promise<ScraperReport> {
  const config = loadConfig();
  const startedAt = new Date();
  const runContext = await createRunContext(config.runsDir, startedAt);
  const steps: ScraperStep[] = [];
  const diagnostics: ScraperDiagnostic[] = [];
  const categorySelections: CategorySelectionRecord[] = [];
  const optionsByCategory = emptyOptionsByCategory();

  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(config.timeoutMs);

  try {
    steps.push({ name: "open_page", status: "running" });
    await page.goto(config.targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    steps[0] = { name: "open_page", status: "ok" };

    const categoryTexts = await collectVisibleTexts(page);

    for (const definition of CATEGORY_FLOW) {
      const block = await findBlockByKeywords(page, definition.keywords);
      const categoryCode = definition.category.toUpperCase();

      if (!block) {
        steps.push({
          name: `find_${definition.category}_block`,
          status: "failed",
          note: `${definition.category} block was not found.`
        });
        diagnostics.push({
          code: `${categoryCode}_BLOCK_NOT_FOUND`,
          message: `${definition.category} block was not found by keyword and price signals.`,
          details: { category: definition.category }
        });
        categorySelections.push({
          category: definition.category,
          optionCount: 0,
          blockDetected: false,
          selectionAttempted: false
        });
        break;
      }

      steps.push({ name: `find_${definition.category}_block`, status: "ok" });
      const options = await extractProductOptions(block, definition.category);
      optionsByCategory[definition.category] = options;
      steps.push({
        name: `extract_${definition.category}_options`,
        status: options.length > 0 ? "ok" : "failed",
        note: `${options.length} ${definition.category} candidates found.`
      });

      if (options.length === 0) {
        diagnostics.push({
          code: `${categoryCode}_OPTIONS_NOT_FOUND`,
          message: `${definition.category} block was detected but no priced product options were extracted.`,
          details: { category: definition.category }
        });
        categorySelections.push({
          category: definition.category,
          optionCount: 0,
          blockDetected: true,
          selectionAttempted: false
        });
        break;
      }

      if (!definition.selectToAdvance) {
        categorySelections.push({
          category: definition.category,
          optionCount: options.length,
          blockDetected: true,
          selectionAttempted: false
        });
        continue;
      }

      const selectedBy = await trySelectFirstOption(block);
      categorySelections.push({
        category: definition.category,
        optionCount: options.length,
        blockDetected: true,
        selectedBy,
        selectionAttempted: true
      });
      steps.push({
        name: `select_first_${definition.category}`,
        status: selectedBy ? "ok" : "failed",
        note: selectedBy
          ? `Clicked by selector candidate: ${selectedBy}`
          : `No select button candidate worked for ${definition.category}.`
      });

      if (!selectedBy) {
        diagnostics.push({
          code: `${categoryCode}_SELECT_BUTTON_NOT_FOUND`,
          message: `${definition.category} options were extracted, but no selectable button candidate worked.`,
          details: { category: definition.category, optionCount: options.length }
        });
        break;
      }

      await page.waitForTimeout(1_500);
    }

    const totalPrice = await extractPageTotalPrice(page);
    steps.push({
      name: "extract_total_price",
      status: totalPrice.text ? "ok" : "skipped",
      note: totalPrice.text
        ? `Detected total price: ${totalPrice.text}`
        : "Total price was not detected."
    });

    const coveredCategories = CATEGORY_FLOW.map((item) => item.category).filter(
      (category) => optionsByCategory[category].length > 0
    );
    const missingCategories = CATEGORY_FLOW.map((item) => item.category).filter(
      (category) => !coveredCategories.includes(category)
    );
    const fullCategoryChainReady = missingCategories.length === 0;
    const cpuSelection = categorySelections.find((record) => record.category === "cpu");
    const screenshotPath = await runContext.screenshot(page, "probe-result");

    const report: ScraperReport = {
      // Backward-compatible Sprint 1 health signal: CPU extraction means the probe itself ran.
      // Full catalog readiness is tracked separately by fullCategoryChainReady.
      ok: optionsByCategory.cpu.length > 0,
      targetUrl: config.targetUrl,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      steps,
      diagnostics,
      categoryTexts,
      cpuOptions: optionsByCategory.cpu,
      motherboardOptions: optionsByCategory.motherboard,
      ramOptions: optionsByCategory.ram,
      gpuOptions: optionsByCategory.gpu,
      ssdOptions: optionsByCategory.ssd,
      psuOptions: optionsByCategory.psu,
      caseOptions: optionsByCategory.case,
      categorySelections,
      coveredCategories,
      missingCategories,
      fullCategoryChainReady,
      totalPriceText: totalPrice.text,
      totalPriceValue: totalPrice.value,
      selectedBy: cpuSelection?.selectedBy,
      motherboardDetected: optionsByCategory.motherboard.length > 0,
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
