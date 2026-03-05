# Development Log

Bu dosya, gelistirme surecini bir hikaye gibi takip etmek icin tutulur.  
Teknik olmayan birinin bile anlayabilecegi dilde yazilir.

## Kural
- Ben her kod degisiklikten sonra bu dosyaya yeni bir kayit ekleyecegim.
- Her kayitta su 3 soru cevaplanacak:
  - Neyi degistirdik?
  - Neden degistirdik?
  - Bu degisiklik nasil calisiyor?
- Sen "artik yapma" diyene kadar bu kayit sureci devam edecek.

---

## 2026-03-05 - Grouped Explainability (Phase 1 / Workstream 1)

### Neyi degistirdik?
- Lead detayindaki "Why this score" bolumunu tek uzun listeden cikarip 4 gruba boldik:
  - Engagement
  - Fit
  - Recency
  - Source

### Neden degistirdik?
- Kullanici skorun neden boyle ciktigini daha hizli anlasin diye.
- Daginik satirlar yerine mantiksal gruplar, guveni ve okunabilirligi artirir.

### Bu degisiklik nasil calisiyor?
- Skor motoru artik her katkiya bir grup etiketi veriyor.
- Dashboard bu etiketlere gore katkilaru kutular halinde gosteriyor.
- Eski (legacy) verilerde grup etiketi olmasa bile sistem anahtar adina bakip dogru gruba yerlestiriyor.

### Vizyon etkisi
- "Bugun once kimi aramaliyim?" sorusuna sadece skorla degil, skorun aciklamasiyla da net cevap verme hedefini guclendirir.

---

## 2026-03-05 - Deterministic Top Reasons Tie-Break (Phase 1 / Workstream 2)

### Neyi degistirdik?
- `topReasons` siralama kurali guclendirildi.
- Eger iki katkida puan esit ise, artik alfabetik siralama uygulanir.
- Bu davranis icin yeni unit test eklendi.

### Neden degistirdik?
- Ayni veride her zaman ayni sebep sirasi gelsin diye.
- Kullanicinin "neden bu lead ustte?" sorusuna tutarli cevap vermek icin.

### Bu degisiklik nasil calisiyor?
- Sistem once katkilaru puana gore buyukten kucuge siraliyor.
- Eger puan esit cikarsa, label alanina gore alfabetik siraliyor.
- Sonra ilk 2 nedeni `topReasons` olarak secmeye devam ediyor.

### Vizyon etkisi
- Skorun aciklanabilirligini sadece gorunur degil, tekrar edilebilir hale getirir.

---

## 2026-03-05 - Score Confidence Heuristic (Phase 1 / Workstream 3)

### Neyi degistirdik?
- Sisteme `scoreConfidence` alani eklendi (`low`, `medium`, `high`).
- Scoring motoru artik lead verisinin doluluk seviyesine gore confidence uretiyor.
- Dashboard'da "Why this score" alanina confidence etiketi eklendi.
- Bu davranis icin unit testler eklendi.

### Neden degistirdik?
- Kullanici sadece puani degil, puanin ne kadar guvenilir oldugunu da gorsun diye.
- Eksik veri ile uretilen skorlarin "kesin dogru" gibi algilanmasini engellemek icin.

### Bu degisiklik nasil calisiyor?
- Sistem 9 kritik sinyalin dolu olup olmadigina bakiyor.
- Sinyal sayisina gore:
  - 6+ ise `high`
  - 3-5 ise `medium`
  - 0-2 ise `low`
- Bu deger lead ile birlikte UI'ya tasiniyor ve detay panelde rozet olarak gosteriliyor.

### Vizyon etkisi
- "Bugun once kimi aramaliyim?" kararini daha guvenli hale getirir cunku skorun kalite seviyesi de gorunur olur.

---

## 2026-03-05 - UX Copy and Clarity Polish (Phase 1 / Workstream 4)

### Neyi degistirdik?
- Lead tablosunda (expand acmadan) confidence etiketi gorunur hale getirildi.
- "Why this score" kutusuna iki kisa aciklayici metin eklendi:
  - "Confidence reflects data completeness."
  - "Grouped by engagement, fit, recency, and source."

### Neden degistirdik?
- Kullanici lead'i acmadan da skor guven seviyesini gorebilsin diye.
- Aciklama alanini daha hizli taranabilir hale getirmek icin.

### Bu degisiklik nasil calisiyor?
- Confidence rozetleri mevcut `scoreConfidence` degerinden uretiliyor.
- Renk tonu high/medium/low durumuna gore otomatik seciliyor.
- Detay panelde mikrometinler kullanicinin okuma sirasini yonlendiriyor.

### Vizyon etkisi
- Urun "yalnizca puan veren" degil, puanin guven seviyesini aciklayan bir karar yardimcisi gibi davranir.

---

## 2026-03-05 - Confidence Heuristic Quality Tuning (Phase 1)

### Neyi degistirdik?
- `deriveScoreConfidence` fonksiyonu basit sayim modelinden weighted modele gecirildi.
- Guclu niyet sinyallerine daha fazla agirlik verildi (`demoRequested=true`, `emailClicks>0`).
- `false` boolean sinyaller artik confidence'i yukselten veri olarak sayilmiyor.
- Yeni edge-case testleri eklendi.

### Neden degistirdik?
- Eksik veya zayif verili lead'lerde confidence'in gereksiz yuksek cikmasini engellemek icin.
- Confidence degerinin is degerini arttirmak icin (daha gercekci dagilim).

### Bu degisiklik nasil calisiyor?
- Sistem sinyalleri esit degil, agirlikli puanla degerlendiriyor.
- Toplam puana gore confidence belirleniyor:
  - 7+ => high
  - 4-6 => medium
  - 0-3 => low

### Vizyon etkisi
- "Skor guvenilir mi?" sorusuna daha isabetli cevap vererek karar kalitesini artirir.

---

## 2026-03-05 - Phase 2 Baslangici: Enrichment Preview Simulation

### Neyi degistirdik?
- Setup Mode icine yeni bir "Enrichment Preview (Prototype)" adimi ekledik.
- CSV satirlarinda eksik alanlar icin sistemin onerdigi degerleri kart kart gostermeye basladik.
- Her oneri icin kullaniciya `Apply`, `Undo`, `Accept all`, `Reset` aksiyonlari eklendi.
- Import sirasinda kabul edilen oneriler otomatik kullaniliyor.

### Neden degistirdik?
- Urunun "AI enrichment" vizyonu backend olmadan da gorulebilir olsun diye.
- Kullaniciya "sistem oneriyor ama kontrol bende" hissi vermek icin.
- Demo akisinda CSV yukleme ile skor sonucu arasina anlamli bir deger adimi eklemek icin.

### Bu degisiklik nasil calisiyor?
- Sistem CSV ve mapping'i okuyup deterministic kurallarla eksik alanlari tarar.
- Oneriler `confidence` etiketiyle listelenir (high/medium/low).
- Kullanici bir oneri kabul ederse, importta ilgili alana bu deger yazilir.
- Kullanici kabul etmezse mevcut CSV degeri korunur.
- Bu davranis sadece prototype session icinde calisir; kalici backend claim'i yapilmaz.

### Vizyon etkisi
- LeadScorer artik yalnizca "puanlayan" degil, puan oncesi veriyi iyilestirmeyi gosteren bir revenue intelligence katmani gibi davranmaya baslar.

---

## 2026-03-05 - Phase 2 Tamamlama: Enrichment Audit Trail + Trust Visibility

### Neyi degistirdik?
- Lead veri modeline `enrichmentMeta` alani eklendi.
- Import sirasinda sadece kabul edilen onerilerden bir "degisiklik kaydi" olusturduk.
- Queue satirina `Enriched +N` rozetini ekledik.
- Lead detayina "Enrichment changes (prototype)" bolumu ekledik:
  - alan adi
  - eski deger -> yeni deger
  - confidence etiketi
  - neden metni
- Bu davranis icin enrichment unit testini genislettik.

### Neden degistirdik?
- Kullaniciya "hangi veri degisti?" sorusunu net gostermek icin.
- Enrichment adimini daha guvenilir hale getirmek icin (black-box gibi hissettirmemek).
- Phase 2'nin audit trail hedefini tamamlamak icin.

### Bu degisiklik nasil calisiyor?
- Kullanici Setup Mode'da bir oneri kabul ederse, sistem bunu import aninda kayda aliyor.
- Eger kabul edilen deger, orijinal CSV degerinden farkliysa bir degisiklik satiri olusuyor.
- Bu satirlar lead'e `enrichmentMeta` olarak ekleniyor.
- Work Mode'da lead listesinde ve detayinda bu degisiklikler gorunuyor.
- Her sey session-only; backend'e yazilmiyor.

### Vizyon etkisi
- LeadScorer "sadece skor veren" aractan, "veriyi nasil iyilestirdigini gosteren" daha guvenilir bir karar destek urunune yaklasiyor.

---

## 2026-03-05 - Phase 3 Baslangici: Operator Workflow UX (Daily Use Speed)

### Neyi degistirdik?
- Work Mode icin yeni hizlandirma katmani ekledik:
  - Saved preset filtreler (`Hot today`, `No recent touch`, `High intent + fit`)
  - Quick triage aksiyonlari (`Contacted`, `Snooze 24h`, `Pin`)
  - Klavye kisayollari (`j/k`, `Enter`, `c/s/p`)
  - SLA rozetleri (`On track`, `Due soon`, `Overdue`, `Responded`)
- Lead bazli UI durumunu saklamak icin `leadUiStateStore` eklendi (local storage).
- Triage/siralama davranisi icin workflow helper fonksiyonlari eklendi ve testlendi.

### Neden degistirdik?
- "Bugun once kimi aramaliyim?" sorusuna daha hizli cevap vermek icin.
- Sadece skora bakmak yerine operasyon durumunu da ayni satirda gostermek icin.
- Gunluk tekrar eden aksiyonlari tek tik ve klavye ile hizlandirmak icin.

### Bu degisiklik nasil calisiyor?
- Kullanici satir bazinda lead'i `contacted`, `snoozed` veya `pinned` yapabiliyor.
- Sistem bu durumu local storage'da tutuyor ve queue siralamasini buna gore optimize ediyor:
  - pinned ustte
  - snoozed altta
  - sonra skor
- Preset filtreler aninda uygun listeyi daraltiyor.
- Klavye kisayollari sadece Work Mode'da ve yazi alaninda degilken aktif.
- SLA rozetleri son aktivite zamanina gore aciliyet sinyali veriyor.

### Vizyon etkisi
- LeadScorer prototipi "data gosterimi"nden "gunluk operasyon araci"na bir adim daha yaklasiyor.

---

## 2026-03-05 - Phase 4 Baslangici: Analytics Narrative Upgrade

### Neyi degistirdik?
- Analytics icin yeni bir hesaplama katmani ekledik: `analyticsNarrative`.
- Dashboard Analytics ekranini narrative odakli yapiya cevirdik:
  - What changed and why satiri
  - Before/after comparison
  - Source ve tier segmentleri
  - Quality funnel
  - Insight callout kartlari
  - Trend + last run
- Analytics helperlari icin unit test eklendi.

### Neden degistirdik?
- Metrik listesi gostermek yeterli degildi; kullanici "ne degisti ve neden?" sorusuna cevap istiyor.
- Karar vermeyi hizlandirmak icin ham veri yerine yorumlanmis sinyal gerekiyordu.

### Bu degisiklik nasil calisiyor?
- Ekran local/session verisini topluyor (lead listesi + run ozetleri + UI state).
- Yeni helper fonksiyonlar bu veriyi segment, funnel, comparison ve insight'a ceviriyor.
- Eger run verisi yoksa sistem synthetic tek-run fallback ile bos ekrani engelliyor.
- Contacted funnel adimi, Work Mode'daki triage state ile bagli calisiyor.

### Vizyon etkisi
- LeadScorer analytics'i raporlama panelinden karar anlatan bir "operating insight layer" seviyesine tasiyor.

---

## 2026-03-05 - Phase 5 Baslangici: Settings & Governance UX

### Neyi degistirdik?
- Settings ekranini gercek governance akisina tasidik:
  - field-level validation
  - pre-save impact preview
  - local snapshot save/apply/compare/delete
  - saved config'e revert
  - run history append/read
- Bu akislar icin yeni helper katmanlari eklendi:
  - `scoringSnapshotStore`
  - `scoringValidation`
  - `scoringImpact`
- Bu helperlar icin unit testler eklendi.

### Neden degistirdik?
- Kullanici config degisikligi yaparken etkisini onceden gorebilsin diye.
- Yanlis ayarlarla kaydetmeyi azaltmak icin net field-level hata gostermek icin.
- Ayar degisikliklerini kontrollu ve geri alinabilir hale getirmek icin.

### Bu degisiklik nasil calisiyor?
- Draft config her degisimde impact preview hesapliyor.
- Save aninda once field-level validator calisiyor; hata varsa kayit engelleniyor.
- Basarili save:
  - config local'e yaziliyor
  - scoring run ozetine yeni kayit dusuluyor
- Snapshotlar local storage'da tutuluyor; kullanici istedigini apply/compare edebiliyor.

### Vizyon etkisi
- LeadScorer ayar paneli "sayisal form" olmaktan cikarak guvenli karar ve denetim paneline donusuyor.

---

## 2026-03-05 - Phase 6 Baslangici: Prototype Demo Readiness

### Neyi degistirdik?
- Demo operating layer eklendi:
  - Demo mode toggle + scenario control bar
  - 3 seeded scenario (high-intent inbound, noisy mixed, outbound batch)
  - One-time guided tour overlay
  - One-click scenario reset
  - Telemetry-lite event tracking
  - Dashboard icinde demo readiness panel
- Demo icin yeni store/telemetry/helper modulleri eklendi.
- Demo akisi icin unit ve component testleri eklendi.

### Neden degistirdik?
- Urunu 10 dakikada tekrar edilebilir sekilde sunulabilir hale getirmek icin.
- Demo esnasinda manuel hazirlik ihtiyacini azaltmak icin.
- Hangi adimlarin kullanildigini local olarak takip edip sunumu olcebilir hale getirmek icin.

### Bu degisiklik nasil calisiyor?
- Kullanici header'dan Demo Mode'u acar.
- Scenario secildiginde sistem deterministic seed data ile akisi baslatir.
- Reset butonu secili scenario'yu tek tikla baseline'a geri dondurur.
- Tour, scenario basina bir kez otomatik acilir; istenirse manuel tekrar baslatilir.
- Import/filter/action/expand/analytics/settings olaylari local telemetry store'a yazilir.

### Vizyon etkisi
- LeadScorer prototipi, teknik demo yerine standartlastirilmis "investor/design partner walkthrough" urun deneyimine donusur.
