# Scraper Probe Output Contract

## Amac

Bu dokuman, Sprint 1 scraper prototipinin urettigi ciktilarin sozlesmesini tanimlar. Amac, ilk probe sonucunu hem insanin okuyabilecegi hem de ileride otomatik testlerin kullanabilecegi sabit bir formata baglamaktir.

## CLI Ozeti

`pnpm scraper:run` komutu basarili veya basarisiz kosu sonunda kisa bir ozet basar.

Beklenen alanlar:

```text
ok=true
target=https://www.incehesap.com/oyun-bilgisayari-toplama/
cpuOptions=3
selectedBy=button
motherboardDetected=true
screenshot=runs/local/...
```

Bu ozet hizli manuel kontrol icindir. Kalici kanit `report.json` dosyasidir.

## Report JSON

Her kosu icin `runs/local/<timestamp>/report.json` dosyasi uretilir.

Ana alanlar:

| Alan | Aciklama |
|---|---|
| `ok` | Probe temel hedefleri gecti mi |
| `targetUrl` | Acilan hedef sayfa |
| `startedAt` | Kosu baslangic zamani |
| `finishedAt` | Kosu bitis zamani |
| `steps` | Adim adim kosu durumu |
| `diagnostics` | Hata veya supheli durum kodlari |
| `categoryTexts` | Sayfadan okunan gorunur kategori/metin sinyalleri |
| `cpuOptions` | Ilk CPU adaylari |
| `selectedBy` | CPU secimi icin calisan selector adayi |
| `motherboardDetected` | CPU secimi sonrasi anakart bolumu algilandi mi |
| `screenshotPath` | Debug ekran goruntusu yolu |

## Diagnostic Kodlari

Sprint 1 icin ilk diagnostic kodlari:

| Kod | Anlam |
|---|---|
| `CPU_BLOCK_NOT_FOUND` | CPU bolumu keyword ve fiyat sinyalleriyle bulunamadi |
| `CPU_SELECT_BUTTON_NOT_FOUND` | CPU adaylari okundu ama secim butonu calismadi |
| `MOTHERBOARD_NOT_DETECTED_AFTER_CPU` | CPU secimi sonrasi anakart bolumu algilanamadi |

## Basari Kurali

Sprint 1'de `ok=true` su anlama gelir:

- Sayfa acildi.
- CPU bolumu bulundu.
- En az bir CPU adayi okundu.

Bu henuz tam konfigurasyon basarisi degildir. Tam konfigurasyon basarisi Sprint 2 veya sonrasi icin ayri tanimlanacaktir.

## Neden Ayrintili Rapor

Incehesap sayfa yapisi degistiginde sadece "scraper bozuldu" demek yeterli degildir. Rapor su sorulara cevap vermelidir:

- Hangi adimda bozuldu?
- Sayfa temel olarak acildi mi?
- CPU bolumu hic mi bulunamadi, yoksa bulundu ama urun okunamadi mi?
- Secim butonu mu bulunamadi?
- CPU secimi sonrasi sayfa beklenen sekilde degismedi mi?
- Debug icin screenshot nerede?

Bu sozlesme ileride self-healing ve otomatik site saglik testi icin temel olacaktir.
