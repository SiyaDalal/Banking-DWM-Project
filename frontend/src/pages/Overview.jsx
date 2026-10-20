import { Link } from 'react-router-dom'
import { ArrowUpRight, Activity, Boxes, BrainCircuit, Database, ShieldAlert, UsersRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { useData } from '../utils/DataContext.jsx'
import { formatMoney, formatNumber, number } from '../utils/analytics.js'
import { DataState } from '../components/DataState.jsx'
import { KpiCard } from '../components/KpiCard.jsx'

function metricMap(rows = []) {
  return Object.fromEntries(rows.map((row) => [row.Metric, number(row.Value)]))
}

export default function Overview() {
  const { datasets, loading } = useData()
  const facts = datasets.fact?.rows ?? []
  const loanCount = facts.length
  const defaultCount = facts.reduce((count, row) => count + (number(row.default_flag) === 1 ? 1 : 0), 0)
  const cardSummary = datasets.creditcardSummary?.rows ?? []
  const creditAll = cardSummary.find((row) => row.Class === 'All')
  const creditFraud = cardSummary.find((row) => String(row.Class) === '1')
  const customers = metricMap(datasets.customerSummary?.rows)
  const modelCount = datasets.models?.rows?.length ?? 0
  const modules = [
    { to: '/loans', title: 'Loan Risk Analytics', icon: ShieldAlert, status: datasets.fact?.rows?.length ? `${formatNumber(loanCount)} loan records` : 'Data unavailable', detail: datasets.fact?.rows?.length ? `${formatNumber(defaultCount)} charged-off flags in the supplied fact table.` : 'Load fact_loan.csv to see portfolio risk metrics.', color: 'violet' },
    { to: '/transactions', title: 'Transaction Anomaly Detection', icon: Activity, status: datasets.flaggedTransactions?.rows?.length ? `${formatNumber(datasets.flaggedTransactions.rows.length)} model output rows` : creditAll ? `${formatNumber(creditAll.Transactions)} labeled records` : 'Data unavailable', detail: creditFraud ? `${formatNumber(creditFraud.Transactions)} rows carry Class 1 labels; anomaly output is distinct from those labels.` : 'Prepare compact historical summaries from creditcard.csv.', color: 'cyan' },
    { to: '/customers', title: 'Customer Intelligence', icon: UsersRound, status: datasets.customerSegmentCounts?.rows?.length ? `${formatNumber(datasets.customerSegmentCounts.rows.length)} K-Means clusters` : customers['Unique customers'] ? `${formatNumber(customers['Unique customers'])} customer IDs` : 'Data unavailable', detail: datasets.customerSegments?.rows?.length ? 'Notebook segment totals and a real customer sample are available.' : 'Activity summaries are available; waiting for Member 2 assignment outputs.', color: 'green' },
    { to: '/warehouse', title: 'Data Warehouse & OLAP', icon: Database, status: datasets.rollup?.rows?.length ? `${datasets.rollup.rows.length} grade roll-ups` : 'Data unavailable', detail: 'Fact-to-dimension joins, roll-up, monthly drill-down and dice reports.', color: 'blue' },
    { to: '/models', title: 'Model Performance', icon: BrainCircuit, status: modelCount ? `${modelCount} loan models reported` : 'Data unavailable', detail: datasets.flaggedTransactions?.rows?.length ? 'Transaction anomaly output is available.' : 'Loan metrics are loaded; transaction model metrics are not exported.', color: 'orange' },
  ]

  return (
    <div className="page-stack">
      <div className="welcome-banner project-banner">
        <div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-dot" /> BANKING DATA WAREHOUSE MANAGEMENT</div><h2>One portfolio.<br /><em>Connected intelligence.</em></h2><p>Explore the full project across loan risk, transaction anomalies, customer behavior, OLAP and model evaluation.</p><Link className="text-button" to="/warehouse">Explore the warehouse <ArrowUpRight size={15} /></Link></div>
        <div className="banner-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Boxes size={27} /></div><span className="orbit-dot dot-a" /><span className="orbit-dot dot-b" /><span className="orbit-dot dot-c" /></div>
        <div className="banner-foot"><span><i className="live-indicator" /> Project data inventory</span><span>Each module uses its own source</span></div>
      </div>

      <div className="section-label"><span>PROJECT-WIDE SNAPSHOT</span><span className="section-rule" /><span className="source-tag">SOURCE-BACKED ONLY</span></div>
      <DataState loading={loading} error={null}>
        <div className="kpi-grid">
          <KpiCard label="Loan fact records" value={datasets.fact?.rows?.length ? formatNumber(loanCount) : 'Data unavailable'} note={datasets.fact?.rows?.length ? 'One row per loan fact' : 'fact_loan.csv required'} icon={ShieldAlert} color="violet" delay={0.02} />
          <KpiCard label="Class 1 labels" value={creditFraud ? formatNumber(creditFraud.Transactions) : 'Data unavailable'} note="Credit-card dataset labels; not model flags" icon={Activity} color="cyan" delay={0.08} />
          <KpiCard label="Customer IDs" value={customers['Unique customers'] ? formatNumber(customers['Unique customers']) : 'Data unavailable'} note="bank_transactions.csv activity profiles" icon={UsersRound} color="green" delay={0.14} />
          <KpiCard label="Loan models reported" value={modelCount ? formatNumber(modelCount) : 'Data unavailable'} note="Values from model_comparison.csv" icon={BrainCircuit} color="orange" delay={0.2} />
        </div>
        <div className="section-label"><span>PROJECT MODULES</span><span className="section-rule" /><span className="source-tag">SELECT A MODULE TO EXPLORE</span></div>
        <div className="module-grid">{modules.map(({ to, title, icon: Icon, status, detail, color }, index) => <motion.div key={to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}><Link className={`panel module-card module-${color}`} to={to}><span className="module-icon"><Icon size={19} /></span><span className="module-title">{title}</span><span className="module-status">{status}</span><span className="module-detail">{detail}</span><span className="module-open">Open module <ArrowUpRight size={14} /></span></Link></motion.div>)}</div>
      </DataState>
      <div className="project-integrity-note"><Database size={16} /><span>Source data stays separated: the credit-card sample and Indian bank transaction records are not joined. Loan KPIs use the fact table; warehouse charts use the supplied OLAP CSVs.</span><Link to="/about">Project architecture <ArrowUpRight size={13} /></Link></div>
    </div>
  )
}
