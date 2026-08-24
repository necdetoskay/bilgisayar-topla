import type { Locator, Page } from "playwright";
import { findFirstPrice, parseTurkishPrice, PRICE_PATTERN } from "./price.js";
import { selectorGroups } from "./selectors.js";
import {
  cleanProductName,
  compactText,
  includesAnyNormalized,
  normalizeText
} from "./text.js";
import type {
  CategorySelectionRecord,
  ComponentCategory,
  ProductOption,
  ScraperDiagnostic,
  ScraperStep
} from "./types.js";

export const COMPONENT_CATEGORY_FLOW: ReadonlyArray<{
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

export type CategoryProbeResult = {
  optionsByCategory: Record<ComponentCategory, ProductOption[]>;
  categorySelections: CategorySelectionRecord[];
  coveredCategories: ComponentCategory[];
  missingCategories: ComponentCategory[];
  fullCategoryChainReady: boolean;
};

export async function probeCategoryChain(args: {
  page: Page;
  steps: ScraperStep[];
  diagnostics: ScraperDiagnostic[];
}): Promise<CategoryProbeResult> {
  const optionsByCategory = emptyOptionsByCategory();
  const categorySelections: CategorySelectionRecord[] = [];

  for (const definition of COMPONENT_CATEGORY_FLOW) {
    const block = await findCategoryBlock(args.page, definition.keywords);
    const categoryCode = definition.category.toUpperCase();

    if (!block) {
      args.steps.push({
        name: `find_${definition.category}_block`,
        status: "failed",
        note: `${definition.category} block was not found.`
      });
      args.diagnostics.push({
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

    args.steps.push({ name: `find_${definition.category}_block`, status: "ok" });
    const options = await extractProductOptions(block, definition.category);
    optionsByCategory[definition.category] = options;
    args.steps.push({
      name: `extract_${definition.category}_options`,
      status: options.length > 0 ? "ok" : "failed",
      note: `${options.length} ${definition.category} candidates found.`
    });

    if (options.length === 0) {
      args.diagnostics.push({
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
    args.steps.push({
      name: `select_first_${definition.category}`,
      status: selectedBy ? "ok" : "failed",
      note: selectedBy
        ? `Clicked by selector candidate: ${selectedBy}`
        : `No select button candidate worked for ${definition.category}.`
    });

    if (!selectedBy) {
      args.diagnostics.push({
        code: `${categoryCode}_SELECT_BUTTON_NOT_FOUND`,
        message: `${definition.category} options were extracted, but no selectable button candidate worked.`,
        details: { category: definition.category, optionCount: options.length }
      });
      break;
    }

    await args.page.waitForTimeout(1_500);
  }

  const coveredCategories = COMPONENT_CATEGORY_FLOW.map((item) => item.category).filter(
    (category) => optionsByCategory[category].length > 0
  );
  const missingCategories = COMPONENT_CATEGORY_FLOW.map((item) => item.category).filter(
    (category) => !coveredCategories.includes(category)
  );

  return {
    optionsByCategory,
    categorySelections,
    coveredCategories,
    missingCategories,
    fullCategoryChainReady: missingCategories.length === 0
  };
}

export async function extractPageTotalPrice(
  page: Page
): Promise<{ text?: string; value?: number }> {
  for (const candidate of selectorGroups.totalPrice.candidates) {
    const blocks = page.locator(candidate.selector);
    const count = Math.min(await blocks.count().catch(() => 0), 100);

    for (let index = 0; index < count; index += 1) {
      const rawText = compactText(
        (await blocks.nth(index).textContent({ timeout: 500 }).catch(() => "")) ?? ""
      );
      const normalized = normalizeText(rawText);

      if (!normalized.includes("toplam") && !normalized.includes("total")) {
        continue;
      }

      const priceText = findFirstPrice(rawText);
      if (priceText) {
        return { text: priceText, value: parseTurkishPrice(priceText) };
      }
    }
  }

  return {};
}

async function findCategoryBlock(
  page: Page,
  keywords: string[]
): Promise<Locator | undefined> {
  const candidates = page.locator("section,article,div,li");
  const count = Math.min(await candidates.count(), 700);
  let fallback: { locator: Locator; textLength: number } | undefined;

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const rawText =
      (await candidate.textContent({ timeout: 500 }).catch(() => "")) ?? "";
    const compact = compactText(rawText);

    if (!compact || !includesAnyNormalized(compact, keywords) || !PRICE_PATTERN.test(compact)) {
      continue;
    }

    const priceCount = countPrices(compact);
    if (priceCount >= 2) {
      if (!fallback || compact.length < fallback.textLength) {
        fallback = { locator: candidate, textLength: compact.length };
      }
      continue;
    }

    if (!fallback) {
      fallback = { locator: candidate, textLength: compact.length };
    }
  }

  return fallback?.locator;
}

async function extractProductOptions(
  block: Locator,
  category: ProductOption["category"],
  limit = 12
): Promise<ProductOption[]> {
  const cardSelectors = selectorGroups.productCards.candidates.map(
    (candidate) => candidate.selector
  );
  const options: ProductOption[] = [];

  for (const selector of cardSelectors) {
    const cards = block.locator(selector);
    const count = Math.min(await cards.count().catch(() => 0), limit);

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      const rawText = compactText(
        (await card.textContent({ timeout: 500 }).catch(() => "")) ?? ""
      );

      if (!rawText || !PRICE_PATTERN.test(rawText)) {
        continue;
      }

      const priceText = findFirstPrice(rawText);
      options.push({
        category,
        name: cleanProductName(rawText, priceText).slice(0, 180),
        priceText,
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

function countPrices(text: string): number {
  const globalPricePattern = new RegExp(PRICE_PATTERN.source, "gi");
  return text.match(globalPricePattern)?.length ?? 0;
}
