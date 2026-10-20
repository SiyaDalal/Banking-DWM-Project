# Banking DWM Frontend

A self-contained React + Vite analytics frontend for the Banking Data Warehouse Management college project. It provides project overview, Loan Risk Analytics, Transaction Anomaly Detection, Customer Intelligence, Data Warehouse & OLAP, Model Performance, Reports, and About pages. It does not replace the Python app, notebooks, source datasets, or other team files.

## Requirements

- Node.js 18 or newer
- npm

## Install and run locally

From the `Banking-DWM-Project` repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

To create and test the production build:

```powershell
npm run build
npm run preview
```

The production site is generated in `frontend/dist/`.

## Project data

The frontend loads CSV files from `frontend/public/data/` at runtime. Prepared files are included when available in the source repository. Supported filenames:

- `fact_loan.csv`
- `dim_loan.csv`
- `dim_borrower.csv`
- `dim_date.csv`
- `model_comparison.csv`
- `olap_rollup_by_grade.csv`
- `olap_drilldown_by_month.csv`
- `olap_dice_results.csv`
- `portfolio_by_grade.csv`
- `portfolio_by_purpose.csv`
- `creditcard_summary.csv`, `creditcard_time_bins.csv`, `creditcard_records_sample.csv`
- `customer_activity_summary.csv`, `customer_activity_bands.csv`, `customer_activity_sample.csv`
- `flagged_transactions.csv`, `customer_segment_profile.csv` (Member 2 notebook outputs)
- `customer_segment_counts.csv`, `customer_segments_sample.csv` (derived from all member segment archive parts)

The warehouse CSVs are copied from the prepared project outputs. The credit-card and bank-transaction source files are not copied into the frontend. Instead, the Python-standard-library preparation script writes compact summaries and bounded samples:

```powershell
python scripts/prepare_project_data.py --input-dir ..\DWM --output-dir public\data --sample-limit 500
```

`--input-dir` must point to the directory containing `creditcard.csv` and/or `bank_transactions.csv`; use the repository's actual data directory. The script reads the entire source files and produces data-derived summaries. Customer activity bands are simple transaction-count descriptions and are not K-Means clusters.

The UI reports missing and empty sources explicitly; it does not fabricate loan records or model results. The three Member 2 outputs have now been retrieved from the `member_2` branch. The two regular CSVs are consumed directly. Customer assignments were uploaded as a ZIP of 23 CSV parts; the preparation script validates every part against the supplied profile totals and creates an exact cluster-count file plus a bounded real-row sample, rather than shipping the 47 MB expanded assignment file to every frontend visitor. The frontend makes one initial request per supported CSV and does not run a retry loop. Do not put the full raw LendingClub, credit-card, or bank transaction datasets, or secrets, in `public/`.

The Model Performance page labels metrics loaded from `model_comparison.csv` as project-reported loan metrics. Member 2's notebook contains an Isolation Forest experiment on `creditcard.csv` and K-Means customer clustering on `bank_transactions.csv`; it does not persist either model or export transaction evaluation metrics. The anomaly page now displays the actual Isolation Forest output rows separately from the dataset's Class labels. The two transaction datasets and loan borrower keys are kept separate.

The Prediction Studio is intentionally a transparent illustrative rule-based demo and clearly labels its result **“Demo Estimate — Not a Validated Credit Decision.”** It is not a trained model or calibrated probability of default. A real service requires a persisted trained model, its fitted preprocessing pipeline, a verified feature contract, and an inference API.

### Integrating Member 2's output CSVs

The uploaded branch contains `flagged_transactions.csv`, `customer_segment_profile.csv`, and `customer_segments_parts.zip` (23 CSV chunks, 882,600 assignment rows). After retrieving these files from the branch, run the standard-library preparation function to validate, aggregate and sample the assignments:

```powershell
cd frontend
python scripts/prepare_project_data.py --input-dir ..\DWM --output-dir public\data --sample-limit 500 --member2-output-dir "C:\path\to\member-2-outputs"
```

The input folder must contain the three downloaded files. The script copies the flagged rows and profile CSV, checks each archive part's headers, compares assignment counts with the supplied profile, and writes `customer_segment_counts.csv` and `customer_segments_sample.csv`. The transaction page shows the model-output count, anomaly flags and searchable rows. Customer Intelligence charts exact counts from all 882,600 assignments and shows a searchable 500-row sample plus the original profile table. Report downloads are enabled for the source output and generated summaries that have parsed rows. No notebook is executed or Git branch merged by this frontend.

## Add to the existing GitHub repository

1. Keep the existing repository contents unchanged.
2. Copy this entire `frontend/` folder into the root of the existing `Banking-DWM-Project` repository.
3. From the repository root, review the new files and commit only the frontend folder:

```powershell
git status
git add frontend/
git commit -m "Add Banking DWM React frontend"
git push
```

The app is independent of the root Python project and has its own `package.json`, dependencies, and build output.

## Deploy to Vercel

1. Import the existing `Banking-DWM-Project` GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Use the Vite build command `npm run build`.
4. Use `dist` as the output directory.
5. Deploy. No environment variables are required.

The included Vercel configuration routes application paths to the React entry point so direct visits to dashboard pages work.

## CSV data contract

CSV headers are matched by name. Loan fact rows use `loan_dim_key` to join `dim_loan.csv`; blank cells remain empty values. The frontend uses prepared fact/dimension/OLAP extracts rather than loading the repository's large raw datasets. If a source cannot be fetched, its view shows the filename and error instead of a success-shaped empty result.

The inspected loan fact grain is one row per `loan_key`; its foreign keys map to unique `loan_dim_key`, `borrower_dim_key`, and `date_key` values in their dimensions. Grade roll-up totals were checked against aggregations from the fact table. `borrower_dim_key` is a warehouse surrogate for a deduplicated set of borrower attributes, not a stable person identifier; it is not joined to transaction `CustomerID`.

`creditcard.csv` is the anomaly notebook's input: the notebook labels `Class=0` as legitimate and `Class=1` as fraud, trains Isolation Forest without `Class` or `Time`, and writes flagged rows to Google Drive. The frontend preparation script summarizes observed source labels and time values only; it does not produce model predictions or evaluation metrics.
