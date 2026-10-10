// Downloads rows as a CSV file (opens in Excel). Used by Reports. Values that start with = + - @ are prefixed so a spreadsheet never runs them as formulas.
export function downloadCsv(filename, header, rows) {
  const cell = (v) => {
    let t = v === null || v === undefined ? '' : String(v)
    if (/^[=+\-@]/.test(t)) t = `'${t}`
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
