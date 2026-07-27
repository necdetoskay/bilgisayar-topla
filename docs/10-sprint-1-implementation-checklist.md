# Sprint 1 Uygulama Checklist

## Amac

Sprint 1'in amaci, Incehesap bilgisayar toplama sayfasina Playwright ile giren, ilk kategori akisini okuyabilen ve secim sonrasi sayfanin degistigini dogrulayabilen kucuk bir teknik prototip cikarmaktir.

Bu sprint sonunda henuz tam sistem onerisi uretilmeyecektir. Oncelik, site otomasyonunun guvenilir sekilde baslatilmasidir.

## Sprint Kapsami

Sprint 1 kapsaminda yapilacaklar:

- Repo icin Node.js ve pnpm tabanli monorepo iskeleti kurulur.
- Playwright bagimliligi eklenir.
- `packages/scraper` paketi olusturulur.
- Incehesap toplama sayfasi acilir.
- Sayfa yuklenme durumu dogrulanir.
- CPU bolumu veya CPU secim alani bulunur.
- CPU seceneklerinden ilk okunabilir liste cikarilir.
- Bir CPU secimi denenir.
- CPU secimi sonrasi motherboard bolumunun degisip degismedigi kontrol edilir.
- Debug icin ekran goruntusu ve sade kosu raporu uretilir.

## Sprint Disi Konular

Asagidaki konular Sprint 1'e alinmayacaktir:

- Tam konfigurasyon olusturma.
- Performans skoru.
- AI yorumlama.
- Web arayuzu.
- Kullanici hesabi.
- Database.
- Otomatik sepet veya satin alma akisi.
- CAPTCHA veya login gerektiren isler.

## Uygulama Adimlari

1. Repo temel dosyalari eklenir.
2. `pnpm-workspace.yaml` olusturulur.
3. Root `package.json` olusturulur.
4. TypeScript ayarlari eklenir.
5. `packages/scraper` paketi kurulur.
6. Playwright kurulumu ve browser yukleme komutu tanimlanir.
7. `selectors.ts` icinde ilk selector adaylari tanimlanir.
8. `run-scraper.ts` sayfayi acar ve temel kontrol yapar.
9. `snapshot.ts` ekran goruntusu ve rapor yazar.
10. Ilk kabul testi manuel komutla calistirilir.

## Ilk Dosya Agaci

```text
bilgisayar-topla/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  .gitignore
  packages/
    scraper/
      package.json
      src/
        config.ts
        index.ts
        run-scraper.ts
        selectors.ts
        snapshot.ts
        types.ts
```

## Kabul Kriterleri

Sprint 1 basarili sayilmasi icin:

- `pnpm install` hatasiz tamamlanir.
- Playwright browser kurulumu yapilir.
- `pnpm scraper:run` komutu calisir.
- Agent Incehesap toplama sayfasini acar.
- CPU alani bulunamazsa anlamli hata raporu uretir.
- CPU alani bulunursa urun adaylarini raporlar.
- Secim sonrasi sayfa degisimi gozlemlenirse bunu rapora yazar.
- Hata durumunda screenshot uretilir.

## Hata Raporu Icerigi

Ilk hata raporu su bilgileri icermelidir:

- tarih ve saat
- hedef URL
- basarisiz adim
- beklenen durum
- gerceklesen durum
- bulunan kategori basliklari
- screenshot dosya yolu
- kisa teknik not

## Basari Raporu Icerigi

Basarili kosu raporu su bilgileri icermelidir:

- hedef URL
- CPU alani bulundu mu
- kac CPU adayi okundu
- secilen test CPU adi
- motherboard alani secimden sonra degisti mi
- toplam kosu suresi
- screenshot dosya yolu

## Sprint Sonu Karari

Sprint 1 sonunda iki karar verilecektir:

- Site akisi Playwright ile yeterince okunabilir mi?
- Sprint 2'de build generator'a gecmek icin veri kalitesi yeterli mi?

Bu iki soruya net cevap verilmeden skor motoru veya UI gelistirmesine gecilmemelidir.
