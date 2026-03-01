# Phase 0 Baseline Specification

## Product Flows (Implemented)
- Landing flow: Hero -> How it works -> Features -> Social proof -> Final CTA.
- Dashboard flow: Filter bar -> KPI row -> Lead queue table -> Expandable AI explanation.
- Dashboard navigation flow: Leads (`/dashboard`), Analytics (`/dashboard/analytics`), Settings (`/dashboard/settings`).

## Canonical Lead Data Contract (v0)
- `id`: numeric row id.
- `rank`: display priority order in queue.
- `name`: lead contact name.
- `company`: lead company name.
- `score`: 0-100 numeric lead score.
- `tier`: enum `hot | warm | cold`.
- `reasons`: top reason codes array (displayed as pills).
- `source`: acquisition channel label.
- `lastActivity`: latest engagement recency text.
- `email`: primary contact email.
- `aiExplanation`: expanded rationale paragraph for ranking.

## Scoring and Tier Rules (v0, deterministic)
- Tier threshold rules:
  - `hot`: score >= 80
  - `warm`: 60 <= score <= 79
  - `cold`: score < 60
- Score explanation structure:
  - Summary paragraph in `aiExplanation`.
  - Top two reason codes in `reasons`.
- Current reason code set from mock data:
  - `High engagement`
  - `Recent purchase intent`
  - `Demo requested`
  - `Budget confirmed`
  - `Multiple page views`
  - `Email engaged`
  - `Whitepaper download`
  - `Repeat visitor`
  - `Webinar attended`
  - `Fits ICP`
  - `Email opened`
  - `Company growth`
  - `Single visit`
  - `Low engagement`
  - `Unqualified industry`
  - `No engagement`

## Phase 0 Definition of Done
- Default app metadata is replaced with LeadScorer branding and product description.
- Sidebar links for analytics and settings resolve to valid routes.
- Visible text encoding artifacts are removed from user-facing copy.
- Lead schema and scoring/tier v0 rules are documented in this file.
