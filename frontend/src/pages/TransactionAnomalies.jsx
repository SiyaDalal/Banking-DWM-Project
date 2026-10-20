import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Database, Search, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../utils/DataContext.jsx'
import { formatNumber, number } from '../utils/analytics.js'
import { DataState } from '../components/DataState.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { ChartFrame } from '../components/ChartFrame.jsx'

const className = (value) => String(value) === '0' ? 'Legitimate label (Class 0)' : String(value) === '1' ? 'Fraud label (Class 1)' : 'Unlabelled'

export default function TransactionAnomalies() {
  const { datasets, loading } = useData()
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('All labels')
  const [minimumAmount, setMinimumAmount] = useState('')
  const summary = datasets.creditcardSummary?.rows ?? []
  const sourceRows = datasets.creditcardRecords?.rows ?? []
  const bins = datasets.creditcardTimeBins?.rows ?? []
  const flaggedRows = datasets.flaggedTransactions?.rows ?? []
  const [flaggedSearch, setFlaggedSearch] = useState('')
  const anomalyFlagCounts = useMemo(() => {
    const counts = new Map()
    flaggedRows.forEach((row) => {
      const label = String(row.Anomaly_Flag ?? row.Anomaly_Prediction ?? 'Unspecified')
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })
    return [...counts].map(([flag, count]) => ({ flag: flag === '1' || flag === '-1' ? 'Flagged' : flag === '0' || flag === '1' ? 'Not flagged' : `Output ${flag}`, count }))
  }, [flaggedRows])
  const flaggedCount = anomalyFlagCounts.filter((row) => row.flag === 'Flagged').reduce((count, row) => count + row.count, 0)
  const total = summary.find((row) => row.Class === 'All')
  const classZero = summary.find((row) => String(row.Class) === '0')
  const classOne = summary.find((row) => String(row.Class) === '1')
  const flaggedColumns = useMemo(() => {
    if (!flaggedRows.length) return []
    const headers = Object.keys(flaggedRows[0])
    const preferred = headers.filter((header) => /transaction|time|amount|class|anomal|fraud|flag|predict|label/i.test(header))
    return [...preferred, ...headers.filter((header) => !preferred.includes(header))].slice(0, 6)
  }, [flaggedRows])
  const visibleFlaggedRows = useMemo(() => {
    if (!flaggedSearch.trim()) return flaggedRows
    const query = flaggedSearch.trim().toLowerCase()
    return flaggedRows.filter((row) => flaggedColumns.some((column) => String(row[column] ?? '').toLowerCase().includes(query)))
  }, [flaggedRows, flaggedColumns, flaggedSearch])

  const filtered = useMemo(() => sourceRows.filter((row) => {
    if (classFilter !== 'All labels' && String(row.Class) !== classFilter) return false
    if (minimumAmount !== '' && number(row.Amount) < number(minimumAmount)) return false
    if (search.trim() && ![row.Source_Row, row.Time, row.Amount, row.Class_Label].some((value) => String(value ?? '').toLowerCase().includes(search.toLowerCase()))) return false
    return true
  }), [sourceRows, classFilter, minimumAmount, search])
  const chartStyle = { background: 'var(--panel-solid)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--text)' }

  function clearFilters() { setSearch(''); setClassFilter('All labels'); setMinimumAmount('') }

  return (
    <div className="page-stack">
      <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> TRANSACTION MONITORING</div><h2>Transaction anomaly detection</h2><p>Historical credit-card labels and the notebook’s anomaly workflow, kept distinct from model predictions.</p></div><span className="status-pill"><Activity size={14} /> HISTORICAL LABELS</span></div>
      <div className="disclaimer-banner info-banner"><Database size={18} /><div><strong>Source confirmed: creditcard.csv is used by Member 2’s Isolation Forest cell.</strong><span>The notebook maps Class 0 to legitimate and Class 1 to fraud, then fits IsolationForest after excluding Class and Time. {flaggedRows.length ? `Loaded ${formatNumber(flaggedRows.length)} rows from flagged_transactions.csv; ${formatNumber(flaggedCount)} are marked anomalous in its output. This filtered output is not the full source or an evaluation set.` : 'Waiting for flagged_transactions.csv from Member 2; source labels below are not model-generated flags.'}</span></div></div>
      <DataState loading={loading} error={datasets.creditcardSummary?.error} filename="creditcard_summary.csv (prepare from creditcard.csv)">
        <div className="kpi-grid">
          <KpiCard label="Transactions analyzed in source" value={total ? formatNumber(total.Transactions) : 'Data unavailable'} note="All rows in creditcard.csv summary" icon={Database} color="violet" />
          <KpiCard label="Class 1 fraud labels" value={classOne ? formatNumber(classOne.Transactions) : 'Data unavailable'} note="Dataset labels, not model flags" icon={ShieldAlert} color="orange" delay={0.05} />
          <KpiCard label="Class 0 legitimate labels" value={classZero ? formatNumber(classZero.Transactions) : 'Data unavailable'} note="Dataset labels, not model predictions" icon={Activity} color="green" delay={0.1} />
          <KpiCard label="Model-flagged records" value={flaggedRows.length ? formatNumber(flaggedCount) : 'Waiting for output'} note={flaggedRows.length ? `${formatNumber(flaggedRows.length)} rows in Member 2 output file` : 'Waiting for flagged_transactions.csv'} icon={AlertTriangle} color="cyan" delay={0.15} />
        </div>
        <div className="chart-grid">
          {flaggedRows.length > 0 && <ChartFrame title="Isolation Forest output flags" description={`Actual Anomaly_Flag values from ${formatNumber(flaggedRows.length)} exported notebook rows`}>
            <div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={anomalyFlagCounts}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="flag" tick={{ fill: '#aab1c4', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} formatter={(value) => [formatNumber(value), 'Output rows']} /><Bar dataKey="count" fill="#ff9b70" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </ChartFrame>}
          <ChartFrame title="Observed class labels by time bin" description="Counts from source Time values grouped into 3,600-value bins; not predicted anomalies">
            <DataState loading={loading} error={datasets.creditcardTimeBins?.error} filename="creditcard_time_bins.csv">
              <div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={bins}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="Time_Bin_3600_Units" tick={{ fill: '#aab1c4', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fill: '#8790a7', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} formatter={(value, name) => [formatNumber(value), name === 'Transactions' ? 'All records' : 'Class 1 labels']} /><Bar yAxisId="left" dataKey="Transactions" fill="#8b7cff" radius={[3, 3, 0, 0]} /><Line yAxisId="right" dataKey="Class_1_Label_Count" stroke="#ff9b70" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer></div>
            </DataState>
          </ChartFrame>
          <ChartFrame title="Labeled amount totals" description="Actual Amount totals grouped by Class label in the prepared summary">
            <DataState loading={loading} error={datasets.creditcardSummary?.error} filename="creditcard_summary.csv">
              {classZero || classOne ? <div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[classZero, classOne].filter(Boolean)}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="Class_Label" tick={{ fill: '#aab1c4', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} formatter={(value) => [number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }), 'Amount total']} /><Bar dataKey="Amount_Total" fill="#31c6e8" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="empty-inline">Class summary is unavailable.</div>}
            </DataState>
          </ChartFrame>
        </div>
      </DataState>
      <section className="panel table-panel"><div className="panel-heading"><div><h2>Source transaction sample</h2><p>First 500 actual CSV rows · filter this compact sample, not the full raw dataset.</p></div><span className="source-tag">creditcard_records_sample.csv</span></div>
        <div className="transaction-filters"><label className="explorer-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search row, time, amount or label…" /><span>{formatNumber(filtered.length)} / {formatNumber(sourceRows.length)}</span></label><select aria-label="Filter by known class label" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option>All labels</option><option value="0">Class 0 · Legitimate label</option><option value="1">Class 1 · Fraud label</option></select><input type="number" min="0" placeholder="Minimum amount" value={minimumAmount} onChange={(event) => setMinimumAmount(event.target.value)} aria-label="Minimum transaction amount" /><button className="button-secondary" onClick={clearFilters}>Clear filters</button></div>
        <DataState loading={loading} error={datasets.creditcardRecords?.error} filename="creditcard_records_sample.csv (prepare from creditcard.csv)">{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Source row</th><th>Time value</th><th>Amount</th><th>Known dataset label</th></tr></thead><tbody>{filtered.slice(0, 100).map((row) => <tr key={row.Source_Row}><td className="mono-cell">#{row.Source_Row}</td><td>{row.Time}</td><td>{number(row.Amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td><td><span className={`risk-cell ${String(row.Class) === '1' ? 'charged' : 'performing'}`}><i />{row.Class_Label}</span></td></tr>)}</tbody></table></div> : <div className="empty-state table-empty"><span className="empty-icon"><Search size={22} /></span><strong>No sample rows match</strong><span>Change the label, amount, or search filters.</span></div>}</DataState>
      </section>
      {flaggedRows.length > 0 && <section className="panel table-panel"><div className="panel-heading"><div><h2>Notebook-flagged transactions</h2><p>Actual anomaly output records exported by Member 2’s Isolation Forest notebook; shown with source column names.</p></div><span className="source-tag">flagged_transactions.csv</span></div>
        <div className="transaction-filters"><label className="explorer-search"><Search size={16} /><input value={flaggedSearch} onChange={(event) => setFlaggedSearch(event.target.value)} placeholder="Search flagged output…" /><span>{formatNumber(visibleFlaggedRows.length)} / {formatNumber(flaggedRows.length)}</span></label><button className="button-secondary" onClick={() => setFlaggedSearch('')}>Clear search</button></div>
        {visibleFlaggedRows.length ? <div className="table-wrap"><table><thead><tr>{flaggedColumns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{visibleFlaggedRows.slice(0, 100).map((row, index) => <tr key={index}>{flaggedColumns.map((column) => <td key={column}>{row[column] == null ? '—' : String(row[column])}</td>)}</tr>)}</tbody></table></div> : <div className="empty-inline">No notebook output rows match this search.</div>}
      </section>}
      {!flaggedRows.length && <div className="integration-note"><span className="integration-icon"><AlertTriangle size={18} /></span><div><strong>Waiting for flagged_transactions.csv from Member 2</strong><p>The notebook trains IsolationForest in-memory and exports flagged rows to Google Drive. Once the CSV is added under public/data/, this page will show its row count and searchable output table. No model artifact or transaction metrics file is currently available.</p></div><span className="api-chip">OUTPUT PENDING</span></div>}
    </div>
  )
}
