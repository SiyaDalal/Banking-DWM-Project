import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BadgeDollarSign, BriefcaseBusiness, CircleDollarSign, FileWarning, Percent, Sparkles } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../utils/DataContext.jsx'
import { formatMoney, formatNumber, joinLoans, number } from '../utils/analytics.js'
import { DataState } from '../components/DataState.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { ChartFrame } from '../components/ChartFrame.jsx'

const COLORS = ['#8b7cff', '#31c6e8', '#5ee0bc', '#ffb86b', '#f2779e', '#a3a9ff', '#67a3ff']
const tooltipStyle = { background: '#141a2a', border: '1px solid #30374a', borderRadius: 12, color: '#fff' }

export default function LoanRisk({ notify }) {
  const { datasets, loading } = useData()
  const facts = datasets.fact?.rows ?? []
  const loans = datasets.loans?.rows ?? []
  const models = datasets.models?.rows ?? []
  const totalCount = facts.length
  const totals = useMemo(() => {
    const amount = facts.reduce((sum, row) => sum + number(row.loan_amnt), 0)
    const defaults = facts.reduce((sum, row) => sum + (number(row.default_flag) === 1 ? 1 : 0), 0)
    return { amount, defaults, average: totalCount ? amount / totalCount : 0, rate: totalCount ? (defaults / totalCount) * 100 : 0 }
  }, [facts, totalCount])

  const joined = useMemo(() => joinLoans(facts, loans), [facts, loans])
  const purposeData = useMemo(() => {
    const counts = new Map()
    joined.forEach((row) => {
      const purpose = row.purpose || 'Unspecified'
      counts.set(purpose, (counts.get(purpose) || 0) + 1)
    })
    return [...counts].map(([name, count]) => ({ name: name.replaceAll('_', ' '), count })).sort((a, b) => b.count - a.count).slice(0, 6)
  }, [joined])
  const activity = [
    { title: 'Loan fact table', detail: `${formatNumber(facts.length)} rows available`, file: 'fact_loan.csv', color: 'cyan' },
    { title: 'Loan dimensions', detail: `${formatNumber(loans.length)} records joined`, file: 'dim_loan.csv', color: 'violet' },
    { title: 'Model comparison', detail: `${models.length} model metric rows`, file: 'model_comparison.csv', color: 'green' },
  ]
  const gradeData = datasets.rollup?.rows ?? []
  const monthlyData = (datasets.drilldown?.rows ?? []).map((row) => ({ ...row, period: `${row.year}-${String(row.month).padStart(2, '0')}` }))
  const riskData = [{ name: 'Performing', value: totalCount - totals.defaults }, { name: 'Charged off', value: totals.defaults }]

  return (
    <div className="page-stack">
      <div className="welcome-banner">
        <div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-dot" /> LOAN RISK ANALYTICS</div><h2>Clarity for every<br /><em>credit decision.</em></h2><p>Explore the lending portfolio through the prepared loan fact and dimension tables.</p><div className="welcome-actions"><Link className="text-button" to="/loans/explorer">Explore loan records <ArrowUpRight size={15} /></Link><Link className="text-button" to="/loans/prediction">Open demo prediction <ArrowUpRight size={15} /></Link><button className="text-button" onClick={() => notify('Loan measures use one fact row per loan, joined to the loan dimension by loan_dim_key.', 'info')}>View data grain <ArrowUpRight size={15} /></button></div></div>
        <div className="banner-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Sparkles size={29} /></div><span className="orbit-dot dot-a" /><span className="orbit-dot dot-b" /><span className="orbit-dot dot-c" /></div>
        <div className="banner-foot"><span><i className="live-indicator" /> Warehouse data ready</span><span>Based on supplied CSV files</span></div>
      </div>

      <div className="section-label"><span>PORTFOLIO SNAPSHOT</span><span className="section-rule" /><span className="source-tag">SOURCE: fact_loan.csv</span></div>
      <DataState loading={loading} error={datasets.fact?.error} filename="fact_loan.csv">
        <div className="kpi-grid">
          <KpiCard label="Total loans" value={formatNumber(totalCount)} note="Rows in the loaded fact table" icon={BriefcaseBusiness} color="violet" delay={0.02} />
          <KpiCard label="Total loan amount" value={formatMoney(totals.amount, true)} note="Sum of loan_amnt in supplied records" icon={CircleDollarSign} color="blue" delay={0.08} />
          <KpiCard label="Average loan amount" value={formatMoney(totals.average)} note="Calculated from loaded loan rows" icon={BadgeDollarSign} color="cyan" delay={0.14} />
          <KpiCard label="Charged-off loans" value={formatNumber(totals.defaults)} note={`${totals.rate.toFixed(2)}% of loaded records`} icon={FileWarning} color="orange" delay={0.2} />
        </div>
        <div className="chart-grid overview-charts">
          <ChartFrame title="Monthly loan volume" description="Loan count by month, from the prepared OLAP drill-down" className="wide-chart">
            <DataState loading={loading} error={datasets.drilldown?.error} filename="olap_drilldown_by_month.csv">
              <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyData}><defs><linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8274ff" stopOpacity={0.35} /><stop offset="95%" stopColor="#8274ff" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="period" tick={{ fill: '#8790a7', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(value), 'Loans']} /><Area type="monotone" dataKey="Total_Loans" stroke="#9a8cff" strokeWidth={2.5} fill="url(#volumeGradient)" activeDot={{ r: 5, fill: '#c0b6ff' }} /></AreaChart></ResponsiveContainer></div>
            </DataState>
          </ChartFrame>
          <ChartFrame title="Risk distribution" description="Charged-off flags in fact_loan.csv">
            <DataState loading={loading} error={datasets.fact?.error} filename="fact_loan.csv">
              <div className="risk-chart"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskData} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="91%" paddingAngle={3} stroke="none"><Cell fill="#41d6c1" /><Cell fill="#ff9b70" /></Pie><Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatNumber(value), name]} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{totals.rate.toFixed(1)}%</strong><span>charge-off</span></div></div><div className="risk-legend"><div><i className="legend-dot green-dot" /><span>Performing<small>{formatNumber(totalCount - totals.defaults)} records</small></span></div><div><i className="legend-dot orange-dot" /><span>Charged off<small>{formatNumber(totals.defaults)} records</small></span></div></div></div>
            </DataState>
          </ChartFrame>
          <ChartFrame title="Loan distribution by grade" description="Prepared OLAP roll-up with portfolio counts">
            <DataState loading={loading} error={datasets.rollup?.error} filename="olap_rollup_by_grade.csv">
              <div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={gradeData} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="grade" tick={{ fill: '#aab1c4', fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(value), 'Loans']} /><Bar dataKey="Total_Loans" radius={[5, 5, 0, 0]}>{gradeData.map((entry, index) => <Cell key={entry.grade} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
            </DataState>
          </ChartFrame>
          <ChartFrame title="Loan purpose mix" description="Count of supplied fact records joined to loan dimensions">
            <DataState loading={loading} error={!loans.length ? datasets.loans?.error : datasets.fact?.error} filename="dim_loan.csv and fact_loan.csv">
              {purposeData.length ? <div className="chart-area small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={purposeData} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 0 }}><CartesianGrid stroke="#ffffff0b" horizontal={false} /><XAxis type="number" tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={112} tick={{ fill: '#aab1c4', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(value), 'Loans']} /><Bar dataKey="count" fill="#31c6e8" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div> : <div className="empty-inline">No purpose values in loaded dimensions.</div>}
            </DataState>
          </ChartFrame>
        </div>
      </DataState>

      <div className="section-label"><span>DATA ACTIVITY</span><span className="section-rule" /><span className="source-tag"><Percent size={12} /> LIVE FROM FILES</span></div>
      <section className="panel activity-panel"><div className="activity-heading"><div><h2>Warehouse data pulse</h2><p>Source file status, not model or transaction activity.</p></div><span className="activity-status"><i /> LOADED</span></div><div className="activity-list">{activity.map((item) => <div className="activity-item" key={item.file}><span className={`activity-symbol ${item.color}`}><BriefcaseBusiness size={16} /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><code>{item.file}</code></div>)}</div></section>
    </div>
  )
}
