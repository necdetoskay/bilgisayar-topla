import { chromium, Locator, Page } from "playwright";
import { loadConfig } from "./config.js";
import { createRunContext, writeReport } from "./snapshot.js";
import { selectorGroups } from "./selectors.js";
import { ProductOption, ScraperReport, ScraperStep } from "./types.js";

const CPU_KEYWORDS = ["cpu", "islemci", "processor"];
const MOTHERBOARD_KEYWORDS = ["anakart", "motherboard", "mainboard"];
const PRICE_PATTERN = /(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})?\s*(?:tl|try|₺)/i;

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

function findFirstPrice(text: string): string | undefined {
  return text.match(PRICE_PATTERN)?.[0];
}

async function collectVisibleTexts(page: Page, limit = 80): Promise<string[]> {
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
  const count = Math.min(await candidates.count(), 500);

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const text = normalizeText((await candidate.textContent({ timeout: 500 }).catch(() => "")) ?? "");

    if (keywords.some((keyword) => text.includes(keyword)) && PRICE_PATTERN.test(text)) {
      return candidate;
    }
  }

  return undefined;
}

async function extractProductOptions(block: Locator, limit = 10): Promise<ProductOption[]> {
  const cardSelectors = selectorGroups.productCards.candidates.map((candidate) => candidate.selector);
  const options: ProductOption[] = [];

  for (const selector of cardSelectors) {
    const cards = block.locator(selector);
    const count = Math.min(await cards.count().catch(() => 0), limit);

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      const rawText = (await card.textContent({ timeout: 500 }).catch(() => ""))?.replace(/\s+/g, " ").trim();

      if (!rawText || !PRICE_PATTERN.test(rawText)) {
        continue;
      }

      options.push({
        category: "cpu",
        name: rawText.slice(0, 180),
        priceText: findFirstPrice(rawText),
        isAvailable: !normalizeText(rawText).includes("stokta yok"),
        rawText
      });
    }

    if (options.length > 0) {
      return options.slice(0, limit);
    }
  }

  return options;
}

async function trySelectFirstOption(cpuBlock: Locator): Promise<string | undefined> {
  for (const candidate of selectorGroups.selectButton.candidates) {
    const button = cpuBlock.locator(candidate.selector).first();

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

async function runProbe(): Promise<ScraperReport> {
  const config = loadConfig();
  const startedAt = new Date();
  const runContext = await createRunContext(config.runsDir, startedAt);
  const steps: ScraperStep[] = [];

  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(config.timeoutMs);

  try {
    steps.push({ name: "open_page", status: "running" });
    await page.goto(config.targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    steps[0] = { name: "open_page", status: "ok" };

    const categoryTexts = await collectVisibleTexts(page);
    const cpuBlock = await findBlockByKeywords(page, CPU_KEYWORDS);

    if (!cpuBlock) {
      const screenshotPath = await runContext.screenshot(page, "cpu-block-not-found");
      const report: ScraperReport = {
        ok: false,
        targetUrl: config.targetUrl,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        steps: [...steps, { name: "find_cpu_block", status: "failed", note: "CPU block was not found." }],
        categoryTexts,
        cpuOptions: [],
        screenshotPath
      };
      await writeReport(runContext, report);
      return report;
    }

    steps.push({ name: "find_cpu_block", status: "ok" });
    const cpuOptions = await extractProductOptions(cpuBlock);
    steps.push({
      name: "extract_cpu_options",
      status: cpuOptions.length > 0 ? "ok" : "failed",
      note: `${cpuOptions.length} CPU candidates found.`
    });

    let selectedBy: string | undefined;
    let motherboardDetected = false;

    if (cpuOptions.length > 0) {
      selectedBy = await trySelectFirstOption(cpuBlock);
      await page.waitForTimeout(2_000);
      const motherboardBlock = await findBlockByKeywords(page, MOTHERBOARD_KEYWORDS);
      motherboardDetected = Boolean(motherboardBlock);
      steps.push({
        name: "select_first_cpu",
        status: selectedBy ? "ok" : "failed",
        note: selectedBy ? `Clicked by selector candidate: ${selectedBy}` : "No select button candidate worked."
      });
      steps.push({
        name: "detect_motherboard_after_cpu",
        status: motherboardDetected ? "ok" : "failed"
      });
    }

    const screenshotPath = await runContext.screenshot(page, "probe-result");
    const report: ScraperReport = {
      ok: cpuOptions.length > 0,
      targetUrl: config.targetUrl,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      steps,
      categoryTexts,
      cpuOptions,
      selectedBy,
      motherboardDetected,
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

if (import.meta.url === `file://${process.argv[1]}`) {
  runProbe()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.ok ? 0 : 1);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
