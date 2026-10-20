import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Database, Search, UsersRound } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../utils/DataContext.jsx'
import { formatINR, formatNumber, joinByKey, number } from '../utils/analytics.js'
import { DataState } from '../components/DataState.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { ChartFrame } from '../components/ChartFrame.jsx'

function getMetric(rows, name) {
  const row = rows.find((item) => item.Metric === name)
  return row?.Value
}

function profileGroups(facts, borrowers, key, display) {
  const rows = joinByKey(facts, borrowers, 'borrower_dim_key')
  const groups = new Map()
  rows.forEach((row) => {
    const name = row[key] || 'Not recorded'
    const value = groups.get(name) || { name, loans: 0, defaults: 0 }
    value.loans += 1
    value.defaults += number(row.default_flag) === 1 ? 1 : 0
    groups.set(name, value)
  })
  return [...groups.values()].map((row) => ({ ...row, display: display ? display(row.name) : row.name, defaultRate: row.loans ? (100 * row.defaults) / row.loans : 0 })).sort((a, b) => b.loans - a.loans)
}

const palette = ['#8b7cff', '#31c6e8', '#5ee0bc', '#ffb86b', '#f2779e', '#67a3ff']

export default function CustomerIntelligence() {
  const { datasets, loading } = useData()
  const [search, setSearch] = useState('')
  const [segmentSearch, setSegmentSearch] = useState('')
  const [minimumActivity, setMinimumActivity] = useState('All')
  const [sort, setSort] = useState({ key: 'Transaction_Count', direction: 'desc' })
  const activity = datasets.customerActivity?.rows ?? []
  const activitySummary = datasets.customerSummary?.rows ?? []
  const bands = datasets.customerBands?.rows ?? []
  const segmentRows = datasets.customerSegments?.rows ?? []
  const segmentCounts = datasets.customerSegmentCounts?.rows ?? []
  const segmentProfiles = datasets.customerSegmentProfile?.rows ?? []
  const facts = datasets.fact?.rows ?? []
  const borrowers = datasets.borrowers?.rows ?? []
  const segmentColumns = segmentRows.length ? Object.keys(segmentRows[0]) : []
  const profileColumns = segmentProfiles.length ? Object.keys(segmentProfiles[0]) : []
  const segmentGroups = useMemo(() => segmentCounts.map((row) => ({
    cluster: String(row.Cluster ?? 'Not recorded'),
    segment: String(row.Customer_Segment ?? row.Cluster ?? 'Not recorded'),
    customers: number(row.Customer_Count),
  })), [segmentCounts])
  const segmentTotal = segmentGroups.reduce((total, row) => total + row.customers, 0)
  const visibleSegmentRows = useMemo(() => {
    if (!segmentSearch.trim()) return segmentRows
    const query = segmentSearch.trim().toLowerCase()
    return segmentRows.filter((row) => segmentColumns.some((column) => String(row[column] ?? '').toLowerCase().includes(query)))
  }, [segmentRows, segmentColumns, segmentSearch])

  const filtered = useMemo(() => activity.filter((row) => {
    if (search.trim() && !String(row.CustomerID ?? '').toLowerCase().includes(search.toLowerCase())) return false
    const count = number(row.Transaction_Count)
    if (minimumActivity === '2+' && count < 2) return false
    if (minimumActivity === '5+' && count < 5) return false
    if (minimumActivity === '10+' && count < 10) return false
    return true
  }).sort((a, b) => {
    const comparison = number(a[sort.key]) - number(b[sort.key])
    return comparison * (sort.direction === 'asc' ? 1 : -1)
  }), [activity, search, minimumActivity, sort])
  const verification = useMemo(() => profileGroups(facts, borrowers, 'verification_status'), [facts, borrowers])
  const employment = useMemo(() => profileGroups(facts, borrowers, 'emp_length'), [facts, borrowers])
  const incomeBands = useMemo(() => {
    const rows = joinByKey(facts, borrowers, 'borrower_dim_key')
    const grouped = new Map()
    rows.forEach((row) => {
      const income = number(row.annual_inc)
      if (!income) return
      const name = income < 25000 ? 'Under $25k' : income < 50000 ? '$25k–$49k' : income < 100000 ? '$50k–$99k' : '$100k+'
      const group = grouped.get(name) || { band: name, loans: 0, defaults: 0, amount: 0 }
      group.loans += 1
      group.defaults += number(row.default_flag) === 1 ? 1 : 0
      group.amount += income
      grouped.set(name, group)
    })
    return [...grouped.values()].map((row) => ({ ...row, defaultRate: row.loans ? (100 * row.defaults) / row.loans : 0 }))
  }, [facts, borrowers])

  function toggleSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }))
  }
  const sortButton = (key, title) => <button className="sort-button" onClick={() => toggleSort(key)}>{title}{sort.key === key ? sort.direction === 'desc' ? <ArrowDownWideNarrow size={13} /> : <ArrowUpWideNarrow size={13} /> : null}</button>
  const chartStyle = { background: 'var(--panel-solid)', border: '1px solid var(--border-strong)', borderRadius: 11, color: 'var(--text)' }

  return (
    <div className="page-stack">
      <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> CUSTOMER & BORROWER INSIGHTS</div><h2>Customer intelligence</h2><p>Behavioral profiles from bank transactions, with loan borrower analysis kept separate.</p></div><span className="status-pill"><UsersRound size={14} /> TWO SOURCE SYSTEMS</span></div>
      <div className="disclaimer-banner info-banner"><UsersRound size={18} /><div><strong>No cross-dataset customer join is performed.</strong><span>bank_transactions.csv CustomerID values do not match the loan warehouse borrower_dim_key. The loan borrower dimension is a deduplicated set of attributes, not a verified customer identifier.</span></div></div>
      <DataState loading={loading} error={datasets.customerSummary?.error} filename="customer_activity_summary.csv (prepare from bank_transactions.csv)">
        <div className="kpi-grid customer-kpis">
          <KpiCard label="Customer IDs" value={getMetric(activitySummary, 'Unique customers') ? formatNumber(getMetric(activitySummary, 'Unique customers')) : 'Data unavailable'} note="Unique non-empty CustomerID values" icon={UsersRound} color="violet" />
          <KpiCard label="Valid transaction rows" value={getMetric(activitySummary, 'Valid customer transaction rows') ? formatNumber(getMetric(activitySummary, 'Valid customer transaction rows')) : 'Data unavailable'} note="Rows with CustomerID and numeric amount" icon={Database} color="cyan" delay={0.05} />
          <KpiCard label="Total transaction amount" value={getMetric(activitySummary, 'Total transaction amount (INR)') ? formatINR(getMetric(activitySummary, 'Total transaction amount (INR)')) : 'Data unavailable'} note="INR total from bank_transactions.csv" icon={UsersRound} color="green" delay={0.1} />
          <KpiCard label="K-Means segments" value={segmentGroups.length ? formatNumber(segmentGroups.length) : 'Waiting for output'} note={segmentGroups.length ? `${formatNumber(segmentTotal)} assignments counted from all archive parts` : 'Waiting for Member 2 segment outputs'} icon={ArrowDownWideNarrow} color="orange" delay={0.15} />
        </div>
        <div className="chart-grid">
          <ChartFrame title="Observed customer activity bands" description="Descriptive transaction-count groups, not the notebook's K-Means output">
            <DataState loading={loading} error={datasets.customerBands?.error} filename="customer_activity_bands.csv"><div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={bands}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="Activity_Band" tick={{ fill: '#aab1c4', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} formatter={(value) => [formatNumber(value), 'Customers']} /><Bar dataKey="Customer_Count" radius={[5, 5, 0, 0]}>{bands.map((row, index) => <Cell key={row.Activity_Band} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer></div></DataState>
          </ChartFrame>
          <ChartFrame title="Loan records by verification" description="Fact-to-borrower dimension join; rates are loan-level">
            <DataState loading={loading} error={datasets.fact?.error || datasets.borrowers?.error} filename="fact_loan.csv and dim_borrower.csv"><div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={verification} margin={{ left: 0, right: 9 }}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="display" tick={{ fill: '#aab1c4', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#8790a7', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} /><Tooltip contentStyle={chartStyle} formatter={(value, name) => [name === 'defaultRate' ? `${number(value).toFixed(2)}%` : formatNumber(value), name === 'loans' ? 'Loan records' : 'Charged-off rate']} /><Bar yAxisId="left" dataKey="loans" fill="#8b7cff" radius={[5, 5, 0, 0]} /><Line yAxisId="right" dataKey="defaultRate" stroke="#ffad7b" strokeWidth={2} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div></DataState>
          </ChartFrame>
          <ChartFrame title="Loan records by employment length" description="Weighted by fact rows, not dimension row count">
            <DataState loading={loading} error={datasets.fact?.error || datasets.borrowers?.error} filename="fact_loan.csv and dim_borrower.csv"><div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={employment.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 12 }}><CartesianGrid stroke="#ffffff0b" horizontal={false} /><XAxis type="number" tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="display" width={74} tick={{ fill: '#aab1c4', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} formatter={(value) => [formatNumber(value), 'Loan records']} /><Bar dataKey="loans" fill="#31c6e8" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></DataState>
          </ChartFrame>
          <ChartFrame title="Loan default rate by income band" description="Observed charged-off rate on loan fact rows; no borrower identity inference">
            <DataState loading={loading} error={datasets.fact?.error || datasets.borrowers?.error} filename="fact_loan.csv and dim_borrower.csv"><div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={incomeBands}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="band" tick={{ fill: '#aab1c4', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} /><Tooltip contentStyle={chartStyle} formatter={(value) => [`${number(value).toFixed(2)}%`, 'Charged-off rate']} /><Bar dataKey="defaultRate" fill="#ffad7b" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></DataState>
          </ChartFrame>
        </div>
      </DataState>
      {segmentRows.length > 0 && <section className="panel table-panel"><div className="panel-heading"><div><h2>Notebook customer segments</h2><p>Actual K-Means assignments summarized across every uploaded archive part; the table is a bounded real-row sample.</p></div><span className="source-tag">{formatNumber(segmentTotal)} SOURCE ROWS</span></div>
        {segmentGroups.length > 0 && <div className="segment-output-chart"><ChartFrame title="Customers by reported cluster" description="Exact cluster totals aggregated from all customer_segments_parts.zip CSV parts">
          <div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={segmentGroups}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="segment" tick={{ fill: '#aab1c4', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} formatter={(value) => [formatNumber(value), 'Customers']} /><Bar dataKey="customers" fill="#8b7cff" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </ChartFrame></div>}
        <div className="transaction-filters"><label className="explorer-search"><Search size={16} /><input value={segmentSearch} onChange={(event) => setSegmentSearch(event.target.value)} placeholder="Search sampled customer or cluster…" /><span>{formatNumber(visibleSegmentRows.length)} / {formatNumber(segmentRows.length)} sample rows</span></label><button className="button-secondary" onClick={() => setSegmentSearch('')}>Clear search</button></div>
        {visibleSegmentRows.length ? <div className="table-wrap"><table><thead><tr>{segmentColumns.slice(0, 8).map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{visibleSegmentRows.slice(0, 100).map((row, index) => <tr key={index}>{segmentColumns.slice(0, 8).map((column) => <td key={column}>{row[column] == null ? '—' : String(row[column])}</td>)}</tr>)}</tbody></table></div> : <div className="empty-inline">No customer segment rows match this search.</div>}
      </section>}
      {segmentProfiles.length > 0 && <section className="panel table-panel"><div className="panel-heading"><div><h2>Notebook segment profiles</h2><p>Prepared aggregate measures from Member 2’s notebook, unchanged from the source file.</p></div><span className="source-tag">customer_segment_profile.csv</span></div><div className="table-wrap"><table><thead><tr>{profileColumns.slice(0, 8).map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{segmentProfiles.slice(0, 100).map((row, index) => <tr key={index}>{profileColumns.slice(0, 8).map((column) => <td key={column}>{row[column] == null ? '—' : String(row[column])}</td>)}</tr>)}</tbody></table></div></section>}
      <section className="panel table-panel"><div className="panel-heading"><div><h2>Customer activity profiles</h2><p>Top 500 profiles by transaction count from the full bank transaction extract.</p></div><span className="source-tag">CUSTOMERID · NO SEGMENT LABELS</span></div>
        <div className="transaction-filters"><label className="explorer-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CustomerID…" /><span>{formatNumber(filtered.length)} / {formatNumber(activity.length)}</span></label><select aria-label="Minimum transaction activity" value={minimumActivity} onChange={(event) => setMinimumActivity(event.target.value)}><option>All</option><option>2+</option><option>5+</option><option>10+</option></select><button className="button-secondary" onClick={() => { setSearch(''); setMinimumActivity('All') }}>Clear filters</button></div>
        <DataState loading={loading} error={datasets.customerActivity?.error} filename="customer_activity_sample.csv (prepare from bank_transactions.csv)">{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Customer ID</th><th>{sortButton('Transaction_Count', 'Transactions')}</th><th>{sortButton('Total_Transaction_Amount_INR', 'Total amount (INR)')}</th><th>Average amount (INR)</th><th>Max amount (INR)</th><th>Average balance (INR)</th></tr></thead><tbody>{filtered.slice(0, 100).map((row) => <tr key={row.CustomerID}><td className="mono-cell">{row.CustomerID}</td><td>{formatNumber(row.Transaction_Count)}</td><td>{formatINR(row.Total_Transaction_Amount_INR)}</td><td>{formatINR(row.Average_Transaction_Amount_INR)}</td><td>{formatINR(row.Max_Transaction_Amount_INR)}</td><td>{row.Average_Account_Balance_INR == null || row.Average_Account_Balance_INR === '' ? '—' : formatINR(row.Average_Account_Balance_INR)}</td></tr>)}</tbody></table></div> : <div className="empty-state table-empty"><span className="empty-icon"><Search size={22} /></span><strong>No customer profiles match</strong><span>Try a different customer ID or activity filter.</span></div>}</DataState>
      </section>
      {(!segmentRows.length || !segmentCounts.length || !segmentProfiles.length) && <div className="integration-note"><span className="integration-icon"><UsersRound size={18} /></span><div><strong>Member 2 customer-segmentation output is incomplete</strong><p>Expected: customer_segments_parts.zip (expanded into counts and a bounded sample), plus customer_segment_profile.csv. Missing prepared outputs: {[!segmentRows.length && 'customer_segments_sample.csv', !segmentCounts.length && 'customer_segment_counts.csv', !segmentProfiles.length && 'customer_segment_profile.csv'].filter(Boolean).join(', ')}. Activity bands remain descriptive, not a substitute clustering result.</p></div><span className="api-chip">OUTPUT INCOMPLETE</span></div>}
    </div>
  )
}
