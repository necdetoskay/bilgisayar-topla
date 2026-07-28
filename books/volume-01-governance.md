# Cilt 01 — Governance

> Bu dosya, ilgili modüler dokümanların fiziksel çıktı ve kesintisiz okuma için belirlenmiş sırayla birleştirilmiş sürümüdür. Kaynak dokümanlar `docs/` altında korunur.

## İçindekiler

1. [Governance Foundation](#governance-foundation) — `docs/00-governance/README.md`
2. [Proje Yönetişimi](#proje-yonetisimi) — `docs/00-governance/project-governance.md`
3. [EOS Benimseme Standardı](#eos-benimseme-standardi) — `docs/00-governance/eos-adoption.md`
4. [Mühendislik İlkeleri](#muhendislik-ilkeleri) — `docs/00-governance/engineering-principles.md`
5. [Decision Log](#decision-log) — `docs/00-governance/decision-log.md`
6. [Proje Terimleri Sözlüğü](#proje-terimleri-sozlugu) — `docs/00-governance/glossary.md`
7. [Architecture, Product and Process Decision Records](#architecture-product-and-process-decision-records) — `docs/00-governance/adr/README.md`
8. [ADR-0001 — EOS Benimseme Modeli](#adr-0001-eos-benimseme-modeli) — `docs/00-governance/adr/ADR-0001-eos-adoption.md`
9. [ADR-0002 — POC-First Ürün Stratejisi](#adr-0002-poc-first-urun-stratejisi) — `docs/00-governance/adr/ADR-0002-poc-first-strategy.md`

---

<!-- SOURCE: docs/00-governance/README.md -->

# Governance Foundation

| Alan | Değer |
|---|---|
| Document ID | GOV-000 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Son Güncelleme | 2026-07-28 |

## Amaç

Bu klasör, Akıllı Alışveriş Asistanı projesinin çalışma, karar alma ve değişiklik yönetimi kurallarını tanımlar.

EOS, **nasıl geliştirdiğimizi** belirleyen merkezi mühendislik sistemidir. Bu repository ise **ne geliştirdiğimizi** tanımlar. EOS dokümanları bu projeye topluca kopyalanmaz; proje, kullandığı EOS sürümünü ve varsa sapmaları burada kaydeder.

## Doküman Haritası

- [EOS Benimseme Standardı](eos-adoption.md)
- [Proje Yönetişimi](project-governance.md)
- [Mühendislik İlkeleri](engineering-principles.md)
- [Karar Kaydı](decision-log.md)
- [Terimler Sözlüğü](glossary.md)
- [ADR Dizini](adr/README.md)

## Öncelik Sırası

Çelişki halinde aşağıdaki sıra uygulanır:

1. EOS Constitution
2. EOS Standards
3. EOS Templates
4. EOS Playbooks
5. Bu projenin governance dokümanları
6. Proje ürün, alan ve mimari dokümanları
7. Sprint ve uygulama dokümanları

## Temel Kural

Genel ve tekrar kullanılabilir bir mühendislik kuralı EOS'ta yaşar. Projeye özgü karar, sapma veya bağlam bu repository içinde yaşar.

## Kararlar

- Proje EOS v1.0'ı temel alır.
- Governance dokümanları proje dokümanlarının üzerinde bağlayıcıdır.
- Önemli kararlar ADR ve Decision Log ile izlenir.

## Açık Sorular

- EOS repository adresi ve sabit sürüm etiketi ayrıca kaydedilecektir.

---

<!-- SOURCE: docs/00-governance/project-governance.md -->

# Proje Yönetişimi

| Alan | Değer |
|---|---|
| Document ID | GOV-002 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | GOV-001 |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

Bu doküman projenin fikirden teslimata kadar nasıl yönetileceğini tanımlar.

## 2. Yaşam Döngüsü

Proje aşağıdaki aşamalardan geçer:

1. Idea
2. Discovery
3. Design
4. Planning
5. Design Freeze
6. Execution
7. Stabilization
8. Release
9. Maintenance

Bir aşamanın çıktıları yeterli değilse sonraki aşamaya geçilmez.

## 3. Mevcut Aşama

Proje şu anda **Discovery / POC Design** aşamasındadır.

Kodlama, POC tasarımı ve başarı ölçütleri yeterince olgunlaşmadan başlamaz.

## 4. Doküman Durumları

- **Draft:** çalışma sürümü
- **In Review:** incelemede
- **Approved:** kabul edildi
- **Frozen:** uygulama için sabitlendi
- **Superseded:** yeni belgeyle değiştirildi
- **Archived:** tarihsel kayıt

## 5. Karar Sınıfları

### Process ADR

Çalışma yöntemi ve yönetişim kararları.

### Product ADR

Ürün kapsamı, kullanıcı davranışı ve ürün stratejisi kararları.

### Architecture ADR

Teknik mimari, veri, entegrasyon ve altyapı kararları.

## 6. Karar Süreci

Önemli bir karar için:

1. problem tanımlanır,
2. seçenekler yazılır,
3. ölçütler belirlenir,
4. karar ve gerekçe kaydedilir,
5. etkiler listelenir,
6. ADR oluşturulur,
7. Decision Log güncellenir.

## 7. Design Freeze

Design Freeze öncesinde en az aşağıdakiler tamamlanır:

- POC amacı ve kapsamı
- başarı ve başarısızlık ölçütleri
- temel domain modeli
- veri kaynakları
- extraction ve validation akışı
- ana riskler
- test stratejisi
- kabul edilen ADR'ler

Freeze sonrasında kapsam değişikliği change request gerektirir.

## 8. Kapsam Yönetimi

POC tamamlanana kadar POC başarısını doğrudan desteklemeyen özellikler backlog'a alınır.

Yeni fikirler kaybolmaz; ancak aktif kapsamı genişletmez.

## 9. Review

Her paket:

- içerik tutarlılığı,
- EOS uyumu,
- gereksiz tekrar,
- izlenebilirlik,
- uygulanabilirlik,
- açık riskler

açısından gözden geçirilir.

## 10. Teslim Standardı

Her dokümantasyon paketi şunları içerir:

- Markdown dosyaları
- uygulanabilir git patch
- `git apply --check` doğrulaması
- commit mesajı
- paket özeti
- sonraki adım

## Kararlar

- Koddan önce tasarım yapılacaktır.
- POC kapsamı korunacaktır.
- Önemli kararlar ADR ile kayıt altına alınacaktır.
- Her paket tek ve anlamlı commit olarak uygulanacaktır.

## Riskler

- Tasarımın gereğinden fazla uzaması.
- POC'a ait olmayan fikirlerin aktif kapsama girmesi.
- Dokümanların koddan kopması.

## Kontroller

- Her faz sonunda kapsam kontrolü.
- Her patch öncesinde `git apply --check`.
- Her önemli değişiklikte Decision Log güncellemesi.

---

<!-- SOURCE: docs/00-governance/eos-adoption.md -->

# EOS Benimseme Standardı

| Alan | Değer |
|---|---|
| Document ID | GOV-001 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | GOV-000 |
| İlgili ADR | ADR-0001 |
| Son Güncelleme | 2026-07-28 |

## 1. Karar

Akıllı Alışveriş Asistanı projesi, mühendislik ve proje yönetimi için EOS v1.0 standardını kullanır.

EOS dosyaları bu repository içine topluca kopyalanmaz. Proje, EOS'u merkezi ve proje bağımsız bir kaynak olarak referans alır.

## 2. Ayrım

### EOS'un sorumluluğu

- yaşam döngüsü
- dokümantasyon standardı
- karar yönetimi
- kalite kapıları
- değişiklik yönetimi
- sürümleme
- review ve onay süreçleri
- test ve teslim ilkeleri

### Projenin sorumluluğu

- ürün vizyonu
- POC ve MVP kapsamı
- domain modeli
- veri kaynakları
- mimari kararlar
- ürün davranışları
- proje riskleri
- sprint planları
- EOS'tan sapmalar

## 3. Benimseme Modeli

Her yeni projede aşağıdaki minimum kayıtlar bulunur:

1. EOS sürümü
2. EOS benimseme kararı
3. projeye özgü sapmalar
4. proje governance dokümanı
5. Decision Log
6. ADR dizini

## 4. Sapma Yönetimi

EOS'tan sapma gerekiyorsa:

1. Sapmanın gerekçesi yazılır.
2. Etkilenen EOS kuralı belirtilir.
3. Riskler ve geri dönüş planı tanımlanır.
4. ADR oluşturulur.
5. Decision Log güncellenir.
6. Sapma geçici ise sona erme koşulu yazılır.

Sessiz veya belgelenmemiş sapma kabul edilmez.

## 5. EOS'a Geri Besleme

Projede ortaya çıkan genel ve tekrar kullanılabilir iyileştirmeler doğrudan proje standardı haline getirilmez.

Önce:

1. proje içinde aday iyileştirme olarak kaydedilir,
2. proje bağımsızlığı değerlendirilir,
3. uygun görülürse EOS backlog'una taşınır,
4. EOS sürümünde kabul edildikten sonra projeler tarafından kullanılabilir.

## 6. Güncelleme Politikası

Proje, EOS'un yeni sürümüne otomatik geçmez. Yeni sürüm için etki analizi ve ayrı bir benimseme kararı gerekir.

## Kararlar

- EOS merkezi kalacaktır.
- EOS ile proje dokümanları ayrılacaktır.
- Projeler yalnızca kullandıkları EOS sürümünü ve sapmaları kaydedecektir.

## Riskler

- EOS sürümünün belirsiz kalması.
- Projeye özgü kuralların yanlışlıkla EOS kuralı gibi uygulanması.
- EOS güncellemesinin etki analizi yapılmadan benimsenmesi.

## Backlog

- EOS repository URL'sini ve immutable sürüm etiketini eklemek.
- EOS proje başlangıç şablonunu standartlaştırmak.

---

<!-- SOURCE: docs/00-governance/engineering-principles.md -->

# Mühendislik İlkeleri

| Alan | Değer |
|---|---|
| Document ID | GOV-003 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | GOV-001, GOV-002 |
| Son Güncelleme | 2026-07-28 |

## İlkeler

### 1. Documentation First

Kod, önemli davranış ve sınırlar belgelenmeden başlamaz.

### 2. POC Before MVP

Önce en yüksek teknik ve veri riskleri doğrulanır. POC ürünün tamamı değildir.

### 3. Single Source of Truth

Bir kural veya tanım tek bir ana dokümanda yaşar. Diğer belgeler tekrar etmek yerine referans verir.

### 4. Evidence Over Assumption

Kararlar varsayıma değil, örnek veri, test ve ölçümlere dayanır.

### 5. Source Provenance

Her kampanya ve ürün verisinin kaynağı, zamanı ve extraction yöntemi izlenebilir olmalıdır.

### 6. Explainable Automation

Otomatik extraction, eşleştirme ve öneriler; confidence, gerekçe ve kaynak bilgisi taşımalıdır.

### 7. Human Review by Design

Belirsiz veya kritik sonuçlar insan incelemesine yönlendirilebilir olmalıdır.

### 8. Immutable Raw Data

Ham kaynak ve extraction çıktısı sonradan sessizce değiştirilmez. Düzeltmeler yeni sürüm veya kayıt olarak tutulur.

### 9. Normalize Without Losing Evidence

Normalize edilmiş veri, ham verinin yerini almaz; ham kanıta geri bağlanır.

### 10. Modular by Default

Crawler, OCR, extraction, normalization, matching ve validation bağımsız sorumluluklar olarak tasarlanır.

### 11. Deterministic Where Possible

Aynı girdi için tekrar üretilebilir sonuç tercih edilir. AI kullanılan adımlarda model, prompt ve parametreler kaydedilir.

### 12. Fail Explicitly

Belirsizlik, eksik veri ve doğrulama hataları gizlenmez; açık durum ve hata kodlarıyla temsil edilir.

### 13. Measure Before Optimize

Performans ve maliyet sorunları ölçülmeden optimizasyon yapılmaz.

### 14. Security and Privacy by Default

Gizli anahtarlar repository'ye yazılmaz; kişisel veri yalnızca gerekli olduğunda toplanır.

### 15. Evolutionary Architecture

POC için gereksiz karmaşıklık kurulmaz; ancak kanıtlanan ihtiyaçların büyümesine engel olacak kısa yollar da kalıcılaştırılmaz.

### 16. EOS Compliance

Süreç ve teslimler EOS v1.0'a uyar. Sapmalar belgelenir.

## Uygulama Kuralı

Bir karar bu ilkelerden biriyle çelişiyorsa gerekçesi ADR içinde açıkça belirtilmelidir.

## Backlog

- İlkeler için otomatik dokümantasyon kontrol listesi.
- Kod review şablonuna ilke referansları eklemek.

---

<!-- SOURCE: docs/00-governance/decision-log.md -->

# Decision Log

| Alan | Değer |
|---|---|
| Document ID | GOV-004 |
| Sürüm | 1.0 |
| Durum | Aktif |
| EOS Sürümü | EOS v1.0 |
| Son Güncelleme | 2026-07-28 |

## Kararlar

| ID | Tarih | Tür | Karar | Durum | ADR |
|---|---|---|---|---|---|
| D-001 | 2026-07-28 | Process | Proje EOS v1.0 kullanacaktır. | Accepted | ADR-0001 |
| D-002 | 2026-07-28 | Product | Tam ürün öncesinde kampanya verisi toplama POC'u yapılacaktır. | Accepted | ADR-0002 |
| D-003 | 2026-07-28 | Process | EOS merkezi tutulacak, projeye topluca kopyalanmayacaktır. | Accepted | ADR-0001 |
| D-004 | 2026-07-28 | Process | POC dışı özellikler POC tamamlanana kadar backlog'a alınacaktır. | Accepted | ADR-0002 |
| D-005 | 2026-07-28 | Process | Repo güncellemeleri doğrulanmış git patch paketleriyle teslim edilecektir. | Accepted | GOV-002 |

## Kullanım

- Her kabul edilen önemli karar bu tabloya eklenir.
- ADR numarası varsa bağlanır.
- Değiştirilen karar silinmez; durumu `Superseded` yapılır.
- Kararın yerini alan kayıt ayrıca eklenir.

---

<!-- SOURCE: docs/00-governance/glossary.md -->

# Proje Terimleri Sözlüğü

| Alan | Değer |
|---|---|
| Document ID | GOV-005 |
| Sürüm | 1.0 |
| Durum | Aktif |
| Son Güncelleme | 2026-07-28 |

## Terimler

**ADR:** Önemli süreç, ürün veya mimari kararını; seçenekleri ve gerekçesiyle kaydeden belge.

**Campaign / Kampanya:** Belirli tarih, kaynak ve koşullara bağlı fiyat veya promosyon teklifi.

**Confidence:** Bir extraction, normalization veya eşleştirme sonucuna duyulan ölçülmüş güven.

**Design Freeze:** Onaylanan tasarımın uygulama için sabitlendiği ve değişikliklerin kontrollü sürece bağlandığı aşama.

**EOS:** Projelerde nasıl çalışıldığını belirleyen merkezi, proje bağımsız mühendislik yönetim sistemi.

**Extraction:** PDF, görsel veya web sayfasından yapılandırılmış bilgi çıkarma işlemi.

**MVP:** Kullanıcıya anlamlı uçtan uca değer sunan ilk asgari ürün.

**Normalization:** Farklı yazım, birim ve paket biçimlerini standart modele dönüştürme işlemi.

**POC:** En yüksek riskli varsayımı sınırlı kapsamda doğrulayan teknik çalışma.

**Product Identity:** Farklı kaynaklardaki aynı gerçek ürünü temsil eden kalıcı kimlik.

**Provenance:** Bir verinin kaynağı, elde edilme zamanı, yöntemi ve dönüşüm geçmişi.

**Raw Data:** Kaynaktan elde edilen, normalize edilmemiş ve değiştirilemez ham veri.

**Source:** Kampanya veya ürün bilgisinin elde edildiği PDF, görsel, web sayfası ya da başka kaynak.

**Validation:** Çıkarılan veya normalize edilen verinin kurallara ve kanıta göre kontrol edilmesi.

**Variant:** Aynı ürün ailesi içinde içerik, aroma, boyut veya paket gibi özelliklerle ayrılan ürün biçimi.

## Kural

Yeni bir temel terim ilk kez kullanıldığında bu sözlüğe eklenir. Domain dokümanları daha ayrıntılı tanımlar için ana kaynak olabilir.

---

<!-- SOURCE: docs/00-governance/adr/README.md -->

# Architecture, Product and Process Decision Records

Bu dizin önemli karar kayıtlarını içerir.

## ADR Türleri

- **Process ADR:** süreç ve yönetişim
- **Product ADR:** ürün ve kapsam
- **Architecture ADR:** teknik ve veri mimarisi

## Durumlar

- Proposed
- Accepted
- Rejected
- Superseded
- Deprecated

## Dosya Adı

```text
ADR-NNNN-kisa-karar-adi.md
```

## Zorunlu Bölümler

1. Bağlam
2. Karar
3. Seçenekler
4. Gerekçe
5. Sonuçlar
6. Riskler
7. Geri dönüş veya değiştirme koşulları

---

<!-- SOURCE: docs/00-governance/adr/ADR-0001-eos-adoption.md -->

# ADR-0001 — EOS Benimseme Modeli

| Alan | Değer |
|---|---|
| Tür | Process ADR |
| Durum | Accepted |
| Tarih | 2026-07-28 |
| Karar Sahibi | Project Team |
| İlgili Doküman | GOV-001 |

## Bağlam

Projeler için oluşturulan EOS mühendislik sistemi daha önce LUMI projesinde kullanıldı. Aynı genel dokümanların her yeni projede yeniden hazırlanması veya kopyalanması tekrar, sürüm ayrışması ve bakım maliyeti oluşturur.

## Karar

EOS, merkezi ve proje bağımsız mühendislik sistemi olarak kullanılacaktır.

Bu proje:

- EOS v1.0'ı referans alır,
- EOS dosyalarını topluca kopyalamaz,
- yalnızca benimseme sürümünü, proje bağlamını ve sapmaları kaydeder,
- genel iyileştirmeleri EOS backlog'una geri besler.

## Değerlendirilen Seçenekler

### A. EOS dokümanlarını her projeye kopyalamak

Reddedildi. Kopyalar zamanla ayrışır ve hangi sürümün geçerli olduğu belirsizleşir.

### B. Her proje için yeni mühendislik kitabı yazmak

Reddedildi. Gereksiz tekrar ve tutarsızlık üretir.

### C. Merkezi EOS + proje adoption belgesi

Kabul edildi. Genel standart ile proje bağlamını ayırır.

## Sonuçlar

### Olumlu

- tekrar azalır,
- standartlar merkezileşir,
- sürüm takibi kolaylaşır,
- projeler arası tutarlılık artar.

### Olumsuz

- EOS kaynağına erişim gerektirir,
- sürüm yükseltmeleri ayrıca yönetilmelidir.

## Riskler

- EOS sürümünün sabit referansla kaydedilmemesi.
- Proje kuralı ile EOS kuralının karıştırılması.

## Değiştirme Koşulu

Merkezi EOS yaklaşımının erişilebilirlik veya sürüm yönetimi açısından sürdürülemez olduğu kanıtlanırsa yeni ADR ile değiştirilir.

---

<!-- SOURCE: docs/00-governance/adr/ADR-0002-poc-first-strategy.md -->

# ADR-0002 — POC-First Ürün Stratejisi

| Alan | Değer |
|---|---|
| Tür | Product ADR |
| Durum | Accepted |
| Tarih | 2026-07-28 |
| Karar Sahibi | Project Team |
| İlgili Doküman | docs/01-poc/poc-vizyonu-ve-kapsami.md |

## Bağlam

Tam Akıllı Alışveriş Asistanı; ürün kimliği, fiyat takibi, öneriler, listeler, sağlık değerlendirmesi ve farklı veri kaynakları gibi geniş bir kapsama sahiptir.

En temel belirsizlik, kampanya katalogları ve seçili web kaynaklarından ürün verisinin güvenilir biçimde çıkarılıp normalize edilip edilemeyeceğidir.

Bu risk doğrulanmadan tam ürün geliştirmek yüksek yeniden çalışma maliyeti oluşturur.

## Karar

İlk uygulama tam ürün veya MVP olmayacaktır.

Önce aşağıdaki sınırlı POC geliştirilecektir:

1. kampanya kaynağını alma,
2. ürün verisini çıkarma,
3. normalize etme,
4. doğrulama,
5. saklama,
6. kaynaklar arasında karşılaştırma.

## POC Dışında Kalanlar

- sağlık ve güvenlik analizi
- aile alışveriş listeleri
- öneri motoru
- ev envanteri
- mobil uygulama
- genel alışveriş ajanı
- fiyat tahmini

Bu fikirler silinmez; backlog'a alınır.

## Değerlendirilen Seçenekler

### A. Tam ürünü doğrudan geliştirmek

Reddedildi. En riskli veri problemi çözülmeden kapsamı büyütür.

### B. Önce kullanıcı arayüzü prototipi yapmak

Kısmen faydalı olsa da ana teknik riski doğrulamaz.

### C. Veri toplama ve normalizasyon POC'u

Kabul edildi. Projenin temel uygulanabilirliğini doğrudan test eder.

## Başarı Yönü

POC başarı ölçütleri ayrı dokümanda sayısallaştırılacaktır. En azından:

- ürün alanlarının çıkarılabilmesi,
- kaynak bağlantısının korunması,
- belirsiz sonuçların işaretlenmesi,
- normalize edilmiş kayıtların karşılaştırılabilmesi

kanıtlanmalıdır.

## Sonuçlar

- İlk teslim son kullanıcı ürünü olmayacaktır.
- POC boyunca kapsam sıkı şekilde korunacaktır.
- POC sonucuna göre MVP mimarisi yeniden değerlendirilecektir.

## Değiştirme Koşulu

POC'un ana teknik riski temsil etmediği kanıtlanırsa veya veri kaynaklarına erişim modeli değişirse yeni ADR hazırlanır.
