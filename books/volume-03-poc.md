# Cilt 03 — POC Tanımı ve Doğrulama

> Bu dosya, ilgili modüler dokümanların fiziksel çıktı ve kesintisiz okuma için belirlenmiş sırayla birleştirilmiş sürümüdür. Kaynak dokümanlar `docs/` altında korunur.

## İçindekiler

1. [POC Definition & Validation](#poc-definition-validation) — `docs/01-poc/README.md`
2. [POC Vizyonu ve Kapsamı](#poc-vizyonu-ve-kapsami) — `docs/01-poc/poc-vizyonu-ve-kapsami.md`
3. [POC Hipotezleri ve Riskleri](#poc-hipotezleri-ve-riskleri) — `docs/01-poc/poc-hipotezleri-ve-riskleri.md`
4. [Test Veri Seti Standardı](#test-veri-seti-standardi) — `docs/01-poc/test-veri-seti-standardi.md`
5. [Doğrulama ve Review Planı](#dogrulama-ve-review-plani) — `docs/01-poc/dogrulama-ve-review-plani.md`
6. [Başarı Ölçüm Standardı](#basari-olcum-standardi) — `docs/01-poc/basari-olcum-standardi.md`
7. [Hata Sınıflandırması](#hata-siniflandirmasi) — `docs/01-poc/hata-siniflandirmasi.md`
8. [Idempotency ve Yeniden İşleme](#idempotency-ve-yeniden-isleme) — `docs/01-poc/idempotency-ve-yeniden-isleme.md`
9. [POC Çıkış Kararı](#poc-cikis-karari) — `docs/01-poc/poc-cikis-karari.md`

---

<!-- SOURCE: docs/01-poc/README.md -->

# POC Definition & Validation

| Alan | Değer |
|---|---|
| Document ID | POC-000 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Son Güncelleme | 2026-07-28 |

## Amaç

Bu klasör, kampanya verisi çıkarma ve normalizasyon POC'unun kapsamını, test yöntemini, başarı ölçütlerini ve çıkış kararını tanımlar.

## Doküman Haritası

- [POC Vizyonu ve Kapsamı](poc-vizyonu-ve-kapsami.md)
- [POC Hipotezleri ve Riskleri](poc-hipotezleri-ve-riskleri.md)
- [Test Veri Seti Standardı](test-veri-seti-standardi.md)
- [Doğrulama ve Review Planı](dogrulama-ve-review-plani.md)
- [Başarı Ölçüm Standardı](basari-olcum-standardi.md)
- [Hata Sınıflandırması](hata-siniflandirmasi.md)
- [Idempotency ve Yeniden İşleme](idempotency-ve-yeniden-isleme.md)
- [POC Çıkış Kararı](poc-cikis-karari.md)

## Temel İlke

POC'un amacı etkileyici demo üretmek değil, kritik veri riskini gerçek örnekler üzerinde ölçülebilir biçimde doğrulamaktır.

---

<!-- SOURCE: docs/01-poc/poc-vizyonu-ve-kapsami.md -->

# POC Vizyonu ve Kapsamı

## Amaç
İlk sürümün amacı, kampanya katalogları ve seçili kaynaklardan ürün ve fiyat verilerini güvenilir biçimde toplayıp normalize edebildiğimizi kanıtlamaktır.

## POC Kapsamı
- PDF katalogları
- Görsel kataloglar
- Seçili web kampanya sayfaları
- Ürün adı, marka, miktar, birim, fiyat
- Kampanya başlangıç/bitiş tarihleri
- Güven skoru
- Karşılaştırılabilir ürün listesi

## İş Akışı
Kaynak → İçerik Alma → Ürün Çıkarma → Normalizasyon → Doğrulama → Depolama → İnceleme Arayüzü

## Başarı Kriterleri
- Ürün kartı tespiti ≥ %85
- Fiyat doğruluğu ≥ %95
- Gramaj/adet doğruluğu ≥ %85
- Kampanya tarihleri doğru ilişkilendirilmeli
- Manuel düzeltme desteklenmeli
- Aynı katalog tekrar işlendiğinde mükerrer kayıt oluşmamalı

## Kapsam Dışı
- Sağlık analizi
- Tarım Bakanlığı entegrasyonu
- Kişisel alışveriş listeleri
- Çok ajanlı tam sistem
- Ev envanteri
- Mobil uygulama

## Sonraki Adım
POC doğrulandıktan sonra MVP kapsamı ve PRD hazırlanacaktır.

---

<!-- SOURCE: docs/01-poc/poc-hipotezleri-ve-riskleri.md -->

# POC Hipotezleri ve Riskleri

| Alan | Değer |
|---|---|
| Document ID | POC-001 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | PRD-001, ADR-0002 |
| Son Güncelleme | 2026-07-28 |

## 1. Ana Hipotez

Market katalogları, görselleri ve seçili kampanya web sayfaları; yeterli doğruluk, izlenebilirlik ve kabul edilebilir manuel düzeltme maliyetiyle yapılandırılmış kampanya kayıtlarına dönüştürülebilir.

## 2. Alt Hipotezler

### H1 — Kaynak Alımı

Kaynaklar güvenilir biçimde indirilebilir, sürümlenebilir ve tekrar işlenebilir.

### H2 — Ürün Kartı Tespiti

Bir sayfa veya görsel içindeki ürün kartları yeterli doğrulukla ayrıştırılabilir.

### H3 — Alan Çıkarımı

Ürün adı, marka, miktar, birim, fiyat ve tarih alanları doğru çıkarılabilir.

### H4 — Alan İlişkilendirme

Bir fiyatın ve kampanya koşulunun doğru ürün kartına ait olduğu belirlenebilir.

### H5 — Normalizasyon

Farklı yazım ve birimler karşılaştırılabilir ortak biçime dönüştürülebilir.

### H6 — Provenance

Her normalize kayıt ham kaynağa, sayfaya ve extraction çıktısına geri bağlanabilir.

### H7 — İnsan Review

Düşük güvenli veya hatalı sonuçlar makul sürede incelenip düzeltilebilir.

### H8 — Idempotency

Aynı kaynak aynı sürümle tekrar işlendiğinde mükerrer kayıt oluşmaz.

## 3. En Yüksek Riskler

| Risk | Etki | Olasılık | POC Kontrolü |
|---|---|---:|---|
| Fiyatın yanlış ürünle eşleşmesi | Kritik | Orta | alan ilişkilendirme testi |
| Kampanya tarihinin yanlış kapsama bağlanması | Yüksek | Orta | tarih kapsam testi |
| Çok farklı katalog düzenleri | Yüksek | Yüksek | kaynak çeşitliliği |
| Görsel kalite düşüklüğü | Orta | Yüksek | zorlu örnek seti |
| Her market için özel kod ihtiyacı | Yüksek | Orta | yeni kaynak uyarlama ölçümü |
| Manuel review yükünün aşırı olması | Yüksek | Orta | kayıt başına review süresi |
| AI çıktılarının tekrar üretilememesi | Orta | Orta | model/prompt sürüm kaydı |
| Aynı kaynağın mükerrer kayıt üretmesi | Orta | Orta | idempotency testi |

## 4. Kritik Başarısızlıklar

Aşağıdakiler POC yaklaşımının yeniden değerlendirilmesini gerektirir:

- fiyat alanında sistematik ve açıklanamayan yanlışlık,
- kaynak bağlantısının kaybolması,
- ürün kartlarının çoğunun manuel ayrıştırılması,
- katalog başına kabul edilemeyecek özel entegrasyon maliyeti,
- review süresinin otomasyon kazancını ortadan kaldırması.

## 5. Risk Azaltma Sırası

1. Fiyat ve ürün ilişkilendirmesi
2. Provenance
3. Miktar ve birim
4. Kampanya tarihleri
5. Idempotency
6. Operasyonel maliyet
7. Kaynak çeşitliliği

---

<!-- SOURCE: docs/01-poc/test-veri-seti-standardi.md -->

# Test Veri Seti Standardı

| Alan | Değer |
|---|---|
| Document ID | POC-002 |
| Sürüm | 1.0 |
| Durum | Taslak |
| Bağımlılıklar | POC-001 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

POC sonuçlarının kolay örneklerle yanıltıcı biçimde yüksek görünmesini önlemek için test veri setinin kapsamını ve etiketleme kurallarını tanımlar.

## 2. Veri Seti Katmanları

### Katman A — Geliştirme Seti

Pipeline geliştirme sırasında kullanılabilir. Son başarı ölçümünde tek başına kullanılamaz.

### Katman B — Doğrulama Seti

Prompt, model ve kuralların ayarlanmasında kullanılır.

### Katman C — Kör Test Seti

Nihai POC değerlendirmesine kadar pipeline ayarlamak için kullanılmaz.

## 3. Kaynak Çeşitliliği

Test seti en az şu çeşitleri içermelidir:

- metin tabanlı PDF
- taranmış PDF
- tek sayfalık kampanya görseli
- çok ürünlü katalog sayfası
- seçili web kampanya sayfası
- düşük çözünürlüklü örnek
- yoğun ve karmaşık tasarım
- farklı kampanya tarih yerleşimleri

## 4. Zorluk Sınıfları

### Kolay

- ürün kartları belirgin,
- yüksek çözünürlük,
- fiyat ürünün yanında,
- metin net.

### Orta

- benzer ürünler yan yana,
- ortak kampanya metni,
- farklı yazı boyutları,
- karmaşık paket bilgisi.

### Zor

- fiyat ve ürün görseli uzak,
- ortak tarih veya dipnot,
- düşük kontrast,
- çapraz yerleşim,
- küçük yazı,
- birden fazla kampanya koşulu.

## 5. Minimum İlk POC Seti

İlk çalışma için önerilen minimum:

- en az 5 farklı kaynak şablonu,
- en az 20 sayfa veya eşdeğer görsel,
- en az 150 gerçek ürün kartı,
- kolay, orta ve zor örneklerin birlikte bulunması,
- en az 2 farklı kaynak tipi.

Bu sayı başlangıç standardıdır; uygulanabilirliğe göre Decision Log ile değiştirilebilir.

## 6. Ground Truth Alanları

Her ürün kartı için mümkün olduğunda:

- source_id
- page_number veya visual_region
- product_name_raw
- brand_raw
- variant_raw
- quantity_value
- quantity_unit
- package_count
- regular_price
- campaign_price
- currency
- campaign_start
- campaign_end
- campaign_condition
- expected_card_boundary
- annotator_note

## 7. Etiketleme Kuralları

- Görselde olmayan bilgi tahmin edilmez.
- Okunamayan alan `unknown` olarak işaretlenir.
- Birden fazla yorum mümkünse belirsizlik notu eklenir.
- Kampanya tarihi sayfa geneline aitse kapsam açıkça yazılır.
- Fiyatın hangi ürüne ait olduğu kesin değilse zorla eşleştirilmez.
- Ham metin ve normalize değer ayrı tutulur.

## 8. Veri Sızıntısı Kontrolü

Kör test setindeki örnekler:

- prompt örneği olarak kullanılmaz,
- normalization kuralı üretmek için incelenmez,
- model seçiminde doğrudan optimize edilmez.

## 9. Sürümleme

Her veri seti sürümü aşağıdakileri taşır:

- dataset_version
- oluşturma tarihi
- kaynak listesi
- etiketleyici
- değişiklik özeti
- lisans ve kullanım notu

---

<!-- SOURCE: docs/01-poc/dogrulama-ve-review-plani.md -->

# Doğrulama ve Review Planı

| Alan | Değer |
|---|---|
| Document ID | POC-003 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | POC-001, POC-002 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

Extraction ve normalizasyon sonuçlarının nasıl doğrulanacağını ve insan review akışının nasıl işleyeceğini tanımlar.

## 2. Doğrulama Katmanları

### 2.1. Şema Doğrulama

- zorunlu alanlar,
- veri tipleri,
- tarih biçimleri,
- para birimi,
- birim sözlüğü.

### 2.2. İş Kuralı Doğrulama

- campaign_price negatif olamaz,
- campaign_end başlangıçtan önce olamaz,
- miktar sıfırdan büyük olmalıdır,
- birim fiyat hesaplanabiliyorsa tutarlı olmalıdır,
- normal fiyat varsa kampanya fiyatı ilişki kontrolünden geçmelidir.

### 2.3. Kaynak Doğrulama

- kayıt doğru sayfaya bağlı mı,
- bounding box veya bölge doğru mu,
- ham metin korunmuş mu,
- fiyat doğru ürün kartına mı ait.

### 2.4. Çapraz Alan Doğrulama

- “4 × 250 ml” toplam miktarıyla uyumlu mu,
- “2 al 1 öde” düz fiyat gibi yorumlanmış mı,
- üyelik koşulu kaybolmuş mu,
- tarih sayfa geneline mi ürün kartına mı ait.

## 3. Review Kuyruğu Tetikleyicileri

Bir kayıt review kuyruğuna alınırsa en az bir reason code taşımalıdır:

- LOW_CONFIDENCE
- PRICE_PRODUCT_AMBIGUITY
- DATE_SCOPE_AMBIGUITY
- QUANTITY_PARSE_ERROR
- UNKNOWN_UNIT
- SCHEMA_VIOLATION
- DUPLICATE_CANDIDATE
- NORMALIZATION_CONFLICT
- SOURCE_UNREADABLE

## 4. Review Ekranı İçin Minimum İhtiyaçlar

- kaynak sayfa veya görsel
- ürün kartı bölgesi
- ham extraction
- normalize sonuç
- alan bazlı confidence
- reason code
- düzenlenebilir alanlar
- kabul, düzelt, reddet eylemleri
- reviewer notu
- işlem geçmişi

## 5. Review Sonuçları

### Accepted

Kayıt değişmeden onaylandı.

### Corrected

Bir veya daha fazla alan değiştirildi.

### Rejected

Ürün kartı veya kayıt geçersiz.

### Deferred

Karar için ek kaynak veya uzmanlık gerekiyor.

## 6. Audit Trail

Her manuel işlem için:

- reviewer_id
- timestamp
- önceki değer
- yeni değer
- reason
- pipeline_version

saklanır.

## 7. Review Süresi Ölçümü

Aşağıdakiler raporlanır:

- kayıt başına ortalama review süresi,
- yalnızca kabul edilen kayıtların süresi,
- düzeltilen kayıtların süresi,
- en sık hata reason code'ları,
- kaynak bazlı review oranı.

## 8. İnsan Review Başarı Kriteri

POC sonunda otomasyon doğruluğu kadar, review ile güvenilir sonuca ulaşma maliyeti de değerlendirilir.

Sistem, otomatik sonucu mükemmel üretmek zorunda değildir; ancak yanlışları görünür ve düzeltilebilir üretmek zorundadır.

---

<!-- SOURCE: docs/01-poc/basari-olcum-standardi.md -->

# Başarı Ölçüm Standardı

| Alan | Değer |
|---|---|
| Document ID | POC-004 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | POC-002, POC-003 |
| Son Güncelleme | 2026-07-28 |

## 1. Ölçüm Birimleri

Başarı tek bir toplam puanla değerlendirilmez.

Ayrı ölçümler:

- ürün kartı tespiti,
- alan extraction doğruluğu,
- alan ilişkilendirme doğruluğu,
- normalizasyon doğruluğu,
- provenance bütünlüğü,
- review yükü,
- idempotency,
- işlem süresi ve maliyet.

## 2. Ürün Kartı Tespiti

Önerilen metrikler:

- precision
- recall
- F1
- kaçırılan kart sayısı
- yanlış pozitif kart sayısı

Başlangıç hedefi:

- F1 en az `%85`

## 3. Alan Bazlı Doğruluk

Her alan ayrı raporlanır:

- product_name
- brand
- quantity_value
- quantity_unit
- regular_price
- campaign_price
- campaign_start
- campaign_end
- campaign_condition

Başlangıç hedefleri:

- fiyat doğruluğu en az `%95`
- gramaj/adet doğruluğu en az `%85`
- tarih ilişkilendirmesi kritik hata içermemeli

## 4. Kritik ve Kritik Olmayan Hata

### Kritik

- yanlış fiyat,
- fiyatın yanlış ürüne bağlanması,
- yanlış kampanya tarihi,
- kaynağın kaybolması,
- yanlış para birimi.

### Kritik Olmayan

- marka yazım varyasyonu,
- eksik varyant,
- biçimsel normalizasyon farkı,
- opsiyonel açıklama eksikliği.

Kritik hatalar toplam doğruluk içinde gizlenmez; ayrı raporlanır.

## 5. Confidence Kalibrasyonu

Confidence yalnızca gösterim amacıyla kullanılmaz.

Ölçülecek sorular:

- düşük confidence gerçekten daha çok hata içeriyor mu,
- yüksek confidence kayıtlarında kritik hata var mı,
- review eşiği hangi noktada en iyi dengeyi sağlıyor.

## 6. Review Metrikleri

- review'e giden kayıt oranı
- corrected oranı
- rejected oranı
- ortalama review süresi
- 100 ürün başına toplam manuel dakika

## 7. Idempotency Metrikleri

Aynı kaynak ve pipeline sürümüyle tekrar işlemde:

- yeni mükerrer kayıt sayısı: `0`
- değişen sonuç sayısı: `0` veya açıklanmış nondeterminism
- aynı source fingerprint korunmalı

## 8. Operasyonel Metrikler

- kaynak başına işlem süresi
- sayfa başına işlem süresi
- ürün başına maliyet
- hata nedeniyle yeniden deneme sayısı
- kaynak adaptasyon süresi

Maliyet Türk lirası cinsinden raporlanabilir; kullanılan model ve servis fiyatı ayrıca kaydedilir.

## 9. Raporlama

Her test koşusu aşağıdakileri üretir:

- run_id
- dataset_version
- pipeline_version
- model ve prompt sürümleri
- alan bazlı metrikler
- kritik hata listesi
- review metrikleri
- maliyet ve süre
- önceki koşuyla fark

## 10. Kabul Kuralı

POC yalnızca toplam ortalama hedefi geçtiği için başarılı sayılmaz.

Aşağıdakilerin birlikte sağlanması gerekir:

- kritik fiyat doğruluğu,
- provenance bütünlüğü,
- idempotency,
- kabul edilebilir review yükü,
- gerçek kaynak çeşitliliğinde tutarlı sonuç.

---

<!-- SOURCE: docs/01-poc/hata-siniflandirmasi.md -->

# Hata Sınıflandırması

| Alan | Değer |
|---|---|
| Document ID | POC-005 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | POC-003, POC-004 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

Hataların aynı dil ve önem seviyesiyle raporlanmasını sağlar.

## 2. Önem Seviyeleri

### SEV-1 — Kritik

Yanlış satın alma kararına doğrudan yol açabilir.

Örnek:

- yanlış fiyat,
- yanlış ürün-fiyat eşleşmesi,
- yanlış kampanya bitiş tarihi,
- yanlış para birimi,
- kaynaksız kayıt.

### SEV-2 — Yüksek

Karşılaştırmayı anlamlı biçimde bozar.

Örnek:

- yanlış miktar,
- yanlış paket adedi,
- kampanya koşulunun kaybolması,
- yanlış birim normalizasyonu.

### SEV-3 — Orta

Kayıt kullanılabilir ancak eksik veya düşük kaliteli hale gelir.

Örnek:

- marka eksik,
- varyant eksik,
- kategori yanlış,
- normal fiyat eksik.

### SEV-4 — Düşük

Sunum veya küçük biçim farklarıdır.

Örnek:

- büyük/küçük harf,
- noktalama,
- boşluk,
- eşdeğer yazım biçimi.

## 3. Hata Aileleri

- SOURCE_ERROR
- CARD_DETECTION_ERROR
- OCR_ERROR
- FIELD_EXTRACTION_ERROR
- FIELD_ASSOCIATION_ERROR
- DATE_SCOPE_ERROR
- QUANTITY_NORMALIZATION_ERROR
- PRICE_NORMALIZATION_ERROR
- DUPLICATION_ERROR
- PROVENANCE_ERROR
- REVIEW_ERROR
- PIPELINE_ERROR

## 4. Sonuç Durumları

Her alan için:

- CORRECT
- INCORRECT
- MISSING
- AMBIGUOUS
- NOT_APPLICABLE

kullanılır.

## 5. Hata Kaydı

Her hata en az şunları taşır:

- error_id
- run_id
- source_id
- record_id
- field_name
- error_family
- severity
- expected
- actual
- evidence_reference
- reviewer_note

## 6. Kök Neden

Hata yalnızca görünen sonuca göre değil, mümkün olduğunda kök nedene göre etiketlenir.

Örnek:

Fiyat yanlışsa ama neden yanlış bounding box ise:

- ana aile: FIELD_ASSOCIATION_ERROR
- ikincil belirti: PRICE_NORMALIZATION_ERROR değil

## 7. Kullanım

Hata sınıfları:

- kalite raporlarında,
- review kuyruğunda,
- regression testlerinde,
- kaynak adaptasyon kararlarında

aynı kodlarla kullanılır.

---

<!-- SOURCE: docs/01-poc/idempotency-ve-yeniden-isleme.md -->

# Idempotency ve Yeniden İşleme

| Alan | Değer |
|---|---|
| Document ID | POC-006 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | POC-001, POC-004 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

Aynı kampanya kaynağının tekrar işlenmesinde mükerrer veya açıklanamayan farklı kayıt oluşmasını önlemek.

## 2. Kaynak Kimliği

Her kaynak için en az:

- source_uri
- retrieval_timestamp
- content_hash
- source_type
- source_version
- market
- campaign_period

saklanır.

`content_hash`, aynı içeriğin farklı URL veya dosya adıyla gelmesini tespit etmekte kullanılır.

## 3. İşleme Kimliği

Her pipeline çalışması:

- run_id
- source_id
- pipeline_version
- model_version
- prompt_version
- normalization_rules_version
- started_at
- completed_at
- status

taşır.

## 4. Idempotency Anahtarı

İlk POC için önerilen anahtar:

```text
content_hash + pipeline_version + processing_profile
```

Aynı anahtar tamamlanmışsa varsayılan davranış yeni kayıt üretmemektir.

## 5. Yeniden İşleme Türleri

### Retry

Aynı sürümle teknik hata sonrası tekrar deneme.

### Reprocess

Yeni pipeline, prompt, model veya kuralla yeniden işleme.

### Review Rebuild

Manuel düzeltmeler korunarak normalize çıktının yeniden oluşturulması.

## 6. Kayıt Politikası

Ham kaynak değişmez.

Yeni işleme sürümü:

- önceki sonucu silmez,
- yeni result version üretir,
- hangi sürümün aktif olduğunu işaretler,
- önceki sonuçla fark raporu oluşturur.

## 7. Mükerrerlik Kontrolü

Mükerrer adayları için:

- aynı source_id,
- aynı visual_region,
- aynı raw text fingerprint,
- aynı normalize ürün alanları

birlikte değerlendirilir.

## 8. Test Senaryoları

1. Aynı dosyayı iki kez yükleme
2. Aynı içeriği farklı dosya adıyla yükleme
3. Aynı kaynağı teknik hata sonrası retry
4. Yeni pipeline sürümüyle reprocess
5. Manuel düzeltilmiş kaydı yeniden işleme
6. Kısmen değişmiş yeni katalog sürümü

## 9. Başarı Kriteri

Aynı içerik ve aynı pipeline sürümü tekrar işlendiğinde:

- yeni kaynak kaydı oluşmaz,
- yeni ürün kayıtları oluşmaz,
- önceki sonuç değişmez,
- işlem sonucu idempotent hit olarak raporlanır.

---

<!-- SOURCE: docs/01-poc/poc-cikis-karari.md -->

# POC Çıkış Kararı

| Alan | Değer |
|---|---|
| Document ID | POC-007 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| Bağımlılıklar | POC-001..POC-006 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

POC tamamlandığında sezgisel değil, kanıta dayalı karar verilmesini sağlar.

## 2. Karar Seçenekleri

### PROCEED

MVP discovery ve mimari planlamasına geçilir.

### REVISE

POC yaklaşımı belirli sorunlar çözülerek tekrar edilir.

### STOP

Temel yaklaşımın hedef kullanım için sürdürülebilir olmadığı kabul edilir.

## 3. PROCEED Koşulları

Aşağıdakilerin birlikte karşılanması beklenir:

- ürün kartı tespiti hedefe ulaşmış,
- fiyat doğruluğu hedefe ulaşmış,
- kritik ürün-fiyat ilişkilendirme hataları kabul edilebilir seviyede,
- provenance eksiksiz,
- idempotency testi başarılı,
- review yükü uygulanabilir,
- en az iki kaynak tipinde sonuç alınmış,
- maliyet ve süre ölçülmüş,
- kritik riskler için net çözüm yolu bulunmuş.

## 4. REVISE Koşulları

- hedeflere yakın ancak belirli kaynaklarda zayıf sonuç,
- confidence kalibrasyonu yetersiz,
- review akışı fazla zaman alıyor,
- tarih kapsamı veya miktar parsing problemi çözülebilir görünüyor,
- mimari değil model/prompt/kural düzeyinde iyileştirme yeterli olabilir.

REVISE kararı süre, kapsam ve hedef değişiklikleriyle birlikte kaydedilir.

## 5. STOP Koşulları

- kritik fiyat hataları sürdürülebilir biçimde azaltılamıyor,
- kaynak düzeni çeşitliliği çözümü ekonomik olmaktan çıkarıyor,
- manuel emek otomasyon değerini ortadan kaldırıyor,
- provenance güvenilir şekilde korunamıyor,
- kaynak erişimi hukuki veya operasyonel olarak sürdürülemiyor.

## 6. Çıkış Raporu

POC sonunda şu başlıklar zorunludur:

1. kullanılan veri seti
2. pipeline sürümü
3. metrikler
4. kritik hata örnekleri
5. review süresi
6. maliyet
7. kaynak bazlı performans
8. risklerin son durumu
9. önerilen karar
10. MVP'ye taşınacak ve taşınmayacak yetenekler

## 7. Onay

Çıkış kararı:

- Decision Log'a eklenir,
- gerekirse yeni ADR oluşturulur,
- POC dokümanları `Frozen` veya `Superseded` durumuna alınır,
- MVP kapsamı POC sonucuna göre hazırlanır.

## 8. Yasak

POC başarısız veya belirsizken yalnızca ilerleme hissi oluşturmak için MVP kodlamasına geçilmez.
