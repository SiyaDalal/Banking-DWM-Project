import { useState } from 'react'
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': ['Project overview', 'A connected view of the Banking Data Warehouse project.'],
  '/loans': ['Loan Risk Analytics', 'Explore loan portfolio outcomes and risk factors.'],
  '/loans/prediction': ['Loan prediction studio', 'Explore a clearly labelled illustrative demo estimate.'],
  '/loans/explorer': ['Loan risk explorer', 'Search and slice the available loan records.'],
  '/transactions': ['Transaction anomaly detection', 'Inspect labelled transaction data and available model outputs.'],
  '/customers': ['Customer intelligence', 'Explore customer activity from the separate bank transaction dataset.'],
  '/warehouse': ['Data Warehouse & OLAP', 'Explore the loan star schema and OLAP operations.'],
  '/models': ['Model performance', 'Compare metrics loaded from your project CSV.'],
  '/reports': ['Reports & exports', 'Export available datasets for your analysis.'],
  '/about': ['About project', 'Banking Data Warehouse Management & Data Mining.'],
}

export default function Topbar({ theme, onThemeToggle, query, onQueryChange, onMenuClick, onNotify }) {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [title, subtitle] = titles[location.pathname] || titles['/']

  function toggleNotifications() {
    setNotificationsOpen((open) => !open)
    if (!notificationsOpen) onNotify('Notifications opened')
  }

  return (
    <header className="topbar">
      <div className="page-title">
        <button className="icon-button mobile-menu" onClick={onMenuClick} aria-label="Open navigation"><Menu size={19} /></button>
        <div><h1>{title}</h1><p>{subtitle}</p></div>
      </div>
      <div className="top-actions">
        <label className={`search-box ${searchOpen ? 'search-open' : ''}`}>
          <Search size={16} />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} placeholder="Search loans…" aria-label="Search loan records" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="notification-wrap">
          <button className="icon-button notification-button" onClick={toggleNotifications} aria-label="Notifications"><Bell size={18} /><i /></button>
          {notificationsOpen && <div className="notification-popover"><strong>You’re all caught up</strong><p>Activity will appear here as you explore the warehouse.</p><button onClick={() => setNotificationsOpen(false)}>Dismiss</button></div>}
        </div>
        <button className="icon-button theme-button" onClick={onThemeToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <div className="avatar profile-avatar" title="Student workspace">ST</div>
      </div>
    </header>
  )
}
