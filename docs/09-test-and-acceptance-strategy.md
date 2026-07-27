# Test ve Kabul Stratejisi

## Test Yaklasimi

Bu proje dinamik bir web sitesine bagli oldugu icin test stratejisi iki seviyeli olmalidir:

- lokal unit testler
- canli siteye karsi kontrollu smoke testler

Unit testler hizli ve deterministik olmali; canli site testleri ise yavas, loglu ve dikkatli calismalidir.

## Test Kategorileri

| Test Turu | Hedef |
|---|---|
| Unit test | Fiyat parse, skor hesaplama, veri normalize etme |
| Fixture test | Kaydedilmis HTML snapshot uzerinden selector dogrulama |
| Smoke test | Canli Incehesap sayfasini acip CPU listesini okuma |
| Chain test | CPU secimi sonrasi anakart alanini dogrulama |
| Failure test | Selector bozuldugunda hata raporu uretme |

## Sprint 1 Kabul Testleri

Sprint 1 icin en az su testler gerekir:

1. Site aciliyor mu?
2. CPU kategori alani bulunuyor mu?
3. CPU secenekleri okunuyor mu?
4. Seceneklerden en az biri secilebilir mi?
5. Secimden sonra anakart alani aktiflesiyor mu?
6. Hata durumunda screenshot ve HTML snapshot uretiliyor mu?

## Test Ciktilari

Her smoke/chain test kosusu su bilgileri uretmelidir:

- test zamani
- hedef URL
- browser modu
- bulunan kategori
- bulunan urun sayisi
- secilen urun
- toplam kosu suresi
- hata varsa hata nedeni

## CI Stratejisi

Canli siteye bagli testler her commit'te zorunlu kosulmamalidir. Baslangic stratejisi:

- Unit ve fixture testler CI'da kosar.
- Canli site smoke testleri manuel komutla kosar.
- Daha sonra gunluk saglik kontrolu eklenebilir.

## Kabul Ilkesi

Agent belirsiz kaldiginda tahmin ederek devam etmemelidir. Ozellikle site akisi bozulursa sistem:

- hangi adimda kaldigini yazmali
- screenshot kaydetmeli
- HTML snapshot kaydetmeli
- kullaniciya veya gelistiriciye net hata mesaji vermeli

Bu ilke, ileride self-healing eklense bile korunmalidir.
