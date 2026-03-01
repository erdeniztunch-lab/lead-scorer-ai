# Phase 1 Deployment & Ops Checklist

## Vercel env setup
Set for both Preview and Production:
- `ALLOWED_ORIGIN` (comma-separated preview + production domains)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `INTERNAL_API_TOKEN` (optional)

## Supabase migration ops
1. Apply migrations in order from `supabase/migrations`.
2. Run validation SQL:
- `supabase/validation/phase1_data_model_check.sql`
- `supabase/validation/phase1_scoring_configs_check.sql`

## Smoke test
1. Login with Supabase account.
2. Upload CSV from dashboard setup mode.
3. Confirm imported leads appear on Leads page.
4. Confirm KPI cards load from API.
5. Update scoring config in Settings and run rescore.
6. Confirm scoring runs list updates.
7. Confirm Analytics summary data is visible.
8. Call protected endpoint without token and verify `401`.

## Rollback
1. Roll back Vercel deployment to previous stable build.
2. If latest DB migration is problematic, apply compensating SQL migration.
3. Re-run smoke tests on rolled-back deployment.
