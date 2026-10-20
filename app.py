
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

st.set_page_config(
    page_title="BankIntel | Banking Analytics",
    page_icon="🏦",
    layout="wide"
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

def load_csv(filename):
    path = DATA_DIR / filename
    if path.exists():
        try:
            return pd.read_csv(path)
        except Exception as error:
            st.error(f"Could not read {filename}: {error}")
    return None

kpis = load_csv("dashboard_kpis.csv")
models = load_csv("model_comparison.csv")
grades = load_csv("olap_rollup_by_grade.csv")

st.markdown("""
<style>
.stApp {background: #F4F7FC;}
[data-testid="stSidebar"] {background: #101C36;}
[data-testid="stSidebar"] * {color: white;}
.block-container {padding-top: 2rem;}
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("# 🏦 BankIntel")
    st.caption("BANKING INTELLIGENCE")
    page = st.radio(
        "Navigation",
        ["Overview", "Loan Risk", "Model Performance", "OLAP Reports"]
    )
    st.divider()
    st.caption("Data Warehousing & Data Mining")

st.title("Banking Intelligence Dashboard")
st.caption("Loan portfolio and model analytics")

if page == "Overview":
    st.subheader("Portfolio Overview")

    if kpis is not None and not kpis.empty:
        row = kpis.iloc[0]

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Loans", f"{int(row['total_loans']):,}")
        c2.metric(
            "Total Loan Amount",
            f"{float(row['total_loan_amount']):,.2f}"
        )
        c3.metric("Default Rate", f"{float(row['default_rate_pct']):.2f}%")
        c4.metric("Default Count", f"{int(row['default_count']):,}")

        st.caption(
            "Metrics are calculated from the available fact table. "
            "They may not represent the full original dataset."
        )
    else:
        st.warning(
            "KPI data is not available yet. Add "
            "data/dashboard_kpis.csv to the repository."
        )

    st.divider()
    left, right = st.columns(2)

    with left:
        st.subheader("Loan Distribution by Grade")
        if grades is not None and {
            "grade", "Total_Loans"
        }.issubset(grades.columns):
            chart_data = grades[["grade", "Total_Loans"]].copy()
            chart_data = chart_data.set_index("grade")
            st.bar_chart(chart_data)
        else:
            st.info("Add a valid olap_rollup_by_grade.csv to show this chart.")

    with right:
        st.subheader("Model Performance")
        if models is not None and "Model" in models.columns:
            metric_cols = [
                c for c in
                ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"]
                if c in models.columns
            ]
            if metric_cols:
                st.bar_chart(models.set_index("Model")[metric_cols])
            else:
                st.info("No model metric columns found.")
        else:
            st.info("Add model_comparison.csv to show model metrics.")

elif page == "Loan Risk":
    st.subheader("Loan Risk Analytics")
    if kpis is not None:
        st.dataframe(kpis, use_container_width=True)
    else:
        st.warning("KPI summary is not available.")

    if grades is not None:
        st.subheader("Grade-wise Portfolio")
        st.dataframe(grades, use_container_width=True)

elif page == "Model Performance":
    st.subheader("Model Comparison")
    if models is not None:
        st.dataframe(models, use_container_width=True)
        metric_cols = [
            c for c in
            ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"]
            if c in models.columns
        ]
        if "Model" in models.columns and metric_cols:
            st.bar_chart(models.set_index("Model")[metric_cols])
    else:
        st.warning("Model comparison report is not available.")

elif page == "OLAP Reports":
    st.subheader("OLAP Reports")
    report_names = [
        "olap_rollup_by_grade.csv",
        "olap_drilldown_by_month.csv",
        "olap_dice_results.csv",
        "portfolio_by_grade.csv",
        "portfolio_by_purpose.csv"
    ]

    for filename in report_names:
        report = load_csv(filename)
        with st.expander(filename):
            if report is None:
                st.info("This report has not been added yet.")
            else:
                st.dataframe(report, use_container_width=True)
                st.download_button(
                    f"Download {filename}",
                    data=(DATA_DIR / filename).read_bytes(),
                    file_name=filename,
                    mime="text/csv",
                    key=filename
                )

st.divider()
st.caption("BankIntel | DWM Project | Member 1 Dashboard")
