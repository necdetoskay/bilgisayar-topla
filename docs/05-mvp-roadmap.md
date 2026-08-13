# MVP ve Sprint Yol Haritasi

## Yeni MVP Hedefi

Ilk MVP, UI olmadan backend/test odakli calisan sartname hattini kanitlamalidir.

Yeni ilk hedef:

`Product Page Fixture veya URL -> product-extractor -> ProductFeatureProfile -> specification module -> draft specification + compliance report`

Bilgisayar toplama/Incehesap konfigurator akisi daha sonra bu hatta veri saglayan ayri bir uretici olarak ele alinacaktir.

## Neden Bu Siralama?

Sartname motoru ve ona veri saglayan moduller dogru calisirsa, sistem yalnizca bilgisayar icin degil yazici, monitor, tarayici, UPS ve diger cihazlar icin de genisletilebilir.

Bu nedenle ilk oncelik:

- ortak veri yapisi
- urun ozellik cikarma
- sartnameye cevirme
- uygunluk kapilari
- test/rapor ciktisi

olmalidir.

## Sprint 0: Planlama ve Repo Hazirligi

- Master plan dokumanlari
- Mimari kararlar
- Risk listesi
- Repo klasor yapisi
- Ilk issue/backlog basliklari

## Sprint 1: Shared Contracts ve Backend Test Harness

- `ProductFeatureProfile` TypeScript tipleri
- evidence/readiness tipleri
- schema validation
- fixture tabanli test kosucusu
- UI olmadan CLI/test komutlari
- run report klasor yapisi

Cikis kriteri:

- Ham URL veya raw urun objesi sartname modulune dogrudan verilemez.
- Sartname modulu yalnizca valide edilmis `ProductFeatureProfile` kabul eder.
- `pnpm typecheck` ve temel schema testleri gecer.

## Sprint 2: Product Extractor MVP

- Fixture HTML veya kontrollu urun sayfasi girdisi
- urun basligi/kategori/ozellik tablosu cikarma
- identity field ve technical capability field ayrimi
- marka/model/vendor karantina mantigi
- `ProductFeatureProfile` uretimi

Cikis kriteri:

- Ornek yazici/monitor urun girdisi `ProductFeatureProfile` uretir.
- Marka/model bilgisi evidence olarak korunur ama clause-eligible feature olmaz.
- Eksik/belirsiz urun verisi `needsMoreFeatures` veya `reviewRequired` uretir.

## Sprint 3: Specification Engine MVP

- `ProductFeatureProfile` girdisinden taslak madde uretimi
- urun kategori profili taslagi
- marka/model/vendor/hiz hard gate'leri
- olculebilirlik ve muayene-kabul kontrolu
- compliance report JSON

Cikis kriteri:

- Yazici veya monitor fixture'indan marka/model icermeyen sartname taslagi uretilir.
- Riskli maddeler blocked/reviewRequired listesine girer.
- AI veya sablon ciktisi hard gate'leri bypass edemez.

## Sprint 4: AI Capability Routing ve Cost Ledger

- capability tabanli AI runtime sozlesmesi
- mock adapter
- usage ledger
- specification cost summary
- structured output validation

Cikis kriteri:

- Her mock AI cagrisi ledger entry uretir.
- Sartname run raporunda model/capability/token/maliyet ozeti gorunur.
- Feature kodu model adina degil capability'ye baglanir.

## Sprint 5: Golden Dataset ve Model Degerlendirme

- product/specification golden dataset yapisi
- beklenen cikti/rubrik kayitlari
- aday model degerlendirme raporu
- hard gate ve kalite skor ayrimi

Cikis kriteri:

- Yeni model adayi sabit fixture setinde olculur.
- Hard gate fail skor ortalamasiyla bypass edilemez.
- Degerlendirme raporu dataset version, prompt version, schema version ve maliyet bilgisini tasir.

## Sprint 6: PC Builder Entegrasyonuna Donus

- requirement-first build flow
- resmi yazilim gereksinimleri
- Incehesap scraper/secim zinciri
- build target -> ProductFeatureProfile cevirimi
- sartname modulune aktarim

Cikis kriteri:

- Toplanan bilgisayar `ProductFeatureProfile` olarak export edilir.
- Sartname modulu PC builder kaynagini bilmeden ayni sozlesme ile calisir.

## UI Karari

Ilk asamada UI yapilmayacaktir.

Uygulama backend/test odakli gelisecektir:

- CLI komutlari
- fixture testleri
- JSON/Markdown raporlar
- schema validation
- ULTEF qualification evidence

UI ancak backend pipeline guvenilir hale geldikten sonra ele alinacaktir.

## Kodlamaya Baslama Kapisi

Kod yazmaya baslamadan once su dokumanlar esas alinmalidir:

- `docs/17-public-procurement-specification-flow.md`
- `docs/18-implementation-work-packages.md`
- `docs/19-product-feature-profile-contract.md`
- `docs/20-ai-capability-routing.md`
- `docs/21-model-evaluation-and-cost-ledger.md`

## Ilk MVP Cikis Kriteri

Ilk MVP sonunda uygulama sunlari UI olmadan kanitlamalidir:

- Urun ozelligi fixture veya product-extractor tarafindan okunur.
- Standart `ProductFeatureProfile` uretilir.
- Sartname modulu yalnizca bu standart yapidan calisir.
- Marka/model/vendor/hiz sızıntisi engellenir.
- Draft sartname Markdown olarak uretilir.
- Compliance report JSON olarak uretilir.
- AI kullanimi varsa token/model/maliyet kaydi rapora girer.
