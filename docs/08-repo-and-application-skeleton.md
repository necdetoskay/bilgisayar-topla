# Repo ve Uygulama Iskeleti

## Hedef

Bu dokuman, ilk kodlama asamasinda repoda kurulacak klasor yapisini tarif eder. Amac, scraping agent, karar motoru ve ileride eklenecek UI katmaninin birbirine karismadan gelismesidir.

## Onerilen Monorepo Yapisi

```text
bilgisayar-topla/
  apps/
    web/
  packages/
    scraper/
    engine/
    shared/
  docs/
  runs/
  tests/
```

## Klasorlerin Gorevleri

| Klasor | Gorev |
|---|---|
| `apps/web` | Kullanici arayuzu ve API endpoint'leri |
| `packages/scraper` | Playwright site otomasyonu |
| `packages/engine` | Profil, skor ve konfigurasyon mantigi |
| `packages/shared` | Ortak tipler ve yardimci fonksiyonlar |
| `docs` | Master plan, mimari ve sprint dokumanlari |
| `runs` | Lokal agent kosu ciktilari |
| `tests` | Entegrasyon ve kabul testleri |

## Ilk Kod Paketleri

Sprint 1 icin yalnizca su alanlar zorunludur:

```text
packages/
  scraper/
    src/
      index.ts
      config.ts
      selectors.ts
      run-scraper.ts
      snapshot.ts
      types.ts
```

## Merkezi Selector Dosyasi

Siteye bagimli seciciler `selectors.ts` icinde tutulmalidir. Boylece site yapisi degistiginde daginik kod aramak yerine tek noktadan mudahale edilir.

Ilk selector gruplari:

- page load indicators
- CPU category block candidates
- product card candidates
- product name candidates
- product price candidates
- select/add button candidates
- motherboard category candidates
- total price candidates

## Ortak Tipler

Ilk tipler sade tutulmalidir:

```ts
type ComponentCategory = "cpu" | "motherboard" | "ram" | "gpu" | "ssd" | "psu" | "case";

interface ProductOption {
  category: ComponentCategory;
  name: string;
  priceText?: string;
  priceValue?: number;
  isAvailable: boolean;
  rawText?: string;
}
```

## Runs Klasoru

`runs/` lokal debug ciktisi icindir. Baslangicta git'e eklenmemeli, yalnizca `.gitkeep` veya dokuman ile klasor amaci anlatilmalidir. Gercek run ciktisi buyuyebilir ve guncel site HTML'i tasiyabilir.

## Gelecek Asama

Sprint 2 ile `packages/engine` icinde ilk secim zinciri modeli baslayacaktir. Sprint 1 tamamlanmadan skor motoru veya UI eklenmemelidir.
