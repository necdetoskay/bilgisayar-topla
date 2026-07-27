# Master Plan

## Urun Vizyonu

Bilgisayar Topla, kullanicinin butcesi ve ihtiyacina gore Incehesap konfiguratorunde mumkun olan en mantikli sistemleri bulan, puanlayan ve sade bir dille aciklayan bir AI destekli karar motorudur.

## Ana Akis

1. Kullanici butce ve kullanim amacini girer.
2. Sistem hedef profil olusturur.
3. Browser agent Incehesap toplama sayfasini acar.
4. Ilk kategori olan islemci seceneklerini okur.
5. Aday islemciler secildikce uyumlu anakart ve sonraki kategoriler okunur.
6. Agent makul kombinasyonlari dener.
7. Skor motoru butce, performans, denge ve yukseltilebilirlik puani hesaplar.
8. AI katmani sonucu kullanici dostu sekilde aciklar.
9. Kullaniciya 2-3 sistem onerisi sunulur.

## Stratejik Kararlar

| Karar | Secim | Gerekce |
|---|---|---|
| Veri kaynagi | Incehesap konfigurator sayfasi | Uyumlu parca listeleri site tarafinda uretiliyor |
| Otomasyon tipi | Browser automation + scraping | Sayfa dinamik ve secimlere gore degisiyor |
| Ilk otomasyon araci | Playwright | Modern, test edilebilir, headless/headful destekli |
| AI rolu | Aciklama ve strateji katmani | Parca seciminde hata riskini azaltir |
| Ilk veri saklama | SQLite veya dosya cache | MVP icin hafif ve yeterli |
| Uzun vadeli veri | PostgreSQL | Fiyat gecmisi, skorlar ve run kayitlari icin daha uygun |

## Basari Kriterleri

- Site acildiginda CPU kategorisi guvenilir sekilde bulunabilmeli.
- CPU secimi sonrasi anakart listesinin degistigi dogrulanabilmeli.
- En az bir tam sistem konfigurasyonu okunabilir fiyatla olusturulabilmeli.
- Sonuc butceyi asmamali veya asiyorsa neden astigi acikca raporlanmali.
- Agent her secim icin gerekce uretebilmeli.
- Scraper bozuldugunda sessizce yanlis sonuc vermemeli; ekran goruntusu ve hata raporu uretmeli.

## Yol Haritasi

1. Dokumantasyon ve kararlar
2. Repo iskeleti
3. Playwright site analiz prototipi
4. Kategori ve urun okuma katmani
5. Secim zinciri dogrulama
6. Basit skor motoru
7. MVP UI
8. AI aciklama katmani
9. Self-healing ve hata raporlama
10. Cache, fiyat gecmisi ve alternatif uretimi
