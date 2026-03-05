# Product Overview & Phase Breakdown

## Vision
LeadScorer is a lightweight revenue intelligence layer for sales teams.
It does not replace CRM. It helps teams decide who to contact first.

## Core Logic
1. Import leads from CSV.
2. Enrich missing fields in prototype-safe mode.
3. Score leads with deterministic, explainable rules.
4. Rank leads into `hot / warm / cold`.
5. Act from queue with triage actions.
6. Review analytics and config impact.

## How It Works
- Setup: map CSV fields, preview issues, optionally apply enrichment suggestions.
- Score: each lead gets score, tier, confidence, and grouped contribution reasons.
- Act: reps use filters, shortcuts, and quick actions to process the queue.
- Analyze: analytics explains movement, segments, and funnel status.
- Govern: settings show impact preview, field validation, snapshots, and revert.
- Demo: scenario toggle, guided tour, resettable baseline, telemetry-lite.

## Phase Breakdown (Completed)

## Phase 1 - Scoring Trust
- Grouped explainability
- Deterministic top reasons
- Confidence badges

## Phase 2 - Enrichment Simulation
- Suggest/apply enrichment in setup flow
- Original vs enriched audit trail in lead detail

## Phase 3 - Operator Workflow UX
- Saved presets
- Quick triage actions
- Keyboard shortcuts
- SLA-style urgency labels

## Phase 4 - Analytics Narrative
- Comparison narrative
- Source/tier segments
- Funnel and insight callouts

## Phase 5 - Settings Governance
- Field-level validation
- Pre-save impact preview
- Config snapshots, compare, revert
- Run history tracking

## Phase 6 - Demo Readiness
- Explicit demo mode toggle
- Seeded scenarios
- One-time guided tour per scenario
- One-click scenario reset
- Local telemetry-lite

## Non-Goals in This Repo
- Backend integration
- CRM sync
- Multi-user persistence
