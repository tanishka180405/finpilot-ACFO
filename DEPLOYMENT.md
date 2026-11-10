# Finpilot Production Deployment

This repository includes turnkey deployment configurations for **Render** (Backend API) and **Netlify** (Next.js Frontend).

---

## 1. Deploy Backend on Render

The repository contains `render.yaml` and `backend/Dockerfile`.

1. Go to **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** > **Blueprint** (or **Web Service**).
3. Connect your GitHub repository: `https://github.com/tanishka180405/finpilot-ACFO`.
4. Render automatically reads `render.yaml` and sets up the `finpilot-backend` service.
5. (Optional) Under Environment Variables in Render, provide your Supabase production keys:
   - `SUPABASE_URL`: Your Supabase project URL (e.g. `https://your-ref.supabase.co`)
   - `SUPABASE_SERVICE_KEY`: Your Supabase `service_role` secret key
   - `FRONTEND_URL`: `*` (or your custom Netlify domain)
6. Click **Apply** / **Deploy**. Render has assigned your live primary URL:
   `https://finpilot-backend-wre0.onrender.com`

---

## 2. Deploy Frontend on Netlify

The repository contains `netlify.toml` configured for Next.js.

1. Go to **[Netlify Dashboard](https://app.netlify.com/)**.
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and choose `tanishka180405/finpilot-ACFO`.
4. Netlify will auto-detect settings from `netlify.toml`:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Environment Variables (in Netlify Site Settings > Environment variables):
   - `NEXT_PUBLIC_DISABLE_AUTH`: `true` (for instant demo/offline mode) or `false` (for live Supabase auth)
   - `BACKEND_URL`: Your Render backend URL (e.g. `https://finpilot-backend.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`: (Optional, if using live auth)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Optional, if using live auth)
6. Click **Deploy Site**.

---

## 3. Running Locally

1. Simply double-click `Start-Finpilot.cmd` (or `Start-Finova.cmd`).
2. Both backend and frontend boot up automatically at `http://localhost:5050`.
3. To switch between offline mock data and live Supabase data, edit `frontend/.env.local`:
   - `NEXT_PUBLIC_DISABLE_AUTH=true` for instant presentation mode.
   - `NEXT_PUBLIC_DISABLE_AUTH=false` with your Supabase credentials for live auth.
