import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Search, SlidersHorizontal, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../utils/DataContext.jsx'
import { formatMoney, formatNumber, joinLoans, number } from '../utils/analytics.js'
import { DataState } from '../components/DataState.jsx'
import { ChartFrame } from '../components/ChartFrame.jsx'

const palette = ['#8b7cff', '#31c6e8', '#5ee0bc', '#ffb86b', '#f2779e', '#67a3ff', '#a3a9ff']

export default function Explorer({ query, setQuery, notify }) {
  const { datasets, loading } = useData()
  const [grade, setGrade] = useState('All grades')
  const [purpose, setPurpose] = useState('All purposes')
  const [term, setTerm] = useState('All terms')
  const [risk, setRisk] = useState('All risk categories')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [rateMax, setRateMax] = useState('')
  const [sort, setSort] = useState({ key: 'loan_amnt', direction: 'desc' })

  const records = useMemo(() => joinLoans(datasets.fact?.rows ?? [], datasets.loans?.rows ?? []), [datasets.fact, datasets.loans])
  const grades = useMemo(() => [...new Set(records.map((row) => row.grade).filter(Boolean))].sort(), [records])
  const purposes = useMemo(() => [...new Set(records.map((row) => row.purpose).filter(Boolean))].sort(), [records])
  const terms = useMemo(() => [...new Set(records.map((row) => row.term).filter(Boolean))].sort(), [records])
  const amountLimit = useMemo(() => records.reduce((max, row) => Math.max(max, number(row.loan_amnt)), 0), [records])
  const filtered = useMemo(() => records.filter((row) => {
    if (grade !== 'All grades' && row.grade !== grade) return false
    if (purpose !== 'All purposes' && row.purpose !== purpose) return false
    if (term !== 'All terms' && row.term !== term) return false
    if (risk === 'Charged off' && number(row.default_flag) !== 1) return false
    if (risk === 'Performing' && number(row.default_flag) !== 0) return false
    if (amountMin !== '' && number(row.loan_amnt) < number(amountMin)) return false
    if (amountMax !== '' && number(row.loan_amnt) > number(amountMax)) return false
    if (rateMax !== '' && number(row.int_rate) > number(rateMax)) return false
    if (query.trim()) {
      const search = query.toLowerCase()
      if (!['loan_key', 'grade', 'purpose', 'term', 'home_ownership'].some((key) => String(row[key] ?? '').toLowerCase().includes(search))) return false
    }
    return true
  }), [records, grade, purpose, term, risk, amountMin, amountMax, rateMax, query])
  const sortedRows = useMemo(() => [...filtered].sort((a, b) => {
    const left = a[sort.key] ?? ''
    const right = b[sort.key] ?? ''
    const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
    return comparison * (sort.direction === 'asc' ? 1 : -1)
  }), [filtered, sort])
  const gradeChart = useMemo(() => {
    const counts = new Map()
    filtered.forEach((row) => counts.set(row.grade || 'Unspecified', (counts.get(row.grade || 'Unspecified') || 0) + 1))
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
  }, [filtered])
  const maxAmount = amountLimit || 1

  function clearFilters() {
    setGrade('All grades'); setPurpose('All purposes'); setTerm('All terms'); setRisk('All risk categories')
    setAmountMin(''); setAmountMax(''); setRateMax(''); setQuery('')
    notify('All loan explorer filters cleared.')
  }
  function toggleSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  }
  const sortable = (key, label) => <button className="sort-button" onClick={() => toggleSort(key)}>{label}{sort.key === key ? sort.direction === 'asc' ? <ArrowUpWideNarrow size={13} /> : <ArrowDownWideNarrow size={13} /> : null}</button>

  return (
    <div className="page-stack">
      <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> LOAN PORTFOLIO</div><h2>Explore loan records</h2><p>Slice the fact table by its loan dimensions. All filters operate on loaded CSV rows.</p></div><span className="data-count-pill">{formatNumber(filtered.length)} <small>matching rows</small></span></div>
      <div className="explorer-layout">
        <aside className="panel filter-panel">
          <div className="filter-title"><span className="filter-icon"><SlidersHorizontal size={16} /></span><div><strong>Filters</strong><small>Narrow the data slice</small></div><button className="filter-clear" onClick={clearFilters} title="Clear filters"><X size={15} /></button></div>
          <label className="form-field compact-field"><span>Grade</span><select value={grade} onChange={(event) => setGrade(event.target.value)}><option>All grades</option>{grades.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="form-field compact-field"><span>Purpose</span><select value={purpose} onChange={(event) => setPurpose(event.target.value)}><option>All purposes</option>{purposes.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="form-field compact-field"><span>Loan term</span><select value={term} onChange={(event) => setTerm(event.target.value)}><option>All terms</option>{terms.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="form-field compact-field"><span>Risk category</span><select value={risk} onChange={(event) => setRisk(event.target.value)}><option>All risk categories</option><option>Performing</option><option>Charged off</option></select></label>
          <div className="filter-divider" />
          <label className="form-field compact-field"><span>Loan amount range</span><div className="range-labels"><span>{formatMoney(amountMin || 0)}</span><span>to</span><span>{formatMoney(amountMax || maxAmount)}</span></div><input className="range-control" type="range" min="0" max={maxAmount} step={1000} value={amountMax || maxAmount} onChange={(event) => setAmountMax(event.target.value === String(maxAmount) ? '' : event.target.value)} aria-label="Maximum loan amount" /><div className="range-inputs"><input type="number" placeholder="Min" min="0" value={amountMin} onChange={(event) => setAmountMin(event.target.value)} /><input type="number" placeholder="Max" min="0" value={amountMax} onChange={(event) => setAmountMax(event.target.value)} /></div></label>
          <label className="form-field compact-field"><span>Maximum interest rate <b>{rateMax ? `${rateMax}%` : 'Any'}</b></span><input className="range-control" type="range" min="0" max="40" step="0.5" value={rateMax || 40} onChange={(event) => setRateMax(event.target.value === '40' ? '' : event.target.value)} aria-label="Maximum interest rate" /></label>
        </aside>
        <div className="explorer-main">
          <div className="explorer-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by loan ID, grade, purpose or term…" /><span>{filtered.length ? `${formatNumber(filtered.length)} records` : 'No matches'}</span></div>
          <ChartFrame title="Loans by grade" description="Distribution within the current filter selection">
            <DataState loading={loading} error={datasets.fact?.error || datasets.loans?.error} filename="fact_loan.csv and dim_loan.csv">
              {filtered.length ? <div className="chart-area explorer-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={gradeChart}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="name" tick={{ fill: '#aab1c4', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#141a2a', border: '1px solid #30374a', borderRadius: 12 }} formatter={(value) => [formatNumber(value), 'Loans']} /><Bar dataKey="count" radius={[5, 5, 0, 0]}>{gradeChart.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="empty-inline">No records match the current filters.</div>}
            </DataState>
          </ChartFrame>
          <section className="panel table-panel"><div className="panel-heading"><div><h2>Loan records</h2><p>Showing up to 100 rows · Click a column to sort</p></div><span className="source-tag">FACT + DIMENSION JOIN</span></div>
            <DataState loading={loading} error={datasets.fact?.error || datasets.loans?.error} filename="fact_loan.csv and dim_loan.csv">
              {sortedRows.length ? <div className="table-wrap"><table><thead><tr><th>{sortable('loan_key', 'Loan ID')}</th><th>{sortable('grade', 'Grade')}</th><th>{sortable('purpose', 'Purpose')}</th><th>{sortable('loan_amnt', 'Amount')}</th><th>{sortable('int_rate', 'Rate')}</th><th>{sortable('term', 'Term')}</th><th>{sortable('default_flag', 'Risk')}</th></tr></thead><tbody>{sortedRows.slice(0, 100).map((row, index) => <tr key={`${row.loan_key}-${index}`}><td className="mono-cell">#{row.loan_key}</td><td><span className={`grade-chip grade-${String(row.grade || 'x').toLowerCase()}`}>{row.grade || '—'}</span></td><td className="purpose-cell">{String(row.purpose || '—').replaceAll('_', ' ')}</td><td>{formatMoney(row.loan_amnt)}</td><td>{number(row.int_rate).toFixed(2)}%</td><td>{row.term?.trim() || '—'}</td><td><span className={`risk-cell ${number(row.default_flag) === 1 ? 'charged' : 'performing'}`}><i />{number(row.default_flag) === 1 ? 'Charged off' : 'Performing'}</span></td></tr>)}</tbody></table></div> : <div className="empty-state table-empty"><span className="empty-icon"><Search size={22} /></span><strong>No records match</strong><span>Try changing or clearing one or more filters.</span><button className="button-secondary" onClick={clearFilters}>Clear filters</button></div>}
            </DataState>
          </section>
        </div>
      </div>
    </div>
  )
}
