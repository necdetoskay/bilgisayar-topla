export { loadConfig } from "./config.js";
export { findFirstPrice, parseTurkishPrice } from "./price.js";
export { runScraperProbe } from "./run-scraper.js";
export { summarizeReport } from "./report.js";
export { compactText, includesAnyNormalized, normalizeText } from "./text.js";
export type {
  ComponentCategory,
  ProductOption,
  ScraperConfig,
  ScraperDiagnostic,
  ScraperReport,
  SelectorCandidate,
  SelectorGroup
} from "./types.js";
