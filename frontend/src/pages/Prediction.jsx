import { useState } from 'react'
import { AlertTriangle, ArrowRight, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react'

const initial = { income: '', amount: '', interest: '', dti: '', credit: '', employment: '', purpose: '', term: '', home: '', verification: '' }

function Field({ label, hint, children }) {
  return <label className="form-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

export default function Prediction({ notify }) {
  const [form, setForm] = useState(initial)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  function estimate(event) {
    event.preventDefault()
    const nextErrors = {}
    const income = Number(form.income)
    const amount = Number(form.amount)
    const rate = Number(form.interest)
    const dti = Number(form.dti)
    const credit = Number(form.credit)
    if (!Number.isFinite(income) || income < 1000 || income > 10000000) nextErrors.income = 'Enter annual income from $1,000 to $10,000,000.'
    if (!Number.isFinite(amount) || amount < 500 || amount > 1000000) nextErrors.amount = 'Enter a loan amount from $500 to $1,000,000.'
    if (!Number.isFinite(rate) || rate < 0 || rate > 40) nextErrors.interest = 'Enter a rate from 0% to 40%.'
    if (!Number.isFinite(dti) || dti < 0 || dti > 100) nextErrors.dti = 'Enter a DTI from 0% to 100%.'
    if (!Number.isFinite(credit) || credit < 300 || credit > 850) nextErrors.credit = 'Credit score must be between 300 and 850.'
    for (const key of ['employment', 'purpose', 'term', 'home', 'verification']) if (!form[key]) nextErrors[key] = 'Please select an option.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setResult(null)
      notify('Please fix the highlighted fields.', 'error')
      return
    }
    const factors = [
      { name: 'Debt-to-income ratio', signal: dti > 35 ? 'Higher illustrative risk' : dti < 20 ? 'Lower illustrative risk' : 'Mid-range', points: dti > 35 ? 2 : dti < 20 ? 0 : 1 },
      { name: 'Credit score', signal: credit < 640 ? 'Higher illustrative risk' : credit >= 720 ? 'Lower illustrative risk' : 'Mid-range', points: credit < 640 ? 2 : credit >= 720 ? 0 : 1 },
      { name: 'Loan-to-income size', signal: amount / income > 0.35 ? 'Higher illustrative risk' : 'Lower illustrative risk', points: amount / income > 0.35 ? 1 : 0 },
      { name: 'Interest rate', signal: rate >= 18 ? 'Higher illustrative risk' : 'Lower illustrative risk', points: rate >= 18 ? 1 : 0 },
    ]
    const score = factors.reduce((sum, factor) => sum + factor.points, 0)
    setResult({ level: score >= 4 ? 'Elevated illustrative risk' : score >= 2 ? 'Moderate illustrative risk' : 'Lower illustrative risk', factors, score })
    notify('Illustrative demo estimate generated.', 'info')
  }

  function reset() {
    setForm(initial)
    setErrors({})
    setResult(null)
    notify('Form reset.')
  }

  const numberInput = (key, placeholder, step = 'any') => <input type="number" inputMode="decimal" min="0" step={step} placeholder={placeholder} value={form[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} />
  const selectInput = (key, options) => <select value={form[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])}><option value="">Select…</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>

  return (
    <div className="page-stack">
      <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> INTERACTIVE WORKSPACE</div><h2>Explore a loan profile</h2><p>See how a few transparent, illustrative factors affect a demo risk band.</p></div><span className="status-pill"><Sparkles size={14} /> DEMO MODE</span></div>
      <div className="disclaimer-banner"><AlertTriangle size={18} /><div><strong>Demo Estimate — Not a Validated Credit Decision.</strong><span>This is a simple illustrative calculation, not a trained model, probability of default, financial advice, or a credit decision. No real prediction API is connected.</span></div></div>
      <div className="prediction-layout">
        <form className="panel prediction-form" onSubmit={estimate} noValidate>
          <div className="panel-heading"><div><h2>Applicant & loan details</h2><p>All fields are required for this illustration.</p></div><span className="step-indicator">01 / 02</span></div>
          <div className="form-grid">
            <Field label="Annual income" hint="Gross yearly income in USD">{numberInput('income', 'e.g. 72,000', 1000)}{errors.income && <small className="field-error">{errors.income}</small>}</Field>
            <Field label="Requested loan amount" hint="Amount requested in USD">{numberInput('amount', 'e.g. 15,000', 500)}<input className="form-slider" type="range" min="500" max="100000" step="500" value={form.amount || 500} onChange={(event) => update('amount', event.target.value)} aria-label="Requested loan amount slider" />{errors.amount && <small className="field-error">{errors.amount}</small>}</Field>
            <Field label="Interest rate" hint="Annual rate (%)">{numberInput('interest', 'e.g. 12.5', 0.1)}{errors.interest && <small className="field-error">{errors.interest}</small>}</Field>
            <Field label="Debt-to-income ratio" hint="Monthly debt / gross monthly income (%)">{numberInput('dti', 'e.g. 18.5', 0.1)}<input className="form-slider" type="range" min="0" max="100" step="1" value={form.dti || 0} onChange={(event) => update('dti', event.target.value)} aria-label="Debt-to-income ratio slider" />{errors.dti && <small className="field-error">{errors.dti}</small>}</Field>
            <Field label="Credit score" hint="Illustrative FICO range: 300–850">{numberInput('credit', 'e.g. 710', 1)}{errors.credit && <small className="field-error">{errors.credit}</small>}</Field>
            <Field label="Employment length">{selectInput('employment', ['< 1 year', '1 year', '2 years', '3 years', '4 years', '5 years', '6 years', '7 years', '8 years', '9 years', '10+ years'])}{errors.employment && <small className="field-error">{errors.employment}</small>}</Field>
            <Field label="Loan purpose">{selectInput('purpose', ['Debt consolidation', 'Credit card', 'Home improvement', 'Major purchase', 'Small business', 'Medical', 'Other'])}{errors.purpose && <small className="field-error">{errors.purpose}</small>}</Field>
            <Field label="Loan term">{selectInput('term', ['36 months', '60 months'])}{errors.term && <small className="field-error">{errors.term}</small>}</Field>
            <Field label="Home ownership">{selectInput('home', ['Rent', 'Mortgage', 'Own', 'Other'])}{errors.home && <small className="field-error">{errors.home}</small>}</Field>
            <Field label="Verification status">{selectInput('verification', ['Verified', 'Source verified', 'Not verified'])}{errors.verification && <small className="field-error">{errors.verification}</small>}</Field>
          </div>
          <div className="form-actions"><button className="button-secondary" type="button" onClick={reset}><RotateCcw size={15} /> Reset form</button><button className="button-primary" type="submit">Generate demo estimate <ArrowRight size={16} /></button></div>
        </form>
        <aside className="panel result-panel">
          <div className="panel-heading"><div><h2>Illustrative result</h2><p>No probability or validated score is produced.</p></div><span className="result-icon"><ShieldAlert size={18} /></span></div>
          {result ? <div className="result-content"><span className={`risk-badge ${result.score >= 4 ? 'risk-high' : result.score >= 2 ? 'risk-mid' : 'risk-low'}`}><i />{result.level}</span><div className="result-meter"><div style={{ width: `${Math.max(12, (result.score / 6) * 100)}%` }} /></div><div className="factor-heading"><strong>Illustrative factors</strong><span>Rule-based demo only</span></div><div className="factor-list">{result.factors.map((factor) => <div className="factor-row" key={factor.name}><span>{factor.name}</span><strong className={factor.points ? 'factor-warn' : 'factor-good'}>{factor.signal}</strong></div>)}</div><div className="result-disclaimer">This band is generated from simple thresholds shown in the source code. It has not been trained or validated and must not be used to make lending decisions.</div></div> : <div className="result-empty"><div className="result-illustration"><div /><div /><div /><Sparkles size={24} /></div><strong>Your result will appear here</strong><span>Complete all fields to see the transparent demo calculation.</span><div className="result-note"><ShieldAlert size={15} />No personal data is sent to a server.</div></div>}
        </aside>
      </div>
      <div className="integration-note"><span className="integration-icon"><Sparkles size={18} /></span><div><strong>Ready for a real prediction service</strong><p>The front-end calculation is isolated from the UI. Replace the demo estimate handler with a Python API call and its matching preprocessing pipeline when those are ready.</p></div><span className="api-chip">API · NOT CONNECTED</span></div>
    </div>
  )
}
