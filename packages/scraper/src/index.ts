export { COMPONENT_CATEGORY_FLOW, probeCategoryChain } from "./category-probe.js";
export { loadConfig } from "./config.js";
export { findFirstPrice, parseTurkishPrice } from "./price.js";
export { runScraperProbe } from "./run-scraper.js";
export { summarizeReport } from "./report.js";
export {
  cleanProductName,
  compactText,
  includesAnyNormalized,
  includesNormalizedKeyword,
  normalizeText
} from "./text.js";
export type {
  CategorySelectionRecord,
  ComponentCategory,
  ProductOption,
  ScraperConfig,
  ScraperDiagnostic,
  ScraperReport,
  SelectorCandidate,
  SelectorGroup
} from "./types.js";
