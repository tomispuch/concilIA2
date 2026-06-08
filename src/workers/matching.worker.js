let resolveGroq = null

function montoIgual(a, b) {
  return Math.round(Math.abs(a) * 100) === Math.round(Math.abs(b) * 100)
}

function umbralAmarillo(monto) {
  const abs = Math.abs(monto)
  if (abs < 10000) return 0.01
  if (abs < 100000) return 0.005
  if (abs < 1000000) return 0.002
  return 0.001
}

function esCandidatoAmarillo(a, b) {
  if (Math.abs(a) === 0) return false
  const diff = Math.abs(Math.abs(a) - Math.abs(b))
  const pct = diff / Math.abs(a)
  return pct > 0 && pct < umbralAmarillo(a)
}

// Clasifica automáticamente una partida sin match en la sección que corresponde
function seccionAuto(partida) {
  if (partida.origen === 'extracto') {
    return partida.monto < 0 ? 'pagos_no_contabilizados' : 'cobranzas_no_contabilizadas'
  } else {
    return partida.monto < 0 ? 'pagos_no_debitados' : 'cobranzas_no_acreditadas'
  }
}

async function runMatching(n8nData) {
  const { extracto = [], mayor = [], pendientes_anteriores = [] } = n8nData

  const secciones = {
    pagos_no_contabilizados: [],
    pagos_no_debitados: [],
    cobranzas_no_contabilizadas: [],
    cobranzas_no_acreditadas: [],
  }
  const conciliados = []
  const sugerencias = []
  const sin_asignar = []

  const mayorUsado = new Set()
  const extractoMatcheado = new Set()
  const arrastreResuelto = new Set()

  // Paso 0: matchear arrastres contra transacciones del mes actual
  // Los arrastres "banco no libros" (pagos_nc, cobr_nc) se comparan con el MAYOR de este mes
  // Los arrastres "libros no banco" (pagos_nd, cobr_na) se comparan con el EXTRACTO de este mes
  for (const arr of pendientes_anteriores) {
    const esBancoNoLibros = arr.seccion === 'pagos_no_contabilizados' || arr.seccion === 'cobranzas_no_contabilizadas'
    const pool = esBancoNoLibros
      ? mayor.filter(m => !mayorUsado.has(m.id) && montoIgual(arr.monto, m.monto))
      : extracto.filter(e => !extractoMatcheado.has(e.id) && montoIgual(arr.monto, e.monto))

    if (pool.length === 0) continue

    // Elegir el más cercano en fecha
    const arrMs = new Date(arr.fecha).getTime()
    const best = pool.reduce((a, b) =>
      Math.abs(new Date(a.fecha).getTime() - arrMs) <= Math.abs(new Date(b.fecha).getTime() - arrMs) ? a : b
    )

    arrastreResuelto.add(arr.id ?? arr.descripcion + arr.monto)
    if (esBancoNoLibros) mayorUsado.add(best.id)
    else extractoMatcheado.add(best.id)

    // Ambos quedan conciliados: el arrastre se regularizó este mes
    conciliados.push({
      id: `carr_${arr.id ?? arr.descripcion}`,
      extracto: esBancoNoLibros
        ? { id: arr.id, fecha: arr.fecha, descripcion: arr.descripcion, monto: arr.monto, referencia: arr.referencia }
        : { id: best.id, fecha: best.fecha, descripcion: best.descripcion, monto: best.monto },
      mayor: esBancoNoLibros
        ? { id: best.id, fecha: best.fecha, descripcion: best.descripcion, monto: best.monto }
        : { id: arr.id, fecha: arr.fecha, descripcion: arr.descripcion, monto: arr.monto, referencia: arr.referencia },
      esArrastre: true,
    })
  }

  // Arrastres que no matchearon → van a su sección como partidas pendientes
  for (const p of pendientes_anteriores) {
    const pid = p.id ?? p.descripcion + p.monto
    if (arrastreResuelto.has(pid)) continue
    const seccion = p.seccion && secciones[p.seccion] ? p.seccion : 'pagos_no_contabilizados'
    secciones[seccion].push({ ...p, origen: 'arrastre', estado: 'rojo' })
  }

  self.postMessage({ type: 'progress', percent: 5, message: 'Incorporando arrastres del mes anterior...' })

  // Paso 1: matching exacto → verde → conciliados (NO a secciones)
  // Primera pasada: 1-a-1 exacto sin ambigüedad
  for (const ext of extracto) {
    if (Math.abs(ext.monto) === 0) continue
    const candidates = mayor.filter(m => !mayorUsado.has(m.id) && montoIgual(ext.monto, m.monto))
    if (candidates.length === 1) {
      const m = candidates[0]
      mayorUsado.add(m.id)
      extractoMatcheado.add(ext.id)
      conciliados.push({
        id: `c_${ext.id}`,
        extracto: { id: ext.id, fecha: ext.fecha, descripcion: ext.descripcion, monto: ext.monto, referencia: ext.referencia },
        mayor: { id: m.id, fecha: m.fecha, descripcion: m.descripcion, monto: m.monto, referencia: m.referencia },
      })
    }
  }

  // Segunda pasada: duplicados de monto exacto → emparejar por fecha más cercana
  for (const ext of extracto) {
    if (extractoMatcheado.has(ext.id) || Math.abs(ext.monto) === 0) continue
    const candidates = mayor.filter(m => !mayorUsado.has(m.id) && montoIgual(ext.monto, m.monto))
    if (candidates.length > 1) {
      // Elegir el candidato con fecha más cercana
      const extMs = new Date(ext.fecha).getTime()
      const best = candidates.reduce((a, b) =>
        Math.abs(new Date(a.fecha).getTime() - extMs) <= Math.abs(new Date(b.fecha).getTime() - extMs) ? a : b
      )
      mayorUsado.add(best.id)
      extractoMatcheado.add(ext.id)
      conciliados.push({
        id: `c_${ext.id}`,
        extracto: { id: ext.id, fecha: ext.fecha, descripcion: ext.descripcion, monto: ext.monto, referencia: ext.referencia },
        mayor: { id: best.id, fecha: best.fecha, descripcion: best.descripcion, monto: best.monto, referencia: best.referencia },
      })
    }
  }

  // Paso 1c: tercera pasada — exactos que quedaron tras resolver duplicados
  for (const ext of extracto) {
    if (extractoMatcheado.has(ext.id) || Math.abs(ext.monto) === 0) continue
    const candidates = mayor.filter(m => !mayorUsado.has(m.id) && montoIgual(ext.monto, m.monto))
    if (candidates.length >= 1) {
      const extMs = new Date(ext.fecha).getTime()
      const best = candidates.reduce((a, b) =>
        Math.abs(new Date(a.fecha).getTime() - extMs) <= Math.abs(new Date(b.fecha).getTime() - extMs) ? a : b
      )
      mayorUsado.add(best.id)
      extractoMatcheado.add(ext.id)
      conciliados.push({
        id: `c_${ext.id}`,
        extracto: { id: ext.id, fecha: ext.fecha, descripcion: ext.descripcion, monto: ext.monto, referencia: ext.referencia },
        mayor: { id: best.id, fecha: best.fecha, descripcion: best.descripcion, monto: best.monto, referencia: best.referencia },
      })
    }
  }

  self.postMessage({ type: 'progress', percent: 40, message: 'Matching exacto completado...' })

  // Paso 2: candidatos amarillos (diff < 5% pero NO exactos) → para Groq
  const extractoRojos = extracto.filter(t => !extractoMatcheado.has(t.id) && Math.abs(t.monto) > 0)
  const mayorRojos = mayor.filter(m => !mayorUsado.has(m.id) && Math.abs(m.monto) > 0)
  const candidatos = []
  const usadosEnCandidatos = new Set()

  for (const ext of extractoRojos) {
    for (const m of mayorRojos) {
      if (usadosEnCandidatos.has(ext.id) || usadosEnCandidatos.has(m.id)) continue
      if (esCandidatoAmarillo(ext.monto, m.monto)) {
        candidatos.push({ id: `cand_${ext.id}_${m.id}`, extracto_item: ext, mayor_item: m })
        usadosEnCandidatos.add(ext.id)
        usadosEnCandidatos.add(m.id)
      }
    }
  }

  self.postMessage({ type: 'progress', percent: 60, message: 'Enviando sugerencias a IA...' })

  let groqResultados = []
  if (candidatos.length > 0) {
    groqResultados = await new Promise(resolve => {
      resolveGroq = resolve
      self.postMessage({ type: 'necesita_groq', pares: candidatos })
    })
  }

  self.postMessage({ type: 'progress', percent: 80, message: 'Procesando respuesta de IA...' })

  // Paso 3: procesar Groq → sugerencias (NO a secciones)
  const groqMatcheados = new Set()
  for (const r of groqResultados) {
    const cand = candidatos.find(c => c.id === r.par_id)
    if (!cand || !r.match || r.confianza !== 'alta') continue
    groqMatcheados.add(cand.extracto_item.id)
    groqMatcheados.add(cand.mayor_item.id)
    sugerencias.push({
      id: `s_${cand.extracto_item.id}`,
      extracto: { id: cand.extracto_item.id, fecha: cand.extracto_item.fecha, descripcion: cand.extracto_item.descripcion, monto: cand.extracto_item.monto },
      mayor: { id: cand.mayor_item.id, fecha: cand.mayor_item.fecha, descripcion: cand.mayor_item.descripcion, monto: cand.mayor_item.monto },
      confianza: r.confianza,
      razon_match: r.razon,
    })
  }

  // Paso 5: subset sum N:1 → sugerencias de multi-matcheo
  function findSubsetSum(items, targetCents, maxSize = 10) {
    function search(start, current, sumCents) {
      if (sumCents === targetCents && current.length >= 2) return [...current]
      if (current.length >= maxSize || sumCents > targetCents) return null
      for (let i = start; i < items.length; i++) {
        current.push(items[i])
        const found = search(i + 1, current, sumCents + Math.round(Math.abs(items[i].monto) * 100))
        if (found) return found
        current.pop()
      }
      return null
    }
    return search(0, [], 0)
  }

  const multiMatcheadosExt = new Set()
  const multiMatcheadosMay = new Set()
  const sugerencias_multi = []

  const extLibres = extractoRojos.filter(e => !groqMatcheados.has(e.id))
  const mayLibres = mayorRojos.filter(m => !mayorUsado.has(m.id) && !groqMatcheados.has(m.id))

  if (extLibres.length <= 50) for (const m of mayLibres) {
    const targetCents = Math.round(Math.abs(m.monto) * 100)
    const disponibles = extLibres.filter(e => !multiMatcheadosExt.has(e.id))
    const grupo = findSubsetSum(disponibles, targetCents)
    if (grupo) {
      grupo.forEach(e => multiMatcheadosExt.add(e.id))
      multiMatcheadosMay.add(m.id)
      sugerencias_multi.push({ id: `multi_${m.id}`, extracto: grupo, mayor: m })
    }
  }

  // Paso 4: sin match → van a sin_asignar (el contador clasifica manualmente)
  for (const ext of extractoRojos) {
    if (groqMatcheados.has(ext.id) || multiMatcheadosExt.has(ext.id)) continue
    sin_asignar.push({ id: ext.id, origen: 'extracto', estado: 'rojo', fecha: ext.fecha, descripcion: ext.descripcion, monto: ext.monto, referencia: ext.referencia })
  }
  for (const m of mayorRojos) {
    if (mayorUsado.has(m.id) || groqMatcheados.has(m.id) || multiMatcheadosMay.has(m.id)) continue
    sin_asignar.push({ id: m.id, origen: 'mayor', estado: 'rojo', fecha: m.fecha, descripcion: m.descripcion, monto: m.monto, referencia: m.referencia })
  }

  // Extracto items con monto=0 (primera fila de PDF sin delta) → ignorar
  // Mayor items con monto=0 → ignorar

  self.postMessage({ type: 'progress', percent: 100, message: 'Análisis completado' })
  self.postMessage({ type: 'done', estado_final: { secciones, conciliados, sugerencias, sugerencias_multi, sin_asignar } })
}

self.onmessage = (e) => {
  if (e.data.type === 'start') {
    runMatching(e.data.data).catch(err => {
      self.postMessage({ type: 'error', mensaje: err.message })
    })
  } else if (e.data.type === 'respuesta_groq') {
    if (resolveGroq) {
      resolveGroq(e.data.resultados)
      resolveGroq = null
    }
  }
}
