import { useState } from 'react'
import { formatMoneda, formatFecha } from '../utils/formatters'
import EditFormInline from './EditFormInline'

const SECCIONES_LABELS = {
  pagos_no_contabilizados: 'Pagos no contabilizados',
  pagos_no_debitados: 'Pagos no debitados',
  cobranzas_no_contabilizadas: 'Cobranzas no contabilizadas',
  cobranzas_no_acreditadas: 'Cobranzas no acreditadas',
}

export default function PartidaRoja({ partida, location, seccionId, onAssign, onEdit }) {
  const [editando, setEditando] = useState(false)
  const isArrastre = partida.origen === 'arrastre'

  const handleSave = (changes) => {
    onEdit(changes)
    setEditando(false)
  }

  const handleAssign = (e) => {
    const target = e.target.value
    if (!target) return
    e.target.value = ''
    onAssign(target)
  }

  return (
    <div className={`border rounded-lg p-4 ${isArrastre ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            isArrastre
              ? 'bg-slate-100 text-slate-600 border-slate-300'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            {isArrastre ? 'Arrastre' : 'Sin match'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-xs text-gray-500 shrink-0">{formatFecha(partida.fecha)}</span>
              <span className="text-sm font-medium text-gray-800 truncate">{partida.descripcion}</span>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatMoneda(partida.monto)}</span>
            </div>
            {partida.referencia && (
              <p className="text-xs text-gray-400 mt-0.5">Ref: {partida.referencia}</p>
            )}
            {partida.editado && (
              <span className="text-xs text-blue-500">editado</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            onChange={handleAssign}
            defaultValue=""
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#082e56]/30 focus:border-[#082e56] text-gray-700"
          >
            <option value="" disabled>
              {location === 'sin_asignar' ? 'Asignar a...' : 'Mover a...'}
            </option>
            {Object.entries(SECCIONES_LABELS).map(([key, label]) => (
              key !== seccionId && (
                <option key={key} value={key}>{label}</option>
              )
            ))}
            {location === 'seccion' && (
              <option value="__sin_asignar__">Sin asignar</option>
            )}
          </select>
          <button
            onClick={() => setEditando(v => !v)}
            className="text-xs text-gray-500 hover:text-[#082e56] transition-colors border border-gray-200 rounded px-2 py-1 bg-white"
          >
            {editando ? 'Cerrar' : 'Editar'}
          </button>
        </div>
      </div>

      {editando && (
        <EditFormInline
          partida={partida}
          onSave={handleSave}
          onCancel={() => setEditando(false)}
        />
      )}
    </div>
  )
}
