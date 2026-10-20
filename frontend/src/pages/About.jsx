import { Activity, ArrowUpRight, Boxes, BrainCircuit, Database, Layers3, Radar, UsersRound, Waypoints } from 'lucide-react'

const architecture = [
  { number: '01', icon: Database, title: 'Dimensional warehouse', text: 'Loan facts connect to borrower, loan, and date dimensions. This structure keeps measures and descriptive attributes ready for slice-and-dice analysis.' },
  { number: '02', icon: Layers3, title: 'Loan risk analytics', text: 'Explore loan amount, interest, purpose, grade, and observed charged-off flags from prepared project CSV files. Metrics remain traceable to their source.' },
  { number: '03', icon: Activity, title: 'Transaction anomaly experiment', text: 'Member 2’s notebook applies Isolation Forest to creditcard.csv after excluding its Class and Time columns. It writes flagged rows to a Google Drive path; no persisted model or exported result is currently available.' },
  { number: '04', icon: UsersRound, title: 'Customer intelligence experiment', text: 'The notebook aggregates bank_transactions.csv by CustomerID and fits four K-Means clusters on transformed activity features. Its segment CSV outputs are not currently available to this frontend.' },
  { number: '05', icon: Waypoints, title: 'OLAP operations', text: 'Roll up portfolio measures by grade, drill down through monthly summaries, and dice the prepared data using interactive dimensions.' },
  { number: '06', icon: BrainCircuit, title: 'Model performance', text: 'The supplied model_comparison.csv reports Logistic Regression and Decision Tree loan metrics. The values are displayed as project-reported, not independently validated.' },
]

export default function About() {
  return (
    <div className="page-stack">
      <div className="about-hero"><div className="eyebrow"><span className="eyebrow-dot" /> BANKING-DWM-PROJECT</div><h2>Data with a<br /><em>banking perspective.</em></h2><p>A unified frontend for the Banking Data Warehouse Management project, connecting the prepared loan warehouse with separate transaction anomaly and customer activity analyses.</p><div className="about-tags"><span>React + Vite</span><span>Prepared CSVs</span><span>Warehouse analytics</span><span>Notebook experiments</span></div><div className="about-graphic"><div className="graphic-ring ring-a" /><div className="graphic-ring ring-b" /><div className="graphic-ring ring-c" /><div className="graphic-center"><Database size={26} /></div><i /><i /><i /></div></div>
      <div className="section-label"><span>PROJECT FOUNDATIONS</span><span className="section-rule" /><span className="source-tag">WAREHOUSE → INSIGHT</span></div>
      <div className="architecture-grid">{architecture.map(({ number, icon: Icon, title, text }) => <article className="panel architecture-card" key={number}><div className="architecture-top"><span>{number}</span><Icon size={19} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      <section className="panel future-panel"><div className="future-icon"><Radar size={21} /></div><div><div className="eyebrow">INTEGRATION STATUS</div><h2>Experiments are not the same as deployable models</h2><p>The notebook contains Isolation Forest and K-Means experiments, but its model objects remain in notebook memory and its outputs target Google Drive. Run the notebook with its datasets and dependencies, then export verified metrics/results before treating those modules as operational. Loan prediction remains an explicitly labelled demo until a trained artifact, preprocessing pipeline, and validated inference interface are available.</p><div className="future-modules"><span><i /> Credit-card label summaries available</span><span><i /> Customer activity summaries available</span><span><i /> Notebook model outputs not present</span></div></div><ArrowUpRight className="future-arrow" size={20} /></section>
      <footer className="about-footer"><span>Banking Data Warehouse Management</span><span>College project · Analytics interface</span><span><Boxes size={14} /> Designed for transparent exploration</span></footer>
    </div>
  )
}
