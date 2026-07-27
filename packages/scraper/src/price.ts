export const PRICE_PATTERN = /(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})?\s*(?:tl|try|₺)/i;

export function findFirstPrice(text: string): string | undefined {
  return text.match(PRICE_PATTERN)?.[0];
}

export function parseTurkishPrice(text: string | undefined): number | undefined {
  if (!text) {
    return undefined;
  }

  const rawPrice = findFirstPrice(text);

  if (!rawPrice) {
    return undefined;
  }

  const normalized = rawPrice
    .replace(/(?:tl|try|₺)/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}
