# Sprint 1 Playwright Prototipi Teknik Spec

## Amac

Sprint 1'in amaci, Incehesap bilgisayar toplama sayfasinin Playwright ile guvenilir sekilde acilabildigini, CPU kategori alaninin okunabildigini ve ilk secimden sonra uyumlu anakart listesinin aktiflestigini kanitlamaktir.

Bu sprintte nihai bilgisayar onerisi uretilmeyecek. Hedef, agent icin gereken site otomasyon temelini kurmaktir.

## Kapsam

Sprint 1 kapsaminda yapilacaklar:

- Playwright tabanli browser automation altyapisi
- Tek hedef sayfa acilisi
- CPU kategori alanini bulma
- CPU seceneklerini okuma
- Bir CPU secme denemesi
- Anakart kategorisinin aktiflestigini dogrulama
- Snapshot ve hata raporu uretme

Sprint 1 kapsam disi:

- Tam sistem toplama
- Skor motoru
- AI aciklama katmani
- Kullanici arayuzu
- Otomatik self-healing L4/vision destegi

## Teknik Yaklasim

Ilk prototip Node.js, TypeScript ve Playwright ile yazilacaktir. Bu secim hem browser automation icin dogal bir zemin sunar hem de ileride Next.js tabanli UI ile ayni dil ailesinde kalmayi saglar.

Onerilen ilk komutlar:

```bash
pnpm install
pnpm test:scraper
```

Ilk prototip headless modda calisabilir, fakat hata ayiklama icin headed mod opsiyonu bulunmalidir.

## Agent Kosu Akisi

1. Browser baslatilir.
2. Hedef sayfa acilir.
3. Sayfanin temel yuklenme durumu beklenir.
4. CPU kategori alani aranir.
5. CPU secenekleri normalize edilir.
6. Ilk aday CPU secilir.
7. Anakart alani aktif mi kontrol edilir.
8. Snapshot dosyalari uretilir.
9. Sonuc basarili/basarisiz olarak raporlanir.

## Cikti Formati

Her kosu sonunda `runs/` altinda bir klasor uretilmelidir:

```text
runs/
  2026-07-27T10-30-00Z/
    run.json
    cpu-options.json
    page-snapshot.html
    screenshot.png
```

`run.json` en az su bilgileri tasimalidir:

- run id
- hedef URL
- baslangic zamani
- bitis zamani
- sonuc durumu
- hata mesaji
- bulunan CPU sayisi
- secilen CPU
- anakart alaninin aktiflesme durumu

## Basari Kriterleri

Sprint 1 basarili sayilmasi icin:

- CPU listesi bos gelmemelidir.
- CPU seciminden sonra sayfada anlamli bir degisim yakalanmalidir.
- Anakart alani aktif veya okunabilir hale gelmelidir.
- Hata olursa ekran goruntusu ve HTML snapshot kaydedilmelidir.
- Kosu sonucu terminalde ve JSON dosyasinda gorulebilmelidir.

## Hata Durumlari

Prototip su hatalari ayri ayri raporlamalidir:

- sayfa acilamadi
- CPU alani bulunamadi
- CPU secenekleri okunamadi
- CPU secilemedi
- anakart alani aktiflesmedi
- fiyat veya sayfa state degisimi dogrulanamadi

## Notlar

Bu sprintte selector'lar mukemmel olmak zorunda degildir. Onemli olan selector mantigini merkezi hale getirmek ve bozuldugunda hangi adimin bozuldugunu net raporlayabilmektir.
