import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime
def fetch_transactions(business_id: str) -> pd.DataFrame:
    # Keep calculation helpers importable for tests and offline analysis.
    from supabase_client import supabase

    response = (
        supabase.table("transactions")
        .select("date, amount, type, category")
        .eq("business_id", business_id)
        .order("date")
        .execute()
    )
    rows = response.data
    if not rows:
        return pd.DataFrame(columns=["date", "amount", "type", "category"])

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df["amount"] = df["amount"].astype(float)
    return df


def build_monthly_net_cashflow(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["ds", "y"])

    monthly = (
        df.set_index("date")["amount"]
        .resample("MS")
        .sum()
        .reset_index()
    )
    monthly.columns = ["ds", "y"]
    return monthly


def run_cashflow_forecast(business_id: str, forecast_months: int = 12) -> dict:
    df = fetch_transactions(business_id)

    if df.empty or len(df) < 3:
        return {
            "error": "Not enough transaction history to generate a forecast. "
                     "Need at least a few months of data."
        }

    monthly = build_monthly_net_cashflow(df)

    try:
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            interval_width=0.80,
        )
        model.fit(monthly)
        future = model.make_future_dataframe(periods=forecast_months, freq="MS")
        forecast = model.predict(future)
    except Exception as error:
        # CmdStan can be blocked by Windows Application Control policies. Keep
        # the agent usable with an explainable trend fallback in that case.
        print(f"Prophet unavailable, using linear trend fallback: {error}")
        x = np.arange(len(monthly))
        slope, intercept = np.polyfit(x, monthly["y"].to_numpy(), 1)
        residuals = monthly["y"].to_numpy() - (intercept + slope * x)
        margin = max(float(np.std(residuals) * 1.28), 1.0)
        future_dates = pd.date_range(monthly["ds"].max() + pd.offsets.MonthBegin(1), periods=forecast_months, freq="MS")
        future_x = np.arange(len(monthly), len(monthly) + forecast_months)
        predicted = intercept + slope * future_x
        forecast = pd.DataFrame({
            "ds": future_dates,
            "yhat": predicted,
            "yhat_lower": predicted - margin,
            "yhat_upper": predicted + margin,
        })

    last_historical_date = monthly["ds"].max()
    forecast_future = forecast[forecast["ds"] > last_historical_date]

    historical_out = [
        {"month": row["ds"].strftime("%Y-%m"), "net_cashflow": round(row["y"], 2)}
        for _, row in monthly.iterrows()
    ]

    forecast_out = [
        {
            "month": row["ds"].strftime("%Y-%m"),
            "predicted_net_cashflow": round(row["yhat"], 2),
            "lower_bound": round(row["yhat_lower"], 2),
            "upper_bound": round(row["yhat_upper"], 2),
        }
        for _, row in forecast_future.iterrows()
    ]

    current_cash_position = round(df["amount"].sum(), 2)

    runway_months = None
    running_balance = current_cash_position
    for i, row in enumerate(forecast_future.itertuples(), start=1):
        running_balance += row.yhat
        if running_balance <= 0:
            runway_months = i
            break

    avg_predicted = forecast_future["yhat"].mean()
    if runway_months:
        summary = (
            f"At current trends, cash reserves are projected to run out in "
            f"approximately {runway_months} month(s). Average projected monthly "
            f"net cash flow is Rs.{avg_predicted:,.0f}."
        )
    elif avg_predicted >= 0:
        summary = (
            f"Cash flow is trending positive. Average projected monthly net "
            f"cash flow over the next {forecast_months} months is "
            f"Rs.{avg_predicted:,.0f}. No near-term runway risk detected."
        )
    else:
        summary = (
            f"Cash flow is trending negative but current reserves are sufficient "
            f"to cover the projected {forecast_months}-month window. Average "
            f"projected monthly net cash flow is Rs.{avg_predicted:,.0f}. Monitor closely."
        )

    return {
        "business_id": business_id,
        "generated_at": datetime.utcnow().isoformat(),
        "current_cash_position": current_cash_position,
        "historical": historical_out,
        "forecast": forecast_out,
        "runway_months": runway_months,
        "summary": summary,
    }
