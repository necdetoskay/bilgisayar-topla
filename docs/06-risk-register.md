# Riskler ve Guvenli Calisma Kurallari

## Ana Riskler

| Risk | Etki | Ilk Cozum |
|---|---|---|
| Site DOM yapisi degisir | Scraper bozulur | Merkezi selector + fallback + rapor |
| Dinamik yukleme gecikir | Eksik veri okunur | Playwright wait/retry ve durum dogrulama |
| Cok kombinasyon yavas calisir | Kullanici bekler | Aday daraltma ve cache |
| AI yanlis yorum yapar | Kullanici yaniltici bilgi alir | Kuralli motoru karar kaynagi yapmak |
| Fiyat/stok anlik degisir | Sonuc eskir | Son kontrol zamani ve tekrar dogrulama |
| Anti-bot/CAPTCHA gelir | Akis durur | Atlatmaya calismadan insan kontrolu raporu |

## Guvenli Calisma Kurallari

- Sistem kullanici adina satin alma veya odeme islemi yapmayacak.
- CAPTCHA veya erisim engeli atlatilmaya calisilmayacak.
- Hata durumunda sessizce tahmin uretilmeyecek.
- Her oneride fiyat kontrol zamani gosterilecek.
- Agent secim zincirinde beklenen durumlari dogrulamadan sonraki adima gecmeyecek.
- AI aciklamalari, kural motorunun urettigi veriyle sinirlandirilacak.

## Hata Raporu Icerigi

Bir otomasyon hatasinda rapor su bilgileri icermelidir:

- Hata adimi
- Beklenen durum
- Gercek durum
- Kullanilan selector
- Alternatif selector denemeleri
- Sayfa URL'i
- Ekran goruntusu yolu
- Ilgili HTML parcasi

## Baslangic Karari

Bu proje icin en dogru ilk adim, tam uygulama koduna gecmeden once Incehesap konfigurator akisini guvenilir sekilde okuyup dogrulayan teknik prototipi hazirlamaktir. Bunun uzerine skor motoru ve AI aciklama katmani insa edilecektir.
