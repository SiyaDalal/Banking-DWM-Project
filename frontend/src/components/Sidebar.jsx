import { NavLink } from 'react-router-dom'
import { Activity, BarChart3, BrainCircuit, ChartNoAxesCombined, CircleHelp, Database, FileChartColumn, LayoutDashboard, PanelLeftClose, PanelLeftOpen, ScanSearch, ShieldAlert, UsersRound } from 'lucide-react'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/loans', label: 'Loan Risk Analytics', icon: ShieldAlert },
  { to: '/transactions', label: 'Transaction Anomaly Detection', icon: ScanSearch },
  { to: '/customers', label: 'Customer Intelligence', icon: UsersRound },
  { to: '/warehouse', label: 'Data Warehouse & OLAP', icon: Database },
  { to: '/models', label: 'Model performance', icon: ChartNoAxesCombined },
  { to: '/reports', label: 'Reports & exports', icon: FileChartColumn },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }) {
  return (
    <>
      {mobileOpen && <button className="mobile-scrim" onClick={onNavigate} aria-label="Close navigation" />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Activity size={19} strokeWidth={2.5} /></div>
          {!collapsed && <div className="brand-copy"><strong>vaultline</strong><span>Banking intelligence</span></div>}
          <button className="icon-button sidebar-collapse" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <div className="nav-caption">{!collapsed && 'WORKSPACE'}</div>
        <nav className="side-nav">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} title={collapsed ? label : undefined} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>{label === 'Loan Risk Analytics' && !collapsed && <span className="nav-badge">2 VIEWS</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {!collapsed && <div className="warehouse-card"><div className="warehouse-icon"><Database size={16} /></div><strong>Warehouse online</strong><span>Prepared project data</span><span className="live-dot"><i /> Connected</span></div>}
          <NavLink to="/about" end onClick={onNavigate} title={collapsed ? 'About project' : undefined} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><CircleHelp size={18} /><span>About project</span></NavLink>
          <div className="sidebar-footer">{!collapsed && <><span className="avatar tiny-avatar">ST</span><span>Student workspace<small>Banking-DWM-Project</small></span></>}</div>
        </div>
      </aside>
    </>
  )
}
