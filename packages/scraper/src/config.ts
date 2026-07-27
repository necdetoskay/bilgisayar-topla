import { ScraperConfig } from "./types.js";

const DEFAULT_TARGET_URL = "https://www.incehesap.com/oyun-bilgisayari-toplama/";

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function readNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(): ScraperConfig {
  return {
    targetUrl: process.env.TARGET_URL ?? DEFAULT_TARGET_URL,
    headless: readBoolean(process.env.HEADLESS, false),
    timeoutMs: readNumber(process.env.TIMEOUT_MS, 30_000),
    runsDir: process.env.RUNS_DIR ?? "runs/local"
  };
}
