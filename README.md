# LeadScorer (Frontend Prototype)

LeadScorer is a frontend-only product prototype for lead prioritization.

## Core Product
- CSV-first lead import
- Explainable scoring (hot/warm/cold + reason breakdown)
- Queue operations (filter, triage, shortcuts)
- Analytics narrative (`what changed and why`)
- Settings governance (impact preview, field validation, snapshots)
- Demo mode (scenarios, guided tour, local telemetry)

## Tech Stack
- Vite
- React
- TypeScript
- Tailwind
- shadcn/ui (pruned to active components)

## Local Run
1. `npm install`
2. `npm run dev`

## Quality Gates
- `npx tsc --noEmit`
- `npm test`
- `npm run build`

## Runtime Model
- No backend integration in this repo.
- Auth is guest-session prototype mode.
- Data is local/session storage based.
