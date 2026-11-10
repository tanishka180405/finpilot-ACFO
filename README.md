# Finpilot — Autonomous CFO Operating System

## Run it

Double-click `Start-Finpilot.cmd` (or `Start-Finova.cmd`). It starts (or restarts) both services and opens the app at http://localhost:5050. The first run installs required packages automatically.

Before the first start, create `frontend/.env.local` from its example, then double-click `Start-Finpilot.cmd` once. It creates `backend/.env` and copies the Supabase URL; add your Supabase `service_role` key there one time and double-click the launcher again. The service-role key must never be placed in the frontend file.

## Manual run (optional)

### Backend
cd backend
python -m venv venv
venv\Scripts\activate      (Windows)
pip install -r requirements.txt
copy .env.example to .env, fill in Supabase credentials
python -m uvicorn main:app --reload

### Frontend
cd frontend
npm install
npm run dev

Open: http://localhost:5050

## Offline presentation mode

This project can run without Supabase authentication for demonstrations. Set this in
`frontend/.env.local`:

```text
NEXT_PUBLIC_DISABLE_AUTH=true
```

Then open `http://localhost:5050/dashboard`. The dashboard includes healthy and
unhealthy company cases, 12-month revenue and cash-flow trends, and local mock data
for the Chat, Cash flow, Revenue, Transactions, Invoices, Payroll, Simulations, and
Ledger pages. Use the Healthy case / Unhealthy case selector to keep all agent pages
on the same scenario.

For production data and sign-in, set `NEXT_PUBLIC_DISABLE_AUTH=false`, configure the
Supabase variables, and ensure the deployed backend can reach Supabase. Never commit
`.env.local` or `backend/.env` because they contain credentials.
