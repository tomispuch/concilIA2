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

export async function convertirExtracto(archivo) {
  const form = new FormData()
  form.append('extracto', archivo)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)
  try {
    const res = await fetch(import.meta.env.VITE_WEBHOOK_CONVERTIR, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detalle || err.error || `Error del servidor: ${res.status}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function descargarExcelConversor(filas, nombreArchivo) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(import.meta.env.VITE_WEBHOOK_CONVERTIR_EXCEL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filas, nombre_archivo: nombreArchivo }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
    return res
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
