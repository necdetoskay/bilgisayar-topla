import { Page } from "playwright";

export type ComponentCategory = "cpu" | "motherboard" | "ram" | "gpu" | "ssd" | "psu" | "case";

export interface ProductOption {
  category: ComponentCategory;
  name: string;
  priceText?: string;
  priceValue?: number;
  isAvailable: boolean;
  rawText?: string;
}

export interface SelectorCandidate {
  name: string;
  selector: string;
  requiredText?: string;
  confidence: "high" | "medium" | "low";
}

export interface SelectorGroup {
  groupName: string;
  candidates: SelectorCandidate[];
}

export interface ScraperConfig {
  targetUrl: string;
  headless: boolean;
  timeoutMs: number;
  runsDir: string;
}

export interface ScraperStep {
  name: string;
  status: "running" | "ok" | "failed" | "skipped";
  note?: string;
}

export interface ScraperDiagnostic {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface ScraperReport {
  ok: boolean;
  targetUrl: string;
  startedAt: string;
  finishedAt: string;
  steps: ScraperStep[];
  diagnostics: ScraperDiagnostic[];
  categoryTexts: string[];
  cpuOptions: ProductOption[];
  motherboardOptions: ProductOption[];
  totalPriceText?: string;
  totalPriceValue?: number;
  selectedBy?: string;
  motherboardDetected?: boolean;
  screenshotPath?: string;
}

export interface RunContext {
  runDir: string;
  screenshot(page: Page, name: string): Promise<string>;
}
