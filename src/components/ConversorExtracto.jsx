import { useState, useRef, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { convertirExtracto, descargarExcelConversor } from '../utils/webhooks'
import { formatMoneda, formatFecha } from '../utils/formatters'

const COLS = [
  { key: 'fecha', label: 'Fecha', w: 100 },
  { key: 'descripcion', label: 'Descripción', w: 165 },
  { key: 'detalle', label: 'Detalle', w: 215 },
  { key: 'importe', label: 'Importe', w: 120, right: true, num: true },
  { key: 'saldo', label: 'Saldo', w: 130, right: true, num: true },
  { key: 'clasificacion', label: 'Clasificación', w: 195, ac: true },
  { key: 'nueva_clasificacion', label: 'Nueva clasif.', w: 175 },
  { key: 'tipo_movimiento', label: 'Tipo', w: 100, tipo: true },
]
const BADGE_W = 48
const TABLE_MIN_W = COLS.reduce((s, c) => s + c.w, 0) + BADGE_W

function Dropzone({ file, onFile }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all select-none
        ${drag ? 'border-[#082e56] bg-blue-50' : 'border-gray-200 hover:border-[#082e56] hover:bg-gray-50'}
        ${file ? 'border-green-400 bg-green-50' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".pdf,.xlsx,.xls" className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-green-700 truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">Click para reemplazar</p>
          </div>
        </div>
      ) : (
        <>
          <svg className="w-14 h-14 text-gray-300 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-base font-semibold text-gray-700">Arrastrá el extracto bancario aquí</p>
          <p className="text-sm text-gray-400 mt-1.5">PDF · XLSX · XLS</p>
          <p className="text-xs text-gray-300 mt-3">o hacé click para seleccionar</p>
        </>
      )}
    </div>
  )
}

function TopBar({ onVolver, onNuevo }) {
  return (
    <div className="bg-[#082e56] text-white px-6 py-4 shadow-md shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-9 h-9 rounded-full object-cover opacity-90" />
          <div>
            <h1 className="text-base font-bold tracking-wide">ConcilIA</h1>
            <p className="text-xs text-blue-300">Conversor de extractos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onNuevo && (
            <button onClick={onNuevo}
              className="text-xs text-blue-200 hover:text-white border border-blue-400/40 hover:border-white/60 rounded-lg px-3 py-1.5 transition-colors">
              ← Nuevo extracto
            </button>
          )}
          <button onClick={onVolver}
            className="text-xs text-blue-200 hover:text-white border border-blue-400/40 hover:border-white/60 rounded-lg px-3 py-1.5 transition-colors">
            Ir a Conciliación
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConversorExtracto({ onVolver }) {
  const [vista, setVista] = useState('upload')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filas, setFilas] = useState([])
  const [filasOrigen, setFilasOrigen] = useState([])
  const [stats, setStats] = useState(null)
  const [editingCell, setEditingCell] = useState(null) // { origIdx, col }
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [descargando, setDescargando] = useState(false)
  const parentRef = useRef(null)

  const clasificaciones = useMemo(() =>
    [...new Set(filas.map(f => f.clasificacion).filter(Boolean))].sort()
  , [filas])

  const filasFiltradas = useMemo(() => {
    let result = filas.map((f, idx) => ({ ...f, _origIdx: idx }))
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase()
      result = result.filter(r =>
        r.descripcion?.toLowerCase().includes(q) ||
        r.detalle?.toLowerCase().includes(q) ||
        r.clasificacion?.toLowerCase().includes(q) ||
        r.nueva_clasificacion?.toLowerCase().includes(q)
      )
    }
    if (filtroTipo !== 'todos') {
      result = result.filter(r => r.tipo_movimiento === filtroTipo)
    }
    return result
  }, [filas, filtroTexto, filtroTipo])

  const totales = useMemo(() => {
    const creditos = filasFiltradas.filter(r => Number(r.importe) > 0).reduce((s, r) => s + Number(r.importe), 0)
    const debitos = filasFiltradas.filter(r => Number(r.importe) < 0).reduce((s, r) => s + Number(r.importe), 0)
    return { creditos, debitos, neto: creditos + debitos }
  }, [filasFiltradas])

  const virtualizer = useVirtualizer({
    count: filasFiltradas.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  const handleConvertir = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const data = await convertirExtracto(file)
      if (!data?.filas) throw new Error('Respuesta inesperada del servidor.')
      const norm = data.filas.map(f => ({ ...f, nueva_clasificacion: f.nueva_clasificacion ?? '' }))
      setFilas(norm)
      setFilasOrigen(norm)
      setStats(data.stats)
      setFiltroTexto('')
      setFiltroTipo('todos')
      setEditingCell(null)
      setVista('tabla')
    } catch (err) {
      setError(err.name === 'AbortError'
        ? 'El servidor tardó demasiado. Intentá de nuevo.'
        : err.message || 'Hubo un problema procesando el archivo.')
    } finally {
      setLoading(false)
    }
  }, [file])

  const commitEdit = useCallback((origIdx, col, value) => {
    setFilas(prev => prev.map((f, i) => i === origIdx ? { ...f, [col]: value } : f))
    setEditingCell(null)
  }, [])

  const handleDescargar = useCallback(async () => {
    setDescargando(true)
    try {
      const nombre = (file?.name?.replace(/\.[^.]+$/, '') || 'extracto') + '_convertido.xlsx'
      const payload = filas.map(({ _origIdx, ...rest }) => rest)
      const res = await descargarExcelConversor(payload, nombre)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('content-disposition')
      const match = cd?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      a.download = match ? match[1].replace(/['"]/g, '') : nombre
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // no-op — could show toast in future
    } finally {
      setDescargando(false)
    }
  }, [filas, file])

  const handleNuevo = useCallback(() => {
    setVista('upload')
    setFile(null)
    setFilas([])
    setFilasOrigen([])
    setStats(null)
    setError(null)
    setEditingCell(null)
    setFiltroTexto('')
    setFiltroTipo('todos')
  }, [])

  // ── UPLOAD VIEW ─────────────────────────────────────────────────────────────
  if (vista === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar onVolver={onVolver} />
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold text-gray-800">Convertir extracto bancario</h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Normalizá cualquier extracto a formato unificado con clasificación contable automática
              </p>
            </div>
            <Dropzone file={file} onFile={setFile} />
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {loading ? (
              <div className="mt-6 flex items-center justify-center gap-3 py-3">
                <div className="w-5 h-5 border-2 border-[#082e56] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">Procesando extracto... puede demorar unos segundos</span>
              </div>
            ) : (
              <button
                onClick={handleConvertir}
                disabled={!file}
                className="mt-6 w-full py-3 text-sm font-semibold bg-[#082e56] text-white rounded-xl hover:bg-[#0a3d72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {file ? 'Convertir extracto' : 'Seleccioná un archivo para continuar'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── TABLE VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <TopBar onVolver={onVolver} onNuevo={handleNuevo} />

      {/* Stats bar */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-2.5 shrink-0">
          <div className="flex items-center gap-5 text-sm flex-wrap">
            <span className="text-gray-600">📄 <strong className="text-gray-800">{stats.total}</strong> movimientos</span>
            <span className="text-emerald-700">✅ <strong>{stats.por_regla}</strong> por reglas</span>
            <span className="text-amber-600">🤖 <strong>{stats.por_ia}</strong> por IA</span>
            {stats.unicas_ia > 0 && (
              <span className="text-amber-500">⚡ <strong>{stats.unicas_ia}</strong> descripciones únicas</span>
            )}
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0">
        <input
          type="text"
          placeholder="Buscar descripción, detalle o clasificación..."
          value={filtroTexto}
          onChange={e => setFiltroTexto(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#082e56] w-72"
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#082e56] bg-white"
        >
          <option value="todos">Todos los tipos</option>
          <option value="Credito">Solo créditos</option>
          <option value="Debito">Solo débitos</option>
        </select>
        {(filtroTexto || filtroTipo !== 'todos') && (
          <span className="text-xs text-gray-400">
            {filasFiltradas.length} resultado{filasFiltradas.length !== 1 ? 's' : ''}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setFilas(filasOrigen); setEditingCell(null) }}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Deshacer cambios
          </button>
          <button
            onClick={handleDescargar}
            disabled={descargando}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#082e56] text-white text-sm font-medium rounded-lg hover:bg-[#0a3d72] transition-colors disabled:opacity-60"
          >
            {descargando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 px-4 py-3 overflow-hidden flex flex-col min-h-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">

          {/* datalist for autocomplete */}
          <datalist id="clas-options">
            {clasificaciones.map(c => <option key={c} value={c} />)}
          </datalist>

          {/* Scrollable area — header sticky inside */}
          <div ref={parentRef} className="overflow-auto flex-1 min-h-0">
            <div style={{ minWidth: TABLE_MIN_W }}>

              {/* Sticky header */}
              <div className="sticky top-0 z-10 flex bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div style={{ width: BADGE_W, minWidth: BADGE_W }} className="px-3 py-3 shrink-0" />
                {COLS.map(col => (
                  <div key={col.key} style={{ width: col.w, minWidth: col.w }}
                    className={`px-2 py-3 shrink-0 ${col.right ? 'text-right' : ''}`}>
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Virtual rows */}
              <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualizer.getVirtualItems().map(vRow => {
                  const row = filasFiltradas[vRow.index]
                  const isIa = row.fuente === 'ia'
                  return (
                    <div
                      key={vRow.key}
                      style={{ position: 'absolute', top: 0, transform: `translateY(${vRow.start}px)`, width: '100%', height: 44 }}
                      className={`flex items-center border-b border-gray-100 text-sm ${isIa ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}`}
                    >
                      {/* Fuente badge */}
                      <div style={{ width: BADGE_W, minWidth: BADGE_W }} className="px-3 shrink-0 flex justify-center">
                        {isIa && (
                          <span
                            title="Clasificado por IA — revisá esta fila"
                            className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded px-1 py-0.5 leading-tight"
                          >
                            IA
                          </span>
                        )}
                      </div>

                      {COLS.map(col => {
                        const isEditing = editingCell?.origIdx === row._origIdx && editingCell?.col === col.key
                        const val = row[col.key]
                        return (
                          <div key={col.key} style={{ width: col.w, minWidth: col.w }}
                            className={`px-2 shrink-0 overflow-hidden ${col.right ? 'text-right' : ''}`}>
                            {isEditing ? (
                              col.tipo ? (
                                <select
                                  autoFocus
                                  defaultValue={val}
                                  onChange={e => commitEdit(row._origIdx, col.key, e.target.value)}
                                  onBlur={e => commitEdit(row._origIdx, col.key, e.target.value)}
                                  className="w-full border border-blue-400 rounded px-1 py-0.5 text-xs outline-none bg-white"
                                >
                                  <option value="Credito">Crédito</option>
                                  <option value="Debito">Débito</option>
                                </select>
                              ) : col.ac ? (
                                <input
                                  autoFocus
                                  list="clas-options"
                                  defaultValue={val}
                                  onBlur={e => commitEdit(row._origIdx, col.key, e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(row._origIdx, col.key, e.target.value) }}
                                  className="w-full border border-blue-400 rounded px-1 py-0.5 text-xs outline-none"
                                />
                              ) : (
                                <input
                                  autoFocus
                                  type={col.num ? 'number' : 'text'}
                                  step={col.num ? 'any' : undefined}
                                  defaultValue={val}
                                  onBlur={e => commitEdit(row._origIdx, col.key, col.num ? parseFloat(e.target.value) : e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(row._origIdx, col.key, col.num ? parseFloat(e.target.value) : e.target.value) }}
                                  className="w-full border border-blue-400 rounded px-1 py-0.5 text-xs outline-none"
                                />
                              )
                            ) : (
                              <div
                                className="truncate cursor-text rounded px-1 py-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
                                title={col.num ? undefined : String(val ?? '')}
                                onClick={() => setEditingCell({ origIdx: row._origIdx, col: col.key })}
                              >
                                {col.num ? (
                                  <span className={Number(val) < 0 ? 'text-red-600' : Number(val) > 0 ? 'text-emerald-700' : 'text-gray-300'}>
                                    {val != null ? formatMoneda(val) : '—'}
                                  </span>
                                ) : col.tipo ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium leading-tight
                                    ${val === 'Credito' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                    {val === 'Credito' ? 'Crédito' : val === 'Debito' ? 'Débito' : val ?? '—'}
                                  </span>
                                ) : col.key === 'fecha' ? (
                                  <span className="text-gray-600 font-mono text-xs">{formatFecha(val)}</span>
                                ) : col.key === 'detalle' ? (
                                  <span className="truncate text-xs text-gray-400">{val}</span>
                                ) : (
                                  val ? <span>{val}</span> : <span className="text-gray-300">—</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Totals footer */}
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center gap-6 text-xs flex-wrap">
            <span className="text-gray-400">
              {filasFiltradas.length} filas
              {filasFiltradas.length < filas.length && ` (de ${filas.length})`}
            </span>
            <span className="text-emerald-700 font-medium">↑ Créditos: {formatMoneda(totales.creditos)}</span>
            <span className="text-red-600 font-medium">↓ Débitos: {formatMoneda(totales.debitos)}</span>
            <span className="font-semibold text-gray-700">Neto: {formatMoneda(totales.neto)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
