# LeadSpark Dashboard

Frontend + serverless API for lead import, scoring, analytics, and settings.

## Stack
- Vite + React + TypeScript
- Serverless API routes under `api/`
- Supabase (Auth + Postgres + RLS)
- Gemini API for explanation generation (`/api/ai/explain`)

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env`
3. Fill required values:
`ALLOWED_ORIGIN`, `INTERNAL_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`
4. `npm run dev`

## Quality gates
- `npm run check:safety`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`

## Security baseline
- `.env` and `.env.*` are gitignored (except `.env.example`)
- API security headers are applied in `api/_lib/security.ts`
- Origin allowlist enforced via `ALLOWED_ORIGIN`
- Optional internal bearer check via `INTERNAL_API_TOKEN`
- Supabase access token is verified server-side on protected routes
- Gemini API key is server-only and only required by AI routes

## Deploy (Vercel)
1. Configure env vars in Vercel for Preview + Production
2. Run Supabase migrations in `supabase/migrations/`
3. Run smoke checks after deploy:
`/api/health`, auth login, import preview/import, leads list, settings save/rescore, analytics summary
