import argparse
import csv
import io
import math
import re
import shutil
import sqlite3
import tempfile
from collections import defaultdict
from pathlib import Path
from zipfile import ZipFile


def numeric(value):
    if value is None:
        return None
    try:
        parsed = float(str(value).replace(",", "").strip())
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def write_csv(path, fieldnames, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def prepare_creditcard(input_dir, output_dir, sample_limit):
    source = input_dir / "creditcard.csv"
    if not source.is_file():
        print(f"SKIP: {source} not found")
        return

    counts = defaultdict(lambda: {"count": 0, "amount": 0.0})
    time_bins = defaultdict(lambda: {"count": 0, "label_one": 0, "amount": 0.0})
    sample = []
    total_rows = 0
    with source.open("r", encoding="utf-8-sig", newline="") as data:
        reader = csv.DictReader(data)
        required = {"Time", "Amount", "Class"}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError(f"{source} must contain columns: {', '.join(sorted(required))}")
        for total_rows, row in enumerate(reader, start=1):
            class_value = str(row.get("Class", "")).strip()
            label = {"0": "Legitimate label (Class 0)", "1": "Fraud label (Class 1)"}.get(class_value, "Unlabelled")
            amount = numeric(row.get("Amount"))
            time_value = numeric(row.get("Time"))
            stats = counts[class_value]
            stats["count"] += 1
            stats["amount"] += amount or 0.0
            if time_value is not None:
                bucket = math.floor(time_value / 3600)
                period = time_bins[bucket]
                period["count"] += 1
                period["label_one"] += int(class_value == "1")
                period["amount"] += amount or 0.0
            if len(sample) < sample_limit:
                sample.append({
                    "Source_Row": total_rows,
                    "Time": row.get("Time", ""),
                    "Amount": row.get("Amount", ""),
                    "Class": class_value,
                    "Class_Label": label,
                })

    summary = [{
        "Class": value,
        "Class_Label": {"0": "Legitimate label (Class 0)", "1": "Fraud label (Class 1)"}.get(value, "Unlabelled"),
        "Transactions": values["count"],
        "Amount_Total": round(values["amount"], 6),
        "Amount_Average": round(values["amount"] / values["count"], 6) if values["count"] else 0,
    } for value, values in sorted(counts.items())]
    total_amount = sum(values["amount"] for values in counts.values())
    summary.append({
        "Class": "All",
        "Class_Label": "All source rows",
        "Transactions": total_rows,
        "Amount_Total": round(total_amount, 6),
        "Amount_Average": round(total_amount / total_rows, 6) if total_rows else 0,
    })
    write_csv(output_dir / "creditcard_summary.csv", ["Class", "Class_Label", "Transactions", "Amount_Total", "Amount_Average"], summary)
    write_csv(output_dir / "creditcard_time_bins.csv", ["Time_Bin_3600_Units", "Transactions", "Class_1_Label_Count", "Amount_Total"], [
        {"Time_Bin_3600_Units": key, "Transactions": value["count"], "Class_1_Label_Count": value["label_one"], "Amount_Total": round(value["amount"], 6)}
        for key, value in sorted(time_bins.items())
    ])
    write_csv(output_dir / "creditcard_records_sample.csv", ["Source_Row", "Time", "Amount", "Class", "Class_Label"], sample)
    print(f"Prepared credit-card summaries from {total_rows:,} rows in {source}")


def prepare_customer_activity(input_dir, output_dir, sample_limit):
    source = input_dir / "bank_transactions.csv"
    if not source.is_file():
        print(f"SKIP: {source} not found")
        return

    total_rows = 0
    valid_rows = 0
    total_amount = 0.0
    with tempfile.TemporaryDirectory(prefix="banking-dwm-") as temporary:
        database = sqlite3.connect(Path(temporary) / "customers.sqlite")
        database.execute("""
            CREATE TABLE customers (
                CustomerID TEXT PRIMARY KEY,
                Transaction_Count INTEGER NOT NULL,
                Transaction_Rows INTEGER NOT NULL,
                Total_Transaction_Amount REAL NOT NULL,
                Max_Transaction_Amount REAL NOT NULL,
                Account_Balance_Total REAL NOT NULL,
                Account_Balance_Count INTEGER NOT NULL
            )
        """)
        upsert = """
            INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(CustomerID) DO UPDATE SET
                Transaction_Count = Transaction_Count + excluded.Transaction_Count,
                Transaction_Rows = Transaction_Rows + excluded.Transaction_Rows,
                Total_Transaction_Amount = Total_Transaction_Amount + excluded.Total_Transaction_Amount,
                Max_Transaction_Amount = MAX(Max_Transaction_Amount, excluded.Max_Transaction_Amount),
                Account_Balance_Total = Account_Balance_Total + excluded.Account_Balance_Total,
                Account_Balance_Count = Account_Balance_Count + excluded.Account_Balance_Count
        """
        batch = []
        with source.open("r", encoding="utf-8-sig", newline="") as data:
            reader = csv.DictReader(data)
            required = {"CustomerID", "TransactionID", "TransactionAmount (INR)", "CustAccountBalance"}
            if not reader.fieldnames or not required.issubset(reader.fieldnames):
                raise ValueError(f"{source} must contain columns: {', '.join(sorted(required))}")
            for total_rows, row in enumerate(reader, start=1):
                customer_id = str(row.get("CustomerID", "")).strip()
                amount = numeric(row.get("TransactionAmount (INR)"))
                if not customer_id or amount is None:
                    continue
                balance = numeric(row.get("CustAccountBalance"))
                valid_rows += 1
                total_amount += amount
                batch.append((
                    customer_id,
                    int(bool(str(row.get("TransactionID", "")).strip())),
                    1,
                    amount,
                    amount,
                    balance or 0.0,
                    int(balance is not None),
                ))
                if len(batch) >= 5000:
                    database.executemany(upsert, batch)
                    database.commit()
                    batch.clear()
        if batch:
            database.executemany(upsert, batch)
            database.commit()

        customer_count = database.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
        balance_count = database.execute("SELECT SUM(Account_Balance_Count) FROM customers").fetchone()[0] or 0
        avg_balance_total = database.execute("SELECT SUM(Account_Balance_Total) FROM customers").fetchone()[0] or 0
        summary = [
            {"Metric": "Source rows", "Value": total_rows},
            {"Metric": "Valid customer transaction rows", "Value": valid_rows},
            {"Metric": "Unique customers", "Value": customer_count},
            {"Metric": "Total transaction amount (INR)", "Value": round(total_amount, 6)},
            {"Metric": "Average transaction amount (INR)", "Value": round(total_amount / valid_rows, 6) if valid_rows else 0},
            {"Metric": "Customer balance observations", "Value": balance_count},
            {"Metric": "Average account balance (INR)", "Value": round(avg_balance_total / balance_count, 6) if balance_count else ""},
        ]
        write_csv(output_dir / "customer_activity_summary.csv", ["Metric", "Value"], summary)

        sample_rows = database.execute("""
            SELECT CustomerID, Transaction_Count, Transaction_Rows,
                   Total_Transaction_Amount, Max_Transaction_Amount,
                   CASE WHEN Transaction_Rows > 0
                        THEN Total_Transaction_Amount / Transaction_Rows ELSE 0 END,
                   CASE WHEN Account_Balance_Count > 0
                        THEN Account_Balance_Total / Account_Balance_Count ELSE NULL END
            FROM customers
            ORDER BY Transaction_Count DESC, Total_Transaction_Amount DESC, CustomerID
            LIMIT ?
        """, (sample_limit,)).fetchall()
        sample = [{
            "CustomerID": row[0],
            "Transaction_Count": row[1],
            "Transaction_Rows": row[2],
            "Total_Transaction_Amount_INR": round(row[3], 6),
            "Max_Transaction_Amount_INR": round(row[4], 6),
            "Average_Transaction_Amount_INR": round(row[5], 6),
            "Average_Account_Balance_INR": "" if row[6] is None else round(row[6], 6),
        } for row in sample_rows]
        write_csv(output_dir / "customer_activity_sample.csv", list(sample[0]) if sample else [
            "CustomerID", "Transaction_Count", "Transaction_Rows", "Total_Transaction_Amount_INR",
            "Max_Transaction_Amount_INR", "Average_Transaction_Amount_INR", "Average_Account_Balance_INR",
        ], sample)

        bands = database.execute("""
            SELECT CASE
                WHEN Transaction_Count <= 1 THEN '1 transaction'
                WHEN Transaction_Count <= 5 THEN '2-5 transactions'
                WHEN Transaction_Count <= 10 THEN '6-10 transactions'
                ELSE '11+ transactions'
            END AS Activity_Band,
            COUNT(*) AS Customer_Count
            FROM customers
            GROUP BY Activity_Band
            ORDER BY MIN(Transaction_Count)
        """).fetchall()
        write_csv(output_dir / "customer_activity_bands.csv", ["Activity_Band", "Customer_Count"], [
            {"Activity_Band": row[0], "Customer_Count": row[1]} for row in bands
        ])
        database.close()
    print(f"Prepared customer activity from {total_rows:,} source rows; {customer_count:,} customer IDs in {source}")


def prepare_member2_outputs(input_dir, output_dir, sample_limit):
    flagged_source = input_dir / "flagged_transactions.csv"
    profile_source = input_dir / "customer_segment_profile.csv"
    parts_archive = input_dir / "customer_segments_parts.zip"
    missing = [path.name for path in (flagged_source, profile_source, parts_archive) if not path.is_file()]
    if missing:
        print(f"SKIP Member 2 outputs: missing {', '.join(missing)} in {input_dir}")
        return

    with profile_source.open("r", encoding="utf-8-sig", newline="") as profile_file:
        profile_reader = csv.DictReader(profile_file)
        profile_fields = profile_reader.fieldnames or []
        profiles = list(profile_reader)
    if not {"Cluster", "Customer_Count"}.issubset(profile_fields):
        raise ValueError(f"{profile_source} must contain Cluster and Customer_Count columns")
    expected_counts = {str(row["Cluster"]): int(numeric(row["Customer_Count"]) or 0) for row in profiles}

    with ZipFile(parts_archive) as archive:
        parts = [info for info in archive.infolist() if re.fullmatch(r"customer_segments_part_\d+\.csv", Path(info.filename).name)]
        parts.sort(key=lambda info: int(re.search(r"_(\d+)\.csv$", info.filename).group(1)))
        if not parts:
            raise ValueError(f"{parts_archive} contains no customer_segments_part_N.csv files")

        fieldnames = None
        cluster_counts = defaultdict(int)
        sample = []
        row_count = 0
        for info in parts:
            with archive.open(info) as raw:
                with io.TextIOWrapper(raw, encoding="utf-8-sig", newline="") as part_file:
                    reader = csv.DictReader(part_file)
                    if not reader.fieldnames or not {"Cluster", "Customer_Segment", "CustomerID"}.issubset(reader.fieldnames):
                        raise ValueError(f"{info.filename} must contain CustomerID, Cluster, and Customer_Segment columns")
                    if fieldnames is None:
                        fieldnames = reader.fieldnames
                    elif reader.fieldnames != fieldnames:
                        raise ValueError(f"CSV headers do not match in {info.filename}")
                    for row in reader:
                        row_count += 1
                        cluster_counts[str(row.get("Cluster", ""))] += 1
                        if len(sample) < sample_limit:
                            sample.append(row)

    if not fieldnames or not row_count:
        raise ValueError(f"{parts_archive} contains no customer assignment rows")
    if dict(cluster_counts) != expected_counts:
        raise ValueError(
            f"Customer assignment cluster counts do not match {profile_source.name}: "
            f"assignments={dict(cluster_counts)}, profiles={expected_counts}"
        )

    flagged_rows = 0
    with flagged_source.open("r", encoding="utf-8-sig", newline="") as flagged_file:
        reader = csv.DictReader(flagged_file)
        if not reader.fieldnames or not {"Anomaly_Prediction", "Anomaly_Flag"}.issubset(reader.fieldnames):
            raise ValueError(f"{flagged_source} must contain Anomaly_Prediction and Anomaly_Flag columns")
        for row in reader:
            flagged_rows += 1
    if not flagged_rows:
        raise ValueError(f"{flagged_source} contains no output rows")

    output_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(flagged_source, output_dir / flagged_source.name)
    shutil.copyfile(profile_source, output_dir / profile_source.name)
    write_csv(output_dir / "customer_segments_sample.csv", fieldnames, sample)
    write_csv(output_dir / "customer_segment_counts.csv", ["Cluster", "Customer_Segment", "Customer_Count"], [
        {"Cluster": row["Cluster"], "Customer_Segment": row.get("Customer_Segment", ""), "Customer_Count": cluster_counts[str(row["Cluster"])]}
        for row in profiles
    ])
    print(f"Prepared {flagged_rows:,} flagged output rows and {row_count:,} customer assignments from Member 2 outputs")
    print(f"Wrote a {len(sample):,}-row customer assignment sample and exact cluster counts to {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Prepare compact, source-derived frontend summaries.")
    parser.add_argument("--input-dir", type=Path, required=True, help="Directory containing creditcard.csv and/or bank_transactions.csv")
    parser.add_argument("--output-dir", type=Path, default=Path("public/data"), help="Frontend data output directory")
    parser.add_argument("--sample-limit", type=int, default=500, help="Maximum real source records / customer profiles in the compact table files")
    parser.add_argument("--member2-output-dir", type=Path, help="Directory containing Member 2's flagged_transactions.csv, customer_segment_profile.csv, and customer_segments_parts.zip")
    args = parser.parse_args()
    if args.sample_limit < 1:
        parser.error("--sample-limit must be at least 1")
    prepare_creditcard(args.input_dir, args.output_dir, args.sample_limit)
    prepare_customer_activity(args.input_dir, args.output_dir, args.sample_limit)
    if args.member2_output_dir:
        prepare_member2_outputs(args.member2_output_dir, args.output_dir, args.sample_limit)


if __name__ == "__main__":
    main()
