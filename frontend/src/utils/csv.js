export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (character === '\n') {
      row.push(cell.trim().replace(/\r$/, ''))
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim().replace(/\r$/, ''))
    if (row.some((value) => value !== '')) rows.push(row)
  }

  if (rows.length < 2) return []
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, ''))
  return rows.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => {
        const value = (values[index] ?? '').trim()
        if (value === '') return [header, null]
        const normalized = value.replace(/[$,%]/g, '').replace(/,/g, '')
        const numeric = Number(normalized)
        return [header, Number.isFinite(numeric) && /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(normalized) ? numeric : value]
      }),
    ),
  )
}
