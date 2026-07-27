# Teknik Stack ve Komutlar

## Ilk Teknik Kararlar

Bu proje icin ilk uygulama stack'i sade tutulmalidir.

| Alan | Karar |
|---|---|
| Runtime | Node.js LTS |
| Package manager | pnpm |
| Dil | TypeScript |
| Browser automation | Playwright |
| Ilk uygulama tipi | CLI scraper prototipi |
| UI | Sprint 3 veya sonrasi |
| Database | Sprint 2 veya sonrasi karar |
| AI provider | Sprint 2 veya sonrasi karar |

## Neden Once CLI

Ilk prototip web arayuzu ile baslamamalidir. Bu projede en buyuk risk UI degil, Incehesap konfigurator akisini guvenilir sekilde okuyabilmektir.

CLI prototipin avantajlari:

- Daha hizli test edilir.
- Browser automation hatalari daha kolay gorulur.
- Screenshot ve debug raporu rahat uretilir.
- UI kararlari scraper riskini gizlemez.

## Onerilen Komutlar

Root `package.json` icinde ilk asamada su script'ler bulunmalidir:

```json
{
  "scripts": {
    "scraper:install": "pnpm --filter @bilgisayar-topla/scraper exec playwright install chromium",
    "scraper:run": "pnpm --filter @bilgisayar-topla/scraper run start",
    "typecheck": "pnpm -r run typecheck"
  }
}
```

Scraper paketi icinde:

```json
{
  "scripts": {
    "start": "tsx src/run-scraper.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

## Windows PowerShell Akisi

Ilk kurulum icin beklenen komut sirasi:

```powershell
cd C:\Users\noskay\Documents\GitHub\bilgisayar-topla

pnpm install

pnpm scraper:install

pnpm scraper:run
```

## Environment Degiskenleri

Sprint 1 icin zorunlu environment degiskeni olmamalidir.

Ileride eklenebilecek degiskenler:

| Degisken | Amac |
|---|---|
| `TARGET_URL` | Varsayilan Incehesap toplama sayfasini ezmek |
| `HEADLESS` | Browser'i gorunur veya headless calistirmak |
| `RUNS_DIR` | Debug rapor klasorunu degistirmek |
| `AI_PROVIDER_API_KEY` | AI aciklama katmani icin provider anahtari |

## Ilk Varsayilanlar

Sprint 1 icin onerilen varsayilanlar:

| Ayar | Deger |
|---|---|
| URL | `https://www.incehesap.com/oyun-bilgisayari-toplama/` |
| Browser | Chromium |
| Headless | false |
| Timeout | 30000 ms |
| Run output | `runs/local/` |

## Git Ignore Kurallari

Ilk `.gitignore` su alanlari dislamalidir:

```text
node_modules/
dist/
.turbo/
.next/
coverage/
runs/
playwright-report/
test-results/
.env
.env.*
```

## Versiyonlama Notu

Scraper selector degisiklikleri kucuk gorunse bile onemlidir. Bu nedenle selector degisiklikleri commit mesajinda acikca belirtilmelidir.

Ornek:

```text
fix(scraper): update cpu option selectors
```

## Sprint 1 Commit Mesajlari

Onerilen commit mesajlari:

```text
chore: scaffold pnpm typescript workspace
```

```text
feat(scraper): add initial incehesap page probe
```

```text
docs: add sprint 1 implementation checklist
```
