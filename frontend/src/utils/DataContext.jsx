import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { parseCsv } from './csv.js'

const FILES = {
  fact: 'fact_loan.csv',
  loans: 'dim_loan.csv',
  borrowers: 'dim_borrower.csv',
  dates: 'dim_date.csv',
  models: 'model_comparison.csv',
  rollup: 'olap_rollup_by_grade.csv',
  drilldown: 'olap_drilldown_by_month.csv',
  dice: 'olap_dice_results.csv',
  portfolioGrade: 'portfolio_by_grade.csv',
  portfolioPurpose: 'portfolio_by_purpose.csv',
  creditcardSummary: 'creditcard_summary.csv',
  creditcardTimeBins: 'creditcard_time_bins.csv',
  creditcardRecords: 'creditcard_records_sample.csv',
  customerSummary: 'customer_activity_summary.csv',
  customerBands: 'customer_activity_bands.csv',
  customerActivity: 'customer_activity_sample.csv',
  customerSegments: 'customer_segments_sample.csv',
  customerSegmentCounts: 'customer_segment_counts.csv',
  customerSegmentProfile: 'customer_segment_profile.csv',
  flaggedTransactions: 'flagged_transactions.csv',
}

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [datasets, setDatasets] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all(
      Object.entries(FILES).map(async ([key, filename]) => {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/${filename}`)
          if (!response.ok) return [key, { rows: [], error: `Could not load ${filename} (HTTP ${response.status}).` }]
          const text = await response.text()
          const contentType = response.headers.get('content-type') ?? ''
          if (/text\/html/i.test(contentType) || /^\s*(<!doctype html|<html\b)/i.test(text)) {
            return [key, { rows: [], error: `${filename} is not available; the server returned an HTML page instead of CSV data.` }]
          }
          const rows = parseCsv(text)
          return [key, { rows, error: rows.length ? null : `${filename} is empty or contains no data rows.` }]
        } catch (error) {
          return [key, { rows: [], error: `Could not load ${filename}: ${error.message}` }]
        }
      }),
    ).then((results) => {
      if (active) {
        setDatasets(Object.fromEntries(results))
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({ datasets, loading, files: FILES }), [datasets, loading])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
