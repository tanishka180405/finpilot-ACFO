import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.cashflow_routes import router as cashflow_router
from routes.agent_runs_routes import router as agent_runs_router
from routes.revenue_routes import router as revenue_router
from routes.simulation_routes import router as simulation_router
from routes.chat_routes import router as chat_router
from routes.business_data_routes import router as business_data_router
from routes.transaction_routes import router as transaction_router
from routes.operations_routes import router as operations_router

load_dotenv()

frontend_url = os.environ.get("FRONTEND_URL", "*")
allowed_origins = [origin.strip() for origin in frontend_url.split(",") if origin.strip()]

app = FastAPI(
    title="Finpilot API",
    description="Autonomous CFO Operating System — agent backend",
    version="0.1.0",
)

if "*" in allowed_origins or not allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(cashflow_router)
app.include_router(agent_runs_router)
app.include_router(revenue_router)
app.include_router(simulation_router)
app.include_router(chat_router)
app.include_router(business_data_router)
app.include_router(transaction_router)
app.include_router(operations_router)


from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Finpilot API — Live & Healthy</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070B14; color: #FFFFFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #0E1526; border: 1px solid #1E293B; border-radius: 20px; padding: 48px 36px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(52, 211, 153, 0.12); color: #34D399; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 600; font-family: monospace; border: 1px solid rgba(52, 211, 153, 0.25); margin-bottom: 24px; }
            .dot { width: 8px; height: 8px; background: #34D399; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            h1 { font-size: 26px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.02em; }
            p { color: #8B96AC; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0; }
            .endpoints { background: #070B14; border: 1px solid #1A2438; border-radius: 12px; padding: 14px; text-align: left; font-family: monospace; font-size: 13px; color: #A5B4FC; margin-bottom: 24px; }
            .endpoints div { margin: 4px 0; }
            .endpoints span { color: #34D399; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge"><span class="dot"></span> BACKEND IS LIVE & HEALTHY</div>
            <h1>Finpilot Autonomous CFO API</h1>
            <p>This is the Python FastAPI backend engine running AI financial agents, cash flow simulations, and revenue forecasting.</p>
            <div class="endpoints">
                <div><span>✓</span> /health — Healthy</div>
                <div><span>✓</span> /api/cashflow — Forecasting Engine</div>
                <div><span>✓</span> /api/simulation — Scenario Simulator</div>
                <div><span>✓</span> /api/revenue — Trend Engine</div>
            </div>
            <p style="font-size: 13px; color: #64748B; margin-bottom: 0;">Open your Netlify URL to use the interactive dashboard.</p>
        </div>
    </body>
    </html>
    """


@app.get("/health")
def health():
    return {"status": "healthy"}
