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

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5050")

app = FastAPI(
    title="Finpilot API",
    description="Autonomous CFO Operating System — agent backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_url.split(",") if origin.strip()],
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


@app.get("/")
def root():
    return {"status": "ok", "service": "finpilot-backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}
