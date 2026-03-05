# Landing Page Redesign Plan (Datost-Like Premium Tech UI, Messaging Locked)

## Title + Intent
This document turns the Landing Visual Convergence direction into a step-by-step, phase-based execution plan.  
Goal: move the landing from a partial glass transition to a clear premium tech/editorial system while keeping messaging meaning, claim boundaries, routing, and CTA intent unchanged.

Non-goals:
- No backend or dashboard scope
- No product copy meaning rewrite
- No route/API changes
- No new UI library

## Locked Constraints
- Messaging meaning remains unchanged.
- No route/API/type changes.
- Landing-only scope.
- Tailwind + local CSS only.

## Grounded Audit
- Legacy and new visual classes currently coexist (mixed system).
- Typography still leans on utility defaults; editorial contrast is weak.
- Surface density is uneven; too many similar glass blocks can dilute focus.
- Motion exists but is not orchestrated consistently across sections.
- Negative space and dramatic heading/layout contrast are still below target.
- Hero/nav/final CTA are strong, but overall feel is still component-first instead of system-first.

## Design Principles
- Single visual system.
- Editorial hierarchy.
- Density control (one dominant surface + one/two supporting surfaces).
- Motion as meaning (minimal and purposeful).
- Green accent discipline (CTA, kicker, critical chips, active states only).

## Phase Model
1. Phase 0 - Baseline & Constraints Lock
2. Phase 1 - CSS System Consolidation
3. Phase 2 - Hero Redesign (Datost-like Signature)
4. Phase 3 - Evidence Section Rebalance
5. Phase 4 - How It Works Visual Edit
6. Phase 5 - Trust Section Premium Pass
7. Phase 6 - Final CTA & Footer Integration
8. Phase 7 - Motion Orchestration + Cleanup

## Phase Cards

### Phase 0 - Baseline & Constraints Lock
Goal:
- Freeze current scope and record a source-of-truth UI baseline.

Files:
- `src/pages/LandingPage.tsx`
- `src/index.css`
- `src/components/landing/*`

Implementation Tasks:
- Snapshot current class usage and identify legacy/new overlap.
- Confirm locked constraints and out-of-scope items.
- Record visual baseline notes for hero, evidence, workflow, trust, final CTA.

Baseline Snapshot (2026-03-05):
- Current mixed-system overlap is confirmed in active landing path:
  - `landing-shell` + `landing-atmosphere`
  - `surface-soft` + `glass-panel` usage in different sections
  - legacy classes still defined and partially active: `data-panel`, `signal-strip`, `cta-surface`
- Active visual class usage discovered in landing runtime:
  - `src/pages/LandingPage.tsx`: `landing-shell`, `landing-atmosphere`, `section-frame`, `surface-soft`, `glass-panel`, `glass-panel-strong`, `glass-chip`
  - `src/components/landing/HeroQueuePreview.tsx`: `data-panel`, `glass-panel-strong`, `accent-halo`, `glass-chip`
  - `src/components/landing/ProductEvidenceStrip.tsx`: `signal-strip`, `glass-panel`, `glass-panel-strong`
  - `src/components/landing/LandingTrustSection.tsx`: `surface-soft`, `section-frame`, `glass-panel`, `glass-panel-strong`, `glass-chip`, `glass-divider`
  - `src/index.css`: both legacy and new class definitions coexist
- Scope lock confirmed:
  - No messaging meaning updates
  - No route/API/type changes
  - Landing-only redesign
  - Tailwind + local CSS only
- Section-level baseline notes:
  - Hero: strong structure, still hybrid class language
  - Evidence: readable, but still tied to legacy `signal-strip`
  - How It Works: clear, but legacy `surface-soft` dependency remains
  - Trust: structurally strong, mostly migrated
  - Final CTA: strong, but still mixed with `cta-surface` legacy naming

Definition of Done:
- Scope boundaries are explicit.
- No scope drift risk remains.

Validation:
- All target files mapped.
- No unresolved ambiguity about goals.

Risks / Notes:
- If scope is not frozen here, downstream phases can regress messaging or over-expand to dashboard.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (baseline class inventory + scope freeze complete)  
Open Issues:
- Windows wildcard scan for `*.tsx` path requires per-file scan; inventory still completed via direct file checks.

---

### Phase 1 - CSS System Consolidation
Goal:
- Make `glass-*` and landing atmosphere classes the primary styling system.

Files:
- `src/index.css`

Implementation Tasks:
- Introduce/finalize:
  - `.glass-panel`
  - `.glass-panel-strong`
  - `.glass-chip`
  - `.glass-divider`
  - `.accent-halo`
  - `.landing-atmosphere`
- Add editorial utilities:
  - `.editorial-h1`
  - `.editorial-h2`
  - `.editorial-body`
  - `.section-breathing`
- Add motion utilities:
  - `.reveal-fade-up`
  - `.reveal-delay-1`
  - `.reveal-delay-2`
  - `.reveal-delay-3`
- Deprecate legacy landing dependencies from live usage path:
  - `landing-shell`
  - `data-panel`
  - `signal-strip`
  - `surface-soft`
- Ensure reduced-motion fallback applies to all reveal classes.

Implementation Notes (2026-03-05):
- Added editorial utilities in `src/index.css`:
  - `.editorial-h1`
  - `.editorial-h2`
  - `.editorial-body`
  - `.section-breathing`
- Added motion utilities:
  - `.reveal-fade-up`
  - `.reveal-delay-1`
  - `.reveal-delay-2`
  - `.reveal-delay-3`
- Added reduced-motion fallback for the new reveal utility set.
- Marked legacy landing classes with explicit deprecation comments for landing runtime:
  - `landing-shell`
  - `data-panel`
  - `signal-strip`
  - `surface-soft`
- Preserved legacy classes for safe sequential migration in later phases.

Definition of Done:
- Landing style surface is systemized and primarily `glass-*` based.
- No mandatory dependency on legacy landing classes in active landing markup.

Validation:
- Manual class graph check for legacy/new conflicts.
- Reduced-motion behavior verified.

Risks / Notes:
- Over-strong blur/glow can reduce readability; keep contrast-first tuning.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (CSS primitives/editorial/motion/deprecation annotations added)  
Open Issues:
- Landing markup still references some deprecated classes; migration happens in Phase 2+.

---

### Phase 2 - Hero Redesign (Datost-like Signature)
Goal:
- Build a clear editorial hero with a dominant queue preview surface.

Files:
- `src/pages/LandingPage.tsx`
- `src/components/landing/HeroQueuePreview.tsx`

Implementation Tasks:
- Convert hero left to editorial stack:
  - small kicker
  - large statement (`editorial-h1`)
  - concise body (`editorial-body`)
  - CTA row
  - trust line
- Ensure hero right panel is one dominant strong glass surface.
- Keep inner summary cards as chips; increase spacing clarity.
- Use balanced 6/6 desktop ratio.
- Keep mobile stacked with queue preview directly after hero copy.

Implementation Notes (2026-03-05):
- Hero left block moved to editorial utility classes:
  - headline now uses `.editorial-h1`
  - support copy now uses `.editorial-body`
- Hero section moved to shared rhythm utility:
  - `.section-breathing` applied
- Hero CTA primary button now uses controlled glow utility:
  - `.cta-glow`
- Hero visual rhythm refined with reveal utility classes:
  - left block: `.reveal-fade-up is-visible`
  - queue panel wrapper: `.reveal-fade-up reveal-delay-1 is-visible`
- Legacy dependency reduced in hero path:
  - removed `data-panel` from `HeroQueuePreview` root
  - queue panel root now relies on `glass-panel-strong + accent-halo`

Definition of Done:
- Hero is the primary visual anchor.
- Content is readable in one quick scan.

Validation:
- Desktop/mobile layout checks.
- CTA readability and focus state checks.

Risks / Notes:
- Excessive decorative layers can compete with CTA clarity.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (editorial hero stack + dominant queue panel + legacy class reduction)  
Open Issues:
- Full legacy class removal across non-hero sections continues in later phases.

---

### Phase 3 - Evidence Section Rebalance
Goal:
- Deliver concise, premium proof density without text walls.

Files:
- `src/components/landing/ProductEvidenceStrip.tsx`

Implementation Tasks:
- Keep 2x2 layout.
- Enforce one dominant card (first card strong), others light glass.
- Normalize padding:
  - mobile: `p-4`
  - desktop: `p-5`
- Tighten vertical flow:
  - proof header -> cards -> CTA

Implementation Notes (2026-03-05):
- Evidence section now uses shared rhythm utility:
  - `section-breathing`
- Legacy class dependency reduced in Evidence path:
  - removed `signal-strip` from active wrapper usage
- Container remains a single dominant surface:
  - wrapper uses `glass-panel`
- Card hierarchy enforced:
  - card 0: `glass-panel-strong + accent-halo + evidence-card-focus`
  - cards 1-3: `glass-panel`
- Card density normalized:
  - `p-4` mobile / `p-5` desktop
  - `h-full` and minimum internal content height for visual balance
- Vertical rhythm tightened:
  - compact spacing from section header to cards
  - compact spacing from cards to CTA block

Definition of Done:
- Section is scannable in 5 seconds.
- Visual emphasis is clear and not noisy.

Validation:
- Card visual hierarchy check.
- Mobile wrapping and spacing check.

Risks / Notes:
- If all cards look equally strong, emphasis is lost.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (dominant card hierarchy + rhythm compression + legacy reduction)  
Open Issues:
- Remaining legacy cleanup in non-Evidence sections continues in later phases.

---

### Phase 4 - How It Works Visual Edit
Goal:
- Improve process clarity with editorial rhythm and strong structural cues.

Files:
- `src/pages/LandingPage.tsx`

Implementation Tasks:
- Lock equal-height step cards.
- Increase step badge contrast.
- Keep output chips neutral and lightweight.
- Refine connector line:
  - thin
  - low opacity
  - centered
- Keep existing CTA; separate with a dedicated visual band.

Implementation Notes (2026-03-05):
- Section switched to shared rhythm utility:
  - `section-breathing`
- Heading migrated to editorial utility:
  - `editorial-h2`
- Connector line refined:
  - lower accent opacity for less visual noise
- Step cards now lock visual structure:
  - `flex h-full flex-col`
  - content block uses `flex-1` for equalized card rhythm
  - standardized `p-4` mobile / `p-5` desktop
- Step badge contrast increased with stronger border/background opacity.
- Output chips kept neutral with `glass-chip` styling and no extra accent boost.
- Section CTA separated via visual band:
  - `glass-divider` + top padding for clear cards-to-action transition.

Definition of Done:
- Users instantly understand the three-step flow.

Validation:
- Equal-height consistency at all breakpoints.
- Connector line and chip contrast checks.

Risks / Notes:
- Over-styled connector or badges can distract from message.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (equalized cards + refined connector + CTA separation band)  
Open Issues:
- Remaining full legacy-class migration is handled in later phases.

---

### Phase 5 - Trust Section Premium Pass
Goal:
- Unify trust block under premium system while preserving current structure.

Files:
- `src/components/landing/LandingTrustSection.tsx`

Implementation Tasks:
- Keep structure:
  - Live now
  - Current limits
  - FAQ
  - CTA + honesty
- Keep live card strong and limits card light.
- Increase FAQ separator clarity.
- Build footer band above CTA/honesty using `glass-divider`.
- Normalize list row height and vertical rhythm.

Implementation Notes (2026-03-05):
- Trust section migrated to shared rhythm utility:
  - `section-breathing`
- Trust heading moved to editorial utility:
  - `editorial-h2`
- Legacy class usage removed in trust scope:
  - removed `surface-soft` from section wrapper
- Surface hierarchy preserved and clarified:
  - Live now: `glass-panel-strong`
  - Current limits: `glass-panel`
- List row heights normalized:
  - `min-h-[86px]` for live/limits rows
  - inner row wrappers use `h-full`
- FAQ readability pass:
  - clearer separator contrast (`border-border/65`)
  - wrapper remains a muted glass block
- CTA + honesty remain in dedicated footer band:
  - `glass-divider` separation
  - CTA glow intentionally reduced to avoid competing with final CTA

Definition of Done:
- Trust block communicates value + limits clearly in one pass.

Validation:
- Visual priority check (live > limits).
- FAQ readability and keyboard behavior check.

Risks / Notes:
- Too many borders in trust can look busy; maintain restraint.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (trust hierarchy + FAQ clarity + footer band + legacy reduction)  
Open Issues:
- Global legacy class cleanup continues in Phase 7.

---

### Phase 6 - Final CTA & Footer Integration
Goal:
- Create a clean conversion finish with visual continuity into footer.

Files:
- `src/pages/LandingPage.tsx`
- `src/components/landing/SiteFooter.tsx`

Implementation Tasks:
- Keep final CTA as single strong glass surface with controlled mesh.
- Down-tune button glow intensity to avoid over-bloom.
- Smooth transition from final CTA into footer with white-gradient continuity.
- Apply minimal spacing/tone tuning in footer only.

Implementation Notes (2026-03-05):
- Final CTA surface refined as single strong conversion block:
  - kept `glass-panel-strong`
  - tuned `cta-surface` gradients for softer white-to-glass continuity
- Added controlled glow variant for final CTA button:
  - new `.cta-glow-soft` utility
  - final CTA now uses soft glow to avoid over-bloom
- Footer transition smoothed:
  - removed hard `border-t` line from footer
  - increased footer top spacing for softer visual handoff
  - tuned `footer-sheen` gradient to blend with CTA exit surface

Definition of Done:
- No abrupt visual cut from final CTA to footer.
- Conversion CTA remains strongest interactive element.

Validation:
- Contrast and glow intensity check.
- Footer transition visual pass.

Risks / Notes:
- Excess glow can reduce perceived polish.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (single strong CTA surface + glow tuning + smoother CTA-to-footer transition)  
Open Issues:
- Final global cleanup of remaining legacy landing classes is planned for Phase 7.

---

### Phase 7 - Motion Orchestration + Cleanup
Goal:
- Final polish and design debt removal.

Files:
- `src/pages/LandingPage.tsx`
- `src/components/landing/*.tsx`
- `src/index.css`

Implementation Tasks:
- Reveal sequencing:
  - Hero immediate
  - Evidence delay-1
  - How It Works delay-2
  - Trust delay-3
- Hover cap:
  - max `translateY(-2px)`
  - short easing only
- Remove legacy/new class co-usage on same element.
- Prune unused landing CSS classes.

Implementation Notes (2026-03-05):
- Reveal sequencing is now explicit at section level:
  - Hero: immediate reveal
  - Evidence: `reveal-delay-1`
  - How It Works: `reveal-delay-2`
  - Trust: `reveal-delay-3`
- Hover motion standardized:
  - evidence cards now use `translateY(-2px)`
  - transition timing tightened to 200ms
- Legacy/new class co-usage cleaned in active landing markup:
  - removed `landing-shell` usage from landing root
  - removed `surface-soft` usage from How It Works section
- Unused landing CSS classes pruned from `index.css`:
  - removed `.landing-shell`
  - removed `.data-panel`
  - removed `.signal-strip`
  - removed `.section-frame` and pseudo-element
  - removed `.reveal-scroll` and its reduced-motion branch
- Kept `.surface-soft` class in CSS because it is still used by dashboard scope, not landing.

Definition of Done:
- Motion feels consistent and intentional.
- No style conflicts remain.

Validation:
- Reduced-motion fallback check.
- Class cleanup check (no dead class usage in landing path).

Risks / Notes:
- Animation layering can create jank on low-end devices if overused.

Status: Completed  
Owner: Codex  
Date: 2026-03-05  
Validation Result: Passed (sequenced reveal + hover standardization + landing class cleanup + CSS prune)  
Open Issues:
- None in landing scope.

## Public APIs / Interfaces / Types Changes
- Route/API changes: none.
- `landingContent.ts` type shape: unchanged by default.
- Component props: no required changes.
- Change surface: presentational only (CSS + markup composition).

## Validation Matrix
Functional:
- `/dashboard`, `/login`, `#how-it-works` behaviors remain correct.
- Sticky CTA remains mobile-only with threshold behavior.

Responsive:
- 320 / 375 / 768 / 1024 / 1440
- No overflow, no blur clipping, no hero grid break.

Visual:
- Single visual language (no legacy/new conflict).
- Hero remains dominant.
- Evidence/How/Trust are distinct but coherent.
- Green accent remains disciplined.

Accessibility:
- AA contrast in muted glass surfaces.
- Clear focus rings.
- `prefers-reduced-motion` compliance.

Build:
- `npx tsc --noEmit`
- `npm run build`

## Test Cases and Scenarios
1. CTA routing and anchor behavior.
2. Sticky CTA mobile-only visibility.
3. Blur/glass clipping checks on all target breakpoints.
4. Focus/keyboard pass for nav/buttons/accordion.
5. Reduced-motion behavior for reveal/hover.
6. Visual regression quick pass:
   - hero
   - evidence
   - how it works
   - trust
   - final CTA continuity

## Acceptance Criteria (Final Gate)
- Datost-like premium tech/editorial feel is achieved.
- Messaging meaning is untouched.
- Glassmorphism remains controlled (not over-designed).
- Mobile and desktop quality parity is maintained.
- Type-check and build are clean.

## Assumptions and Defaults
- Datost-like means style direction only, not direct cloning.
- Copy meaning and conversion path are fixed.
- No new UI library is introduced.
- Landing-only iteration; dashboard is out of scope.

## Implementation Order (Execution Ready)
1. Create this document and lock constraints.
2. Fill Phase 0 baseline snapshot.
3. Execute phases strictly in order: 1 -> 7.
4. After each phase:
   - run relevant validation
   - update phase status and validation result
5. Finalize with acceptance checklist and completion stamp.
