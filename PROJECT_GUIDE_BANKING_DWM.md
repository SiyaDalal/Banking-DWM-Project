# Banking Data Warehouse Management (Banking-DWM-Project)

## 1. Project overview

This project demonstrates an end-to-end data warehouse and analytics workflow for lending risk, transaction anomalies, customer behavior, OLAP analysis, and model comparison. The work has two application paths:

1. **Data science and Python:** Colab/notebook preprocessing, warehouse and OLAP output generation, and model experiments. The repository's `member_1` branch has a Streamlit `app.py`; Member 2's `Project.ipynb` and latest output files are on `member_2`.
2. **Analytics website:** the self-contained React/Vite frontend in `frontend/`. It loads prepared CSVs from `frontend/public/data/` and runs without a database server or Python API.

The current local working directory is `C:\Users\SIYA\Documents\5TH SEM SUBJECTS\DWM\PROJECT`. It contains `DWM\` and `frontend\`, but it is **not a Git checkout** and does not contain root `app.py` or `requirements.txt`. The frontend can run here; the Streamlit app should be run from an actual repository clone.

## 2. End-to-end flow (A to Z)

```text
Raw CSV datasets
    ↓
Colab / Python notebook processing (extract, clean, transform, model, aggregate)
    ↓
Prepared CSV warehouse tables + model/OLAP outputs + notebook output CSVs
    ↓
Compact frontend preparation (summaries, counts, bounded samples; no model retraining)
    ↓
frontend/public/data/
    ↓
React DataContext fetch → CSV parser → keyed joins/filters → charts, KPIs, tables, exports
```

### Step 1 — Source data

The local `DWM\` folder contains raw or source files: `lendingclub.csv` (about 1.68 GB), `creditcard.csv` (about 151 MB), `bank_transactions.csv` (about 67.6 MB), and `Groceries_dataset.csv`, together with prepared loan warehouse, OLAP, and metrics CSVs. Raw datasets are not served to the browser.

The three banking sources are analytically distinct:

- `lendingclub.csv` feeds loan risk and the loan warehouse.
- `creditcard.csv` feeds the credit-card fraud/anomaly experiment.
- `bank_transactions.csv` feeds customer activity and K-Means segmentation.

There is no verified common customer key connecting these sources. In particular, `borrower_dim_key` is a warehouse surrogate for a deduplicated borrower-attribute row; it is not a stable identity that can be joined to bank `CustomerID`.

### Step 2 — Colab and notebook processing

The notebook workflow was authored for Google Colab. Inspected paths include `/content/lendingclub.csv` and `/content/drive/MyDrive/DWM/...`, plus Colab/Drive-specific imports. The notebook performs data preparation, loan model experiments, star-schema/OLAP output creation, an Isolation Forest experiment, and K-Means customer segmentation.

Member 2's actual `Project.ipynb` on the remote `member_2` branch contains loan model/warehouse work, Isolation Forest using `creditcard.csv`, and K-Means using customer aggregates from `bank_transactions.csv`. The notebook's model-fitting code runs in memory; it does not provide a complete deployable model service with saved estimators and preprocessing artifacts. The notebook was inspected but not executed as part of integrating its already-uploaded outputs.

### Step 3 — Warehouse and analytical outputs

Prepared data is persisted as CSV files, rather than loaded into a persistent database server. The project has a fact table, dimensions, and precomputed model/OLAP result CSVs. The React website treats these prepared CSVs as its analytical data source.

### Step 4 — Compact preparation and frontend data load

`frontend/scripts/prepare_project_data.py` uses Python's standard library to derive compact credit-card summaries/time bins/sample rows and bank-customer activity summaries/bands/sample profiles. It can also validate Member 2's archive of customer assignments, compare cluster totals against the profile file, and generate exact cluster counts plus a bounded sample. It does not train or score models.

At page startup, `frontend/src/utils/DataContext.jsx` fetches each configured CSV once from `public/data/`. `frontend/src/utils/csv.js` parses quoted CSV fields, blanks, and numeric values; HTML responses are rejected instead of being mistaken for CSV. There is no background retry loop. Missing/invalid files are shown as data-not-available states.

`frontend/src/utils/analytics.js` provides numeric formatting and key-based fact/dimension joins. Page components use React state for filters, sorting, navigation, theme, and notifications. Recharts draws charts, Framer Motion animates route/UI transitions, and Lucide React supplies icons.

### Step 5 — Dashboard and reports

The dashboard displays only loaded source-backed data. Filters and charts work over loaded prepared tables. Report exports create a CSV Blob in the browser and initiate a download for the selected loaded dataset; unavailable/empty datasets cannot be exported successfully.

## 3. Project modules and current functionality

### 3.1 Overview

Shows project-wide loan, transaction-label, customer and model summaries when their source CSVs are available. Module cards navigate to their dedicated pages.

### 3.2 Loan Risk Analytics

Uses `fact_loan.csv` joined with loan/borrower/date dimensions. It provides portfolio KPIs, risk/grade/purpose analysis, filters/search/sorting in Loan Explorer, and a Prediction Studio form. The demo form is explicitly labeled:

> **Demo Estimate — Not a Validated Credit Decision**

This is not a trained model, calibrated default probability, credit score, or lending decision.

### 3.3 Transaction Anomaly Detection

Member 2's notebook uses `creditcard.csv`, with `Class=0` interpreted as legitimate and `Class=1` as fraud. The Isolation Forest feature matrix excludes `Class` and `Time`. `flagged_transactions.csv` contains 10,088 rows with `Anomaly_Prediction=-1` and `Anomaly_Flag=1`; the page separates these model output flags from the historical `Class` labels and allows search/filtering.

The 10,088 is the number of exported flagged output rows, not the full transaction source count. The notebook does not export an evaluation metrics CSV or persist a reusable trained model. No anomaly Accuracy/Precision/Recall/F1/ROC-AUC is claimed.

### 3.4 Customer Intelligence

Member 2 applies four-cluster K-Means to transformed/scaled customer aggregates from `bank_transactions.csv`. The uploaded assignment data is a ZIP of 23 CSV parts, not one giant CSV. It contains **882,600** customer assignments.

The prep script validates each part's header, aggregates every row by Cluster, and verifies the totals against `customer_segment_profile.csv`. It emits:

- `customer_segment_counts.csv`: exact totals for all assignments.
- `customer_segments_sample.csv`: 500 actual assignment rows for interactive search/display.
- `customer_segment_profile.csv`: four supplied cluster profile rows.

The dashboard charts the exact full assignment counts and shows the bounded sample and profiles. Cluster counts do not get inferred from the 500-row sample.

### 3.5 Data Warehouse & OLAP

Shows the loan fact/dimension relationships and the prepared roll-up, month drill-down, dice, and portfolio analyses. Its CSV outputs are checked against the fact table as described below.

### 3.6 Model Performance

Displays the two project-reported loan rows from `model_comparison.csv`; values are not placeholders. The transaction anomaly experiment is kept separate because it does not have a saved metrics output.

| Loan model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 0.669444 | 0.342264 | 0.673848 | 0.453954 | 0.737472 |
| Decision Tree | 0.645433 | 0.313029 | 0.618499 | 0.415678 | 0.656482 |

These values are copied from the source CSV. The training split, class balance, preprocessing, and evaluation design affect interpretation; the metrics were not independently regenerated in this workspace. Notebook code also experiments with Random Forest, but the supplied comparison CSV displayed by the frontend contains two model rows.

### 3.7 Reports and About

Reports exports available prepared datasets as browser-generated CSV files. About summarizes the project architecture, data boundaries, and possible future work.

## 4. Warehouse schema and keys

### Fact table: `fact_loan.csv`

**Grain:** one row per loan in the inspected prepared extract. It contains 66,006 rows, with unique `loan_key`.

| Column | Meaning |
|---|---|
| `loan_key` | Unique loan fact identifier |
| `loan_dim_key` | Foreign key to `dim_loan.loan_dim_key` |
| `borrower_dim_key` | Foreign key to `dim_borrower.borrower_dim_key` |
| `date_key` | Foreign key to `dim_date.date_key` |
| `loan_amnt` | Loan amount measure |
| `funded_amnt` | Funded amount measure |
| `int_rate` | Interest rate measure |
| `installment` | Installment measure |
| `default_flag` | Binary charged-off/default indicator used by current analytics |

### `dim_loan.csv`

1,663 rows; primary key `loan_dim_key`. Descriptive attributes: `term`, `grade`, `sub_grade`, `purpose`, `home_ownership`, `application_type`.

### `dim_borrower.csv`

66,003 rows; primary key `borrower_dim_key`. Attributes: `annual_inc`, `emp_length`, `verification_status`, `addr_state`, `dti`, `fico_range_low`, `fico_range_high`.

### `dim_date.csv`

Two rows in the inspected extract; primary key `date_key`. Attributes: `issue_date`, `year`, and `month`. The key is a year/month-like key (for example, 201512).

### Relationships and join validation

```text
fact_loan.loan_dim_key      → dim_loan.loan_dim_key
fact_loan.borrower_dim_key  → dim_borrower.borrower_dim_key
fact_loan.date_key          → dim_date.date_key
```

The inspected facts have unique `loan_key`; all three dimension keys are unique; every fact foreign key matched. Because each dimension key is unique, joining fact-to-dimension at the defined grain does not multiply loan rows. Loan counts and rates should be aggregated from fact rows, not by counting dimension rows.

## 5. Data Warehouse Management concepts used

### ETL / ELT

- **Extract:** read lending, credit-card, and bank transaction files.
- **Transform:** clean/prepare fields; derive `default_flag`; form dimensions and facts; train/evaluate notebook models; aggregate monthly, grade, purpose, and customer outputs.
- **Load:** save prepared warehouse and analytical outputs to CSV. This is a file-based load, not a database-server load.

### Dimensional modeling

- **Fact:** numeric measures at a declared grain, one loan per fact row.
- **Dimensions:** descriptive context for slicing facts by loan, borrower attributes, or date.
- **Surrogate keys:** integer/key fields link dimensions without relying on display text.
- **Star schema:** fact at the center with descriptive dimensions surrounding it; enables portfolio measures by grade/purpose/month.

### OLAP

- **Roll-up:** summarize loan facts by grade. Current fields include loan count, total/average loan amount, charged-off count, and rate.
- **Drill-down:** inspect year/month groups. Current extract has Nov and Dec 2015.
- **Dice:** select a multidimensional subset using dimensions such as grade, purpose, and term; the prepared dice file contains fact keys/measures plus grade and purpose.
- **Slice/filter:** restrict charts and tables to selected grades, purpose, term, year, risk, amount, or interest rate.
- **Portfolio analysis:** compare grade and purpose groupings using precomputed counts, amounts, and rates.

Correct aggregation rules:

```text
charged_off_rate (%) = 100 × SUM(default_flag) / COUNT(fact loan rows)
average_loan_amount  = SUM(loan_amnt) / COUNT(fact loan rows)
```

Do not take an unweighted average of group rates to calculate a portfolio rate; group rates must be weighted by group loan counts or calculated from fact rows directly.

### Data quality, lineage, and separation

- Fact grain and PK/FK validity are checked.
- Roll-up and drill-down measures are compared against recalculations from the fact table.
- Missing/invalid sources are reported rather than replaced with invented records or metrics.
- Historical `Class`, model `Anomaly_Flag`, and loan `default_flag` are different fields with different meanings.
- Credit-card, Indian bank transaction, and loan borrower data are not joined without a verified shared ID.

## 6. Actual CSV inventory and locations

### Source/prepared data in `DWM\`

Raw/source: `lendingclub.csv`, `creditcard.csv`, `bank_transactions.csv`, `Groceries_dataset.csv`.

Prepared loan warehouse: `fact_loan.csv`, `dim_loan.csv`, `dim_borrower.csv`, `dim_date.csv`.

Prepared results: `model_comparison.csv`, `olap_rollup_by_grade.csv`, `olap_drilldown_by_month.csv`, `olap_dice_results.csv`, `portfolio_by_grade.csv`, `portfolio_by_purpose.csv`.

### Frontend data in `frontend\public\data\`

- Warehouse and model/OLAP files listed above.
- Compact source summaries: `creditcard_summary.csv`, `creditcard_time_bins.csv`, `creditcard_records_sample.csv`, `customer_activity_summary.csv`, `customer_activity_bands.csv`, `customer_activity_sample.csv`.
- Member 2's `flagged_transactions.csv` and `customer_segment_profile.csv`.
- Derived `customer_segment_counts.csv` and bounded `customer_segments_sample.csv`.

The browser does not load the 1.68 GB LendingClub source, the raw credit-card/bank transaction files, or the full 882,600-row assignment data.

## 7. React frontend stack and structure

### Stack

- React 18, JavaScript, JSX.
- Vite 6 for local development/build.
- React Router for pages.
- Recharts for charts.
- Framer Motion for transitions and animations.
- Lucide React for icons.
- HTML/CSS for responsive design, themes, and layout.
- Fetch API for local static CSV data.

### Layout

```text
frontend/
  package.json, package-lock.json, index.html, vite.config.js, vercel.json
  README.md
  scripts/prepare_project_data.py
  public/data/                  prepared frontend CSVs
  src/
    main.jsx                    entry point/provider setup
    App.jsx                     routing/theme/toasts/transitions
    index.css                   styles and responsive layout
    components/                 sidebar, topbar, KPI/chart/data states
    pages/                      overview, loans, transactions, customers,
                                warehouse/OLAP, models, reports, about
    utils/DataContext.jsx       supported CSV loading
    utils/csv.js                CSV parser
    utils/analytics.js          joins and formatters
```

Eight main pages are Overview, Loan Risk Analytics, Transaction Anomaly Detection, Customer Intelligence, Data Warehouse & OLAP, Model Performance, Reports, and About Project. Loan Explorer and Prediction Studio are nested loan pages.

## 8. How to run everything

### 8.1 React frontend (available in the current workspace)

PowerShell:

```powershell
cd "C:\Users\SIYA\Documents\5TH SEM SUBJECTS\DWM\PROJECT\frontend"
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Production build and local preview:

```powershell
npm run build
npm run preview
```

Build output is `frontend\dist\`.

### 8.2 Regenerate compact transaction/customer summaries

From `frontend\`:

```powershell
python scripts\prepare_project_data.py --input-dir ..\DWM --output-dir public\data --sample-limit 500
```

It reads source `creditcard.csv` and/or `bank_transactions.csv` if present. This standard-library script may take time because it processes large CSVs and uses a temporary SQLite database for customer aggregation.

### 8.3 Reprocess Member 2 outputs

Put `flagged_transactions.csv`, `customer_segment_profile.csv`, and `customer_segments_parts.zip` into a folder, then run:

```powershell
python scripts\prepare_project_data.py --input-dir ..\DWM --output-dir public\data --sample-limit 500 --member2-output-dir "C:\path\to\member-2-outputs"
```

The script checks archive part headers and verifies per-cluster assignment totals against the supplied profile before writing output files. It fails explicitly if required files or expected columns are missing or totals disagree.

### 8.4 Existing Streamlit app (requires a real Git clone)

Root `app.py` and `requirements.txt` are absent from the current local workspace. Earlier inspection located them in the remote `member_1` branch. In a clone containing those files, from the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
streamlit run app.py
```

If activation is blocked:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m streamlit run app.py
```

The Colab notebook is a separate workflow and may need dataset/Drive path edits and notebook dependencies when run outside Colab. The React site does not replace the Streamlit application.

## 9. Testing and verification status

Verified in this workspace:

- React production build: `npm run build` passed after integration.
- All eight main routes loaded in browser checks.
- Flagged output count/table/chart displayed; customer cluster counts and profile matched all archive assignments.
- Segment sample search, loan search, prediction required-field validation, OLAP tabs, theme toggle, and mobile width were tested.
- Report handler created a Blob download link with the expected filename and showed a success toast.
- Fact/dimension keys: 66,006 fact rows, unique loan key and dimension keys, zero unmatched FKs.
- Grade roll-up and month drill-down matched aggregations recalculated from the fact CSV.
- Preparation script syntax and repeat generation to a separate temporary directory passed.

Not verified/unavailable:

- No configured automated frontend unit-test suite (runner reported no tests found).
- This local workspace is not a Git checkout, so local branch/remotes/diff are unavailable.
- Root Streamlit app and requirements are not present locally, so Python app startup was not tested.
- The Colab notebook was not re-executed during this integration.
- No saved serving model or inference API is available for real loan predictions.
- No anomaly-model metrics output is supplied; the flagged file is not a metrics report.

## 10. Deployment

### Vercel frontend

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

The current static frontend needs no API environment variable. Keep a future Python model API and the Streamlit deployment separate from the React/Vercel site.

### Backend/API

There is no separate FastAPI backend in this frontend implementation. Prepared CSVs are sufficient for the current charts and tables. Genuine model inference would need a saved estimator, fitted preprocessing, verified feature order/contract, input validation, inference API, deployment configuration, and frontend API URL configuration. None is claimed as implemented.

## 11. Collaboration and Git safety

The identified remote is `https://github.com/SiyaDalal/Banking-DWM-Project.git`; branches include `member_1` and `member_2`. The uploaded outputs were retrieved selectively from `member_2`; the branch was not merged. No commit, push, merge, or deployment was performed.

This current folder is not a Git repository. In the real repository clone, first inspect its state:

```powershell
cd "C:\path\to\your\Banking-DWM-Project"
git status --short --branch
git remote -v
git branch --show-current
```

Review exact intended files before staging. Do not stage unrelated team work with `git add .`. Git operations should be performed only in the actual clone and only after reviewing its status/diff.

## 12. Short summary

The project applies DWM concepts by transforming source CSVs into a loan fact/dimension warehouse, computing OLAP outputs at grade/month/purpose grains, and presenting validated prepared results in a responsive React analytics application. Notebook experiments cover loan classification, credit-card anomaly detection, and bank-transaction customer segmentation. CSVs are the current handoff/storage interface between processing and the website; there is no live database/API in the frontend. Model outputs and source labels are kept separate, and the prediction form remains a clearly disclosed demo until a verifiable trained pipeline/API exists.
