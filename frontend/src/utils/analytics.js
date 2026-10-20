export const number = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value == null || value === '') return 0
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function joinByKey(facts = [], dimensions = [], key) {
  const dimensionsById = new Map(dimensions.map((row) => [String(row[key]), row]))
  return facts.map((row) => ({ ...row, ...(dimensionsById.get(String(row[key])) ?? {}) }))
}

export function joinLoans(fact = [], dimensions = []) {
  return joinByKey(fact, dimensions, 'loan_dim_key')
}

export function formatMoney(value, compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(number(value))
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(number(value))
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number(value))
}
