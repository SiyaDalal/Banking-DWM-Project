import { motion } from 'framer-motion'

export function KpiCard({ label, value, note, icon: Icon, color = 'violet', delay = 0 }) {
  return (
    <motion.article className={`kpi-card ${color}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay }}>
      <div className="kpi-top">
        <span>{label}</span>
        <span className="kpi-icon">{Icon && <Icon size={18} />}</span>
      </div>
      <strong className="kpi-value">{value}</strong>
      <span className="kpi-note">{note}</span>
    </motion.article>
  )
}
