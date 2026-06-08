import { useReducer, useRef, useCallback, useState } from 'react'
import StepUpload from './components/StepUpload'
import StepConciliacion from './components/StepConciliacion'
import ConversorExtracto from './components/ConversorExtracto'
import Loader from './components/Loader'
import HowItWorks from './components/HowItWorks'
import { parsearArchivos } from './utils/webhooks'
import { matchearSemantico } from './utils/groq'
import MatchingWorker from './workers/matching.worker.js?worker'

const SECCION_MAP = {
  pagos_banco_no_contab: 'pagos_no_contabilizados',
  pagos_contab_no_debitados: 'pagos_no_debitados',
  cobr_no_contab: 'cobranzas_no_contabilizadas',
  cobr_no_acreditadas: 'cobranzas_no_acreditadas',
}

// Convierte cualquier valor a número seguro (maneja strings con formato argentino)
function safeNum(v) {
  if (v == null) return 0
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  const s = String(v).trim().replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function normalizeN8nResponse(data) {
  const rawExt = data.extracto ?? []
  const extracto = rawExt.map((t, i) => {
    const credito = safeNum(t.credito)
    const debito = safeNum(t.debito)
    let monto
    if (t.monto != null) {
      monto = safeNum(t.monto)
    } else if (credito !== 0 || debito !== 0) {
      // N8N detectó columnas débito/crédito correctamente
      monto = credito - debito
    } else if (i > 0) {
      // Fallback PDF: delta entre saldos consecutivos
      // saldo sube → crédito (positivo), baja → débito (negativo)
      monto = safeNum(t.saldo) - safeNum(rawExt[i - 1].saldo)
    } else {
      monto = 0
    }
    return {
      id: t.id ?? `e${i + 1}`,
      fecha: t.fecha ?? '',
      descripcion: t.descripcion ?? '',
      referencia: t.comprobante ?? t.referencia ?? '',
      monto,
    }
  })

  const rawMay = data.mayor ?? []
  const mayor = rawMay.map((t, i) => {
    const debe = safeNum(t.debe)
    const haber = safeNum(t.haber)
    let monto
    if (t.monto != null) {
      monto = safeNum(t.monto)
    } else if (debe !== 0 || haber !== 0) {
      // debe = movimiento positivo en cuenta banco (depósito)
      // haber = movimiento negativo (pago)
      monto = debe - haber
    } else if (i > 0) {
      // Fallback delta saldo
      monto = safeNum(t.saldo) - safeNum(rawMay[i - 1].saldo)
    } else {
      monto = 0
    }
    return {
      id: t.id ?? `m${i + 1}`,
      fecha: t.fecha ?? '',
      descripcion: t.descripcion ?? t.comentario ?? t.nombre ?? t.comprobante ?? '',
      referencia: t.comprobante ?? t.referencia ?? '',
      monto,
    }
  })

  const pendientes_anteriores = (data.pendientes_anteriores ?? []).map((p, i) => ({
    id: p.id ?? `arr${i + 1}`,
    fecha: p.fecha ?? '',
    descripcion: p.descripcion ?? '',
    referencia: p.referencia ?? '',
    monto: safeNum(p.monto ?? p.importe),
    seccion: SECCION_MAP[p.seccion] ?? p.seccion ?? 'pagos_no_contabilizados',
  }))

  // Saldos desde el response o del último row
  const saldo_extracto = data.saldo_extracto != null
    ? safeNum(data.saldo_extracto)
    : safeNum(rawExt[rawExt.length - 1]?.saldo)

  const saldo_contable = data.saldo_contable != null
    ? safeNum(data.saldo_contable)
    : safeNum(rawMay[rawMay.length - 1]?.saldo)

  // Derivar mes de la fecha más reciente del extracto
  let mes = data.mes ?? ''
  if (!mes && extracto.length > 0) {
    const fechas = extracto.map(t => t.fecha).filter(Boolean).sort()
    if (fechas.length > 0) {
      const [y, m] = fechas[fechas.length - 1].split('-')
      mes = `${m}-${y}`
    }
  }

  return {
    empresa: data.empresa ?? '',
    banco: data.banco ?? '',
    mes,
    saldo_extracto,
    saldo_contable,
    extracto,
    mayor,
    pendientes_anteriores,
  }
}

const initialState = {
  step: 'upload',
  loading: false,
  loadingMsg: '',
  error: null,
  meta: null,
  saldo_extracto: 0,
  saldo_contable: 0,
  matchingProgress: 0,
  matchingMsg: '',
  matchingStatus: 'idle',
  groqWarning: false,
  conciliados: [],
  sugerencias: [],
  sugerencias_multi: [],
  secciones: {
    pagos_no_contabilizados: [],
    pagos_no_debitados: [],
    cobranzas_no_contabilizadas: [],
    cobranzas_no_acreditadas: [],
  },
  sin_asignar: [],
  archivos: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading, loadingMsg: action.msg || '' }
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_ARCHIVOS':
      return { ...state, archivos: action.archivos }
    case 'INIT_CONCILIACION':
      return {
        ...state,
        loading: false,
        error: null,
        step: 'conciliacion',
        meta: action.meta,
        saldo_extracto: action.saldo_extracto,
        saldo_contable: action.saldo_contable,
        matchingStatus: 'running',
        matchingProgress: 0,
        matchingMsg: 'Iniciando análisis...',
        groqWarning: false,
        conciliados: [],
        sugerencias: [],
        sugerencias_multi: [],
        secciones: { pagos_no_contabilizados: [], pagos_no_debitados: [], cobranzas_no_contabilizadas: [], cobranzas_no_acreditadas: [] },
        sin_asignar: [],
      }
    case 'MATCHING_PROGRESS':
      return { ...state, matchingProgress: action.percent, matchingMsg: action.message }
    case 'MATCHING_DONE':
      return {
        ...state,
        matchingStatus: 'done',
        matchingProgress: 100,
        conciliados: action.conciliados,
        sugerencias: action.sugerencias,
        sugerencias_multi: action.sugerencias_multi,
        secciones: action.secciones,
        sin_asignar: action.sin_asignar,
      }
    case 'MATCHING_ERROR':
      return { ...state, matchingStatus: 'done', matchingProgress: 100 }
    case 'GROQ_WARNING':
      return { ...state, groqWarning: true }
    case 'SET_SALDO':
      return { ...state, [action.campo]: action.valor }
    case 'RESET':
      return { ...initialState }
    case 'GOTO_CONVERSOR':
      return { ...state, step: 'conversor' }
    case 'VOLVER_UPLOAD':
      return { ...state, step: 'upload' }
    case 'CRUCE_MANUAL': {
      const { bancoIds, librosIds } = action
      const banco = state.sin_asignar.filter(p => bancoIds.includes(p.id))
      const libros = state.sin_asignar.filter(p => librosIds.includes(p.id))
      const restantes = state.sin_asignar.filter(p => !bancoIds.includes(p.id) && !librosIds.includes(p.id))
      return {
        ...state,
        sin_asignar: restantes,
        conciliados: [...state.conciliados, {
          id: `cruce_${Date.now()}`,
          esGrupal: true,
          extracto: banco,
          mayor: libros,
          monto_extracto: banco.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0),
          monto_mayor: libros.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0),
        }],
      }
    }
    case 'MATCH_GRUPAL': {
      const { seccionId, extractoIds, mayorIds } = action
      const items = state.secciones[seccionId]
      const extMatched = items.filter(p => extractoIds.includes(p.id))
      const mayMatched = items.filter(p => mayorIds.includes(p.id))
      const remaining = items.filter(p => !extractoIds.includes(p.id) && !mayorIds.includes(p.id))
      const match = {
        id: `grp_${Date.now()}`,
        esGrupal: true,
        extracto: extMatched,
        mayor: mayMatched,
        monto_extracto: extMatched.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0),
        monto_mayor: mayMatched.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0),
      }
      return {
        ...state,
        secciones: { ...state.secciones, [seccionId]: remaining },
        conciliados: [...state.conciliados, match],
      }
    }

    case 'ACCEPT_SUGERENCIA_MULTI': {
      const { sugerenciaId } = action
      const sug = state.sugerencias_multi.find(s => s.id === sugerenciaId)
      if (!sug) return state
      return {
        ...state,
        sugerencias_multi: state.sugerencias_multi.filter(s => s.id !== sugerenciaId),
        conciliados: [...state.conciliados, {
          id: sug.id.replace(/^multi_/, 'c_multi_'),
          esGrupal: true,
          extracto: sug.extracto,
          mayor: [sug.mayor],
          monto_extracto: sug.extracto.reduce((s, e) => s + Math.abs(Number(e.monto) || 0), 0),
          monto_mayor: Math.abs(Number(sug.mayor.monto) || 0),
        }],
      }
    }
    case 'REJECT_SUGERENCIA_MULTI': {
      const { sugerenciaId } = action
      const sug = state.sugerencias_multi.find(s => s.id === sugerenciaId)
      if (!sug) return state
      const extItems = sug.extracto.map(e => ({ ...e, origen: 'extracto', estado: 'rojo' }))
      const mayItem = { ...sug.mayor, origen: 'mayor', estado: 'rojo' }
      return {
        ...state,
        sugerencias_multi: state.sugerencias_multi.filter(s => s.id !== sugerenciaId),
        sin_asignar: [...state.sin_asignar, ...extItems, mayItem],
      }
    }
    // Sugerencia aceptada → pasa a conciliados
    case 'ACCEPT_SUGERENCIA': {
      const { sugerenciaId } = action
      const sug = state.sugerencias.find(s => s.id === sugerenciaId)
      if (!sug) return state
      return {
        ...state,
        sugerencias: state.sugerencias.filter(s => s.id !== sugerenciaId),
        conciliados: [...state.conciliados, { ...sug, id: sug.id.replace(/^s_/, 'c_') }],
      }
    }
    // Sugerencia rechazada → ambos lados vuelven a sus secciones auto-clasificadas
    case 'REJECT_SUGERENCIA': {
      const { sugerenciaId } = action
      const sug = state.sugerencias.find(s => s.id === sugerenciaId)
      if (!sug) return state
      const extItem = { id: sug.extracto.id, origen: 'extracto', estado: 'rojo', ...sug.extracto }
      const mayItem = { id: sug.mayor.id, origen: 'mayor', estado: 'rojo', ...sug.mayor }
      const secExt = sug.extracto.monto < 0 ? 'pagos_no_contabilizados' : 'cobranzas_no_contabilizadas'
      const secMay = sug.mayor.monto < 0 ? 'pagos_no_debitados' : 'cobranzas_no_acreditadas'
      return {
        ...state,
        sugerencias: state.sugerencias.filter(s => s.id !== sugerenciaId),
        secciones: {
          ...state.secciones,
          [secExt]: [...state.secciones[secExt], extItem],
          [secMay]: [...state.secciones[secMay], mayItem],
        },
      }
    }
    // Deshacer match conciliado → ambos lados vuelven a secciones
    case 'UNDO_CONCILIADO': {
      const { conciliadoId } = action
      const conc = state.conciliados.find(c => c.id === conciliadoId)
      if (!conc) return state
      const extItem = { id: conc.extracto.id, origen: 'extracto', estado: 'rojo', ...conc.extracto }
      const mayItem = { id: conc.mayor.id, origen: 'mayor', estado: 'rojo', ...conc.mayor }
      const secExt = conc.extracto.monto < 0 ? 'pagos_no_contabilizados' : 'cobranzas_no_contabilizadas'
      const secMay = conc.mayor.monto < 0 ? 'pagos_no_debitados' : 'cobranzas_no_acreditadas'
      return {
        ...state,
        conciliados: state.conciliados.filter(c => c.id !== conciliadoId),
        secciones: {
          ...state.secciones,
          [secExt]: [...state.secciones[secExt], extItem],
          [secMay]: [...state.secciones[secMay], mayItem],
        },
      }
    }
    case 'AUTO_CLASIFICAR_PENDIENTES': {
      const esBanco = p => p.origen === 'extracto' ||
        (p.origen === 'arrastre' && p._seccionOrigen !== 'pagos_no_debitados' && p._seccionOrigen !== 'cobranzas_no_acreditadas')
      const bancoPart = state.sin_asignar.filter(esBanco).map(p => ({ ...p, autoClasificado: true }))
      const librosPart = state.sin_asignar.filter(p => !esBanco(p)).map(p => ({ ...p, autoClasificado: true }))
      return {
        ...state,
        sin_asignar: [],
        secciones: {
          ...state.secciones,
          pagos_no_contabilizados: [...state.secciones.pagos_no_contabilizados, ...bancoPart],
          pagos_no_debitados: [...state.secciones.pagos_no_debitados, ...librosPart],
        },
      }
    }
    case 'ASSIGN_SECTION': {
      const { partidaId, targetSeccionId } = action
      const partida = state.sin_asignar.find(p => p.id === partidaId)
      if (!partida) return state
      return {
        ...state,
        sin_asignar: state.sin_asignar.filter(p => p.id !== partidaId),
        secciones: { ...state.secciones, [targetSeccionId]: [...state.secciones[targetSeccionId], partida] },
      }
    }
    case 'REASSIGN_SECTION': {
      const { fromSeccionId, partidaId, toSeccionId } = action
      const partida = state.secciones[fromSeccionId]?.find(p => p.id === partidaId)
      if (!partida) return state
      return {
        ...state,
        secciones: {
          ...state.secciones,
          [fromSeccionId]: state.secciones[fromSeccionId].filter(p => p.id !== partidaId),
          [toSeccionId]: [...state.secciones[toSeccionId], partida],
        },
      }
    }
    case 'UNASSIGN_FROM_SECTION': {
      const { seccionId, partidaId } = action
      const partida = state.secciones[seccionId]?.find(p => p.id === partidaId)
      if (!partida) return state
      return {
        ...state,
        secciones: { ...state.secciones, [seccionId]: state.secciones[seccionId].filter(p => p.id !== partidaId) },
        sin_asignar: [...state.sin_asignar, partida],
      }
    }
    case 'EDIT_PARTIDA': {
      const { location, seccionId, partidaId, changes } = action
      if (location === 'sin_asignar') {
        return { ...state, sin_asignar: state.sin_asignar.map(p => p.id === partidaId ? { ...p, ...changes, editado: true } : p) }
      }
      return {
        ...state,
        secciones: {
          ...state.secciones,
          [seccionId]: state.secciones[seccionId].map(p => p.id === partidaId ? { ...p, ...changes, editado: true } : p),
        },
      }
    }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [showHelp, setShowHelp] = useState(false)
  const workerRef = useRef(null)

  const setupWorker = useCallback((n8nData) => {
    if (workerRef.current) workerRef.current.terminate()
    const worker = new MatchingWorker()

    worker.onmessage = async (e) => {
      const { type } = e.data
      if (type === 'progress') {
        dispatch({ type: 'MATCHING_PROGRESS', percent: e.data.percent, message: e.data.message })
      } else if (type === 'necesita_groq') {
        try {
          const resultados = await matchearSemantico(e.data.pares)
          worker.postMessage({ type: 'respuesta_groq', resultados })
        } catch {
          dispatch({ type: 'GROQ_WARNING' })
          worker.postMessage({ type: 'respuesta_groq', resultados: [] })
        }
      } else if (type === 'done') {
        const ef = e.data.estado_final
        dispatch({ type: 'MATCHING_DONE', secciones: ef.secciones, conciliados: ef.conciliados, sugerencias: ef.sugerencias, sugerencias_multi: ef.sugerencias_multi ?? [], sin_asignar: ef.sin_asignar })
      } else if (type === 'error') {
        dispatch({ type: 'MATCHING_ERROR' })
      }
    }

    worker.onerror = () => dispatch({ type: 'MATCHING_ERROR' })
    workerRef.current = worker
    worker.postMessage({ type: 'start', data: n8nData })
  }, [])

  const handleAnalizar = useCallback(async (extracto, mayor, anterior) => {
    dispatch({ type: 'SET_LOADING', loading: true, msg: 'Procesando archivos...' })
    dispatch({ type: 'SET_ARCHIVOS', archivos: { extracto, mayor, anterior } })
    try {
      const raw = await parsearArchivos(extracto, mayor, anterior)
      console.log('[ConcilIA] Respuesta N8N raw:', raw)
      const data = normalizeN8nResponse(raw)
      console.log('[ConcilIA] Normalizado:', data)
      dispatch({
        type: 'INIT_CONCILIACION',
        meta: { empresa: data.empresa, banco: data.banco, mes: data.mes },
        saldo_extracto: data.saldo_extracto,
        saldo_contable: data.saldo_contable,
      })
      setupWorker(data)
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'El servidor tardó demasiado. Verificá la conexión e intentá de nuevo.'
        : `Error al procesar los archivos: ${err.message}`
      dispatch({ type: 'SET_ERROR', error: msg })
    }
  }, [setupWorker])

  const handleReset = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate()
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {showHelp && <HowItWorks onClose={() => setShowHelp(false)} />}
      {state.loading && <Loader message={state.loadingMsg} />}
      {state.step === 'upload' && (
        <StepUpload
          onAnalizar={handleAnalizar}
          error={state.error}
          onClearError={() => dispatch({ type: 'CLEAR_ERROR' })}
          onShowHelp={() => setShowHelp(true)}
          onGoConversor={() => dispatch({ type: 'GOTO_CONVERSOR' })}
        />
      )}
      {state.step === 'conciliacion' && (
        <StepConciliacion
          state={state}
          dispatch={dispatch}
          onReset={handleReset}
          onShowHelp={() => setShowHelp(true)}
        />
      )}
      {state.step === 'conversor' && (
        <ConversorExtracto onVolver={() => dispatch({ type: 'VOLVER_UPLOAD' })} />
      )}
    </div>
  )
}
