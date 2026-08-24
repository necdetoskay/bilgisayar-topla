export function normalizeText(value: string): string {
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

export function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function includesAnyNormalized(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => includesNormalizedKeyword(value, keyword));
}

export function includesNormalizedKeyword(value: string, keyword: string): boolean {
  const normalizedValue = normalizeText(value);
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) {
    return false;
  }

  if (normalizedKeyword.includes(" ")) {
    return normalizedValue.includes(normalizedKeyword);
  }

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokenPattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i");
  return tokenPattern.test(normalizedValue);
}

export function cleanProductName(rawText: string, priceText?: string): string {
  let cleaned = compactText(rawText);

  if (priceText) {
    cleaned = cleaned.split(priceText).join(" ");
  }

  cleaned = cleaned
    .replace(/(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})?\s*(?:tl|try|₺)/gi, " ")
    .replace(/\b(?:sepete ekle|sepet|sec|seç|ekle|satın al|satin al)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || compactText(rawText);
}
