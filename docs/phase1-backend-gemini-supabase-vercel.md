# Phase 1 Backend (Gemini + Supabase + Vercel)

## Architecture
- Frontend (Vercel static): React app.
- Backend (Vercel serverless): `/api/*` endpoints.
- Auth: Supabase JWT (client gets access token, API verifies token via Supabase Auth).
- AI: Gemini API is called only from backend (`/api/ai/explain`), never from browser.

## Security Baseline
- `GEMINI_API_KEY` is server-only Vercel env var.
- API checks:
  - `Origin` allowlist (`ALLOWED_ORIGIN`)
  - Supabase bearer token verification
  - strict request validation
- Response/security headers:
  - `Cache-Control: no-store` for API
  - `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

## Required Vercel Environment Variables
- `ALLOWED_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (recommended: `gemini-1.5-flash`)
- `INTERNAL_API_TOKEN` (optional defense-in-depth)

## Endpoints
- `GET /api/health`
- `POST /api/ai/explain`
  - `Authorization: Bearer <supabase_access_token>`
  - body:
    - `leadName`
    - `company`
    - `score`
    - `tier`
    - `reasons[]` (optional)

## Next Step
- Add Supabase-backed auth flow on frontend and replace local session gate.
