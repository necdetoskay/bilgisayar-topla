# Akıllı Alışveriş Asistanı — Engineering Handbook v0.1

> Governance, ürün vizyonu, POC ve domain dokümantasyonunun kesintisiz okuma ve fiziksel çıktı için hazırlanmış birleşik Markdown sürümüdür.

## Ciltler

- [Cilt 01 — Governance](#cilt-01-governance) — [`volume-01-governance.md`](volume-01-governance.md)
- [Cilt 02 — Ürün Vizyonu](#cilt-02-urun-vizyonu) — [`volume-02-product-vision.md`](volume-02-product-vision.md)
- [Cilt 03 — POC Tanımı ve Doğrulama](#cilt-03-poc-tanimi-ve-dogrulama) — [`volume-03-poc.md`](volume-03-poc.md)
- [Cilt 04 — Domain ve Product Identity](#cilt-04-domain-ve-product-identity) — [`volume-04-domain.md`](volume-04-domain.md)

---

## Cilt 01 — Governance

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

---

## Cilt 02 — Ürün Vizyonu

<!-- SOURCE: docs/00-urun-vizyonu/README.md -->

# Ürün Temeli

| Alan | Değer |
|---|---|
| Document ID | PRD-000 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Son Güncelleme | 2026-07-28 |

## Amaç

Bu klasör, Akıllı Alışveriş Asistanı'nın neden var olduğunu, hangi problemi çözdüğünü, kimler için tasarlandığını ve ürünün hangi sınırlar içinde gelişeceğini tanımlar.

## Doküman Haritası

- [Uygulama İskeleti](uygulama-iskeleti.md): geniş ürün vizyonu ve modül haritası
- [Problem Tanımı](problem-tanimi.md): çözülmek istenen temel kullanıcı ve veri problemleri
- [Ürün Felsefesi ve Değer Önerisi](urun-felsefesi-ve-deger-onerisi.md)
- [Hedef Kullanıcılar ve Kullanım Bağlamları](hedef-kullanicilar-ve-kullanim-baglamlari.md)
- [Ürün Sınırları ve Kapsam İlkeleri](urun-sinirlari-ve-kapsam-ilkeleri.md)
- [Başarı Çerçevesi](basari-cercevesi.md)

## Belge İlişkisi

`uygulama-iskeleti.md` ürünün uzun vadeli yönünü tanımlar.

`docs/01-poc/poc-vizyonu-ve-kapsami.md` ise yalnızca ilk teknik doğrulama çalışmasının sınırlarını tanımlar. POC, ürün vizyonunun tamamı değildir.

## Tek Kaynak Kuralı

- Geniş ürün modülleri: `uygulama-iskeleti.md`
- İlk teknik doğrulama kapsamı: `docs/01-poc/poc-vizyonu-ve-kapsami.md`
- Ürün problemi: `problem-tanimi.md`
- Kapsam sınırları: `urun-sinirlari-ve-kapsam-ilkeleri.md`
- Başarı yaklaşımı: `basari-cercevesi.md`

---

<!-- SOURCE: docs/00-urun-vizyonu/uygulama-iskeleti.md -->

# Akıllı Alışveriş Asistanı — Uygulama İskeleti

## 1. Belgenin amacı

Bu belge, **Akıllı Alışveriş Asistanı** projesi için şimdiye kadar yapılan fikir alışverişlerinin ürün iskeletini kayda geçirir. Amaç henüz teknik uygulama ayrıntılarını veya nihai PRD'yi tanımlamak değil; uygulamanın ne olduğunu, hangi problemleri çözdüğünü, hangi modüllerden oluştuğunu ve kullanıcıya nasıl bir deneyim sunacağını ortak bir çerçeveye oturtmaktır.

Bu belge kodlama öncesi ürün olgunlaştırma sürecinin başlangıç kaydıdır. Uygulama fikir bakımından yeterince olgunlaştığında bu çerçeve kullanılarak ayrıntılı PRD, sistem mimarisi, veri modeli, sprint planı ve uygulama planı hazırlanacaktır.

---

## 2. Ürün tanımı

Akıllı Alışveriş Asistanı yalnızca fiyat karşılaştıran veya kampanya gösteren bir uygulama değildir.

Uygulama;

- kullanıcının ihtiyaçlarını,
- aile içi ortak alışveriş listelerini,
- ürün ve marka tercihlerini,
- kara listeleri,
- ürün içeriklerini,
- resmî güvenlik kayıtlarını,
- geçmiş fiyatları,
- kampanya geçerlilik sürelerini,
- kişisel ürün deneyimlerini,
- alışveriş sıklığını,
- hedef fiyatları,
- satıcı güvenilirliğini

birlikte değerlendirerek **ne alınmalı, ne zaman alınmalı, nereden alınmalı, hangi ürün tercih edilmeli ve neden** sorularına açıklanabilir cevaplar üretir.

Temel ürün yaklaşımı:

> En ucuz ürünü değil, kullanıcı ve ailesi için en uygun satın alma kararını bulmak.

---

## 3. Temel ürün ilkeleri

### 3.1. Pratiklik birinci önceliktir

Uygulamanın en önemli başarı ölçütü özellik sayısı değil, kullanıcının karar alma süresidir.

Hedef deneyim:

> Uygulamayı aç, ihtiyacını belirt, sonucu gör, kararını ver ve çık.

Kullanıcı ekranlar, filtreler ve uzun formlar arasında kaybolmamalıdır.

### 3.2. Bir bilgi kullanıcıdan ikinci kez istenmez

Kullanıcının daha önce belirttiği;

- marka tercihleri,
- kara listeleri,
- kaçındığı içerikler,
- aile bireylerinin tercihleri,
- hedef fiyatlar,
- favori ürünler,
- geçmiş ürün yorumları,
- market tercihleri

kalıcı hafızada tutulmalı ve sonraki kararlarda otomatik kullanılmalıdır.

### 3.3. Açıklanabilir karar

Uygulama yalnızca puan veya sonuç göstermemelidir. Her öneri veya ret kararı için kısa ve anlaşılır neden sunmalıdır.

Örnek:

- Son 90 günün en düşük fiyatına yakın.
- Kampanya yarın sona eriyor.
- Marka kara listenizde.
- Çocuğunuz bu ürünü daha önce beğenmedi.
- İçerik profilinizde kaçındığınız bir katkı maddesi içeriyor.
- Aynı ürün başka bir güvenilir satıcıda daha uygun.

### 3.4. Agent'lar önerir, araçlar hesaplar, harness denetler, kaynaklar kanıtlar

LLM veya agent çıktısı tek başına son karar olmamalıdır.

- Araştırma ve yorumlama uzman agent'lar tarafından yapılabilir.
- Fiyat, birim fiyat, tarih, eşik, sepet optimizasyonu ve kara liste kontrolü deterministik araçlarla yapılmalıdır.
- Merkezi harness görevleri yönetmeli, çıktıların doğrulanmasını sağlamalıdır.
- Her önemli karar kaynak ve kanıt kaydıyla saklanmalıdır.

### 3.5. Güvenlik ve uygunluk fiyatın önündedir

Öncelik sırası genel olarak şöyledir:

1. Resmî güvenlik ve risk kayıtları
2. Kullanıcının kara listeleri ve kesin yasakları
3. Kişisel içerik ve sağlık tercihleri
4. Ürün kalitesi ve geçmiş deneyimler
5. Fiyat ve kampanya avantajı

---

## 4. Kullanıcı deneyimi yaklaşımı

### 4.1. Ana ekran sade olmalıdır

Ana ekranda kullanıcıya en fazla birkaç güçlü giriş noktası gösterilmelidir:

- **Bugün Ne Almalıyım?**
- **Ürünü Tara**
- **Alışveriş Listelerim**
- **Hazır Raporlar**

İleri düzey ayarlar ana deneyimin önüne geçmemelidir.

### 4.2. Konuşma ve kamera öncelikli kullanım

Kullanıcı mümkün olduğunca doğal dille işlem yapabilmelidir.

Örnek komutlar:

- Bu akşam haftalık alışveriş yapacağım.
- Çocuğa süt alacağım.
- Bu ürün nasıl?
- Bu fişi kaydet.
- Televizyon fiyatı uygun olduğunda haber ver.
- Eşim listeye ne ekledi?

Kamera ile;

- ürün ön yüzü,
- barkod,
- içindekiler etiketi,
- besin değerleri,
- fiyat etiketi,
- fiş

taranabilmelidir.

### 4.3. Katmanlı sonuç gösterimi

İlk ekranda kısa sonuç gösterilmelidir:

- Uygun
- Dikkatle değerlendir
- Tercihlerinize uygun değil
- Resmî risk nedeniyle uzak dur

Detay isteyen kullanıcı gerekçeleri, kaynakları ve ayrıntılı puanları açabilmelidir.

### 4.4. Raf konumu kapsam dışıdır

Uygulama mağaza içi raf veya koridor konumu göstermeye çalışmayacaktır. Market içi yerleşimler güvenilir biçimde elde edilemediği ve sık değiştiği için bu özellik ürün kapsamına alınmayacaktır.

---

## 5. Ana modüller

## 5.1. Alışveriş Listelerim

Kullanıcı farklı amaçlarla listeler oluşturabilmelidir:

- günlük alışveriş,
- haftalık alışveriş,
- aylık ihtiyaçlar,
- ortak aile listesi,
- yalnızca uygun fiyat oluştuğunda alınacaklar,
- elektronik ürünler,
- beyaz eşya,
- okul ihtiyaçları,
- dayanıklı tüketim ürünleri.

Her liste öğesinde ihtiyaca göre şu bilgiler bulunabilir:

- ürün veya kategori,
- miktar,
- önem düzeyi,
- aciliyet,
- ihtiyaç tarihi,
- hedef fiyat,
- tercih edilen markalar,
- yasaklı markalar,
- kabul edilebilir alternatifler,
- teknik özellikler,
- atanmış aile üyesi,
- durum.

Önem ve aciliyet birbirinden ayrı değerlendirilmelidir.

Örnek:

- Bebek bezi: çok önemli, bugün gerekli.
- Peynir: önemli, bu hafta gerekli.
- Televizyon: düşük aciliyet, yalnızca iyi fırsatta alınacak.

### Ortak aile listesi

Bir aile üyesinin oluşturduğu liste diğer aile üyelerinin ekranına düşmelidir. Sistem gün içinde araştırma yapmalı ve alışveriş zamanına yakın sade bir rapor hazırlamalıdır.

Örnek rapor:

- 12 ürün araştırıldı.
- 8 ürün için uygun seçenek bulundu.
- 2 ürünün kampanyası yarın bitiyor.
- 1 ürün kara liste nedeniyle elendi.
- 1 ürün için fiyatın düşmesi beklenebilir.

---

## 5.2. Broşür ve kampanya toplama

Uygulama market broşürlerinden yapılandırılmış ürün ve kampanya verisi çıkarabilmelidir.

Toplanması gereken temel alanlar:

- market,
- ürün adı,
- marka,
- varyant,
- gramaj veya adet,
- normal fiyat,
- kampanya fiyatı,
- birim fiyat,
- kampanya türü,
- geçerlilik başlangıç tarihi,
- geçerlilik bitiş tarihi,
- üyelik veya kart şartı,
- stok sınırlaması,
- kaynak,
- güven seviyesi.

Fiyat geçerlilik süresi zorunlu veri olarak ele alınmalıdır. Kampanya bitiş tarihi yaklaşan ve kullanıcı için uygun olan ürünler alarm adayı olabilir.

Kaynak önceliği:

1. Resmî market kataloğu veya broşürü
2. Güvenilir broşür toplayıcı kaynak
3. Akakçe veya Cimri gibi doğrulama kaynakları
4. Kullanıcının raf etiketi veya fiş fotoğrafı

---

## 5.3. On-the-Fly Check — anlık ürün kontrolü

Kullanıcı alışveriş sırasında bir ürünün;

- ön yüzünü,
- barkodunu,
- içindekiler listesini,
- besin değerleri tablosunu,
- fiyat etiketini

fotoğraf olarak yükleyebilmelidir.

Sistem mümkün olduğunca tek akışta şu işlemleri yapmalıdır:

1. Ürünü tanıma
2. Barkod, marka, ürün adı ve gramaj çıkarımı
3. İçindekiler listesini okuma
4. Besin değerlerini çıkarma
5. Katkı maddelerini eşleştirme
6. Resmî ve bilimsel kaynaklarla açıklama
7. Kullanıcının tercihleriyle karşılaştırma
8. Genel ürün puanı üretme
9. Kişisel uyum puanı üretme
10. Fiyat ve birim fiyat çıkarma
11. Kullanıcıya nedenleriyle birlikte sonuç gösterme

Önerilen iki puan:

- **Genel ürün puanı:** Ürünün içerik, beslenme ve şeffaflık özellikleri.
- **Kişisel uyum puanı:** Ürünün kullanıcı ve ailesinin tercihleriyle uyumu.

Fotoğraftan çıkarılan veriler için güven oranı gösterilmeli; belirsiz bilgiler kesinmiş gibi sunulmamalıdır.

Ürün veritabanında yoksa geçici ürün kaydı oluşturulmalı, kullanıcıya hızlı sonuç verilmeli ve ürün daha sonra doğrulama kuyruğunda zenginleştirilmelidir.

---

## 5.4. Ürün bilgi ve içerik katmanı

Her ürün zaman içinde zenginleşen bir bilgi kaydına sahip olmalıdır.

Örnek veri başlıkları:

- ürün kimliği,
- barkod,
- marka,
- kategori,
- varyant,
- gramaj,
- içerik listesi,
- içerik sürümleri,
- besin değerleri,
- katkı maddeleri,
- alerjenler,
- işlenmişlik düzeyi,
- genel ürün puanı,
- kaynaklar,
- yapay zekâ özeti,
- fiyat geçmişi,
- kampanyalar,
- resmî güvenlik kayıtları,
- kişisel deneyimler.

Üreticilerin formülleri değiştirebileceği kabul edilmeli ve içerik sürüm geçmişi tutulmalıdır.

---

## 5.5. Resmî güvenlik ve taklit-tağşiş kontrolü

Tarım ve Orman Bakanlığı tarafından yayımlanan güvenilir gıda, taklit ve tağşiş kayıtları sistemin en önemli veri kaynaklarından biri olmalıdır.

Kontrol yalnızca marka adına göre yapılmamalıdır. Mümkün olduğunda;

- firma,
- marka,
- ürün adı,
- kategori,
- parti veya seri bilgisi,
- yayın tarihi

birlikte değerlendirilmelidir.

Resmî eşleşme varsa sistem normal fiyat önerisi üretmemeli, öncelikle güvenlik uyarısı vermelidir.

---

## 5.6. Marka ve ürün tercih sistemi

Markalar ve ürünler yalnızca seviliyor/sevilmiyor şeklinde tutulmamalıdır.

Önerilen tercih seviyeleri:

- tercih edilen,
- kabul edilebilir,
- nötr,
- kaçınılan,
- tamamen engellenen.

Tamamen engellenen marka veya ürün;

- önerilere,
- en ucuz sepete,
- fiyat alarmlarına,
- kampanya bildirimlerine

dâhil edilmemelidir.

Kullanıcı ayrıca içerik bazlı tercihler tanımlayabilmelidir:

- palm yağı istemiyorum,
- glikoz şurubu istemiyorum,
- yapay tatlandırıcı istemiyorum,
- koruyucu içerenleri mümkünse önerme,
- belirli alerjenleri tamamen engelle.

---

## 5.7. Kişisel ürün yorumları ve deneyim günlüğü

Her ürün için kullanıcıya ve aileye özel yorum eklenebilmelidir.

Örnekler:

- Kızım tadını sevmedi.
- Çok çabuk bozuldu.
- Normalden fazla acıydı.
- Fiyatına göre başarılıydı.
- Bir daha almak istemiyorum.
- Ailece çok beğendik.

Bu yorumlar klasik herkese açık yorum sisteminden farklıdır. Amaç sosyal puanlama değil, ailenin kendi satın alma hafızasını oluşturmaktır.

Yapay zekâ serbest metni otomatik etiketleyebilir:

- çocuk beğenmedi,
- tat memnuniyeti düşük,
- hızlı bozuldu,
- tekrar satın alma isteği düşük,
- aile favorisi,
- ambalaj sorunu,
- kalite tutarsızlığı.

Kişisel yorumlar öneri puanını etkilemelidir; ancak tek başına kesin hüküm oluşturmamalıdır. Yorumun tarihi, ürün formül değişikliği ve tekrar eden deneyimler dikkate alınmalıdır.

---

## 5.8. Fiyat araştırma ve fiyat geçmişi

Sistem gıda ile sınırlı olmamalıdır. Elektronik, beyaz eşya ve diğer dayanıklı tüketim ürünleri için büyük ve güvenilir alışveriş kaynaklarından fiyat araştırması yapılabilmelidir.

Dayanıklı tüketim ürünlerinde fiyat yanında şu unsurlar değerlendirilmelidir:

- model numarası,
- teknik özellikler,
- satıcı güvenilirliği,
- garanti,
- yetkili servis,
- kargo,
- kurulum,
- teslimat süresi,
- kuponlar,
- banka kampanyaları,
- ürünün fiyat geçmişi,
- benzer veya daha iyi alternatifler.

En ucuz satıcı otomatik olarak en iyi seçenek kabul edilmemelidir.

---

## 5.9. Fiyat ve kampanya alarm sistemi

Kullanıcı farklı alarm türleri tanımlayabilmelidir:

- hedef fiyatın altına düşünce,
- tarihsel olarak iyi fiyat oluşunca,
- güçlü indirim oluşunca,
- kampanyanın bitmesine az kalınca,
- düzenli alınan ürünün zamanı yaklaşınca,
- güvenilir satıcıda fiyat düşünce,
- daha iyi alternatif bulunduğunda.

Alarm üretmeden önce şu kontroller yapılmalıdır:

1. Ürün kara listede mi?
2. Resmî risk kaydı var mı?
3. İçerik kullanıcı tercihleriyle uyumlu mu?
4. İndirim gerçekten avantajlı mı?
5. Kampanya şartları doğrulandı mı?
6. Kampanyanın bitmesine ne kadar kaldı?
7. Kullanıcının ürüne yakın zamanda ihtiyacı var mı?

Amaç her fiyat değişimini bildirmek değil, kullanıcı açısından anlamlı olayları bildirmektir.

---

## 5.10. Sepet ve alışveriş planı optimizasyonu

Sistem yalnızca ürün bazında değil, bütün alışveriş listesi için plan üretmelidir.

Dikkate alınabilecek faktörler:

- toplam sepet tutarı,
- market sayısı,
- kullanıcının maksimum uğramak istediği mağaza sayısı,
- yol ve zaman maliyeti,
- kampanya bitiş tarihleri,
- minimum sepet şartı,
- teslimat ücreti,
- stok bilgisi,
- ürün önceliği,
- alternatif ürün kabulü.

Sistem kullanıcıya açık karşılaştırma sunmalıdır:

> Tek marketten alırsanız 24 TL daha fazla ödersiniz ancak ikinci bir mağazaya gitmeniz gerekmez.

Bu hesaplamalar deterministik optimizasyon araçlarıyla yapılmalıdır.

---

## 5.11. Fiş ve alışveriş sonrası öğrenme

Kullanıcı fiş fotoğrafı yükleyebilmelidir. Sistem;

- satın alınan ürünleri,
- miktarları,
- fiyatları,
- marketi,
- tarihi,
- uygulanan kampanyaları

çıkararak alışveriş geçmişine eklemelidir.

Bu veri;

- fiyat geçmişi,
- tüketim sıklığı,
- tekrar satın alma tahmini,
- tasarruf raporları,
- kişisel ürün yorumları,
- stok tahmini

için kullanılabilir.

Uygulama satın alma sonrası kullanıcıya uzun form göstermemeli; gerekirse yalnızca kısa sorular sormalıdır:

- Bu ürünü beğendiniz mi?
- Tekrar alınsın mı?
- Hızlı bozuldu mu?

---

## 6. Çok ajanlı harness mimarisi

Uygulama tek bir genel agent yerine merkezi bir harness ve uzman görev bileşenleriyle çalışmalıdır.

### 6.1. Merkezi Orchestrator / Harness

Sorumlulukları:

- kullanıcı isteğini anlamak,
- görevi alt görevlere ayırmak,
- gerekli agent ve araçları seçmek,
- görev sırasını yönetmek,
- başarısız işlemleri yeniden denemek,
- maliyet ve süre sınırlarını yönetmek,
- doğrulama gerektiren çıktıları işaretlemek,
- insan onayı gereken noktaları belirlemek,
- sonuçları birleştirmek,
- karar kaydını saklamak.

### 6.2. Uzman agent ve servis adayları

- Product Identity Agent
- Brochure Extraction Agent
- Price Research Agent
- Food Safety Agent
- Ingredient Analysis Agent
- Personal Preference Agent
- Campaign Agent
- Notification Agent
- Report Agent

### 6.3. Deterministik araçlar

- barkod ve ürün eşleştirme,
- fiyat ve birim fiyat hesaplama,
- tarih ve kampanya süresi kontrolü,
- kara liste filtresi,
- puan ağırlıklandırma,
- hedef fiyat kontrolü,
- sepet optimizasyonu,
- JSON ve şema doğrulama,
- tekrar kayıt önleme,
- bildirim zamanlama.

Her iş agent olmamalıdır. Hesaplanabilir ve doğrulanabilir işler mümkün olduğunca kod tabanlı araçlarla yapılmalıdır.

---

## 7. Hafıza katmanları

## 7.1. Kullanıcı hafızası

- marka tercihleri,
- kara listeler,
- içerik tercihleri,
- aile bireyleri,
- market tercihleri,
- maksimum mağaza sayısı,
- alışveriş günleri,
- hedef fiyatlar,
- bildirim tercihleri,
- geçmiş kararlar.

## 7.2. Ürün hafızası

- ürün kimliği,
- barkod,
- varyantlar,
- içerik sürümleri,
- puanlar,
- güvenlik kayıtları,
- fiyat geçmişi,
- kişisel yorumlar,
- geçmiş satın almalar.

## 7.3. Görev hafızası

- hangi araştırma yapıldı,
- hangi kaynaklar kullanıldı,
- hangi agent çalıştı,
- sonuç neydi,
- güven seviyesi neydi,
- ne zaman tekrar kontrol edilmeli.

## 7.4. Karar hafızası

Her öneri veya ret kararı için;

- karar,
- nedenler,
- kullanılan kurallar,
- kaynaklar,
- güven seviyesi,
- kullanıcıya gösterilen açıklama

saklanmalıdır.

---

## 8. Raporlama yaklaşımı

Uygulama uzun raporları varsayılan olarak göstermemelidir. Önce özet, sonra ayrıntı yaklaşımı kullanılmalıdır.

Örnek günlük rapor:

> Bugünkü listenizde 11 ürün var. 7 ürün için uygun seçenek bulundu. 2 kampanya yarın sona eriyor. 1 ürün kara liste nedeniyle çıkarıldı. 1 ürün için fiyatın düşmesi beklenebilir.

Örnek dayanıklı tüketim raporu:

> Takip ettiğiniz televizyon hedef fiyatın altına düştü. Satıcı güvenilir, ancak kampanya banka kartı şartına bağlı. Aynı fiyat aralığında daha uzun garanti sunan bir alternatif de bulundu.

---

## 9. Bildirim yaklaşımı

Bildirim sistemi sessiz ve seçici olmalıdır.

Bildirim gönderilebilecek anlamlı olaylar:

- gerekli ürün için iyi fiyat oluşması,
- kampanyanın yakında bitmesi,
- resmî güvenlik kaydı bulunması,
- kullanıcının hedef fiyatının gerçekleşmesi,
- ortak listeye önemli ürün eklenmesi,
- alışveriş raporunun hazır olması,
- daha iyi alternatif bulunması,
- ürün formülünün değişmesi.

Bildirimler kullanıcıyı uygulamaya bağımlı hâle getirmemeli veya sürekli fiyat kontrolüne zorlamamalıdır.

---

## 10. Kapsam dışında veya sonraya bırakılan fikirler

Şimdilik kapsam dışında:

- mağaza içi raf ve koridor yönlendirmesi,
- güvenilir veri olmadan gerçek zamanlı stok garantisi,
- doğrulanmamış sağlık iddiaları,
- yalnızca LLM yorumuna dayalı güvenlik kararı,
- herkese açık sosyal yorum platformu,
- gereksiz özelliklerle yoğun ana ekran.

İleriki sürümlerde değerlendirilebilecek alanlar:

- anonim topluluk eğilimleri,
- daha gelişmiş ev stok yönetimi,
- teslimat ve online sipariş entegrasyonları,
- banka ve sadakat programı entegrasyonları,
- otomatik yeniden sipariş,
- gelişmiş bütçe ve tasarruf planlama.

---

## 11. Başlangıç ürün omurgası

İlk ürün omurgası dört ana deneyim etrafında kurulmalıdır:

1. **Alışveriş Listelerim**
   Günlük, haftalık, ortak aile ve uzun vadeli takip listeleri.

2. **Ürünü Tara**
   Barkod, içerik, besin değeri ve fiyat etiketinden anlık değerlendirme.

3. **Araştır ve Karar Ver**
   Broşür, fiyat geçmişi, güvenlik, içerik ve tercihler üzerinden öneri.

4. **Raporlar ve Alarmlar**
   Ne alınmalı, ne bekletilmeli, hangi kampanya bitiyor ve neden.

---

## 12. Sonraki dokümantasyon adımları

Uygulama iskeleti olgunlaştırıldıktan sonra aşağıdaki belgeler hazırlanmalıdır:

1. Ürün Gereksinimleri Dokümanı — PRD
2. Kullanıcı personalları ve temel senaryolar
3. Uçtan uca kullanıcı akışları
4. Bilgi mimarisi ve ekran haritası
5. Çok ajanlı harness mimarisi
6. Veri kaynakları ve güvenilirlik politikası
7. Ürün, fiyat, kampanya ve hafıza veri modeli
8. Puanlama ve öneri politikası
9. Bildirim ve alarm politikası
10. Gizlilik, güvenlik ve aile paylaşım modeli
11. MVP kapsamı ve sonraki sürümler
12. Test stratejisi ve kabul kriterleri
13. Teknik yığın ve uygulama planı
14. Sprint ve teslimat planı

---

## 13. Ürünün kısa tanımı

> Akıllı Alışveriş Asistanı; kullanıcının ihtiyaçlarını, ailesinin tercihlerini, ürün deneyimlerini, güvenlik ve içerik verilerini, güncel fiyatları ve kampanyaları birlikte değerlendirerek neyin, ne zaman, nereden ve neden alınması gerektiğini açıklayan çok ajanlı kişisel satın alma karar platformudur.

---

<!-- SOURCE: docs/00-urun-vizyonu/problem-tanimi.md -->

# Problem Tanımı

| Alan | Değer |
|---|---|
| Document ID | PRD-001 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Son Güncelleme | 2026-07-28 |

## 1. Ana Problem

Tüketiciler bir ürünü satın almadan önce fiyat, kampanya, gramaj, kalite, kişisel tercih, satıcı güvenilirliği ve kampanya süresi gibi dağınık bilgileri farklı kaynaklardan elle bir araya getirmek zorundadır.

Bu süreç:

- zaman alır,
- karşılaştırılması güç veriler üretir,
- birim ve paket farklılıkları nedeniyle yanıltıcı olabilir,
- kampanya geçerlilik tarihlerini gözden kaçırabilir,
- aynı ürünün farklı adlarla sunulması nedeniyle hatalı karşılaştırmalara yol açabilir,
- kullanıcının önceki tercihlerini ve deneyimlerini çoğunlukla hesaba katmaz.

## 2. POC Seviyesindeki Kök Problem

İlk aşamadaki en kritik belirsizlik şudur:

> Market katalogları, görselleri ve seçili web sayfalarındaki dağınık kampanya verileri güvenilir, izlenebilir ve karşılaştırılabilir yapılandırılmış kayıtlara dönüştürülebilir mi?

Bu problem çözülmeden fiyat karşılaştırması, öneri, alarm veya kişisel alışveriş asistanı güvenilir biçimde geliştirilemez.

## 3. Kullanıcı Açısından Problemler

### 3.1. Bilgi dağınıklığı

Kampanyalar PDF, görsel, web sayfası, mobil uygulama ve mağaza içi etiketlerde dağınık halde bulunur.

### 3.2. Karşılaştırma zorluğu

Aynı ürün farklı kaynaklarda farklı ad, paket ve birimlerle gösterilebilir.

Örnek:

- 1 litre
- 1000 ml
- 4 × 250 ml
- aile paketi

Bu kayıtların doğrudan fiyat karşılaştırması yanıltıcı olabilir.

### 3.3. Geçerlilik belirsizliği

Fiyatın hangi tarihlerde, hangi mağazada, hangi üyelik veya kart koşuluyla geçerli olduğu çoğu zaman ürün adından ayrı sunulur.

### 3.4. Kanıt eksikliği

Bir fiyat veya ürün bilgisinin hangi kaynaktan geldiği kaybolursa kullanıcı sonucu doğrulayamaz.

### 3.5. Karar yorgunluğu

Kullanıcının amacı yüzlerce kampanyayı incelemek değil, belirli bir ihtiyacı için güvenilir karar verebilmektir.

## 4. Sistem Açısından Problemler

- ürün kartlarının görsel olarak doğru ayrıştırılması,
- fiyatın doğru ürünle eşleştirilmesi,
- marka, varyant, miktar ve birim çıkarımı,
- kampanya tarihlerinin kaynak içindeki doğru kapsama bağlanması,
- tekrar işlenen kaynaklarda mükerrer kayıt oluşmaması,
- ham veri ile normalize edilmiş verinin bağlantısının korunması,
- belirsiz kayıtların insan incelemesine yönlendirilmesi.

## 5. Çözülmeyecek Yanlış Problem

İlk aşamada amaç bütün alışveriş kararlarını yapay zekâya bırakmak değildir.

Amaç:

> Güvenilir karar sistemlerinin üzerinde çalışabileceği doğrulanabilir veri temelini kurmak ve bunun uygulanabilirliğini kanıtlamaktır.

## 6. Problem Başarıyla Çözülürse

Sistem:

- kampanya kaynaklarını düzenli biçimde işleyebilir,
- ürün ve fiyat alanlarını çıkarabilir,
- kayıtları standartlaştırabilir,
- belirsizliği görünür kılabilir,
- kaynağa geri bağlantı sağlayabilir,
- aynı veya karşılaştırılabilir ürünleri eşleştirmeye hazır veri üretebilir.

## Açık Sorular

- Hangi market ve kaynak tipleri ilk POC veri setine alınacaktır?
- Aynı ürünün kimliği barkod bulunmadığında nasıl kurulacaktır?
- Kabul edilebilir manuel inceleme oranı nedir?

---

<!-- SOURCE: docs/00-urun-vizyonu/urun-felsefesi-ve-deger-onerisi.md -->

# Ürün Felsefesi ve Değer Önerisi

| Alan | Değer |
|---|---|
| Document ID | PRD-002 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | PRD-001 |
| Son Güncelleme | 2026-07-28 |

## 1. Ürün Felsefesi

Akıllı Alışveriş Asistanı'nın amacı kullanıcıya daha fazla veri göstermek değil, satın alma kararını daha güvenilir ve daha kolay hale getirmektir.

Temel yaklaşım:

> En ucuz görünen ürünü değil, koşullarıyla birlikte en uygun ve kanıtlanabilir satın alma seçeneğini bulmak.

## 2. Değer Önerisi

Ürün uzun vadede kullanıcıya şu değeri sunmalıdır:

- dağınık kampanya bilgisini tek yapıda toplamak,
- paket ve birim farklarını görünür kılmak,
- fiyatın geçerlilik koşullarını kaybetmemek,
- sonucu kaynağıyla göstermek,
- kullanıcının tercihlerini zaman içinde hatırlamak,
- önerinin nedenini açıklamak,
- belirsiz bilgiyi kesin sonuç gibi sunmamak.

## 3. POC Değer Önerisi

POC son kullanıcıya tam alışveriş asistanı sunmaz.

POC'un değeri:

> Kampanya verisinin otomatik veya yarı otomatik biçimde güvenilir, normalize edilmiş ve incelenebilir kayıtlara dönüştürülebildiğini kanıtlamak.

## 4. Ürün Davranış İlkeleri

### 4.1. Kanıt sonuçtan ayrılmaz

Her fiyat ve kampanya kaydı kaynak, tarih ve extraction bilgisine bağlı olmalıdır.

### 4.2. Belirsizlik gizlenmez

Güven seviyesi düşük alanlar işaretlenir ve gerektiğinde review kuyruğuna gönderilir.

### 4.3. Ham veri korunur

Normalize edilmiş kayıt, kaynağın yerine geçmez.

### 4.4. Otomasyon insanı dışlamaz

Sistem mümkün olanı otomatikleştirir; belirsiz olanı insanın kolayca düzeltebileceği şekilde sunar.

### 4.5. Sadelik özellik sayısından önemlidir

Kullanıcı ürünün iç işleyişini öğrenmek zorunda kalmadan güvenilir sonuç almalıdır.

### 4.6. Kişiselleştirme daha sonra gelir

Önce güvenilir ortak veri tabanı, sonra kullanıcıya özel karar katmanı geliştirilir.

## 5. Ürünün Yapmayacağı Şeyler

- Kaynaksız fiyat iddiası üretmek
- Belirsiz extraction sonucunu kesinmiş gibi göstermek
- Sırf düşük fiyat nedeniyle güvenilmez sonucu önermek
- Aynı olmayan paketleri yanıltıcı şekilde karşılaştırmak
- POC aşamasında tam ürün kapsamını taklit etmek

## Kararlar

- Veri güvenilirliği, özellik sayısından önce gelir.
- Açıklanabilirlik ve provenance temel ürün kabiliyetidir.
- İnsan review akışı geçici kusur değil, tasarımın parçasıdır.

---

<!-- SOURCE: docs/00-urun-vizyonu/hedef-kullanicilar-ve-kullanim-baglamlari.md -->

# Hedef Kullanıcılar ve Kullanım Bağlamları

| Alan | Değer |
|---|---|
| Document ID | PRD-003 |
| Sürüm | 1.0 |
| Durum | Taslak |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | PRD-001, PRD-002 |
| Son Güncelleme | 2026-07-28 |

## 1. Birincil Kullanıcı

Birincil kullanıcı, düzenli ev alışverişi yapan ve fiyat ile ürün uygunluğunu değerlendirmek için farklı kampanya kaynaklarını inceleyen kişidir.

Temel ihtiyaçları:

- araştırmaya daha az zaman ayırmak,
- kampanya süresini kaçırmamak,
- paket farklarını anlayabilmek,
- güvenilir sonucu kaynağıyla görebilmek,
- tekrar eden tercihlerini yeniden girmemek.

## 2. İkincil Kullanıcılar

### 2.1. Aile alışverişini birlikte yöneten kişiler

Ortak ihtiyaç listesi, tercih ve satın alma kararlarını paylaşırlar.

### 2.2. Belirli ürünü fırsat oluştuğunda almak isteyen kullanıcı

Elektronik, beyaz eşya veya dayanıklı tüketim ürünü için hedef fiyat bekler.

### 2.3. Ürün içeriğine veya markaya dikkat eden kullanıcı

Belirli marka, içerik, kalite veya güvenlik kurallarına göre seçim yapar.

### 2.4. Sistem yöneticisi veya veri inceleyicisi

POC ve sonraki sürümlerde düşük güvenli extraction sonuçlarını inceler, düzeltir ve doğrular.

## 3. POC Kullanıcısı

POC'un doğrudan kullanıcısı son tüketiciden önce **veri inceleyicisi / proje sahibi** olacaktır.

POC kullanıcısı:

- kaynak ekler,
- extraction sonuçlarını görür,
- ham görsel veya sayfayla karşılaştırır,
- yanlış alanları düzeltir,
- normalize edilmiş kayıtları inceler,
- aynı kaynağın tekrar işlenmesini test eder.

## 4. Temel Kullanım Bağlamları

### 4.1. Haftalık alışveriş öncesi

Kullanıcı ihtiyaçlarını uygun kampanyalarla eşleştirmek ister.

### 4.2. Mağazada anlık karar

Kullanıcı gördüğü ürünün fiyat ve uygunluğunu hızlıca değerlendirmek ister.

### 4.3. Kampanya takibi

Kullanıcı belirli ürün veya kategori için kampanya bekler.

### 4.4. Uzun vadeli fiyat kararı

Kullanıcı acil olmayan ürünü geçmiş fiyat ve hedef fiyat bilgisiyle değerlendirir.

### 4.5. Veri doğrulama

İnceleyici, otomatik çıkarılan kayıtların doğruluğunu kontrol eder.

## 5. POC Önceliği

POC yalnızca `Veri doğrulama` bağlamını uçtan uca desteklemek zorundadır.

Diğer kullanım bağlamları uzun vadeli ürün vizyonunda kalır ve POC başarısından sonra ayrıntılandırılır.

## Açık Sorular

- İlk gerçek kullanıcı yalnızca proje sahibi mi olacaktır?
- POC review ekranında birden fazla kullanıcı ve rol gerekli midir?
- Son kullanıcı araştırmasında hangi alışveriş sıklıkları önceliklidir?

---

<!-- SOURCE: docs/00-urun-vizyonu/urun-sinirlari-ve-kapsam-ilkeleri.md -->

# Ürün Sınırları ve Kapsam İlkeleri

| Alan | Değer |
|---|---|
| Document ID | PRD-004 |
| Sürüm | 1.0 |
| Durum | Onaylandı |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | PRD-001, PRD-002 |
| Son Güncelleme | 2026-07-28 |

## 1. Üç Ayrı Kapsam

Proje boyunca aşağıdaki kavramlar karıştırılmayacaktır.

### Ürün Vizyonu

Uzun vadede ulaşılmak istenen bütün yetenekler.

### POC

En yüksek riskli veri toplama ve normalizasyon varsayımını doğrulayan sınırlı çalışma.

### MVP

POC sonucuna göre tanımlanacak, son kullanıcıya anlamlı uçtan uca değer sunan ilk ürün.

## 2. POC Kapsam Kuralı

Bir özellik POC'a ancak şu soruya olumlu cevap veriyorsa alınır:

> Bu özellik kampanya verisini güvenilir biçimde çıkarma, normalize etme, doğrulama veya karşılaştırma riskini doğrudan test ediyor mu?

Olumsuzsa özellik backlog'a taşınır.

## 3. POC İçinde

- PDF katalog alma
- katalog görsellerini işleme
- seçili kampanya web sayfalarını işleme
- ürün kartı tespiti
- ürün adı, marka, miktar, birim ve fiyat çıkarımı
- kampanya tarihlerini ilişkilendirme
- ham kaynak kaydı
- confidence üretimi
- normalizasyon
- doğrulama ve manuel düzeltme
- idempotent yeniden işleme
- temel karşılaştırılabilir çıktı

## 4. POC Dışında

- aile alışveriş listeleri
- kişisel öneri motoru
- sağlık ve içerik analizi
- resmî risk kayıtları entegrasyonu
- ev envanteri
- mobil uygulama
- gelişmiş fiyat tahmini
- tam çok ajanlı sistem
- satıcı puanlama
- bildirim ve alarm ürünü
- raf veya koridor konumu

## 5. Kalıcı Kapsam Dışı

Aşağıdaki özellik, veri güvenilirliği nedeniyle ürün vizyonunda da kapsam dışıdır:

- market içi raf veya koridor konumu

Yeni kalıcı kapsam dışı kararlar ADR ile kaydedilir.

## 6. Backlog Kuralı

Yeni fikirler reddedilmiş sayılmaz.

Her fikir:

- başlık,
- kullanıcı değeri,
- POC ile ilişkisi,
- bağımlılıklar,
- değerlendirme zamanı

ile backlog'a kaydedilir.

Ancak backlog kaydı aktif kapsam anlamına gelmez.

## 7. Kapsam Değişikliği

Design Freeze sonrasında kapsam değişikliği için:

1. gerekçe,
2. kullanıcı veya teknik değer,
3. maliyet ve risk,
4. mevcut başarı ölçütlerine etkisi,
5. kabul veya ret kararı

belgelenir.

## Kararlar

- POC, MVP değildir.
- Ürün vizyonu POC kapsamını otomatik olarak genişletmez.
- POC dışı fikirler uygulamaya değil backlog'a gider.

---

<!-- SOURCE: docs/00-urun-vizyonu/basari-cercevesi.md -->

# Başarı Çerçevesi

| Alan | Değer |
|---|---|
| Document ID | PRD-005 |
| Sürüm | 1.0 |
| Durum | Taslak |
| EOS Sürümü | EOS v1.0 |
| Bağımlılıklar | PRD-001, PRD-004 |
| İlgili Doküman | docs/01-poc/poc-vizyonu-ve-kapsami.md |
| Son Güncelleme | 2026-07-28 |

## 1. Amaç

Bu belge ürünün ve POC'un başarısını farklı seviyelerde değerlendirmek için ortak çerçeve oluşturur.

Kesin POC test protokolü ve veri seti ayrı dokümanda tanımlanacaktır.

## 2. Başarı Seviyeleri

### 2.1. Veri Başarısı

- ürün kartı doğru tespit ediliyor mu?
- fiyat doğru ürünle ilişkilendiriliyor mu?
- miktar ve birim doğru çıkarılıyor mu?
- kampanya tarihleri doğru kapsama bağlanıyor mu?
- kaynak ve sayfa bilgisi korunuyor mu?

### 2.2. Sistem Başarısı

- aynı kaynak tekrar işlendiğinde mükerrer kayıt oluşuyor mu?
- hatalar görünür ve incelenebilir mi?
- işlem yeniden üretilebilir mi?
- ham ve normalize edilmiş veri ayrılıyor mu?
- düşük güvenli alanlar review akışına gidiyor mu?

### 2.3. Operasyonel Başarı

- bir katalog için gereken manuel düzeltme miktarı kabul edilebilir mi?
- yeni kaynak eklemek aşırı özel kod gerektiriyor mu?
- işlem süresi ve maliyet ölçülebiliyor mu?
- başarısız kaynaklar sistemi tamamen durdurmadan ayrıştırılabiliyor mu?

### 2.4. Ürün Başarısı

MVP ve sonraki aşamalarda:

- kullanıcının araştırma süresi azalıyor mu?
- önerilerin gerekçesi anlaşılabiliyor mu?
- kullanıcı sonucu güvenilir buluyor mu?
- yanlış veya yanıltıcı karşılaştırma oranı kabul edilebilir mi?

## 3. Mevcut POC Eşikleri

POC vizyon belgesinde kabul edilen başlangıç eşikleri:

- ürün kartı tespiti: en az `%85`
- fiyat doğruluğu: en az `%95`
- gramaj veya adet doğruluğu: en az `%85`
- kampanya tarihleri doğru ilişkilendirilmeli
- manuel düzeltme desteklenmeli
- tekrar işlem mükerrer kayıt üretmemeli

Bu eşikler test veri seti tanımlandıktan sonra yeniden gözden geçirilebilir; değişiklik gerekçesi kayıt altına alınır.

## 4. Başarısızlık Sinyalleri

Aşağıdakiler POC'un yeniden tasarlanmasını gerektirebilir:

- kritik fiyat hatalarının kabul edilebilir seviyeye indirilememesi,
- kaynak ile ürün eşleşmesinin kaybolması,
- çoğu kaydın manuel girilmek zorunda kalması,
- her market için tamamen ayrı sistem gereksinimi,
- aynı girdide tutarsız ve açıklanamayan sonuçlar,
- işlem maliyetinin hedef kullanım için sürdürülemez olması.

## 5. Ölçüm İlkeleri

- Test seti gerçek kaynaklardan oluşur.
- Başarı yalnızca kolay örneklerle ölçülmez.
- Alan bazlı doğruluk ayrı raporlanır.
- `Eksik`, `yanlış` ve `belirsiz` sonuçlar ayrılır.
- Manuel düzeltme süresi ölçülür.
- Model, prompt ve pipeline sürümü sonuçla birlikte saklanır.

## 6. POC Çıkış Kararı

POC sonunda üç karardan biri verilir:

- **Proceed:** MVP planlamasına geç.
- **Revise:** Belirli riskleri çözmek için POC'u yeniden tasarla.
- **Stop:** Temel yaklaşımın sürdürülebilir olmadığına karar ver.

## Açık Sorular

- POC test seti kaç katalog ve kaç ürün içerecek?
- Manuel düzeltme için kabul edilebilir üst sınır nedir?
- İşlem başına hedef maliyet ve süre nedir?
- Farklı kaynak tipleri ayrı mı, birleşik mi puanlanacaktır?

---

## Cilt 03 — POC Tanımı ve Doğrulama

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

---

## Cilt 04 — Domain ve Product Identity

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
