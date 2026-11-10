# Finpilot production deployment

## Backend

Deploy `backend/` as a Python 3.11 container using its Dockerfile. Set these environment variables in the hosting provider:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=<server-only-service-role-key>
FRONTEND_URL=https://your-frontend-domain.example
```

The service starts on the provider's `PORT` and exposes `/health` for health checks.

## Frontend

Deploy `frontend/` as a Next.js application. Set:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
BACKEND_URL=https://your-backend-domain.example
```

`BACKEND_URL` is used by `next.config.js` to proxy browser `/api/*` requests, so users continue to use one frontend origin.

## Release checklist

- Use separate Supabase projects for staging and production.
- Rotate any service-role key exposed during development.
- Apply the database schema and RLS policies before starting the app.
- Configure Supabase email/redirect URLs for the deployed frontend.
- Confirm the backend `/health` endpoint and frontend login flow.
- Run the end-to-end flow: create business → import data → forecast → simulation → ledger.
