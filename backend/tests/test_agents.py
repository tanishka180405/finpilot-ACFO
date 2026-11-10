import pandas as pd

from agents.cashflow import build_monthly_net_cashflow
from agents.revenue import build_monthly_revenue
from agents.simulation import _calculate_runway


def test_monthly_cashflow_aggregates_signed_transactions():
    transactions = pd.DataFrame({
        "date": pd.to_datetime(["2025-01-01", "2025-01-15", "2025-02-01"]),
        "amount": [1000, -250, 500],
    })
    result = build_monthly_net_cashflow(transactions)
    assert result["y"].tolist() == [750, 500]


def test_monthly_revenue_aggregates_months():
    revenue = pd.DataFrame({
        "date": pd.to_datetime(["2025-01-01", "2025-01-20"]),
        "amount": [1000, 2000],
    })
    result = build_monthly_revenue(revenue)
    assert result.iloc[0]["y"] == 3000


def test_runway_returns_first_month_balance_reaches_zero():
    assert _calculate_runway(100, [-40, -60, -10]) == 2
    assert _calculate_runway(100, [20, 10]) is None
