# LeadScorer Frontend-Only Prototype Improvement Plan (6 Phases)

## Summary
Ürünü mevcut koddan anladığım haliyle: LeadScorer şu anda CSV-first, explainable scoring ve queue-first execution prototipi.  
Backend/entegrasyon yok; local/session mode'da çalışıyor.

Kilitlediğimiz öncelik:
- Primary focus: Scoring Trust
- Demo path: Inbound CSV First

Bu plan, frontend-only koşulda ürün değerini hızla kanıtlamak için 6 fazlı ve decision-complete bir iyileştirme yoludur.

## Product Understanding (Current Reality)

### Core value already present
- CSV upload + mapping + validation + issue export
- Deterministic scoring (hot/warm/cold) with contribution breakdown
- Queue + filters + settings + analytics screens

### Main gaps vs product vision
- "AI enrichment" katmanı henüz gerçek/simüle edilmiş ürün davranışı olarak görünür değil
- Analytics ekranı mostly snapshot; trend ve impact narrative zayıf
- Settings changes local preview, run history/persistence yok
- Demo guidance (first-run onboarding, success path) yetersiz

## Phase 1 — Scoring Trust Hardening (Highest Priority)

### Goal
Skorun "neden doğru olduğuna" dair güveni artırmak.

### Scope
- Queue detail panel'de explainability yapısını standardize et.
- Reason/code consistency ve config etkisini görünür yap.
- Scoring doğrulama guardrail'lerini sıkılaştır.

### Changes
- Explainability schema normalization  
  `scoreBreakdown` satırlarını kategorilere ayır: `engagement`, `fit`, `recency`, `source`.  
  UI'de grouped breakdown gösterimi.
- Reason quality  
  `topReasons` için deterministic tie-break rule (label sort fallback) dokümante ve testli.
- Confidence hint (frontend heuristic)  
  Eksik sinyal sayısına göre `low/medium/high` confidence badge.

### Interfaces / Types
- `Lead` view model'e `scoreConfidence: "low" | "medium" | "high"` eklenir (frontend-only derived).
- `ScoreContribution` için optional `group` alanı eklenir.

### Acceptance
- Her lead'de "why this score" net, tutarlı ve 5 saniyede anlaşılır.
- Aynı input için same score + same topReasons garantisi testle doğrulanır.

## Phase 2 — AI Enrichment Simulation Layer (Frontend Mock)

### Goal
Ürünün "enrichment" hikayesini backend olmadan inandırıcı biçimde göstermek.

### Scope
- Setup flow'a optional enrichment preview adımı ekle.
- Eksik alan tamamlama önerileri (mock rules) üret.

### Changes
- Enrichment preview panel  
  Missing fields listesi + proposed fill values + confidence tag.
- Apply suggestions  
  Kullanıcı satır/saha bazında öneriyi kabul/ret eder.
- Audit trail (session)  
  "original vs enriched" diff badge.

### Interfaces / Types
- `EnrichmentSuggestion` type: `field`, `original`, `suggested`, `confidence`, `sourceHint`
- `Lead` view model'e optional `enrichmentMeta`.

### Acceptance
- CSV import öncesi enrichment etkisi görsel ve anlaşılır.
- Kullanıcı enrichment'i kontrol edebildiğini hisseder.

## Phase 3 — Operator Workflow UX (Daily Use Speed)

### Goal
"Bugün önce kimi aramalıyım?" sorusunu tek ekranda daha hızlı cevaplamak.

### Scope
- Queue ergonomisi, quick actions, saved filters, keyboard flow.

### Changes
- Saved filter presets  
  "Hot today", "No recent touch", "High intent + fit".
- Quick triage actions  
  Mark as contacted, snooze, pin top lead (session state).
- Keyboard navigation  
  `j/k` row navigation, `enter` expand, `e/c/l` action shortcuts.
- First-response timer mock  
  Lead row'da simple SLA indicator.

### Interfaces / Types
- `LeadUIState` (session): `contactedAt`, `snoozedUntil`, `pinned`, `status`.

### Acceptance
- Queue triage süresi gözle görülür azalır (demo benchmark task ile).

## Phase 4 — Analytics Narrative Upgrade

### Goal
Analytics ekranını "metric dump"tan "decision narrative"e çevirmek.

### Scope
- Trend, segment, ve config comparison hikayesini güçlendir.

### Changes
- Before/after config comparison card  
  Preset değişiminde hot/warm/cold delta.
- Segmented views  
  Source-based split, tier-based conversion proxy.
- Quality funnel mock  
  Imported -> scored -> prioritized -> contacted.
- Insight callouts  
  "Most influential signal this run", "largest drop driver".

### Interfaces / Types
- `AnalyticsInsight` type: `title`, `value`, `direction`, `explanation`.

### Acceptance
- Analytics ekranı "what changed and why" sorusuna cevap verir.

## Phase 5 — Settings and Governance UX

### Goal
Scoring konfigürasyonunu güvenli ve yönetilebilir hale getirmek (frontend-only).

### Scope
- Config snapshots, revert, validation UX, change impact preview.

### Changes
- Config version snapshots (local)  
  Save named config, compare, revert.
- Pre-save impact preview  
  "If applied, hot leads +X / cold -Y" dry-run card.
- Validation UX  
  Field-level errors (sadece generic "Config invalid" değil).
- Preset lock hints  
  Conservative/balanced/aggressive intent açıklaması.

### Interfaces / Types
- `LocalScoringConfigSnapshot`: `id`, `name`, `config`, `createdAt`, `note`.

### Acceptance
- Kullanıcı config değişiminin etkisini save öncesi görür.
- Hatalar net ve field-level görünür.

## Phase 6 — Prototype Demo Readiness (Investor/Design Partner Ready)

### Goal
Ürünü tutarlı, tekrar edilebilir demo deneyimine dönüştürmek.

### Scope
- Demo mode, seeded scenarios, scripted walkthrough, telemetry-lite.

### Changes
- Demo scenarios  
  "High-intent inbound", "Noisy mixed list", "Outbound batch".
- Guided tour overlay  
  4-step product tour (setup -> score -> act -> analyze).
- Resettable sandbox  
  One-click reset to scenario baseline.
- Telemetry-lite (local)  
  Track key actions: import, filter use, expand lead, action click.

### Interfaces / Types
- `DemoScenario`: `id`, `name`, `seedData`, `goal`.
- `PrototypeEvent`: `event`, `timestamp`, `context`.

### Acceptance
- Demo 10 dakikada tutarlı şekilde çalıştırılabilir.
- Kullanıcı testlerinde hangi adımda kayıp yaşandığı ölçülebilir.

## Cross-Phase Engineering Rules
- Frontend-only constraint korunacak.
- No fake backend claims; UI'de "prototype mode" şeffaf kalacak.
- Deterministic scoring core bozulmayacak.
- Her faz sonunda `npm test`, `npx tsc --noEmit`, `npm run build`.

## Test Cases and Scenarios

### Functional
- CSV parse/mapping/import, filters, settings apply, analytics render.

### Determinism
- Same input -> same score/tier/reasons.

### UX
- First-run task: "Find top 5 leads and act" under time budget.

### Accessibility
- Keyboard-only queue navigation and focus visibility.

### Regression
- Existing scoring/config/csv tests + new phase-specific unit tests.

## Assumptions and Defaults
- Bu roadmap yalnız frontend prototip için hazırlanmıştır.
- Inbound CSV akışı ana demo yolu olarak kalır.
- "AI enrichment" bu aşamada simulated UX ile temsil edilir.
- Backend entegrasyon fazı ayrı dokümanlarda tanımlı kalır; burada uygulanmaz.
