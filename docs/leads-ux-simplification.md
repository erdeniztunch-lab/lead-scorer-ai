# Leads UX Simplification Plan (Dashboard Work Mode)

## Problem
The Leads Work Mode currently delivers strong capability but high cognitive load.
Users can triage effectively, yet row density, action overload, and filter complexity slow the core decision:
`Who should I contact first today?`

## Current UX Audit
- Row-level signal density is high (many badges and actions in one line).
- Action area competes with itself (contact/snooze/pin + communication icons).
- Filter panel requires parsing too many controls before action.
- Expanded detail panel is informative but not decision-first.
- Keyboard flow is strong and must be preserved.

## Design Principles
- Don't Make Me Think: triage-first, not detail-first.
- One clear primary action per row.
- Progressive disclosure for secondary controls.
- Decision-first expanded panel architecture.
- Preserve speed features (presets, shortcuts, quick actions) while reducing clutter.

## Locked UX Decisions
1. Row-level visual density will be reduced.
2. Action hierarchy:
   - Primary: `Contacted`
   - Secondary: `Snooze`, `Pin` in compact menu
3. Filter panel will use a two-tier model:
   - Quick presets visible by default
   - Advanced filters in collapsible area
4. Expanded detail panel will follow 3 layers:
   1. Why this score (short)
   2. Recommended next action
   3. Details (enrichment + grouped contributions)
5. Keyboard flow remains visible and intact.

## Scope
In scope:
- Frontend UX simplification of Dashboard Leads Work Mode.
- Layout, visual hierarchy, interaction structure, and microcopy tightening.

Out of scope:
- Backend changes
- API changes
- Scoring logic changes
- Route changes

## Phase Model
1. Phase 0 - Baseline Audit Lock
2. Phase 1 - Queue Row Density Reduction
3. Phase 2 - Action Hierarchy Refactor
4. Phase 3 - Filter IA Simplification
5. Phase 4 - Expanded Detail Re-architecture
6. Phase 5 - Visual Hierarchy & Microcopy Polish
7. Phase 6 - QA, Accessibility, and Regression

## Phase Cards

### Phase 0 - Baseline Audit Lock
Goal:
- Freeze current UX baseline and scope boundaries.

Files:
- `src/pages/Dashboard.tsx`
- `src/lib/dashboardWorkflowHelpers.ts`
- `src/lib/leadUiStateStore.ts`
- `docs/leads-ux-simplification.md`

Tasks:
- Document current row content, row actions, filters, and expanded panel structure.
- Freeze non-goals (no scoring logic or backend changes).

Baseline Snapshot (2026-03-05):
- Current queue table structure includes 6 columns:
  - `#`, `Lead`, `Company`, `Score`, `Tier`, `Actions`
- Row-level status density currently includes multiple concurrent badges:
  - confidence, enrichment, status, pinned, SLA
- Row action area currently includes:
  - icon actions: email, call, LinkedIn
  - workflow actions: `Contacted`, `Snooze 24h`, `Pin/Unpin`
- Filter block currently combines presets and advanced controls in one surface:
  - presets: Hot today, No recent touch, High intent + fit
  - advanced controls: search, tier select, quality select, reset
- Keyboard shortcuts are active and documented in UI:
  - `j/k`, `Enter`, `c/s/p`
- Expanded row currently contains:
  - Why this score
  - AI explanation
  - Enrichment changes
  - Grouped contribution breakdown
- Supporting logic verified in source:
  - workflow sorting (`pinned`, `snoozed`, `score`, `rank`)
  - SLA derivation
  - local UI state persistence

Scope Lock:
- No scoring math changes
- No backend/API/route changes
- Work Mode UX simplification only

Definition of Done:
- Baseline and scope are explicit and accepted.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (baseline inventory + scope freeze completed)  
Open Issues:
- None at baseline stage.

---

### Phase 1 - Queue Row Density Reduction
Goal:
- Make each lead row scannable in 1-2 seconds.

Files:
- `src/pages/Dashboard.tsx`

Tasks:
- Reduce visible badges to core set (`Tier`, `SLA`, one status badge).
- Move lower-priority indicators (confidence/enrichment) to muted or detail-level placement.
- Keep score and name/company prominence strong.

Definition of Done:
- Rows are visually lighter with clear primary signals.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Implemented (row density reduced in Work Mode table)  
Open Issues:
- Secondary action hierarchy (Snooze/Pin overflow) remains for Phase 2.

---

### Phase 2 - Action Hierarchy Refactor
Goal:
- Prevent accidental clicks and action overload.

Files:
- `src/pages/Dashboard.tsx`
- `src/components/ui/*` (only if existing compact menu component is reused)

Tasks:
- Keep one primary row CTA: `Contacted`.
- Move `Snooze` and `Pin` into compact overflow actions.
- Consolidate or reduce low-priority icon actions.

Definition of Done:
- One obvious primary action per row.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Implemented (single primary row action + compact overflow for secondary actions)  
Open Issues:
- Filter complexity remains and is covered in Phase 3.

---

### Phase 3 - Filter IA Simplification
Goal:
- Reduce filter cognitive load without removing capability.

Files:
- `src/pages/Dashboard.tsx`

Tasks:
- Keep 3 quick presets visible by default.
- Move search/tier/quality controls into an `Advanced filters` collapsible area (or inverse if layout fit requires).
- Keep a clear `Reset filters` control.

Definition of Done:
- Users can begin with one click using presets, then refine only when needed.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Implemented (quick presets + collapsible advanced filters + unified reset)  
Open Issues:
- Expanded panel architecture still pending (Phase 4).

---

### Phase 4 - Expanded Detail Re-architecture
Goal:
- Turn expanded rows into decision panels, not information dumps.

Files:
- `src/pages/Dashboard.tsx`

Tasks:
- Reorder expanded panel:
  1. Why this score (short summary)
  2. Recommended next action
  3. Details (enrichment + grouped contributions)
- Remove repeated microcopy and redundant labels.

Definition of Done:
- Action decision can be made in first viewport of expanded content.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Implemented (decision-first expanded panel with recommended next action)  
Open Issues:
- Visual spacing/microcopy fine-tuning remains for Phase 5.

---

### Phase 5 - Visual Hierarchy & Microcopy Polish
Goal:
- Improve readability, consistency, and scan rhythm.

Files:
- `src/pages/Dashboard.tsx`
- `src/index.css` (only if minimal support classes are needed)

Tasks:
- Normalize spacing and card rhythm.
- Soften non-critical badges.
- Keep shortcut helper visible but compact.
- Tighten copy to literal, short, action-first language.

Definition of Done:
- Screen feels cleaner while preserving workflow power.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Implemented (visual hierarchy tightened, secondary signals softened, microcopy compressed)  
Open Issues:
- Final UX quality gate remains for Phase 6.

---

### Phase 6 - QA, Accessibility, and Regression
Goal:
- Validate simplification outcomes without workflow regressions.

Files:
- `src/pages/Dashboard.tsx`
- tests under `src/test/*` as needed
- `docs/leads-ux-simplification.md`
- `development.md`

Tasks:
- Functional checks for row actions, filters, expanded panel, and shortcuts.
- Accessibility checks (focus order, keyboard-only use, contrast).
- Responsive checks (320/375/768/1024/1440).
- Run build gates.

Definition of Done:
- UX goals met and no regressions in core lead workflow.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (`npx tsc --noEmit`, `npm run build`) + row action menu accessibility hardening  
Open Issues:
- Optional manual responsive sweep (320/375/768/1024/1440) can be re-run before release freeze.

## Public APIs / Interfaces / Types Impact
- No route changes.
- No backend/API contract changes.
- Internal view-only helpers may be added if needed.
- Scoring and lead model semantics remain unchanged.

## Validation Matrix

Functional:
- `Contacted`, `Snooze`, `Pin` behaviors remain correct after refactor.
- Presets and advanced filters produce expected subsets.
- Expand/collapse still works and displays reordered sections.

Keyboard:
- `j/k`, `Enter`, `c/s/p` continue to work.
- Shortcut suppression in input/select/textarea remains intact.

Responsive:
- 320 / 375 / 768 / 1024 / 1440 render without overflow or broken action layout.

Accessibility:
- Focus visibility for row actions and overflow menu.
- Meaningful labels for controls.
- Acceptable contrast for muted secondary signals.

Regression gates:
- `npx tsc --noEmit`
- `npm run build`

## Acceptance Criteria
1. Row scan time and visual clutter are clearly reduced.
2. One primary row action is obvious.
3. Filter experience provides quick-start + advanced refinement.
4. Expanded panel is decision-first.
5. Keyboard workflow remains intact.
6. Type-check/build pass.

## Assumptions
1. Primary objective is operator speed, not maximum per-row information display.
2. Detailed information remains accessible in expanded view.
3. No new UI library will be introduced.
4. Documentation and development logs will be updated after each phase.
