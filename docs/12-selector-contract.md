# Selector Sozlesmesi

## Amac

Selector sozlesmesi, scraper kodunun Incehesap sayfa yapisina nasil baglanacagini tarif eder. Amac, site degisikliklerinde tum kodu aramak yerine tek bir selector ve dogrulama katmanini guncellemektir.

## Temel Ilke

Selector'lar tek class adina bagli olmamalidir. Mumkun oldugunca birden fazla sinyal birlikte kullanilmalidir:

- gorunen metin
- role veya button davranisi
- kategori basligi
- urun karti metni
- fiyat formati
- yakin DOM iliskisi
- secim sonrasi sayfa degisimi

## Selector Gruplari

Ilk `selectors.ts` dosyasi su gruplari icermelidir:

| Grup | Gorev |
|---|---|
| `pageReady` | Sayfanin temel olarak yuklendigini anlama |
| `categoryBlocks` | CPU, anakart, RAM gibi bolum adaylarini bulma |
| `cpuCategory` | Islemci alanini bulma |
| `productCards` | Urun karti adaylarini bulma |
| `productName` | Urun adini cikarma |
| `productPrice` | Fiyat bilgisini cikarma |
| `selectButton` | Urun secme butonunu bulma |
| `motherboardCategory` | CPU sonrasi anakart alanini bulma |
| `totalPrice` | Toplam fiyat alanini bulma |

## Selector Veri Yapisi

Selector'lar tek string olarak degil, aday listesi olarak tutulmalidir.

```ts
interface SelectorCandidate {
  name: string;
  selector: string;
  requiredText?: string;
  confidence: "high" | "medium" | "low";
}

interface SelectorGroup {
  groupName: string;
  candidates: SelectorCandidate[];
}
```

## Basari Dogrulamasi

Bir selector calisti diye adim basarili sayilmamalidir. Her adimda davranis dogrulamasi yapilmalidir.

Ornek CPU alani icin:

- Alan bulundu mu?
- Alan icinde urun gibi gorunen satir/kart var mi?
- Urun adinda CPU markasi veya model sinyali var mi?
- Fiyat formati okunabiliyor mu?
- Secim butonu var mi?

## Secim Sonrasi Dogrulama

CPU secildikten sonra su kontroller yapilmalidir:

- Sayfa beklenen sure icinde guncellendi mi?
- Motherboard bolumu aktif hale geldi mi?
- Motherboard urun adaylari gorundu mu?
- Toplam fiyat degisti mi?
- Secilen CPU adi sayfada secili durum olarak gorunuyor mu?

Bu kontrollerden en az ikisi gecmeden secim basarili kabul edilmemelidir.

## Self-Healing Siniri

Sprint 1'de tam AI destekli self-healing yoktur. Ancak selector mimarisi buna hazir olmalidir.

Sprint 1'de desteklenen dayaniklilik:

- birden fazla selector adayi deneme
- kategori basliklarini listeleme
- hata aninda screenshot alma
- bulunan ama dogrulanamayan elementleri raporlama

Sprint 2 veya sonrasi:

- DOM yakinlik analizi
- metin benzerligi ile kategori bulma
- AI destekli selector onerisi
- otomatik saglik kontrol kosulari

## Hata Durumunda Durma Kurali

Agent emin olmadigi durumda devam etmemelidir.

Ozellikle su durumlarda kosu durmali ve rapor uretmelidir:

- CPU alani bulunamadi.
- CPU alani bulundu ama urun adaylari okunamadi.
- Urun secildi gibi gorundu ama motherboard bolumu acilmadi.
- Toplam fiyat veya secili urun durumu celiskili.
- CAPTCHA, login, bot engeli veya beklenmeyen modal goruldu.

## Log Seviyeleri

Ilk prototipte sade log seviyeleri yeterlidir:

| Seviye | Kullanim |
|---|---|
| `info` | Normal ilerleme |
| `warn` | Alternatif selector denendi |
| `error` | Adim basarisiz |
| `debug` | Bulunan aday element ozeti |

## Uzun Vadeli Hedef

Selector sozlesmesi ileride otomatik saglik testinin temelini olusturacaktir. Site yapisi degistiginde sistem sadece "bozuldu" dememeli; hangi adimda, hangi selector grubunda, hangi beklenen davranisin saglanamadigini acikca raporlamalidir.
