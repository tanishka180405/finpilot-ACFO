from datetime import datetime

import numpy as np
import pandas as pd

def fetch_subscription_revenue(business_id: str) -> pd.DataFrame:
    # The database client is only needed when fetching live business data.
    from supabase_client import supabase

    response = (
        supabase.table("transactions")
        .select("date, amount")
        .eq("business_id", business_id)
        .eq("category", "subscription_revenue")
        .eq("type", "income")
        .order("date")
        .execute()
    )
    if not response.data:
        return pd.DataFrame(columns=["date", "amount"])

    revenue = pd.DataFrame(response.data)
    revenue["date"] = pd.to_datetime(revenue["date"])
    revenue["amount"] = revenue["amount"].astype(float)
    return revenue


def build_monthly_revenue(revenue: pd.DataFrame) -> pd.DataFrame:
    if revenue.empty:
        return pd.DataFrame(columns=["ds", "y"])

    monthly = revenue.set_index("date")["amount"].resample("MS").sum().reset_index()
    monthly.columns = ["ds", "y"]
    return monthly


def run_revenue_forecast(business_id: str, forecast_months: int = 12) -> dict:
    revenue = fetch_subscription_revenue(business_id)
    monthly = build_monthly_revenue(revenue)

    if len(monthly) < 3:
        return {"error": "Not enough subscription revenue history to generate a forecast."}

    positions = np.arange(len(monthly))
    slope, intercept = np.polyfit(positions, monthly["y"].to_numpy(), 1)
    future_positions = np.arange(len(monthly), len(monthly) + forecast_months)
    predictions = np.maximum(0, intercept + slope * future_positions)

    last_month = monthly["ds"].max()
    future_months = pd.date_range(last_month + pd.offsets.MonthBegin(1), periods=forecast_months, freq="MS")
    forecast_out = [
        {"month": month.strftime("%Y-%m"), "predicted_revenue": round(float(prediction), 2)}
        for month, prediction in zip(future_months, predictions)
    ]
    historical_out = [
        {"month": row["ds"].strftime("%Y-%m"), "revenue": round(float(row["y"]), 2)}
        for _, row in monthly.iterrows()
    ]

    latest_revenue = float(monthly.iloc[-1]["y"])
    projected_revenue = float(predictions[-1])
    growth_rate = ((projected_revenue / latest_revenue) - 1) * 100 if latest_revenue else 0
    summary = (
        f"Subscription revenue is projected to reach Rs.{projected_revenue:,.0f} "
        f"in {forecast_months} months, a {growth_rate:+.1f}% change from the latest month."
    )

    return {
        "business_id": business_id,
        "generated_at": datetime.utcnow().isoformat(),
        "historical": historical_out,
        "forecast": forecast_out,
        "latest_monthly_revenue": round(latest_revenue, 2),
        "projected_monthly_revenue": round(projected_revenue, 2),
        "growth_rate": round(growth_rate, 1),
        "summary": summary,
    }
