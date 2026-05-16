export async function parsearArchivos(extracto, mayor, anterior) {
  const form = new FormData()
  form.append('extracto_bancario', extracto)
  form.append('mayor_contable', mayor)
  form.append('conciliacion_anterior', anterior)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 180000)

  try {
    const res = await fetch(import.meta.env.VITE_WEBHOOK_PARSING, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function generarExcel(payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    const res = await fetch(import.meta.env.VITE_WEBHOOK_EXCEL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
    return res
  } finally {
    clearTimeout(timeout)
  }
}
