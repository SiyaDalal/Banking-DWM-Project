import { BadgeCheck, Info } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../utils/DataContext.jsx'
import { DataState } from '../components/DataState.jsx'
import { ChartFrame } from '../components/ChartFrame.jsx'

const metricKeys = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']
const colors = ['#9b8bff', '#35c6e6']

export default function ModelPerformance() {
  const { datasets, loading } = useData()
  const rows = datasets.models?.rows ?? []
  const chartRows = metricKeys.map((metric) => Object.fromEntries([['metric', metric], ...rows.map((row, index) => [row.Model || `Model ${index + 1}`, row[metric]])]))
  const models = [...new Set(rows.map((row) => row.Model).filter(Boolean))]
  return (
    <div className="page-stack">
      <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> MODEL OBSERVABILITY</div><h2>Performance comparison</h2><p>Review evaluation metrics recorded by your project pipeline.</p></div><span className="status-pill"><BadgeCheck size={14} /> CSV SOURCE</span></div>
      <div className="disclaimer-banner info-banner"><Info size={18} /><div><strong>Values are loaded from the supplied model_comparison.csv.</strong><span>These are project-reported metrics, not independently verified. No placeholder results are generated when data is absent.</span></div></div>
      <ChartFrame title="Model metric comparison" description="Metric values are displayed on a shared 0–1 scale">
        <DataState loading={loading} error={datasets.models?.error} filename="model_comparison.csv">
          {rows.length ? <div className="chart-area model-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartRows} margin={{ top: 15, right: 24, bottom: 0, left: 0 }}><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="metric" tick={{ fill: '#abb2c7', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} tick={{ fill: '#8790a7', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#141a2a', border: '1px solid #30374a', borderRadius: 12 }} formatter={(value) => [Number(value).toFixed(4), '']} /><Legend wrapperStyle={{ color: '#aab1c4', fontSize: 12 }} /><Bar dataKey={models[0]} fill={colors[0]} radius={[4, 4, 0, 0]} maxBarSize={32} />{models[1] && <Bar dataKey={models[1]} fill={colors[1]} radius={[4, 4, 0, 0]} maxBarSize={32} />}{models.slice(2).map((model, index) => <Bar key={model} dataKey={model} fill={['#59dbb6', '#ffb86b'][index % 2]} radius={[4, 4, 0, 0]} maxBarSize={32} />)}</BarChart></ResponsiveContainer></div> : null}
        </DataState>
      </ChartFrame>
      <section className="panel model-table-panel"><div className="panel-heading"><div><h2>Reported metrics</h2><p>Exact values parsed from the source CSV; shown to four decimal places.</p></div><span className="source-tag">model_comparison.csv</span></div><DataState loading={loading} error={datasets.models?.error} filename="model_comparison.csv">{rows.length ? <div className="table-wrap"><table><thead><tr><th>Model</th>{metricKeys.map((metric) => <th key={metric}>{metric}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.Model}-${index}`}><td><span className="model-name"><i style={{ background: colors[index % colors.length] }} />{row.Model || 'Unnamed model'}</span></td>{metricKeys.map((metric) => <td key={metric} className="mono-cell">{typeof row[metric] === 'number' ? row[metric].toFixed(4) : row[metric] ?? '—'}</td>)}</tr>)}</tbody></table></div> : null}</DataState></section>
      <section className="panel model-table-panel anomaly-metrics-note"><div className="panel-heading"><div><h2>Transaction anomaly model</h2><p>Separate from the loan classifier metrics above.</p></div><span className="source-tag">ISOLATION FOREST</span></div><p>{datasets.flaggedTransactions?.rows?.length ? `Member 2’s flagged_transactions.csv is loaded with ${datasets.flaggedTransactions.rows.length.toLocaleString()} output rows. ` : 'Member 2’s flagged_transactions.csv is not available. '}The notebook does not export a model evaluation-metrics file or persist a reusable model artifact. The flagged-record output alone is not an accuracy, precision, recall, F1, or ROC-AUC result, so no transaction metrics are reported.</p></section>
      <p className="footnote">Metrics are only as meaningful as their evaluation split, class balance, feature preparation, and validation procedure. Consult the project training workflow before drawing conclusions.</p>
    </div>
  )
}
