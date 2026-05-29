import { formatMoneda, formatFecha } from '../utils/formatters'
import { useState } from 'react'
import EditFormInline from './EditFormInline'

const TITULOS = {
  pagos_no_contabilizados: 'Pagos en banco no contabilizados',
  pagos_no_debitados: 'Pagos contabilizados no debitados en banco',
  cobranzas_no_contabilizadas: 'Cobranzas no contabilizadas',
  cobranzas_no_acreditadas: 'Cobranzas no acreditadas en banco',
}

const OTRAS = {
  pagos_no_contabilizados: ['pagos_no_debitados', 'cobranzas_no_contabilizadas', 'cobranzas_no_acreditadas'],
  pagos_no_debitados: ['pagos_no_contabilizados', 'cobranzas_no_contabilizadas', 'cobranzas_no_acreditadas'],
  cobranzas_no_contabilizadas: ['pagos_no_contabilizados', 'pagos_no_debitados', 'cobranzas_no_acreditadas'],
  cobranzas_no_acreditadas: ['pagos_no_contabilizados', 'pagos_no_debitados', 'cobranzas_no_contabilizadas'],
}

function FilaSeccion({ partida, seccionId, dispatch }) {
  const [editando, setEditando] = useState(false)
  const isArrastre = partida.origen === 'arrastre'
  const isAuto = partida.autoClasificado

  return (
    <div className={`border-b border-gray-50 last:border-0 px-4 py-2.5 hover:bg-gray-50 transition-colors ${isArrastre ? 'bg-slate-50/50' : ''} ${isAuto ? 'bg-amber-50/50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-gray-400 shrink-0 w-20">{formatFecha(partida.fecha)}</span>
            <span className="text-xs text-gray-800 flex-1 leading-snug break-words">{partida.descripcion}</span>
            {partida.referencia && (
              <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{partida.referencia}</span>
            )}
            <span className="text-sm font-semibold text-gray-900 shrink-0">{formatMoneda(Math.abs(Number(partida.monto) || 0))}</span>
          </div>
          {isArrastre && <span className="text-xs text-slate-500 ml-20">↳ arrastre mes anterior</span>}
          {isAuto && <span className="text-xs text-amber-600 font-medium ml-20">⚡ auto-clasificado — revisá si corresponde</span>}
          {partida.editado && <span className="text-xs text-blue-500 ml-20">editado</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isAuto && (
            <button
              onClick={() => dispatch({ type: 'UNASSIGN_FROM_SECTION', seccionId, partidaId: partida.id })}
              className="text-xs text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 bg-amber-50 rounded px-2 py-1 transition-colors"
              title="Mover a pendientes para cruzarlo manualmente"
            >
              Cruzar
            </button>
          )}
          <select
            onChange={e => {
              const v = e.target.value
              if (!v) return
              e.target.value = ''
              if (v === '__devolver__') {
                dispatch({ type: 'UNASSIGN_FROM_SECTION', seccionId, partidaId: partida.id })
              } else {
                dispatch({ type: 'REASSIGN_SECTION', fromSeccionId: seccionId, partidaId: partida.id, toSeccionId: v })
              }
            }}
            defaultValue=""
            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-500 focus:outline-none focus:border-[#082e56]"
          >
            <option value="" disabled>Mover</option>
            {OTRAS[seccionId].map(id => (
              <option key={id} value={id}>{TITULOS[id]}</option>
            ))}
            <option value="__devolver__">← Devolver a pendientes</option>
          </select>
          <button
            onClick={() => setEditando(v => !v)}
            className="text-xs text-gray-400 hover:text-[#082e56] border border-gray-200 rounded px-2 py-1"
          >
            Editar
          </button>
        </div>
      </div>
      {editando && (
        <div className="mt-2">
          <EditFormInline
            partida={partida}
            onSave={changes => {
              dispatch({ type: 'EDIT_PARTIDA', location: 'seccion', seccionId, partidaId: partida.id, changes })
              setEditando(false)
            }}
            onCancel={() => setEditando(false)}
          />
        </div>
      )}
    </div>
  )
}

export default function SeccionConciliacion({ seccionId, partidas, dispatch }) {
  const subtotal = partidas.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0)

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-800">{TITULOS[seccionId]}</h3>
          {partidas.length > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
              {partidas.length}
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-gray-800">{formatMoneda(subtotal)}</span>
      </div>

      {/* Header tipo Excel */}
      {partidas.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-100 border-b border-gray-200 text-xs text-gray-500 font-medium">
          <span className="w-20">Fecha</span>
          <span className="flex-1">Concepto</span>
          <span className="hidden sm:inline w-24 text-right">Referencia</span>
          <span className="w-28 text-right">Importe</span>
          <span className="w-32" />
        </div>
      )}

      {partidas.length === 0 ? (
        <div className="px-5 py-5 text-center text-sm text-gray-400">
          Sin partidas — los items asignados aparecerán acá
        </div>
      ) : (
        <div>
          {partidas.map(p => (
            <FilaSeccion key={p.id} partida={p} seccionId={seccionId} dispatch={dispatch} />
          ))}
        </div>
      )}
    </div>
  )
}
