
import streamlit as st
import pandas as pd
from pathlib import Path

try:
    import plotly.express as px
    PLOTLY = True
except ImportError:
    PLOTLY = False

# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="BankIntel | Banking Intelligence",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded"
)

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"

def load_csv(filename):
    for path in [DATA / filename, BASE / filename]:
        if path.exists():
            try:
                return pd.read_csv(path)
            except Exception:
                return None
    return None

kpis = load_csv("dashboard_kpis.csv")
models = load_csv("model_comparison.csv")
grades = load_csv("olap_rollup_by_grade.csv")
months = load_csv("olap_drilldown_by_month.csv")
dice = load_csv("olap_dice_results.csv")
portfolio_grade = load_csv("portfolio_by_grade.csv")
portfolio_purpose = load_csv("portfolio_by_purpose.csv")

# ---------------- DESIGN ----------------
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;600;700;800&display=swap');

.stApp {
    background:
      radial-gradient(ellipse at 10% 5%,rgba(57,119,210,.15),transparent 38%),
      radial-gradient(ellipse at 90% 30%,rgba(30,190,175,.10),transparent 35%),
      #F4F7FC;
    background-size: 160% 160%;
    animation: backgroundFlow 18s ease-in-out infinite alternate;
    font-family:'DM Sans',sans-serif;
}
@keyframes backgroundFlow {
    from {background-position:0% 0%}
    to {background-position:100% 100%}
}
.block-container {padding-top:2rem;max-width:1500px}
[data-testid="stSidebar"] {
    background:linear-gradient(180deg,#101A30,#203B60);
}
[data-testid="stSidebar"] * {color:#EAF2FF}
[data-testid="stHeader"] {background:rgba(244,247,252,.8)}
.hero {
    background:linear-gradient(115deg,#101A30,#174D79,#087E8B);
    background-size:200% 200%;
    animation:heroFlow 12s ease infinite;
    border-radius:22px;padding:30px;color:white;
    margin-bottom:24px;
    box-shadow:0 15px 35px rgba(20,45,80,.15);
}
@keyframes heroFlow {
    0% {background-position:0% 50%}
    50% {background-position:100% 50%}
    100% {background-position:0% 50%}
}
.hero h1 {color:white;font-size:31px;font-weight:800;margin:0}
.hero p {color:#D8E8FC;margin-bottom:0}
.eyebrow {letter-spacing:2px;font-size:11px;font-weight:700;color:#A8D9FF}
.section-title {font-size:23px;font-weight:800;color:#172B4D;margin:18px 0 4px}
.section-sub {color:#718096;font-size:13px;margin-bottom:16px}
.kpi {
    background:white;border:1px solid #E2E9F3;
    border-radius:17px;padding:20px;min-height:120px;
    box-shadow:0 7px 24px rgba(20,40,70,.045);
}
.kpi-label {font-size:12px;font-weight:700;color:#728199}
.kpi-value {font-size:26px;font-weight:800;color:#183454;margin-top:12px}
.kpi-note {font-size:11px;color:#8290A5;margin-top:6px}
.result {
    padding:24px;border-radius:17px;background:white;
    border:1px solid #E2E9F3;
    box-shadow:0 7px 24px rgba(20,40,70,.06);
}
div[data-testid="stMetric"] {
    background:white;border:1px solid #E2E9F3;
    border-radius:14px;padding:15px;
}
.stButton button,.stDownloadButton button {
    border-radius:10px;font-weight:700;
}
footer {visibility:hidden}
</style>
""", unsafe_allow_html=True)

def heading(title, subtitle=""):
    st.markdown(
        f'<div class="section-title">{title}</div>'
        f'<div class="section-sub">{subtitle}</div>',
        unsafe_allow_html=True
    )

def card(label, value, note):
    st.markdown(
        f'<div class="kpi"><div class="kpi-label">{label}</div>'
        f'<div class="kpi-value">{value}</div>'
        f'<div class="kpi-note">{note}</div></div>',
        unsafe_allow_html=True
    )

def col_match(df, names):
    if df is None:
        return None
    lookup = {str(c).lower(): c for c in df.columns}
    for name in names:
        if name.lower() in lookup:
            return lookup[name.lower()]
    return None

def draw_bar(df, x, y, title):
    if df is None or df.empty or x not in df.columns or y not in df.columns:
        st.info(f"{title}: data or required columns are unavailable.")
        return
    if PLOTLY:
        fig = px.bar(
            df, x=x, y=y, title=title,
            template="plotly_white", color=x
        )
        fig.update_layout(
            showlegend=False,
            margin=dict(l=10,r=10,t=50,b=10),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.bar_chart(df.set_index(x)[y])

# ---------------- NAVIGATION ----------------
with st.sidebar:
    st.markdown(
        "<div style='font-size:27px;font-weight:800'>🏦 BankIntel</div>",
        unsafe_allow_html=True
    )
    st.caption("BANKING RISK INTELLIGENCE")
    st.divider()

    page = st.radio(
        "WORKSPACE",
        [
            "Executive Overview",
            "Loan Prediction Studio",
            "Loan Risk Explorer",
            "Model Performance",
            "OLAP Analytics",
            "Reports & Data"
        ]
    )

    st.divider()
    st.caption("DATA WAREHOUSING & DATA MINING")
    st.caption("Member 1 • Dashboard")

# ---------------- HERO ----------------
st.markdown("""
<div class="hero">
  <div class="eyebrow">DATA • INSIGHTS • DECISIONS</div>
  <h1>Banking Intelligence</h1>
  <p>Portfolio analytics, loan-risk exploration and model insights.</p>
</div>
""", unsafe_allow_html=True)

# ==================================================
# LOAN PREDICTION STUDIO — DEMONSTRATION ONLY
# ==================================================
if page == "Loan Prediction Studio":
    heading(
        "Loan Prediction Studio",
        "Enter applicant details to explore an illustrative risk assessment."
    )

    st.warning(
        "DEMO MODE: This is a rule-based illustration, not a trained ML model "
        "or a real probability of default. Do not use it for lending decisions."
    )

    with st.form("loan_form"):
        st.subheader("Applicant details")
        left, right = st.columns(2)

        with left:
            income = st.number_input(
                "Annual income", min_value=0,
                max_value=100_000_000, value=600_000, step=50_000
            )
            amount = st.number_input(
                "Requested loan amount", min_value=0,
                max_value=100_000_000, value=300_000, step=25_000
            )
            credit = st.slider("Credit score", 300, 850, 700)
            employment = st.slider("Employment length (years)", 0, 40, 5)

        with right:
            rate = st.number_input(
                "Interest rate (%)", min_value=0.0,
                max_value=50.0, value=10.0, step=0.25
            )
            dti = st.slider(
                "Debt-to-income ratio (%)", 0.0, 100.0, 25.0, 1.0
            )
            purpose = st.selectbox(
                "Loan purpose",
                [
                    "debt_consolidation", "credit_card",
                    "home_improvement", "major_purchase",
                    "small_business", "medical", "other"
                ]
            )
            term = st.selectbox("Loan term", ["36 months", "60 months"])

        submitted = st.form_submit_button(
            "✨ Assess Illustrative Risk",
            type="primary",
            use_container_width=True
        )

    if submitted:
        score = 0
        reasons = []

        if credit < 600:
            score += 30
            reasons.append("Credit score is in the lower range.")
        elif credit < 670:
            score += 15
            reasons.append("Credit score is below the stronger-score range.")

        ratio = amount / income if income > 0 else None

        if ratio is None:
            score += 25
            reasons.append("Income is zero, so the loan-to-income ratio cannot be computed.")
        elif ratio > 2:
            score += 25
            reasons.append("Loan amount is more than twice annual income.")
        elif ratio > 1:
            score += 12
            reasons.append("Loan amount exceeds annual income.")

        if dti > 40:
            score += 25
            reasons.append("Debt-to-income ratio is high.")
        elif dti > 30:
            score += 12
            reasons.append("Debt-to-income ratio is moderately high.")

        if rate > 18:
            score += 10
            reasons.append("Entered interest rate is high.")
        if employment < 1:
            score += 10
            reasons.append("Employment history is short.")
        if term == "60 months":
            score += 3
            reasons.append("A longer loan term was selected.")

        score = min(score, 100)

        if score < 25:
            label, color = "Lower illustrative risk", "#159B75"
        elif score < 55:
            label, color = "Moderate illustrative risk", "#D99216"
        else:
            label, color = "Higher illustrative risk", "#D84A58"

        st.divider()
        heading("Your assessment", "Based on the demonstration rules shown above.")

        a, b, c = st.columns(3)
        a.metric("Illustrative score", f"{score}/100")
        b.metric("Credit score entered", credit)
        c.metric("Loan / annual income", "N/A" if ratio is None else f"{ratio:.2f}×")

        st.markdown(
            f'<div class="result"><div style="color:#718096;font-size:12px">'
            f'DEMONSTRATION RESULT</div>'
            f'<div style="font-size:26px;font-weight:800;color:{color};'
            f'margin-top:8px">{label}</div>'
            f'<p style="color:#718096">Not a model prediction or probability of default.</p>'
            f'</div>',
            unsafe_allow_html=True
        )
        st.progress(score / 100, text="Illustrative risk score")

        heading("Factors considered")
        if reasons:
            for reason in reasons:
                st.write("•", reason)
        else:
            st.write("No elevated-risk conditions were triggered by these demo rules.")

        st.caption(
            f"Loan purpose selected: {purpose}. This field is collected for the "
            "interface demonstration and is not used in the demo score."
        )

# ==================================================
# EXECUTIVE OVERVIEW
# ==================================================
elif page == "Executive Overview":
    heading("Portfolio at a glance", "Saved project metrics, where available.")

    if kpis is not None and not kpis.empty:
        row = kpis.iloc[0]
        expected = ["total_loans", "total_loan_amount", "default_rate_pct", "default_count"]
        if all(c in kpis.columns for c in expected):
            a, b, c, d = st.columns(4)
            with a:
                card("TOTAL LOANS", f'{int(row["total_loans"]):,}', "Available fact rows")
            with b:
                card("LOAN AMOUNT", f'{float(row["total_loan_amount"]):,.0f}', "Sum of loan amounts")
            with c:
                card("DEFAULT RATE", f'{float(row["default_rate_pct"]):.2f}%', "Saved KPI summary")
            with d:
                card("DEFAULT COUNT", f'{int(row["default_count"]):,}', "Saved KPI summary")
        else:
            st.warning("dashboard_kpis.csv has different columns than expected.")
            st.dataframe(kpis)
    else:
        st.warning("dashboard_kpis.csv is missing. Other reports can still be explored.")

    a, b = st.columns(2)
    with a:
        heading("Loan distribution by grade")
        x = col_match(grades, ["grade"])
        y = col_match(grades, ["Total_Loans", "total_loans", "loan_count"])
        if x and y:
            draw_bar(grades, x, y, "Loans by grade")
        else:
            st.info("Required grade/count columns were not found.")

    with b:
        heading("Model comparison")
        if models is not None:
            st.dataframe(models, use_container_width=True)
            if PLOTLY and "Model" in models.columns:
                metrics = [c for c in ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"] if c in models.columns]
                if metrics:
                    metric = st.selectbox("Metric to compare", metrics)
                    fig = px.bar(models, x="Model", y=metric, color="Model", title=metric, template="plotly_white")
                    fig.update_layout(showlegend=False, yaxis_range=[0, 1])
                    st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("model_comparison.csv not found.")

# ==================================================
# LOAN RISK EXPLORER
# ==================================================
elif page == "Loan Risk Explorer":
    heading("Loan Risk Explorer", "Filter and inspect saved portfolio reports.")

    if grades is not None and not grades.empty:
        x = col_match(grades, ["grade"])
        y = col_match(grades, ["Total_Loans", "total_loans", "loan_count"])
        if x:
            values = grades[x].dropna().astype(str).unique().tolist()
            chosen = st.multiselect("Choose grades", values, default=values)
            filtered = grades[grades[x].astype(str).isin(chosen)]
            if y:
                draw_bar(filtered, x, y, "Filtered portfolio by grade")
            st.dataframe(filtered, use_container_width=True)
            st.download_button(
                "Download filtered report",
                filtered.to_csv(index=False),
                "filtered_grade_report.csv",
                "text/csv"
            )
        else:
            st.dataframe(grades, use_container_width=True)
    else:
        st.info("Grade report unavailable.")

    if portfolio_purpose is not None:
        heading("Portfolio by purpose")
        st.dataframe(portfolio_purpose, use_container_width=True)

# ==================================================
# MODEL PERFORMANCE
# ==================================================
elif page == "Model Performance":
    heading("Model Performance", "Compare the saved classification results.")

    if models is not None:
        st.dataframe(models, use_container_width=True)
        if PLOTLY and "Model" in models.columns:
            metrics = [c for c in ["Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC"] if c in models.columns]
            if metrics:
                metric = st.selectbox("Choose a metric", metrics)
                fig = px.bar(models, x="Model", y=metric, color="Model", title=metric, template="plotly_white")
                fig.update_layout(showlegend=False, yaxis_range=[0, 1])
                st.plotly_chart(fig, use_container_width=True)

        st.download_button(
            "Download model comparison",
            models.to_csv(index=False),
            "model_comparison.csv",
            "text/csv"
        )
    else:
        st.warning("model_comparison.csv not found.")

# ==================================================
# OLAP ANALYTICS
# ==================================================
elif page == "OLAP Analytics":
    heading("OLAP Analytics", "Explore the saved multidimensional outputs.")

    reports = {
        "Roll-up by grade": grades,
        "Drill-down by month": months,
        "Dice results": dice,
        "Portfolio by grade": portfolio_grade,
        "Portfolio by purpose": portfolio_purpose
    }
    chosen = st.selectbox("Select report", list(reports.keys()))
    df = reports[chosen]

    if df is not None:
        st.dataframe(df, use_container_width=True)
        numeric = df.select_dtypes(include="number").columns.tolist()
        categories = df.select_dtypes(exclude="number").columns.tolist()

        if PLOTLY and numeric and categories:
            x = st.selectbox("Category", categories)
            y = st.selectbox("Measure", numeric)
            draw_bar(df, x, y, chosen)

        st.download_button(
            "Download selected report",
            df.to_csv(index=False),
            f"{chosen.lower().replace(' ', '_')}.csv",
            "text/csv"
        )
    else:
        st.warning("This report is unavailable.")

# ==================================================
# REPORTS & DATA
# ==================================================
elif page == "Reports & Data":
    heading("Reports & Data", "Check and download available project outputs.")

    files = [
        "dashboard_kpis.csv", "model_comparison.csv",
        "olap_rollup_by_grade.csv", "olap_drilldown_by_month.csv",
        "olap_dice_results.csv", "portfolio_by_grade.csv",
        "portfolio_by_purpose.csv"
    ]

    rows = []
    for filename in files:
        exists = (DATA / filename).exists() or (BASE / filename).exists()
        rows.append({"File": filename, "Status": "Available" if exists else "Missing"})

    st.dataframe(pd.DataFrame(rows), use_container_width=True)

    for filename in files:
        df = load_csv(filename)
        if df is not None:
            with st.expander(f"Preview {filename}"):
                st.write(f"{len(df):,} rows • {len(df.columns)} columns")
                st.dataframe(df.head(100), use_container_width=True)
                st.download_button(
                    f"Download {filename}",
                    df.to_csv(index=False),
                    filename,
                    "text/csv",
                    key=f"download_{filename}"
                )

st.divider()
st.caption("BankIntel • Banking Intelligence & Risk Analytics • DWM Project")
