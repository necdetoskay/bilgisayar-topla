# Bilgisayar Topla

Incehesap bilgisayar toplama sayfasini kullanarak, kullanicinin butcesi ve kullanim amacina gore en iyi bilgisayar konfigurasyonlarini oneren AI destekli agent projesi.

Projenin hedefi yalnizca parca secmek degildir. Sistem once kullanicinin gercek yazilim/is yuku ihtiyacini anlayacak, resmi yazilim gereksinimlerini kanit olarak kullanacak, buna gore donanim hedef profili cikaracak, Incehesap uzerinden uyumlu sistem toplayacak ve istenirse toplanan bilgisayari kamu alimi icin marka/model isaret etmeyen teknik sartname taslagina donusturecektir.

## Temel Yaklasim

- Veri kaynagi: Incehesap bilgisayar toplama sayfasi.
- Otomasyon: Playwright tabanli browser agent.
- Gereksinim modeli: Resmi yazilim gereksinimleri ve kanit zinciri.
- Ortak veri sozlesmesi: Tum urun/cihaz ozellikleri `ProductFeatureProfile` yapisina normalize edilir.
- Karar motoru: Kural tabanli uyumluluk, hedef profil ve skor motoru.
- AI rolu: Ihtiyac ayrisma, aciklama, alternatif yorumlama ve hata raporlama. AI kanitsiz kesin gereksinim veya sartname maddesi uretmez.
- Sartname rolu: Sadece hazir `ProductFeatureProfile` girdisini kamu alimi diline cevirir; marka/model/vendor/hiz isaretleyen ifadeleri engeller veya review-required yapar.

## Dokumanlar

- [Proje Ozeti](docs/00-project-brief.md)
- [Master Plan](docs/01-master-plan.md)
- [Sistem Mimarisi](docs/02-system-architecture.md)
- [Scraping ve Site Otomasyonu](docs/03-scraping-and-automation.md)
- [AI Agent Tasarimi](docs/04-ai-agent-design.md)
- [MVP ve Sprint Yol Haritasi](docs/05-mvp-roadmap.md)
- [Riskler ve Guvenli Calisma Kurallari](docs/06-risk-register.md)
- [Sprint 1 Teknik Spec](docs/07-sprint-1-playwright-prototype-spec.md)
- [Repo ve Uygulama Iskeleti](docs/08-repo-and-application-skeleton.md)
- [Test ve Kabul Stratejisi](docs/09-test-and-acceptance-strategy.md)
- [Sprint 1 Uygulama Checklist](docs/10-sprint-1-implementation-checklist.md)
- [Teknik Stack ve Komutlar](docs/11-tech-stack-and-commands.md)
- [Selector Sozlesmesi](docs/12-selector-contract.md)
- [Scraper Probe Output Contract](docs/13-scraper-probe-output-contract.md)
- [Selection Chain Probe](docs/14-selection-chain-probe.md)
- [Requirement-First Build Flow](docs/15-requirement-first-build-flow.md)
- [Official Source Evidence Model](docs/16-official-source-evidence-model.md)
- [Public Procurement Specification Flow](docs/17-public-procurement-specification-flow.md)
- [Implementation Work Packages](docs/18-implementation-work-packages.md)
- [Product Feature Profile Contract](docs/19-product-feature-profile-contract.md)

## Takip Issue'lari

- [Requirement-first evidence-based PC build flow](https://github.com/necdetoskay/bilgisayar-topla/issues/1)
- [Public procurement technical specification generator](https://github.com/necdetoskay/bilgisayar-topla/issues/2)
- [Product extractor module for product page URL feature extraction](https://github.com/necdetoskay/bilgisayar-topla/issues/6)

## Mevcut Durum

Repo planlama, tasarim ve ilk teknik prototip asamasindadir. Ilk scraper prototipi, Incehesap konfigurator sayfasinda kategori akisini okuyabilen ve secim zincirini dogrulayabilen kucuk bir teknik kanittir.

Yeni ana uygulama yonu:

1. Kullanicinin yazilim/is yuku ihtiyacini al.
2. Resmi kaynaklardan minimum ve onerilen gereksinimleri cikar.
3. Kanitli donanim hedef profili olustur.
4. Incehesap uzerinden uyumlu sistemi topla.
5. Cihaz/urun ozelliklerini `ProductFeatureProfile` yapisina cevir.
6. Gerekiyorsa kamu alimi teknik sartname taslagina aktar.

## Ilk Scraper Prototipi

Sprint 1 scraper prototipi su komutlarla calistirilir:

```powershell
pnpm install
pnpm scraper:install
pnpm scraper:run
```

Kosu sonunda CLI kisa bir ozet basar. Ayrintili `report.json` ve screenshot dosyalari `runs/local/` altinda olusur.
