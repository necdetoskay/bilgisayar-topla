# Bilgisayar Topla

Incehesap bilgisayar toplama sayfasini kullanarak, kullanicinin butcesi ve kullanim amacina gore en iyi bilgisayar konfigurasyonlarini oneren AI destekli agent projesi.

Projenin hedefi yalnizca parca secmek degildir. Sistem once kullanicinin gercek yazilim/is yuku ihtiyacini anlayacak, resmi yazilim gereksinimlerini kanit olarak kullanacak, buna gore donanim hedef profili cikaracak, Incehesap uzerinden uyumlu sistem toplayacak ve ileriki asamada istenirse toplanan bilgisayari kamu alimi icin marka/model isaret etmeyen teknik sartname taslagina donusturecektir.

## Temel Yaklasim

- Veri kaynagi: Incehesap bilgisayar toplama sayfasi.
- Otomasyon: Playwright tabanli browser agent.
- Harness: Goreve gore minimum capability/tool/context provision eden task-aware PC Build Harness.
- Gereksinim modeli: Resmi yazilim gereksinimleri ve kanit zinciri.
- Resmi kaynak resolver'i: Yazilim/surum/edition girdisini allow-list kontrollu resmi kaynaga cozer, HTTPS/redirect host kapilarini uygular ve SHA-256 kimlikli snapshot/provenance uretir.
- Ortak veri sozlesmesi: Tum urun/cihaz ozellikleri `ProductFeatureProfile` yapisina normalize edilir.
- Karar motoru: Kural tabanli uyumluluk, hedef profil ve skor motoru.
- AI rolu: Capability bazli model yonlendirme ile ihtiyac ayrisma, teknik yorumlama, kaynak arastirma ve aciklama destek islemleri yapar. AI kanitsiz kesin gereksinim uretmez ve deterministic uyumluluk kapilarini atlayamaz.
- AI maliyet/kalite yonetimi: Kullanilan modeller, token miktarlari, tahmini/gercek maliyetler ve alternatif model degerlendirmeleri kayit altina alinir.
- Sartname rolu: Mevcut kod korunur ancak aktif ilk PC-toplama milestone'undan ayridir; bilgisayar toplama akisi stabil olduktan sonra yeniden devreye alinacaktir.

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
- [AI Capability Routing Profile](docs/20-ai-capability-routing.md)
- [Model Evaluation and Cost Ledger Profile](docs/21-model-evaluation-and-cost-ledger.md)
- [PC Build Harness v1](docs/22-pc-build-harness-v1.md)
- [Official Source Resolver v1](docs/23-official-source-resolver.md)

## Takip Issue'lari

- [Requirement-first evidence-based PC build flow](https://github.com/necdetoskay/bilgisayar-topla/issues/1)
- [Public procurement technical specification generator](https://github.com/necdetoskay/bilgisayar-topla/issues/2)
- [Product extractor module for product page URL feature extraction](https://github.com/necdetoskay/bilgisayar-topla/issues/6)

## Mevcut Durum

Repo planlama, tasarim ve teknik prototip asamasindan ilk PC-build orchestration asamasina gecmektedir. Ilk scraper prototipi Incehesap konfigurator sayfasinda kategori akisini okuyabilir; product extractor tarafinda model policy, OpenRouter adapteri, benchmark ve cost ledger altyapisi bulunur. Yeni `packages/harness` paketi PC Build Run Contract v1 ve task-aware capability provisioning ile bu parcalari ortak bir akis altinda toplamaya baslar. `packages/requirements` resmi kaynak resolver'i ve snapshot/provenance katmani ile requirement evidence zincirini somutlastirmaya baslamistir.

Aktif ilk milestone:

1. Kullanicinin yazilim/is yuku ihtiyacini al.
2. Resmi kaynaklari deterministik resolver ile cozumle ve snapshot/provenance kaydi olustur.
3. Resmi snapshot'tan minimum ve onerilen gereksinimleri cikar.
4. Kanitli donanim hedef profili olustur.
5. Incehesap katalog/configurator verisini oku.
6. Cihaz/urun ozelliklerini `ProductFeatureProfile` yapisina cevir.
7. Uyumlu aday sistemleri deterministic kurallarla olustur ve ele.
8. Butce/hedef profil skorlamasi yap.
9. Secilen sistemi bagimsiz verification kapisindan gecir.
10. Aciklama, run trace, token, latency ve maliyet raporu uret.

Teknik sartname uretimi bu milestone tamamlanana kadar aktif akisin disindadir.

## Ilk Scraper Prototipi

Sprint 1 scraper prototipi su komutlarla calistirilir:

```powershell
pnpm install
pnpm scraper:install
pnpm scraper:run
```

Kosu sonunda CLI kisa bir ozet basar. Ayrintili `report.json` ve screenshot dosyalari `runs/local/` altinda olusur.
