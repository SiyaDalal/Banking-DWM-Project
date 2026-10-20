import { useState } from 'react'
import { ArrowDownToLine, Download, FileSpreadsheet } from 'lucide-react'
import { useData } from '../utils/DataContext.jsx'
import { formatNumber } from '../utils/analytics.js'
import { DataState } from '../components/DataState.jsx'

const fileDefinitions = [
  ['fact', 'fact_loan.csv', 'Loan fact table · measures and default flags'],
  ['loans', 'dim_loan.csv', 'Loan dimensions · grade, purpose, term and ownership'],
  ['borrowers', 'dim_borrower.csv', 'Borrower dimensions · income, employment and verification'],
  ['dates', 'dim_date.csv', 'Date dimension · issue month and year'],
  ['models', 'model_comparison.csv', 'Reported model evaluation metrics'],
  ['rollup', 'olap_rollup_by_grade.csv', 'Prepared portfolio aggregation by loan grade'],
  ['drilldown', 'olap_drilldown_by_month.csv', 'Prepared monthly loan trend'],
  ['dice', 'olap_dice_results.csv', 'Prepared multidimensional loan subset'],
  ['portfolioGrade', 'portfolio_by_grade.csv', 'Portfolio measures grouped by grade'],
  ['portfolioPurpose', 'portfolio_by_purpose.csv', 'Portfolio measures grouped by purpose'],
  ['creditcardSummary', 'creditcard_summary.csv', 'Source-derived class label and amount summary; not model predictions'],
  ['creditcardTimeBins', 'creditcard_time_bins.csv', 'Observed credit-card records in fixed Time-value bins'],
  ['creditcardRecords', 'creditcard_records_sample.csv', 'First 500 source rows for interactive review'],
  ['customerSummary', 'customer_activity_summary.csv', 'Source-derived customer and transaction totals'],
  ['customerBands', 'customer_activity_bands.csv', 'Descriptive transaction-count bands, not K-Means segments'],
  ['customerActivity', 'customer_activity_sample.csv', 'Top customer profiles by transaction count'],
  ['flaggedTransactions', 'flagged_transactions.csv', 'Member 2 Isolation Forest output rows'],
  ['customerSegments', 'customer_segments_sample.csv', '500 actual assignments sampled from all uploaded K-Means parts'],
  ['customerSegmentCounts', 'customer_segment_counts.csv', 'Exact cluster assignment totals validated against segment profiles'],
  ['customerSegmentProfile', 'customer_segment_profile.csv', 'Member 2 K-Means segment-level profile aggregates'],
]

function escapeCell(value) {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function makeCsv(rows) {
  if (!rows.length) throw new Error('The selected dataset has no rows to export.')
  const headers = Object.keys(rows[0])
  if (!headers.length) throw new Error('The selected dataset has no columns to export.')
  return [headers.map(escapeCell).join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\r\n')
}

export default function Reports({ notify }) {
  const { datasets, loading } = useData()
  const [downloading, setDownloading] = useState(null)
  async function download(key, filename) {
    setDownloading(key)
    try {
      const rows = datasets[key]?.rows ?? []
      if (!rows.length) throw new Error(`${filename} is not available or contains no data rows.`)
      const csv = makeCsv(rows)
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
      if (!blob.size) throw new Error(`Could not create an export for ${filename}.`)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      notify(`Download started: ${filename}`)
    } catch (error) {
      notify(error.message || `Could not export ${filename}.`, 'error')
    } finally {
      setDownloading(null)
    }
  }
  const available = fileDefinitions.filter(([key]) => datasets[key]?.rows?.length)
  const missing = fileDefinitions.filter(([key]) => !datasets[key]?.rows?.length)
  const totalRows = available.reduce((total, [key]) => total + (datasets[key]?.rows?.length ?? 0), 0)

  return (
    <div className="page-stack">
      <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> EXPORT CENTER</div><h2>Reports & data exports</h2><p>Download the prepared CSV tables that are currently available to this frontend.</p></div><span className="status-pill"><FileSpreadsheet size={14} /> CSV EXPORTS</span></div>
      <div className="report-summary-grid"><div className="report-summary"><span className="summary-number">{formatNumber(available.length)}</span><span>Datasets available</span><small>of {fileDefinitions.length} supported files</small></div><div className="report-summary"><span className="summary-number">{formatNumber(totalRows)}</span><span>Total loaded data rows</span><small>Across available files</small></div><div className="report-summary"><span className="summary-number">{formatNumber(missing.length)}</span><span>Datasets missing</span><small>Not included in public/data/</small></div></div>
      <section className="panel reports-panel"><div className="panel-heading"><div><h2>Available project data</h2><p>Each export contains exactly the rows loaded from its matching source file.</p></div><span className="source-tag">CSV · UTF-8</span></div><DataState loading={loading} error={null}><div className="report-list">{fileDefinitions.map(([key, filename, description]) => {
        const count = datasets[key]?.rows?.length ?? 0
        const error = datasets[key]?.error
        const isMemberOutput = ['flaggedTransactions', 'customerSegments', 'customerSegmentCounts', 'customerSegmentProfile'].includes(key)
        return <div className={`report-row ${count ? '' : 'unavailable'}`} key={key}><span className="report-file-icon"><FileSpreadsheet size={18} /></span><div className="report-copy"><strong>{filename}</strong><span>{description}</span>{!count && <small className="missing-detail">{isMemberOutput ? `Waiting for output file from Member 2.${error ? ` ${error}` : ''}` : error || 'No data rows available.'}</small>}</div><span className={`row-count ${count ? '' : 'missing-count'}`}>{count ? `${formatNumber(count)} rows` : isMemberOutput ? 'Waiting' : 'Not available'}</span><button className="button-secondary export-button" onClick={() => download(key, filename)} disabled={!count || downloading === key} aria-label={`Download ${filename}`}>{downloading === key ? <ArrowDownToLine size={15} className="spin" /> : <Download size={15} />}<span>{count ? 'Download' : 'Unavailable'}</span></button></div>
      })}</div></DataState></section>
      <div className="report-note"><span className="report-note-icon"><ArrowDownToLine size={17} /></span><div><strong>Exports are generated in your browser</strong><p>No data is uploaded to a server. Missing files are reported per dataset; place the required CSV in <code>public/data/</code> and refresh to make it available.</p></div></div>
    </div>
  )
}
