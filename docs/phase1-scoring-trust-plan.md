# Phase 1 Execution Plan - Scoring Trust Hardening

## Why This Is Next
Current product state is frontend-only prototype with completed CSV-first import and deterministic scoring baseline.  
According to `docs/product-phases.md`, the immediate next phase is **Phase 1 - Scoring Trust Hardening**.

## Phase Goal
Increase user trust in lead ranking by making scoring logic more explainable, more consistent, and easier to verify during daily use.

## In Scope
- Explainability structure improvements in lead detail view
- Deterministic reason ranking quality improvements
- Confidence signaling for low-data leads
- Frontend-only validation and test coverage updates

## Out of Scope
- Backend integrations (Supabase, Gemini API calls, server endpoints)
- Persistent audit storage beyond local/session mode
- CRM integrations

## Workstreams

### 1) Explainability Structure
- Add contribution grouping in scoring output:
  - `engagement`
  - `fit`
  - `recency`
  - `source`
- Render grouped breakdown blocks in queue lead detail.
- Keep existing score math unchanged.

#### Planned Type Changes
- `ScoreContribution`:
  - Add optional `group?: "engagement" | "fit" | "recency" | "source"`
- `Lead` view model (UI-level):
  - Add derived `scoreConfidence: "low" | "medium" | "high"`

### 2) Deterministic Top Reasons Quality
- Keep current top-reason sorting by score contribution.
- Add stable tie-break rule:
  - if contribution is equal, sort by `label` ascending.
- Ensure same input always returns same reason order.

### 3) Confidence Signal (Frontend Heuristic)
- Derive confidence from available high-signal fields:
  - email opens/clicks/page views
  - demo requested
  - fit booleans
  - source/recency availability
- Suggested rule:
  - `high`: 6+ reliable populated signals
  - `medium`: 3-5 reliable populated signals
  - `low`: 0-2 reliable populated signals
- Display confidence badge next to score or in expanded lead panel.

### 4) UX Copy and Clarity
- Add concise microcopy in expanded lead card:
  - "Score confidence reflects data completeness."
- Keep "prototype mode" transparency unchanged.
- Avoid AI over-claim language in this phase.

### 5) Testing and Verification
- Extend `src/test/scoringEngine.test.ts` with:
  - deterministic tie-break test
  - contribution grouping presence test
  - confidence derivation tests
- Keep existing tests intact.
- Validation commands:
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`

## Acceptance Criteria
- "Why this score" is clearer through grouped contributions.
- Same lead input produces stable `topReasons` ordering.
- Leads display confidence indicator without backend dependency.
- Existing scoring behavior and thresholds remain unchanged.
- All quality gates pass.

## Definition of Done
- UI and scoring utilities updated for grouping + confidence.
- Added tests for tie-break and confidence behavior.
- No regressions in CSV import and lead queue flow.
- Phase summary updated in `docs/product-phases.md` when done.
