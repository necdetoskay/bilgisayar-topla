# Scraping ve Site Otomasyonu

## Hedef Sayfa

Incehesap bilgisayar toplama sayfasi:

https://www.incehesap.com/oyun-bilgisayari-toplama/

## Sayfa Davranisi

Sayfada kategori secimleri sira ile ilerler:

1. Islemci secilir.
2. Secilen islemciye uyumlu anakart listesi gelir.
3. Sonraki kategoriler secime gore aktif olur.
4. Her secim fiyat ve uyumlu secenek havuzunu etkiler.

Bu nedenle proje klasik statik HTML scraping degil, browser automation + dinamik DOM okuma yaklasimi kullanacaktir.

## MVP Otomasyon Akisi

1. Sayfayi ac.
2. CPU secim alanini bul.
3. CPU seceneklerini oku.
4. Aday CPU sec.
5. Anakart alaninin aktif hale geldigini dogrula.
6. Anakart seceneklerini oku.
7. Fiyat/toplam alaninin degisip degismedigini kontrol et.
8. Sonucu logla.

## Dayanikli Selector Stratejisi

Tek bir class ismine baglanmak yerine su ipuclari birlikte kullanilacaktir:

- Kategori basligi metni
- Buton/role bilgisi
- Urun adi ve fiyat deseni
- Kategori bloklari arasindaki DOM iliskisi
- Gorsel veya label yakinligi
- Secim sonrasi beklenen davranis

## Self-Healing Seviyeleri

| Seviye | Aciklama |
|---|---|
| L1 | Alternatif selector deneme |
| L2 | Metin ve DOM yakinligina gore alan bulma |
| L3 | Sayfa snapshot'i, HTML parcasi ve ekran goruntusu ile hata raporu |
| L4 | AI/vision destekli yeni alan tahmini |

Ilk MVP icin L1-L3 yeterlidir. L4 daha sonraki asamada degerlendirilecektir.

## Etik ve Guvenli Kullanim

- CAPTCHA veya anti-bot mekanizmasi atlatilmaya calisilmayacak.
- Siteye yuksek frekansli istek atilmayacak.
- Cache kullanilarak gereksiz tekrarlar azaltilacak.
- Kullaniciya son kontrol zamani gosterilecek.
