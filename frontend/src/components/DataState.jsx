import { Database, LoaderCircle } from 'lucide-react'

export function DataState({ loading, error, filename, children }) {
  if (loading) {
    return <div className="data-state"><LoaderCircle className="spin" size={22} /><span>Loading project data…</span></div>
  }
  if (error || !children) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Database size={22} /></span>
        <strong>Data not available</strong>
        <span>{error || `Add ${filename} to public/data/ to populate this view.`}</span>
        {filename && <code>public/data/{filename}</code>}
      </div>
    )
  }
  return children
}

export function LoadingBlock({ loading, children }) {
  return loading ? <div className="loading-block"><LoaderCircle className="spin" size={26} /></div> : children
}
