import { useState, useCallback } from 'react'
import HeaderConciliacion from './HeaderConciliacion'
import MetricasCards from './MetricasCards'
import SeccionConciliacion from './SeccionConciliacion'
import ZonaSinAsignar from './ZonaSinAsignar'
import FooterSaldos from './FooterSaldos'
import { generarExcel } from '../utils/webhooks'
import { formatMoneda } from '../utils/formatters'

const SECCIONES_ORDER = [
  'pagos_no_contabilizados',
  'pagos_no_debitados',
  'cobranzas_no_contabilizadas',
  'cobranzas_no_acreditadas',
]

async function descargarExcel(res, banco, mes) {
  const texto = await res.clone().text()
  let bytes

  try {
    const binary = atob(texto.trim())
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
  } catch {
    const buffer = await res.arrayBuffer()
    bytes = new Uint8Array(buffer)
  }

  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Conciliacion_${banco}_${mes}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export default function StepConciliacion({ state, dispatch, onReset, onShowHelp }) {
  const [generandoExcel, setGenerandoExcel] = useState(false)
  const [excelError, setExcelError] = useState(null)

  const { secciones, sin_asignar, conciliados, sugerencias, saldo_extracto, saldo_contable, meta, matchingStatus, groqWarning } = state

  const todasEnSecciones = Object.values(secciones).flat()
  // Progreso = conciliados + secciones clasificadas (sin arrastres sin tocar) / total
  const totalItems = conciliados.length + sugerencias.length * 2 + todasEnSecciones.length + sin_asignar.length
  const resueltos = conciliados.length + todasEnSecciones.filter(p => p.origen !== 'arrastre').length
  const progress = totalItems > 0 ? Math.round((resueltos / totalItems) * 100) : 0

  const abs = (arr) => arr.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0)
  const saldo_conciliado =
    (Number(saldo_extracto) || 0)
    + abs(secciones.pagos_no_contabilizados)
    - abs(secciones.pagos_no_debitados)
    - abs(secciones.cobranzas_no_contabilizadas)
    + abs(secciones.cobranzas_no_acreditadas)
  const diferencia = saldo_conciliado - (Number(saldo_contable) || 0)

  const handleGenerarExcel = useCallback(async () => {
    if (matchingStatus === 'running') return

    if (diferencia !== 0) {
      const ok = window.confirm(
        `La diferencia actual es ${formatMoneda(diferencia)}. ¿Querés generar el Excel de todas formas?`
      )
      if (!ok) return
    }

    setGenerandoExcel(true)
    setExcelError(null)

    try {
      const payload = {
        meta,
        saldo_extracto,
        saldo_contable,
        secciones,
        sin_asignar,
      }
      const res = await generarExcel(payload)
      await descargarExcel(res, meta?.banco || 'banco', meta?.mes || 'mes')
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'El servidor tardó demasiado. Intentá de nuevo.'
        : `Error al generar el Excel: ${err.message}`
      setExcelError(msg)
    } finally {
      setGenerandoExcel(false)
    }
  }, [matchingStatus, diferencia, meta, saldo_extracto, saldo_contable, secciones, sin_asignar])

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderConciliacion
        meta={meta}
        progress={progress}
        matchingStatus={matchingStatus}
        diferencia={diferencia}
        onGenerarExcel={handleGenerarExcel}
        generandoExcel={generandoExcel}
        groqWarning={groqWarning}
        onReset={onReset}
        onShowHelp={onShowHelp}
      />

      <div className="max-w-6xl mx-auto px-6 py-6 pb-24 space-y-5">
        {matchingStatus === 'running' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-[#082e56] rounded-full animate-spin shrink-0" />
            <p className="text-sm text-blue-700">{state.matchingMsg || 'Analizando transacciones...'}</p>
            <div className="flex-1">
              <div className="w-full bg-blue-200 rounded-full h-1">
                <div
                  className="bg-[#082e56] rounded-full h-1 transition-all duration-500"
                  style={{ width: `${state.matchingProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-blue-600 shrink-0">{state.matchingProgress}%</span>
          </div>
        )}

        <MetricasCards
          secciones={secciones}
          sin_asignar={sin_asignar}
          conciliados={conciliados}
          sugerencias={sugerencias}
          saldo_extracto={saldo_extracto}
          saldo_contable={saldo_contable}
        />

        {sugerencias.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-amber-100 bg-amber-50">
              <h3 className="text-sm font-semibold text-gray-800">Sugerencias de la IA</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">{sugerencias.length}</span>
              <p className="text-xs text-gray-500 ml-1">Estos pares tienen monto similar — revisá si corresponden al mismo movimiento</p>
            </div>
            <div className="p-4 space-y-3">
              {sugerencias.map(sug => (
                <div key={sug.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="bg-white rounded p-2.5 border border-amber-100">
                      <p className="text-xs text-gray-500 mb-0.5">Extracto</p>
                      <p className="font-medium text-gray-800 text-xs leading-snug">{sug.extracto.descripcion}</p>
                      <p className="font-semibold text-gray-900 mt-1">{formatMoneda(sug.extracto.monto)}</p>
                    </div>
                    <div className="bg-white rounded p-2.5 border border-amber-100">
                      <p className="text-xs text-gray-500 mb-0.5">Mayor</p>
                      <p className="font-medium text-gray-800 text-xs leading-snug">{sug.mayor.descripcion}</p>
                      <p className="font-semibold text-gray-900 mt-1">{formatMoneda(sug.mayor.monto)}</p>
                    </div>
                  </div>
                  {sug.razon_match && <p className="text-xs text-gray-500 italic mb-3">IA: "{sug.razon_match}"</p>}
                  <div className="flex gap-2">
                    <button onClick={() => dispatch({ type: 'ACCEPT_SUGERENCIA', sugerenciaId: sug.id })} className="flex-1 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium">Aceptar</button>
                    <button onClick={() => dispatch({ type: 'REJECT_SUGERENCIA', sugerenciaId: sug.id })} className="flex-1 py-1.5 text-sm bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors font-medium">Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {SECCIONES_ORDER.map(seccionId => (
          <SeccionConciliacion
            key={seccionId}
            seccionId={seccionId}
            partidas={secciones[seccionId]}
            dispatch={dispatch}
          />
        ))}

        <ZonaSinAsignar partidas={sin_asignar} dispatch={dispatch} />

        {excelError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 flex-1">{excelError}</p>
            <button
              onClick={handleGenerarExcel}
              className="text-xs text-red-600 underline hover:text-red-800 shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      <FooterSaldos
        saldo_extracto={saldo_extracto}
        saldo_contable={saldo_contable}
        secciones={secciones}
        dispatch={dispatch}
      />
    </div>
  )
}
