# Cilt 04 — Domain ve Product Identity

> Bu dosya, ilgili modüler dokümanların fiziksel çıktı ve kesintisiz okuma için belirlenmiş sırayla birleştirilmiş sürümüdür. Kaynak dokümanlar `docs/` altında korunur.

## İçindekiler

1. [Domain Foundation](#domain-foundation) — `docs/02-domain/README.md`
2. [Ubiquitous Language](#ubiquitous-language) — `docs/02-domain/ubiquitous-language.md`
3. [Product Identity Model](#product-identity-model) — `docs/02-domain/product-identity-model.md`
4. [Domain Entities and Value Objects](#domain-entities-and-value-objects) — `docs/02-domain/domain-entities-and-value-objects.md`
5. [Campaign Offer Model](#campaign-offer-model) — `docs/02-domain/campaign-offer-model.md`
6. [Normalization Model](#normalization-model) — `docs/02-domain/normalization-model.md`
7. [Matching Lifecycle](#matching-lifecycle) — `docs/02-domain/matching-lifecycle.md`
8. [Domain Invariants](#domain-invariants) — `docs/02-domain/domain-invariants.md`

---

<!-- SOURCE: docs/02-domain/README.md -->

# Domain Foundation

| Alan | Değer |
|---|---|
| Document ID | DOM-000 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Son Güncelleme | 2026-07-28 |

## Amaç

Bu klasör, kampanya kaynaklarından alınan ham verinin hangi domain kavramlarına dönüştürüleceğini tanımlar.

POC'un en kritik domain problemi **Product Identity**'dir. Aynı gerçek ürün farklı kaynaklarda farklı metinlerle görünebilir; buna karşılık benzer görünen iki kayıt gerçekte farklı varyant veya paket olabilir.

## Doküman Haritası

- [Ubiquitous Language](ubiquitous-language.md)
- [Product Identity Model](product-identity-model.md)
- [Domain Entities and Value Objects](domain-entities-and-value-objects.md)
- [Campaign Offer Model](campaign-offer-model.md)
- [Normalization Model](normalization-model.md)
- [Matching Lifecycle](matching-lifecycle.md)
- [Domain Invariants](domain-invariants.md)

## Temel Ayrım

```text
Source
  └── Observation
        ├── Observed Product
        └── Observed Offer
               ↓ normalize / match
Product Family
  └── Product Variant
        └── Offer
```

Ham gözlem, canonical ürün ve kampanya teklifi aynı şey değildir.

---

<!-- SOURCE: docs/02-domain/ubiquitous-language.md -->

# Ubiquitous Language

| Alan | Değer |
|---|---|
| Document ID | DOM-001 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Son Güncelleme | 2026-07-28 |

## Temel Terimler

**Source:** PDF, görsel, web sayfası veya diğer kampanya kaynağı.

**Source Snapshot:** Kaynağın belirli zamanda alınmış, içerik hash'iyle tanımlanan değişmez kopyası.

**Observation:** Bir source snapshot içinden çıkarılan ham ürün ve teklif gözlemi.

**Observed Product:** Kaynakta görüldüğü biçimiyle ürün açıklaması. Kesin canonical ürün değildir.

**Observed Offer:** Kaynakta görülen fiyat, kampanya, tarih ve koşulların ham kaydı.

**Product Family:** Marka ve temel ürün niteliği bakımından aynı aileye ait ürünlerin üst kimliği.

**Product Variant:** Aroma, yağ oranı, içerik, model, renk veya benzeri seçim özelliğiyle ayrılan canonical ürün biçimi.

**Package Configuration:** Tekli, çoklu paket, toplam miktar veya adet bilgisini ifade eden yapı.

**Canonical Product:** Normalize edilmiş, kalıcı kimliğe sahip Product Variant kaydı.

**Offer:** Belirli satıcı, zaman aralığı, fiyat ve koşullara sahip satın alma teklifi.

**Product Identity:** Bir gözlemin hangi canonical ürünü temsil ettiğini belirleme problemi.

**Candidate Match:** Observed Product ile canonical ürün arasında henüz kesinleşmemiş eşleşme adayı.

**Match Decision:** Eşleşmenin kabul, ret veya review sonucudur.

**Identity Confidence:** Ürün kimliği eşleşmesine duyulan güven.

**Field Confidence:** Tek bir çıkarılan alana duyulan güven.

**Provenance:** Domain kaydının hangi source snapshot, sayfa, bölge ve extraction sürümünden üretildiğini gösteren bağ.

**Normalization:** Ham metin ve değerleri standart forma dönüştürme işlemi.

**Deduplication:** Aynı gözlem veya teklifin tekrar kaydedilmesini önleme işlemi.

**Equivalent Quantity:** Farklı paket biçimlerinin ortak temel birime çevrilmiş toplam miktarı.

**Comparable Offer:** Aynı canonical ürün veya açıkça karşılaştırılabilir eşdeğer ürün için normalize edilmiş teklif.

## Yasaklı Eş Anlamlı Kullanım

- `Product` kelimesi hem ham gözlem hem canonical kayıt için kullanılmaz.
- `Campaign` ile `Offer` eş anlamlı kabul edilmez.
- `Variant` ile `Package Configuration` birbirine karıştırılmaz.
- `Confidence` tek sayı olarak kullanılmaz; alan ve kimlik güveni ayrılır.

---

<!-- SOURCE: docs/02-domain/product-identity-model.md -->

# Product Identity Model

| Alan | Değer |
|---|---|
| Document ID | DOM-002 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | DOM-001 |
| Son Güncelleme | 2026-07-28 |

## 1. Problem

Aşağıdaki kayıtlar aynı ürünü ifade edebilir:

- `Sütaş Süt 1 L`
- `Sütaş Tam Yağlı Süt 1000 ml`
- `SÜTAŞ UHT SÜT TAM YAĞLI 1LT`

Ancak aşağıdakiler aynı ürün sayılmamalıdır:

- Sütaş Tam Yağlı Süt 1 L
- Sütaş Yarım Yağlı Süt 1 L
- Sütaş Laktozsuz Süt 1 L
- Sütaş Süt 4 × 250 ml

Benzer metin eşit kimlik anlamına gelmez.

## 2. Kimlik Katmanları

### 2.1. Product Family

Temel tüketici ürün ailesi.

Örnek:

```text
Brand: Sütaş
Base Product: İçme Sütü
```

### 2.2. Product Variant

Satın alma seçimini değiştiren nitelikler.

Örnek:

```text
Fat Level: Tam Yağlı
Processing: UHT
Lactose: Normal
Flavor: Sade
```

### 2.3. Package Configuration

Satılan fiziksel paket.

Örnek:

```text
Unit Size: 1 L
Pack Count: 1
Total Quantity: 1 L
Container: Karton
```

Canonical karşılaştırmada varyant ve paket birlikte dikkate alınır.

## 3. Kimlik Sinyalleri

Öncelik sırası bağlama göre değişebilir, ancak tipik sinyaller:

1. GTIN / barkod
2. marka
3. normalize ürün türü
4. varyant özellikleri
5. toplam miktar
6. paket adedi
7. üretici ürün kodu
8. kaynak görsel benzerliği
9. metinsel benzerlik
10. kategori bağlamı

Barkod güçlü sinyaldir ancak tek başına her zaman mevcut değildir.

## 4. Kimlik Kararı

Bir gözlem için olası sonuçlar:

- `EXACT_MATCH`
- `PROBABLE_MATCH`
- `AMBIGUOUS`
- `NO_MATCH`
- `NEW_CANONICAL_CANDIDATE`

## 5. Kesin Eşleşme

Aşağıdakilerden biri yeterli kanıt sağlayabilir:

- aynı doğrulanmış GTIN,
- aynı üretici kodu ve uyumlu varyant/paket,
- daha önce insan tarafından onaylanmış source-specific alias.

Çelişkili varyant veya miktar bilgisi varsa otomatik exact match yapılmaz.

## 6. Benzerlik Eşleşmesi

Barkod yoksa eşleşme bileşik skorla yapılır.

Önerilen özellik grupları:

- brand similarity
- base product similarity
- variant compatibility
- quantity compatibility
- package compatibility
- category compatibility
- text similarity

Skor tek başına karar değildir; hard conflict kuralları önce uygulanır.

## 7. Hard Conflicts

Aşağıdakiler eşleşmeyi engelleyebilir:

- farklı doğrulanmış barkod,
- uyumsuz varyant,
- farklı ürün türü,
- anlamlı miktar farkı,
- farklı paket sayısı,
- farklı model veya seri,
- karşılıklı dışlayan özellikler.

## 8. Kimlik Geçmişi

Canonical ürünler birleştirilebilir veya ayrılabilir.

Her işlem:

- önceki kimlikleri,
- yeni kimliği,
- gerekçeyi,
- reviewer'ı,
- tarihi,
- etkilenen teklifleri

audit trail ile saklar.

## 9. POC Sınırı

POC'ta amaç evrensel ürün kataloğu kurmak değildir.

Amaç:

- gözlem ile canonical kayıt ayrımını kanıtlamak,
- basit kimlik adayları üretmek,
- belirsiz eşleşmeleri review'e göndermek,
- yanlış kesin eşleşmeyi önlemektir.

---

<!-- SOURCE: docs/02-domain/domain-entities-and-value-objects.md -->

# Domain Entities and Value Objects

| Alan | Değer |
|---|---|
| Document ID | DOM-003 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | DOM-001, DOM-002 |
| Son Güncelleme | 2026-07-28 |

## 1. Entity'ler

### Source

Kampanya bilgisinin mantıksal kaynağı.

Örnek alanlar:

- source_id
- source_type
- provider
- canonical_uri
- market_id
- status

### SourceSnapshot

Kaynağın belirli içerik sürümü.

- snapshot_id
- source_id
- content_hash
- retrieved_at
- media_type
- storage_reference
- metadata

### ExtractionRun

Bir source snapshot üzerinde çalışan pipeline örneği.

- run_id
- snapshot_id
- pipeline_version
- model_version
- prompt_version
- status
- started_at
- completed_at

### Observation

Kaynak bölgesinden çıkarılan ham kayıt.

- observation_id
- run_id
- page_or_region
- raw_text
- raw_fields
- field_confidences
- evidence_reference

### ProductFamily

Ürün ailesinin kalıcı kimliği.

- product_family_id
- brand_id
- base_product_type
- category_id
- canonical_name

### ProductVariant

Canonical satın alma ürünü.

- product_variant_id
- product_family_id
- attributes
- package_configuration
- gtins
- status

### Offer

Belirli satıcı ve zaman koşulundaki fiyat teklifi.

- offer_id
- product_variant_id veya unresolved_observation_id
- merchant_id
- price
- validity_period
- conditions
- provenance
- status

### MatchDecision

Observation ile ProductVariant arasındaki kimlik kararı.

- match_decision_id
- observation_id
- candidate_product_variant_id
- decision
- score
- reasons
- reviewer_id
- decided_at

## 2. Value Object'ler

### Money

- amount
- currency

Para miktarı floating-point olarak tutulmaz.

### Quantity

- value
- unit
- normalized_value
- normalized_unit

### PackageConfiguration

- unit_quantity
- pack_count
- total_quantity
- container_type

### ValidityPeriod

- starts_at
- ends_at
- timezone
- precision

### Confidence

- value
- method
- calibration_version

### EvidenceReference

- snapshot_id
- page_number
- bounding_box veya selector
- extracted_text

### CampaignCondition

- condition_type
- parameters
- raw_text

## 3. Aggregate Sınırları

POC için önerilen aggregate'ler:

### Source Processing Aggregate

- SourceSnapshot
- ExtractionRun
- Observation

### Product Identity Aggregate

- ProductFamily
- ProductVariant
- aliases
- MatchDecision

### Offer Aggregate

- Offer
- validity
- price
- conditions
- provenance

Bu aggregate'ler ayrı sürümlenebilir ve ayrı hatalara sahip olabilir.

---

<!-- SOURCE: docs/02-domain/campaign-offer-model.md -->

# Campaign Offer Model

| Alan | Değer |
|---|---|
| Document ID | DOM-004 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | DOM-002, DOM-003 |
| Son Güncelleme | 2026-07-28 |

## 1. Offer Nedir?

Offer, bir ürünün belirli satıcıda, belirli zaman aralığında ve belirli koşullarla satın alınabilen fiyat kaydıdır.

Ürün kalıcıdır; offer geçicidir.

## 2. Offer Alanları

- merchant
- store_scope
- product_variant veya unresolved observation
- regular_price
- campaign_price
- currency
- validity_period
- campaign_conditions
- membership_requirement
- stock_limit
- channel
- provenance
- confidence
- status

## 3. Kampanya Türleri

İlk domain sözlüğü:

- DIRECT_PRICE
- PERCENT_DISCOUNT
- FIXED_AMOUNT_DISCOUNT
- MULTI_BUY
- BUY_X_GET_Y
- MEMBER_PRICE
- COUPON_PRICE
- BUNDLE_PRICE
- LOYALTY_POINTS
- UNKNOWN

POC, bütün türleri hesaplamak zorunda değildir; ancak raw condition kaybolmamalıdır.

## 4. Fiyat Ayrımı

### Regular Price

Kaynakta açıkça belirtilmiş referans fiyat.

### Campaign Price

Koşullar sağlandığında geçerli fiyat.

### Effective Unit Price

Kampanya koşulları normalize edilebiliyorsa temel birim başına hesaplanan değer.

### Displayed Price

Kaynakta görsel olarak öne çıkarılan fiyat. Her zaman gerçek ödenecek tutar olmayabilir.

## 5. Geçerlilik

ValidityPeriod kesinlik seviyesi taşır:

- EXACT
- DATE_ONLY
- INFERRED_FROM_PAGE
- INFERRED_FROM_CATALOG
- UNKNOWN

Tarih kaynağı belirtilmeden türetilmez.

## 6. Koşullar

Koşullar yapılandırılmış ve ham biçimde birlikte tutulur.

Örnek:

```text
Raw: Money Kart ile 2 adet alımda
Type: MEMBER_PRICE + MIN_QUANTITY
Parameters:
  membership: Money Kart
  minimum_quantity: 2
```

## 7. Çözümlenmemiş Offer

Ürün kimliği henüz belirlenemese bile offer kaybolmaz.

Bu durumda:

- `product_variant_id` boş,
- `observation_id` dolu,
- status `UNRESOLVED_PRODUCT`

olarak saklanabilir.

## 8. Karşılaştırılabilirlik

İki offer ancak:

- aynı canonical ürün,
- uyumlu paket,
- uyumlu kanal ve koşullar,
- örtüşen veya açıkça belirtilen zaman bağlamı

varsa doğrudan karşılaştırılır.

Üyelik gerektiren fiyat ile koşulsuz fiyat aynı etikette gösterilmez.

---

<!-- SOURCE: docs/02-domain/normalization-model.md -->

# Normalization Model

| Alan | Değer |
|---|---|
| Document ID | DOM-005 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | DOM-002, DOM-004 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

Kaynaklardaki farklı yazım ve gösterimleri karşılaştırılabilir hale getirirken ham kanıtı korumak.

## 2. Katmanlar

### Raw

Kaynakta görülen değer.

```text
"4x250 ml"
```

### Parsed

Yapısal olarak ayrıştırılmış değer.

```text
pack_count = 4
unit_quantity = 250
unit = ml
```

### Normalized

Standart temel birime dönüştürülmüş değer.

```text
total_quantity = 1000
normalized_unit = ml
```

### Canonical

Domain sözlüğündeki standart temsil.

```text
PackageConfiguration(4 × 250 ml, total 1 L)
```

## 3. Normalize Edilen Alanlar

- marka
- ürün türü
- varyant özellikleri
- miktar
- birim
- paket adedi
- fiyat
- para birimi
- tarih
- kampanya koşulu
- satıcı adı
- kategori

## 4. Birim Politikası

İlk desteklenen temel birimler:

- kütle: g
- hacim: ml
- adet: piece
- uzunluk: m

Gösterimde kullanıcı dostu birim kullanılabilir; hesaplama canonical temel birimde yapılır.

## 5. Marka Normalizasyonu

Aşağıdakiler korunur:

- raw_brand
- normalized_brand
- brand_id
- normalization_rule_id

Marka bilinmiyorsa tahmin zorunlu değildir.

## 6. Ürün Adı Normalizasyonu

Ürün adı tek metin olarak ezilmez.

Mümkün olduğunda ayrılır:

- brand
- base product
- variant attributes
- package text
- marketing text

“Avantajlı paket”, “ekonomik boy” gibi pazarlama metinleri kimlik sinyali olarak düşük ağırlık taşır.

## 7. Tarih Normalizasyonu

Tarih için:

- raw_text
- parsed_date
- timezone
- precision
- scope
- inference_reason

saklanır.

## 8. Kural Sürümleme

Her normalize sonuç:

- normalization_rules_version
- normalized_at
- source_field
- warnings

taşır.

Kural değiştiğinde eski sonuç sessizce güncellenmez; yeni sürüm oluşturulur.

## 9. Kayıplı Dönüşüm Yasağı

Normalization işlemi:

- raw text'i silmez,
- bilinmeyen alanı uydurmaz,
- varyant bilgisini genel ürün adına indirgemez,
- çoklu paket bilgisini yalnızca toplam miktara düşürmez.

---

<!-- SOURCE: docs/02-domain/matching-lifecycle.md -->

# Matching Lifecycle

| Alan | Değer |
|---|---|
| Document ID | DOM-006 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | DOM-002, DOM-005 |
| Son Güncelleme | 2026-07-28 |

## 1. Yaşam Döngüsü

```text
Observed
  → Parsed
  → Normalized
  → Candidate Generated
  → Conflict Checked
  → Scored
  → Auto Matched / Review Required / No Match
  → Confirmed
```

## 2. Candidate Generation

Aday havuzu şu yollarla daraltılır:

1. GTIN
2. marka
3. kategori
4. temel ürün türü
5. miktar aralığı
6. varyant anahtarları
7. metin benzerliği

Tüm ürün kataloğuyla kör benzerlik karşılaştırması yapılmaz.

## 3. Conflict Check

Skor hesaplanmadan önce hard conflict kuralları uygulanır.

Örnek:

- farklı doğrulanmış GTIN,
- tam yağlı ve yağsız çelişkisi,
- 1 L ile 200 ml farkı,
- farklı ürün kategorisi.

## 4. Scoring

Önerilen skor bileşenleri:

- brand_score
- product_type_score
- variant_score
- quantity_score
- package_score
- text_score
- evidence_score

Toplam skorun yanında bileşenler saklanır.

## 5. Karar Eşikleri

Başlangıç modeli:

- yüksek eşik üzeri ve conflict yok: auto match
- orta aralık: review
- düşük eşik: no match veya new candidate

Kesin eşikler test veri setiyle kalibre edilir.

## 6. İnsan Kararları

Reviewer:

- adayı kabul eder,
- adayı reddeder,
- başka canonical ürün seçer,
- yeni canonical ürün oluşturur,
- gözlemi çözümsüz bırakır.

## 7. Alias Öğrenimi

Onaylanmış kaynak yazımları alias olarak tutulabilir.

Alias:

- source-specific olabilir,
- global olmayabilir,
- güven ve kullanım sayısı taşır,
- yanlış onay halinde geri alınabilir.

## 8. Merge ve Split

### Merge

İki canonical ürünün aslında aynı olduğu anlaşılırsa kimlikler birleştirilir.

### Split

Tek canonical ürün içinde yanlışlıkla farklı varyantlar birleştirilmişse ayrılır.

Offer geçmişi kaybolmaz; yeni kimliklere yeniden bağlanır ve audit edilir.

## 9. Regression

Her onaylanmış veya düzeltilmiş eşleşme, uygun olduğunda regression örneğine dönüşür.

Yeni matching sürümü eski kritik kararları yeniden test eder.

---

<!-- SOURCE: docs/02-domain/domain-invariants.md -->

# Domain Invariants

| Alan | Değer |
|---|---|
| Document ID | DOM-007 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | DOM-002..DOM-006 |
| Son Güncelleme | 2026-07-28 |

## 1. Kimlik Kuralları

1. Observation canonical ürün değildir.
2. Product Family doğrudan fiyat taşımaz.
3. Offer bir Product Variant'a veya unresolved observation'a bağlı olmalıdır.
4. Farklı doğrulanmış GTIN kayıtları otomatik birleştirilemez.
5. Hard conflict bulunan aday auto match olamaz.
6. Match kararı gerekçe ve skor bileşenleri olmadan kaydedilemez.

## 2. Provenance Kuralları

1. Her Observation bir SourceSnapshot'a geri bağlanır.
2. Her Offer evidence reference taşır.
3. Normalize değer ham değerin yerini almaz.
4. Kaynak bölgesi bilinmiyorsa bu açıkça belirtilir.
5. Manuel düzeltme audit trail olmadan uygulanamaz.

## 3. Para ve Fiyat Kuralları

1. Money floating-point ile temsil edilmez.
2. Para birimi zorunludur.
3. Kampanya fiyatı koşullarından ayrılmaz.
4. Üyelik fiyatı koşulsuz fiyat gibi gösterilemez.
5. Birim fiyat yalnızca miktar güvenilir olduğunda hesaplanır.

## 4. Miktar Kuralları

1. Miktar sıfırdan büyük olmalıdır.
2. Pack count sıfırdan büyük tam sayıdır.
3. Total quantity, unit quantity ve pack count ile tutarlı olmalıdır.
4. Parçalı ve toplam paket bilgisi birlikte korunur.
5. Bilinmeyen birim tahmin edilerek canonical birime çevrilmez.

## 5. Tarih Kuralları

1. Bitiş tarihi başlangıçtan önce olamaz.
2. Inferred tarih inference reason taşır.
3. Tarihin ürün, sayfa veya katalog kapsamı belirtilir.
4. Süresi dolmuş offer aktif gösterilemez.

## 6. Sürümleme Kuralları

1. Raw source immutable'dır.
2. Pipeline ve normalization sürümü kayıtla birlikte saklanır.
3. Reprocess eski sonucu silmez.
4. Merge ve split işlemleri geri izlenebilir olmalıdır.
5. Aynı idempotency key aynı aktif sonucu üretmelidir.

## 7. POC Kabul Kuralları

Bir kayıt karşılaştırılabilir kabul edilmek için:

- ürün kimliği yeterli güvene sahip,
- miktar ve birim çözümlenmiş,
- fiyat ve para birimi doğrulanmış,
- geçerlilik bağlamı biliniyor,
- provenance eksiksiz

olmalıdır.
