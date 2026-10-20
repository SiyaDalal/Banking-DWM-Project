

import streamlit as st
import pandas as pd
from pathlib import Path

# --------------------------------------------------
# PAGE CONFIGURATION
# --------------------------------------------------
st.set_page_config(
    page_title="Banking Intelligence | DWM Analytics",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --------------------------------------------------
# CUSTOM WEBSITE STYLING
# --------------------------------------------------
st.markdown("""
<style>
    .stApp {
        background-color: #F4F7FC;
    }

    [data-testid="stSidebar"] {
        background-color: #101C36;
    }

    [data-testid="stSidebar"] * {
        color: #FFFFFF;
    }

    .brand {
        font-size: 25px;
        font-weight: 800;
        color: #FFFFFF;
        padding: 10px 0 0 0;
    }

    .brand-subtitle {
        color: #B8C5DD;
        font-size: 12px;
        margin-bottom: 28px;
    }

    .main-title {
        color: #152747;
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 0;
    }

    .subtitle {
        color: #6B7890;
        font-size: 14px;
        margin-bottom: 24px;
    }

    .kpi-card {
        background: #FFFFFF;
        padding: 22px;
        border-radius: 14px;
        border: 1px solid #E5EAF3;
        min-height: 135px;
    }

    .kpi-label {
        color: #64748B;
        font-size: 14px;
        font-weight: 600;
    }

    .kpi-value {
        color: #172B4D;
        font-size: 28px;
        font-weight: 800;
        margin-top: 12px;
    }

    .kpi-note {
        color: #718096;
        font-size: 12px;
        margin-top: 7px;
    }

    .section-title {
        color: #172B4D;
        font-size: 20px;
        font-weight: 750;
        margin-top: 18px;
    }

    .panel {
        background: #FFFFFF;
        border: 1px solid #E5EAF3;
        border-radius: 14px;
        padding: 20px;
        min-height: 125px;
    }

    .panel-heading {
        color: #172B4D;
        font-size: 16px;
        font-weight: 700;
    }

    .panel-note {
        color: #718096;
        font-size: 13px;
        margin-top: 10px;
    }

    div[data-testid="stMetric"] {
        background: #FFFFFF;
        border: 1px solid #E5EAF3;
        padding: 18px;
        border-radius: 12px;
    }

    div[data-testid="stMetricLabel"] {
        color: #64748B;
    }

    .stButton button {
        border-radius: 9px;
    }

    footer {
        visibility: hidden;
    }
</style>
""", unsafe_allow_html=True)

# --------------------------------------------------
# SIDEBAR NAVIGATION
# --------------------------------------------------
with st.sidebar:
    st.markdown(
        '<div class="brand">🏦 BankIntel</div>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<div class="brand-subtitle">'
        'DATA WAREHOUSING & MINING'
        '</div>',
        unsafe_allow_html=True
    )

    st.markdown("---")
    st.caption("MAIN MENU")

    page = st.radio(
        "Navigate",
        [
            "Overview",
            "Loan Risk Analytics",
            "Model Performance",
            "Transaction Anomalies",
            "Customer Intelligence",
            "OLAP Reports",
            "Download Reports"
        ],
        label_visibility="collapsed"
    )

    st.markdown("---")
    st.markdown("**Project Status**")
    st.caption("Banking Intelligence System")
    st.caption("Dashboard UI: Initial version")

# --------------------------------------------------
# HEADER
# --------------------------------------------------
st.markdown(
    '<div class="main-title">Banking Intelligence Dashboard</div>',
    unsafe_allow_html=True
)

st.markdown(
    '<div class="subtitle">'
    'Explore loan portfolio risk, model performance, '
    'transaction anomalies and customer intelligence.'
    '</div>',
    unsafe_allow_html=True
)

# --------------------------------------------------
# OVERVIEW PAGE
# --------------------------------------------------
if page == "Overview":

    st.markdown("### Portfolio Overview")
    st.caption(
        "The figures below will populate from your actual CSV files "
        "in the next integration step."
    )

    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.metric("Total Loans", "Awaiting data")

    with c2:
        st.metric("Loan Amount", "Awaiting data")

    with c3:
        st.metric("Default Rate", "Awaiting data")

    with c4:
        st.metric("Models Evaluated", "2 available")

    st.markdown(
        '<div class="section-title">Analytics Workspace</div>',
        unsafe_allow_html=True
    )

    left, right = st.columns(2)

    with left:
        st.markdown(
            '<div class="panel">'
            '<div class="panel-heading">📊 Loan Portfolio by Grade</div>'
            '<div class="panel-note">'
            'Grade-wise loan counts and portfolio amounts will appear here '
            'after the CSV integration.'
            '</div></div>',
            unsafe_allow_html=True
        )

    with right:
        st.markdown(
            '<div class="panel">'
            '<div class="panel-heading">📈 Model Performance</div>'
            '<div class="panel-note">'
            'Compare accuracy, precision, recall, F1-score and ROC-AUC '
            'using the saved model comparison results.'
            '</div></div>',
            unsafe_allow_html=True
        )

    st.markdown(
        '<div class="section-title">Additional Intelligence Modules</div>',
        unsafe_allow_html=True
    )

    a, b, c = st.columns(3)

    with a:
        st.markdown(
            '<div class="panel">'
            '<div class="panel-heading">🔎 Transaction Anomalies</div>'
            '<div class="panel-note">'
            'Anomaly flags and evaluation results.'
            '</div></div>',
            unsafe_allow_html=True
        )

    with b:
        st.markdown(
            '<div class="panel">'
            '<div class="panel-heading">👥 Customer Intelligence</div>'
            '<div class="panel-note">'
            'Customer segments and behavior profiles.'
            '</div></div>',
            unsafe_allow_html=True
        )

    with c:
        st.markdown(
            '<div class="panel">'
            '<div class="panel-heading">🗂️ OLAP Reports</div>'
            '<div class="panel-note">'
            'Roll-up, drill-down, slice and dice analysis.'
            '</div></div>',
            unsafe_allow_html=True
        )

# --------------------------------------------------
# LOAN RISK ANALYTICS PAGE
# --------------------------------------------------
elif page == "Loan Risk Analytics":
    st.subheader("Loan Risk Analytics")
    st.write(
        "Analyze loan amount, grade, purpose, borrower attributes "
        "and default status."
    )

    st.info(
        "The fact and dimension CSV files will be connected in Step 3."
    )

    st.markdown("#### Planned analysis")
    st.write("- Total loan amount and loan count")
    st.write("- Default rate from validated default labels")
    st.write("- Loan distribution by grade and purpose")
    st.write("- Monthly portfolio trends")

# --------------------------------------------------
# MODEL PERFORMANCE PAGE
# --------------------------------------------------
elif page == "Model Performance":
    st.subheader("Model Performance")
    st.write(
        "Compare the saved classification metrics for Logistic Regression "
        "and Decision Tree."
    )

    st.info(
        "The model_comparison.csv file will populate the metrics and "
        "comparison chart in Step 3."
    )

    st.write("Metrics: Accuracy, Precision, Recall, F1-Score and ROC-AUC.")

# --------------------------------------------------
# TRANSACTION ANOMALIES PAGE
# --------------------------------------------------
elif page == "Transaction Anomalies":
    st.subheader("Transaction Anomaly Detection")

    st.write(
        "Review transactions flagged by the anomaly detection model "
        "and evaluate the model against available labels."
    )

    st.info(
        "This section requires Member 2's verified anomaly detection output."
    )

# --------------------------------------------------
# CUSTOMER INTELLIGENCE PAGE
# --------------------------------------------------
elif page == "Customer Intelligence":
    st.subheader("Customer Intelligence")

    st.write(
        "Explore customer segments, transaction behavior and segment profiles."
    )

    st.info(
        "This section requires the verified customer segmentation results."
    )

# --------------------------------------------------
# OLAP REPORTS PAGE
# --------------------------------------------------
elif page == "OLAP Reports":
    st.subheader("OLAP Reports")

    st.write(
        "Explore multidimensional analysis of the loan portfolio."
    )

    st.markdown("- Roll-up: summarize loans by grade.")
    st.markdown("- Drill-down: explore results by month.")
    st.markdown("- Slice and dice: inspect selected subsets of data.")

    st.info(
        "Your existing OLAP CSV outputs will be connected in Step 3."
    )

# --------------------------------------------------
# DOWNLOAD REPORTS PAGE
# --------------------------------------------------
elif page == "Download Reports":
    st.subheader("Download Reports")

    st.write(
        "Download available project CSV reports once the data files "
        "are connected."
    )

    st.info(
        "Report previews and download buttons will be implemented "
        "in Step 3."
    )

# --------------------------------------------------
# FOOTER
# --------------------------------------------------
st.markdown("---")
st.caption(
    "BankIntel | Banking Intelligence and Risk Analytics System "
    "| Data Warehousing and Data Mining Project"
)
