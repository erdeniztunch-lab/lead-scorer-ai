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

---

## 2026-03-05 - Landing-Dashboard Alignment + Encoding Cleanup

### Neyi degistirdik?
- Landing'deki evidence ve trust icerigini dashboard'da gercekten olan ozelliklerle hizaladik.
- Evidence kartlarini su alanlara cektik:
  - field mapping guardrails
  - score explainability
  - operator workflow (preset + shortcut + triage)
  - demo readiness (scenario + tour + reset)
- Trust bolumunde "Live now" listesine Phase 3-6 gercekleri (workflow, analytics/settings governance, demo layer) eklendi.
- Dokumanlarda bozulan karakterleri duzelttik (`product-phases.md`, `product-messaging.md`).

### Neden degistirdik?
- Landing ile urunun gercek yetenekleri arasinda bosluk olmasin diye.
- Kullanici urunu daha zayif sanmasin; mevcut degeri net gorebilsin diye.
- Bozuk karakterlerin guven ve profesyonellik hissini dusurmesini engellemek icin.

### Bu degisiklik nasil calisiyor?
- Landing metin kaynagi `landingContent.ts` uzerinden guncellendi; boylece UI metinleri tek yerden kontrol ediliyor.
- Trust section daha genis "Live now" kapsamini otomatik render ediyor.
- Dokumanlar temiz ASCII/UTF-8 uyumlu metinle yeniden yazildi.

### Vizyon etkisi
- Urun hikayesi ve urun gercegi ayni cizgiye geldi: "CSV-first, explainable, action-ready, demo-ready" konumu daha net oldu.

---

## 2026-03-05 - Landing Evidence UX Simplification (Dont Make Me Think)

### Neyi degistirdik?
- "What you can do today, at a glance" metnini outcome-first hale getirdik:
  - "What your team can do in the next 10 minutes."
- Evidence kartlarini action -> result formatina cevirdik.
- Dominant karti ilk karta aldik (Queue Ready In Minutes).
- Kart yapisini mobilde daha hizli tarama icin icon-solda, metin-sagda olacak sekilde sadeledik.
- Evidence bolumunun icine dogrudan "Try in Dashboard" CTA ekledik.
- Prototype durumu tek net satirla yazildi: session/local, no backend persistence.

### Neden degistirdik?
- Kullanici hero sonrasi 5 saniyede "ne yapabilirim?" sorusuna cevap bulsun diye.
- Ozellik listesi yerine karar etkisini gostermek icin.
- Kanit bolumu ile aksiyon arasindaki gecisi kisaltmak icin.

### Bu degisiklik nasil calisiyor?
- Icerik `landingContent.ts` uzerinden action-result copy ile guncellendi.
- `ProductEvidenceStrip` icinde kart hiyerarsisi ve dominant vurgu yeniden duzenlendi.
- Section icindeki CTA kullaniciyi dogrudan dashboard'a yonlendiriyor.

### Vizyon etkisi
- Landing daha net bir "value -> proof -> action" akisina kavustu ve messaging felsefesiyle daha uyumlu hale geldi.

---

## 2026-03-05 - How It Works UX Refinement

### Neyi degistirdik?
- How It Works basligini daha sonuc odakli yaptik: "How your team runs this daily".
- Kartlari 3 net fiil formatina cektik: Upload, Score, Act.
- Her adima bir "output chip" ekledik:
  - Queue ready
  - Hot/Warm/Cold + reasons
  - Contacted/Snoozed/Pinned
- Description alani kisaltildi (daha az text yuklu).
- Section altina tek net CTA ve prototype honesty satiri eklendi.

### Neden degistirdik?
- Kullanici bu bolumu 5-7 saniyede tarayip urun akisini anlasin diye.
- "Ozellik anlatisi" yerine "is akisi sonucu" gostermek icin.
- How It Works'ten dashboard aksiyonuna gecisi kisaltmak icin.

### Bu degisiklik nasil calisiyor?
- `landingContent.ts` icinde workflow icerigi action -> output modeline gecirildi.
- `LandingPage.tsx` icinde kartlar output chip ile render edilmeye baslandi.
- Section kendi CTA'si ile kullaniciyi dogrudan dashboard'a yonlendiriyor.

### Vizyon etkisi
- Landing'in "Dont Make Me Think" ve YC-style clarity hedefleri daha tutarli hale geldi; akisin mantigi bir bakista anlasilir oldu.

---

## 2026-03-05 - Trust Snapshot UX Upgrade

### Neyi degistirdik?
- Trust Snapshot basligini sonuc odakli hale getirdik: "Know exactly what works today".
- Alt metni netlestirdik: "Live now, limits, and critical FAQs in one block."
- Live now ve Current limits kartlarini ayni agirliktan cikardik:
  - Live now karti daha baskin (accent vurgu)
  - Limits karti daha sakin (muted ton)
- Madde sunumunu list-disc yerine hizli taranan satir kartlara cevirdik.
- Trust section sonuna tek CTA ekledik: "Try in Dashboard".
- Tek bir prototype honesty satiri ekledik.

### Neden degistirdik?
- Kullanici neyin canli oldugunu 5 saniyede anlasin diye.
- Limitler savunmaci degil, durust ve net gorunsun diye.
- Trust bolumunden dashboard aksiyonuna gecis hizlansin diye.

### Bu degisiklik nasil calisiyor?
- `landingContent.ts` icinde trust copy'leri outcome-first formatta guncellendi.
- `LandingTrustSection.tsx` icinde 3 zone yapisi kuruldu:
  - Live now
  - Current limits
  - Quick FAQ
- Kart satirlarinda baslik + tek mikro satir yaklasimi ile okunabilirlik arttirildi.
- CTA dogrudan `/dashboard` yonlendirmesi yapiyor.

### Vizyon etkisi
- Landing, urunun guven katmanini daha hizli anlatan ve karar aksiyonuna daha net baglanan bir yapiya kavustu.

---

## 2026-03-05 - Landing Glassmorphic UI Redesign (Green + White Gradient)

### Neyi degistirdik?
- Landing icin yeni gorunur bir glassmorphic tasarim sistemi ekledik.
- `index.css` tarafinda yeni landing tokenlari ve utility classlari tanimladik:
  - landing atmosphere
  - glass panel surface'leri
  - glass chip
  - accent halo ve divider katmanlari
- Hero, Evidence, How It Works, Trust ve Final CTA alanlarini bu ortak tasarim sistemine bagladik.
- Navbar'a scroll bazli opaklik/surface sikilastirma efekti ekledik.
- Mobile sticky CTA'yi de glass yüzey diline uyarladik.

### Neden degistirdik?
- Mevcut UI netti ama "teknolojik premium" hissi zayifti.
- Section'lar arasinda ayni sistem hissi eksikti; bazi yerler flat gorunuyordu.
- Green accent ve beyaz gradient dili daha sistemli bir gorsel kimlige ihtiyac duyuyordu.

### Bu degisiklik nasil calisiyor?
- Yeni class sistemi tek bir "surface language" olusturuyor.
- Kartlar blur + yarı saydam arkaplan + ince border + yumusak glow ile derinlik kazaniyor.
- CTA alanlari kontrollu accent glow ile odagi kaybetmeden vurgulaniyor.
- Yapilan degisiklikler messaging'i degistirmeden sadece sunumu guclendiriyor.

### Vizyon etkisi
- Landing artik daha tutarli, daha premium ve daha "productized" bir teknoloji arayuzu gibi gorunuyor; deger onerisini gorsel olarak daha guclu tasiyor.

---

## 2026-03-05 - Landing Redesign Master Doc (Phase-Based)

### Neyi degistirdik?
- `docs/landing-page-redesign.md` adinda yeni bir master plan dokumani olusturduk.
- Datost-like premium landing hedefini 8 faza bolduk (Phase 0-7).
- Her faz icin sabit kart yapisi eklendi:
  - Goal
  - Files
  - Implementation Tasks
  - Definition of Done
  - Validation
  - Risks / Notes

### Neden degistirdik?
- Redesign surecini adim adim ve kontrol edilebilir hale getirmek icin.
- Kodlama sirasinda karar dagilimini azaltmak ve herkesin ayni planla ilerlemesini saglamak icin.
- Uygulama, QA ve acceptance kriterlerini tek yerde toplamak icin.

### Bu degisiklik nasil calisiyor?
- Yeni dokuman "execution guide" gibi davranir.
- Fazlar sirali ilerler; her faz sonunda validation sonucu dokumana islenir.
- Messaging lock, API lock ve scope lock dokumanin basinda net sekilde korunur.

### Vizyon etkisi
- Landing redesign calismasi artik rastgele degil, sistematik ve olculebilir bir urun-gelistirme akisina donustu.

---

## 2026-03-05 - Landing Redesign Phase 0 Completed (Baseline & Constraints Lock)

### Neyi degistirdik?
- `docs/landing-page-redesign.md` icindeki Phase 0 bolumunu gercek envanterle doldurduk.
- Baseline Snapshot eklendi:
  - aktif class overlap listesi
  - landing dosyalari bazinda class kullanimi
  - section bazli mevcut durum notlari
- Phase 0 status alanini `Completed` olarak isaretledik.

### Neden degistirdik?
- Redesign surecine kontrolsuz degisiklikle baslamamak icin.
- Hangi class'larin legacy, hangilerinin yeni sistem oldugunu netlestirmek icin.
- Scope drift (messaging/route/API kaymasi) riskini sifirlamak icin.

### Bu degisiklik nasil calisiyor?
- Dokuman artik "source-of-truth" baseline kaydi tutuyor.
- Sonraki fazlar bu kayda gore ilerleyecek (Phase 1-7).
- Her faz sonunda ayni dokumanda status/validation guncellemesi yapilacak.

### Vizyon etkisi
- Landing redesign artik tasarim denemesi degil, kontrollu ve izlenebilir bir engineering execution surecine donustu.

---

## 2026-03-05 - Landing Redesign Phase 1 Completed (CSS System Consolidation)

### Neyi degistirdik?
- `src/index.css` icinde Phase 1 icin tasarim sistemini tamamladik:
  - editorial utility classlari: `editorial-h1`, `editorial-h2`, `editorial-body`, `section-breathing`
  - motion utility classlari: `reveal-fade-up`, `reveal-delay-1/2/3`
- Yeni reveal classlari icin reduced-motion fallback ekledik.
- Landing runtime icin legacy classlara deprecate notlari ekledik:
  - `landing-shell`
  - `data-panel`
  - `signal-strip`
  - `surface-soft`

### Neden degistirdik?
- Tek bir premium visual systeme gecisi sistematik hale getirmek icin.
- Sonraki fazlarda (Hero/Evidence/Trust) tekrar eden stil kararlarini azaltmak icin.
- Hareket davranisini kontrollu ve erisilebilir yapmak icin.

### Bu degisiklik nasil calisiyor?
- CSS artik hem tipografik hiyerarsi hem de motion orchestration icin ortak utility set sagliyor.
- Legacy classlar hemen silinmedi; migration guvenli ilerlesin diye deprecate edilip korunuyor.
- Sonraki fazlarda markup bu yeni utility set'e tasinacak.

### Vizyon etkisi
- Landing redesign teknik olarak "hazir bir tasarim altyapisina" kavustu; bundan sonraki fazlar daha hizli ve daha tutarli ilerleyecek.

---

## 2026-03-05 - Landing Redesign Phase 2 Completed (Hero Redesign)

### Neyi degistirdik?
- Hero sol blogu editorial stack'e tasidik:
  - `editorial-h1` baslik
  - `editorial-body` destek metni
- Hero section'da `section-breathing` ritmini aktif ettik.
- Hero primary CTA'ya kontrollu glow (`cta-glow`) uyguladik.
- Hero icin reveal utility classlari eklendi:
  - sol blok: `reveal-fade-up is-visible`
  - queue panel wrapper: `reveal-fade-up reveal-delay-1 is-visible`
- `HeroQueuePreview` rootundan legacy `data-panel` class'ini kaldirdik.

### Neden degistirdik?
- Hero'yu daha editorial ve premium bir ilk izlenime tasimak icin.
- Sol mesaj hiyerarsisini netlestirip, sag paneli dominant "tech signature" olarak konumlamak icin.
- Legacy/new class karisiminin Phase 2 hedefindeki hero tarafini temizlemek icin.

### Bu degisiklik nasil calisiyor?
- Hero markup yeni utility seti ile daha sistematik render ediliyor.
- Queue panel sadece `glass-panel-strong + accent-halo` ile yeni style sisteminden besleniyor.
- Section ritmi ve CTA vurgu dili birbiriyle daha uyumlu hale geldi.

### Vizyon etkisi
- Landing'in ilk ekrani artik daha guclu bir premium tech/editorial kimlik tasiyor ve Phase 3-7 icin temiz bir temel olusturuyor.

---

## 2026-03-05 - Landing Redesign Phase 3 Completed (Evidence Rebalance)

### Neyi degistirdik?
- Evidence section'i `section-breathing` ritmine tasidik.
- Legacy `signal-strip` class bagimliligini Evidence path'inden kaldirdik.
- Kart hiyerarsisini netlestirdik:
  - ilk kart: strong + halo + focus
  - diger kartlar: light glass
- Kart yogunlugunu standardize ettik:
  - mobile `p-4`, desktop `p-5`
  - `h-full` ve minimum ic yukseklik ile daha dengeli gorunum
- Header -> cards -> CTA arasi dikey ritmi daha kompakt hale getirdik.

### Neden degistirdik?
- "Tek dominant kart" kuralini netlestirmek icin.
- Evidence bolumunu 5 saniyede taranabilir yapmak icin.
- Legacy/new class karisimini adim adim temizlemek icin.

### Bu degisiklik nasil calisiyor?
- Section wrapper tek dominant `glass-panel` olarak calisiyor.
- Kartlar icin ayri agirlik seviyeleri kullanilarak odak dagilimi azaltildi.
- CTA blogu daha yakin konumlandirilarak proof -> action gecisi hizlandirildi.

### Vizyon etkisi
- Evidence bolumu artik premium hissi korurken daha net odakli ve conversion-friendly bir yapida calisiyor.

---

## 2026-03-05 - Landing Redesign Phase 4 Completed (How It Works Visual Edit)

### Neyi degistirdik?
- How It Works section'ini ortak ritim utility'sine tasidik (`section-breathing`).
- Basligi editorial utility ile guncelledik (`editorial-h2`).
- Step kartlarini esit ritimde calisacak sekilde kilitledik:
  - `flex h-full flex-col`
  - `flex-1` ile metin alani dengesi
  - `p-4` mobile / `p-5` desktop
- Step badge kontrastini artirdik (daha net border/background).
- Output chip'leri neutral glass olarak biraktik.
- Connector line opakligini dusurup daha zarif hale getirdik.
- Section alti CTA'yi `glass-divider` ile ayri bir action band'a cevirdik.

### Neden degistirdik?
- 3 adimli akis bir bakista anlasilsin diye.
- Kartlar arasi yukseklik ve ritim farklari karar hizini dusurmesin diye.
- CTA, kartlardan net ayrisip "next action" olarak okunabilsin diye.

### Bu degisiklik nasil calisiyor?
- Kartlar artik ayni yapisal iskeleti kullaniyor.
- Badge/chip/connector gorsel oncelikleri kontrollu sekilde ayristirildi.
- CTA bandi kart blogunun devamiyla karismadan altta net bir bitis veriyor.

### Vizyon etkisi
- How It Works bolumu artik premium ama sade bir process anlatimina donustu; Datost-like editorial netlik hedefiyle daha uyumlu calisiyor.

---

## 2026-03-05 - Landing Redesign Phase 5 Completed (Trust Premium Pass)

### Neyi degistirdik?
- Trust section'i ortak ritim utility'sine tasidik (`section-breathing`).
- Basligi editorial utility ile guncelledik (`editorial-h2`).
- Trust scope'ta legacy class bagimliligini azalttik:
  - `surface-soft` kaldirildi.
- Surface hiyerarsisini koruyup netlestirdik:
  - Live now: strong surface
  - Current limits: light surface
- Live/Limits satirlarini min yukseklik ile normalize ettik (`min-h-[86px]`).
- FAQ separator kontrastini artirdik (`border-border/65`).
- CTA + honesty footer band korunurken CTA glow'u sadeledik (final CTA ile yarismasin diye).

### Neden degistirdik?
- Trust bolumunun 5 saniyede taranabilir olmasi icin.
- Live ve limits farkinin ilk bakista net gorunmesi icin.
- FAQ okunabilirligini artirip section bitisindeki aksiyonu daha kontrollu vermek icin.

### Bu degisiklik nasil calisiyor?
- Trust section artik tek bir premium visual sistemde calisiyor.
- Satir yukseklikleri ve separatorlar sayesinde tarama ritmi daha duzenli.
- CTA footer bandinda net gorunuyor ama final CTA'nin onune gecmiyor.

### Vizyon etkisi
- Trust Snapshot bolumu artik hem durustluk hem premium gorsel kaliteyi birlikte tasiyor; conversion oncesi guven katmani guclendi.

---

## 2026-03-05 - Landing CTA Density and Section Transition Smoothing

### Neyi degistirdik?
- Ara section'lardaki tekrar eden CTA'lari azalttik:
  - Evidence section CTA kaldirildi.
  - How It Works section CTA kaldirildi.
  - Trust section CTA kaldirildi.
- Hero ve Final CTA ana conversion noktasi olarak birakildi.
- Section gecislerindeki keskinlik azaltildi:
  - gereksiz `border-y` kullanimlari kaldirildi
  - bazi `section-frame` kullanimlari landing akisindan cikarildi

### Neden degistirdik?
- Her sectionda CTA olmasi kullanicinin odagini dagitiyordu.
- Gecislerdeki sert sinirlar sayfayi parcali hissettiriyordu.
- Daha akici ve premium bir narrative scroll hissi hedefledik.

### Bu degisiklik nasil calisiyor?
- Conversion aksiyonu artik daha net: hero + final + mobile sticky.
- Ara sectionlar bilgi/guven odakli calisiyor, karar butonuyla yarismiyor.
- Border/frame yogunlugu azaldigi icin sectionlar birbirine daha yumusak baglaniyor.

### Vizyon etkisi
- Landing daha sakin, daha net ve daha odakli bir conversion akisi kazandi; premium his guclenirken cognitive load azaldi.

---

## 2026-03-05 - Landing Redesign Phase 6 Completed (Final CTA & Footer Integration)

### Neyi degistirdik?
- Final CTA surface'ini tek guclu conversion panel olarak ince ayarladik.
- `cta-surface` gradientlerini daha yumusak hale getirdik.
- Final CTA butonu icin daha kontrollu glow utility ekledik:
  - yeni class: `cta-glow-soft`
- Final CTA section alt boslugunu optimize ettik (footer gecisine hazirlamak icin).
- Footer tarafinda sert gecis etkisini azalttik:
  - hard `border-t` kaldirildi
  - footer spacing/tone yumusatildi
  - `footer-sheen` daha akici gradient ile guncellendi

### Neden degistirdik?
- Final conversion alaninin guclu ama "asiri parlayan" olmamasi icin.
- CTA'dan footer'a geciste kopuk bir cizgi hissini engellemek icin.
- Premium ve akici sayfa ritmini landing sonunda da korumak icin.

### Bu degisiklik nasil calisiyor?
- Final CTA butonu artik daha soft glow kullaniyor; odakli ama dengeli gorunuyor.
- Footer'un ust siniri cizgiyle keskinlesmek yerine gradient ile devam ediyor.
- CTA->footer akisi tek hikaye gibi okunuyor.

### Vizyon etkisi
- Landing son bolumu artik daha olgun bir conversion kapanisi veriyor; premium his bozulmadan aksiyon net kaliyor.

---

## 2026-03-05 - Landing Palette Update (Indigo-Lilac + White)

### Neyi degistirdik?
- Landing sayfasina scoped renk paleti uyguladik:
  - `#6367FF` (main)
  - `#8494FF`
  - `#C9BEFF`
  - `#FFDBFD`
  - white
- Bu renkleri global uygulamayi bozmadan sadece landing container icinde aktif ettik (`.landing-atmosphere` altinda token override).
- Glass border, glow ve arka plan gradient katmanlarini yeni palette gore tune ettik.
- `surface-soft` gradientlerini de ayni palette daha yumusak gecise cektik.

### Neden degistirdik?
- Landing ile hedeflenen premium tech kimligini daha tutarli hale getirmek icin.
- Kontrastli ama yumusak bir renk sistemi kurarak hem okunabilirligi hem de estetik kaliteyi artirmak icin.
- Dashboard/global tema etkilenmeden sadece landingde degisim yapmak icin.

### Bu degisiklik nasil calisiyor?
- `bg-accent`, `text-accent` gibi utility'ler landing icinde yeni accent degerini kullaniyor.
- Glass system border/glow/background katmanlari yeni secondary/tertiary tonlarla calisiyor.
- Sonuc olarak sectionlar daha uyumlu ve gecisler daha organik gorunuyor.

### Vizyon etkisi
- Landing, istenen "Datost-like premium tech" yone daha da yaklasti: renk dili artik daha bilincli, kontrastli ve marka hissi daha guclu.

---

## 2026-03-05 - Landing Redesign Phase 7 Completed (Motion Orchestration + Cleanup)

### Neyi degistirdik?
- Reveal siralamasini section bazinda netlestirdik:
  - Hero immediate
  - Evidence delay-1
  - How delay-2
  - Trust delay-3
- Hover hareketlerini tek standarda cektik:
  - Evidence kartlarinda `translateY(-2px)`
  - Kisa transition sureleri (200ms)
- Landing markup'ta legacy class kalintilarini temizledik:
  - root'tan `landing-shell` kaldirildi
  - How section'dan `surface-soft` kaldirildi
- Kullanilmayan landing CSS classlarini prune ettik:
  - `landing-shell`, `data-panel`, `signal-strip`
  - `section-frame`
  - `reveal-scroll`

### Neden degistirdik?
- Motion dilini sectionlar arasi tutarli yapmak icin.
- Hover davranisini tek bir urun diliyle sabitlemek icin.
- Legacy/new class karisimindan kaynaklanan teknik borcu kapatmak icin.
- CSS'i daha sade, bakimi kolay ve odakli hale getirmek icin.

### Bu degisiklik nasil calisiyor?
- Reveal classlari artik section-level olarak kontrollu bir sequencing veriyor.
- Hover standardi butun Evidence kartlarinda ayni hissi uretiyor.
- Prune edilen classlar landing tarafinda artik kullanilmadigi icin style catismasi azaltiyor.

### Vizyon etkisi
- Landing redesign sureci Phase 0-7 tamamlanmis oldu; sayfa artik daha tutarli, daha temiz ve daha premium bir sistem davranisi sergiliyor.

---

## 2026-03-05 - Footer Tone Fix (Less Flat White)

### Neyi degistirdik?
- Footer arka planini duz beyaz hissinden cikardik.
- `footer-sheen` icine palete uyumlu katmanli gradient ekledik:
  - soldan/yukaridan soft glow
  - sagdan/yukaridan hard glow
  - altta yumusak card gecisi
- Footer'a ince bir ust sinir kontrasti ekledik (`border-t border-border/35`).

### Neden degistirdik?
- Footer tek renk beyaz gorunuyor ve sayfa sonunu kopuk hissettiriyordu.
- Final CTA'dan footera geciste premium akisin devam etmesi gerekiyordu.

### Bu degisiklik nasil calisiyor?
- Footer tonu artik landing paletiyle bagli calisiyor.
- Kontrast korunuyor ama yuzey artik daha katmanli ve "productized" gorunuyor.

### Vizyon etkisi
- Landing kapanisinda gorsel kalite devam ediyor; footer artik bos beyaz bir alan degil, tasarim sisteminin bir parcasi gibi davranıyor.
