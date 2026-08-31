# Bilgisayar Topla

Incehesap bilgisayar toplama sayfasini kullanarak, kullanicinin butcesi ve kullanim amacina gore en iyi bilgisayar konfigurasyonlarini oneren AI destekli agent projesi.

Projenin hedefi yalnizca parca secmek degildir. Sistem once kullanicinin gercek yazilim/is yuku ihtiyacini anlayacak, resmi yazilim gereksinimlerini kanit olarak kullanacak, buna gore donanim hedef profili cikaracak, Incehesap uzerinden uyumlu sistem toplayacak ve ileriki asamada istenirse toplanan bilgisayari kamu alimi icin marka/model isaret etmeyen teknik sartname taslagina donusturecektir.

## Temel Yaklasim

- Veri kaynagi: Incehesap bilgisayar toplama sayfasi.
- Otomasyon: Playwright tabanli browser agent.
- Harness: Goreve gore minimum capability/tool/context provision eden task-aware PC Build Harness.
- Gereksinim modeli: Resmi yazilim gereksinimleri ve kanit zinciri.
- Resmi kaynak resolver'i: Yazilim/surum/edition girdisini allow-list kontrollu resmi kaynaga cozer, HTTPS/redirect host kapilarini uygular ve SHA-256 kimlikli snapshot/provenance uretir.
- Requirement extraction: Her normalize minimum/onerilen alanini exact snapshot SHA ve snapshot icinde bulunan raw `sourceText` kanitina baglar; kanitsiz AI/parser ciktilari authoritative olamaz.
- Katalog modeli: Configurator ciktilari 7 zorunlu PC parca kategorisine normalize edilir ve configurator/product-page provenance ayri tutulur.
- Ortak veri sozlesmesi: Tum urun/cihaz ozellikleri `ProductFeatureProfile` yapisina normalize edilir.
- Uyumluluk motoru: CPU socket, DDR, kasa form factor, GPU clearance, storage interface, PSU ve component completeness kontrolleri deterministic olarak calisir.
- Build engine: Aday uzayini bounded/deterministic uretir, compatibility PASS adaylarini butce ve `HardwareTarget` uyumuna gore skorlar.
- Verification: Scorer sonucuna guvenmez; secilen sistemi katalog, urun sayfasi, resmi gereksinim ve hard-gate zincirinden bagimsiz yeniden dogrular.
- AI rolu: Capability bazli model yonlendirme ile ihtiyac ayrisma, teknik yorumlama, kaynak arastirma ve aciklama destek islemleri yapar. AI kanitsiz kesin gereksinim uretmez ve deterministic uyumluluk kapilarini atlayamaz.
- AI maliyet/kalite yonetimi: Kullanilan modeller, token miktarlari, tahmini/gercek maliyetler, latency ve alternatif model degerlendirmeleri kayit altina alinir.
- Sartname rolu: Mevcut kod korunur ancak aktif ilk PC-toplama milestone'undan ayridir; bilgisayar toplama akisi stabil olduktan sonra yeniden devreye alinacaktir.

## Canonical V1 PC Build Akisi

```text
intent
-> requirementEvidence
-> hardwareTarget
-> catalog
-> productExtraction
-> candidateGeneration
-> compatibility
-> scoring
-> verification
-> explanation
-> completed
```

Her stage fail-closed calisir. Eksik veya celiskili kanit tahmin edilmez; ilgili stage `reviewRequired` veya `failed` olur.

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
- [Snapshot-Backed Requirement Extraction Pipeline v1](docs/24-requirement-extraction-pipeline.md)
- [Hardware Target Builder v1](docs/25-hardware-target-builder-v1.md)
- [Independent Verification and Proof Chain v1](docs/26-independent-verification-and-proof-chain-v1.md)

## Aktif Epic ve Work Packages

Aktif V1 dikeyi [Epic #13](https://github.com/necdetoskay/bilgisayar-topla/issues/13) altinda takip edilir:

- [#14 - Catalog / seven-category Incehesap chain](https://github.com/necdetoskay/bilgisayar-topla/issues/14)
- [#15 - Catalog products to ProductFeatureProfile](https://github.com/necdetoskay/bilgisayar-topla/issues/15)
- [#16 - Deterministic compatibility engine](https://github.com/necdetoskay/bilgisayar-topla/issues/16)
- [#17 - Candidate generation, budget and target scoring](https://github.com/necdetoskay/bilgisayar-topla/issues/17)
- [#18 - Independent verification and proof-chain report](https://github.com/necdetoskay/bilgisayar-topla/issues/18)
- [#19 - ULTEF golden vertical and live Incehesap acceptance](https://github.com/necdetoskay/bilgisayar-topla/issues/19)

Daha ust gereksinim takibi [#1 requirement-first evidence-based PC build flow](https://github.com/necdetoskay/bilgisayar-topla/issues/1) uzerindedir. Public procurement/specification calismasi ilk PC-build milestone'u tamamlanana kadar frozen/deferred durumundadir.

## Mevcut Durum

PR #12 (`feat/pc-build-harness-v1`) V1 PC-build verticalini tek bir kanit zincirine toplar.

Kod/fixture seviyesinde mevcut olan ana katmanlar:

1. Resmi yazilim kaynagi resolver + snapshot/provenance.
2. Snapshot-backed requirement extraction.
3. Evidence-linked `HardwareTarget` builder.
4. 7 kategorili `CatalogSnapshot` ve Incehesap selection-chain sozlesmesi.
5. Product-page URL ve snapshot-backed `ProductFeatureProfile` extraction gate.
6. Deterministic compatibility engine.
7. Bounded candidate generation, hard budget ve target-fit scoring.
8. Independent verification ve proof-chain report.
9. Deterministic explanation/final run completion gate.
10. AutoCAD 2022 + Microsoft 365 Business + ~50.000 TRY kasa golden vertical fixture'i ve socket/DDR/PSU/evidence/catalog/budget trap'leri.

Ek proof-chain guvenlik kapilari ayni build icin duplicate verification sonucu, duplicate verification ID, secili olmayan build verification sonucu ve secili olmayan build explanation kaydini fail-closed reddeder.

### Henuz kapanmayan kabul kapilari

- Workspace `pnpm` package test/typecheck komutlarinin gercek bir dependency kurulumunda calistirilmasi.
- Golden full vertical testinin runtime PASS olarak gozlemlenmesi.
- Gercek Incehesap browser/configurator 7/7 kategori acceptance'i.
- Gercek product-page evidence extraction acceptance'i.
- Secili canli build'in independent verification + final proof-chain raporu.

Bu nedenle fixture kodunun repoda bulunmasi runtime test PASS olarak raporlanmaz.

## Ilk Scraper Prototipi

Sprint 1 scraper prototipi su komutlarla calistirilir:

```powershell
pnpm install
pnpm scraper:install
pnpm scraper:run
```

Kosu sonunda CLI kisa bir ozet basar. Ayrintili `report.json` ve screenshot dosyalari `runs/local/` altinda olusur.
