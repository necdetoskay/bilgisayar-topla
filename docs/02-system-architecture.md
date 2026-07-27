# Sistem Mimarisi

## Katmanlar

| Katman | Gorev |
|---|---|
| UI | Butce, kullanim amaci ve tercihleri alir; onerileri gosterir |
| API | Kullanici istegini agent calisma talebine cevirir |
| Browser Agent | Incehesap sayfasini acar, kategorileri okur, parca secer |
| Scraper Adapter | Selector, DOM okuma ve fiyat/parca parse islemlerini merkezilestirir |
| Candidate Generator | Denenecek parca adaylarini daraltir |
| Compatibility Validator | Site akisi ve secim sonucunun dogru ilerledigini kontrol eder |
| Scoring Engine | Butce, performans, denge, verimlilik ve yukseltilebilirlik puani verir |
| AI Explainer | Sonuclari sade ve ikna edici dille aciklar |
| Cache/Storage | Urun, fiyat, run ve hata kayitlarini saklar |

## Onerilen Teknik Yapi

- Frontend: Next.js + React + TypeScript
- Backend: Next.js API routes veya ayrik Node.js worker
- Browser automation: Playwright
- Ilk storage: SQLite veya JSON cache
- Ileri storage: PostgreSQL
- AI provider: OpenRouter/OpenAI uyumlu soyutlama
- Test: Playwright testleri + unit testleri

## Kritik Tasarim Ilkeleri

- Selector bilgileri tek merkezde tutulmali.
- Scraper sonucu dogrulanmadan skor motoruna verilmemeli.
- Agent her adimda "beklenen durum" ve "gercek durum" karsilastirmasi yapmali.
- AI ciktilari karar verisi yerine aciklama ve strateji destegi olarak kullanilmali.
- Hata durumunda sistem yanlis oneriyi gostermek yerine durup raporlamali.
