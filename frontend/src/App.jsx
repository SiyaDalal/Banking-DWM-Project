import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'

const Overview = lazy(() => import('./pages/Overview.jsx'))
const LoanRisk = lazy(() => import('./pages/LoanRisk.jsx'))
const TransactionAnomalies = lazy(() => import('./pages/TransactionAnomalies.jsx'))
const CustomerIntelligence = lazy(() => import('./pages/CustomerIntelligence.jsx'))
const Prediction = lazy(() => import('./pages/Prediction.jsx'))
const Explorer = lazy(() => import('./pages/Explorer.jsx'))
const ModelPerformance = lazy(() => import('./pages/ModelPerformance.jsx'))
const Olap = lazy(() => import('./pages/Olap.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const About = lazy(() => import('./pages/About.jsx'))

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('vaultline-theme') || 'dark')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('vaultline-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector('.search-box input')?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function notify(message, kind = 'success') {
    setToast({ message, kind, id: Date.now() })
    window.setTimeout(() => setToast(null), 3400)
  }

  function handleGlobalSearch(value) {
    setQuery(value)
    if (value.trim() && location.pathname !== '/loans/explorer') navigate('/loans/explorer')
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="particle-field" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <main className={`main-area ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar theme={theme} onThemeToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} query={query} onQueryChange={handleGlobalSearch} onMenuClick={() => setMobileOpen(true)} onNotify={(message) => notify(message, 'info')} />
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} className="route-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<div className="loading-block"><span className="spin">◌</span></div>}>
                <Routes location={location}>
                  <Route path="/" element={<Overview notify={notify} />} />
                  <Route path="/loans" element={<LoanRisk notify={notify} />} />
                  <Route path="/loans/prediction" element={<Prediction notify={notify} />} />
                  <Route path="/loans/explorer" element={<Explorer query={query} setQuery={setQuery} notify={notify} />} />
                  <Route path="/transactions" element={<TransactionAnomalies />} />
                  <Route path="/customers" element={<CustomerIntelligence />} />
                  <Route path="/warehouse" element={<Olap />} />
                  <Route path="/models" element={<ModelPerformance />} />
                  <Route path="/reports" element={<Reports notify={notify} />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/prediction" element={<Navigate to="/loans/prediction" replace />} />
                  <Route path="/explorer" element={<Navigate to="/loans/explorer" replace />} />
                  <Route path="/olap" element={<Navigate to="/warehouse" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <AnimatePresence>
        {toast && <motion.div className={`toast ${toast.kind}`} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}><span>{toast.kind === 'error' ? <X size={17} /> : <Check size={17} />}</span>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></motion.div>}
      </AnimatePresence>
    </div>
  )
}
