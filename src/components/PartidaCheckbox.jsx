import { useState } from 'react'
import { formatMoneda, formatFecha } from '../utils/formatters'
import EditFormInline from './EditFormInline'

export default function PartidaCheckbox({ partida, checked, onToggle, onEdit, onMover, seccionId, otherSecciones }) {
  const [editando, setEditando] = useState(false)
  const isArrastre = partida.origen === 'arrastre'

  const badgeClass = isArrastre
    ? 'bg-slate-100 text-slate-600 border-slate-300'
    : 'bg-red-100 text-red-700 border-red-200'

  return (
    <div className={`border rounded-lg p-2.5 transition-all cursor-pointer ${
      checked
        ? 'border-[#082e56] bg-blue-50 shadow-sm'
        : isArrastre
          ? 'bg-white border-slate-200 hover:border-slate-400'
          : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 w-4 h-4 accent-[#082e56] cursor-pointer shrink-0"
          onClick={e => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0" onClick={onToggle}>
          {/* Línea 1: badge + fecha + monto */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
                {isArrastre ? 'Arrastre' : 'Sin match'}
              </span>
              <span className="text-xs text-gray-400 shrink-0">{formatFecha(partida.fecha)}</span>
            </div>
            <span className="text-xs font-bold text-gray-900 whitespace-nowrap shrink-0">
              {formatMoneda(Math.abs(partida.monto))}
            </span>
          </div>
          {/* Línea 2: descripción completa */}
          <p className="text-xs text-gray-700 leading-snug break-words">
            {partida.descripcion}
          </p>
          {/* Línea 3: referencia si hay */}
          {partida.referencia && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">Ref: {partida.referencia}</p>
          )}
          {partida.editado && <span className="text-xs text-blue-500">editado</span>}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-gray-100">
        <select
          onChange={(e) => { if (e.target.value) { onMover(e.target.value); e.target.value = '' } }}
          defaultValue=""
          onClick={e => e.stopPropagation()}
          className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-500 focus:outline-none focus:border-[#082e56]"
        >
          <option value="" disabled>Mover a otra sección...</option>
          {otherSecciones.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
          <option value="__fuera__">Quitar de sección</option>
        </select>
        <button
          onClick={(e) => { e.stopPropagation(); setEditando(v => !v) }}
          className="text-xs text-gray-400 hover:text-[#082e56] border border-gray-200 rounded px-2 py-1 bg-white whitespace-nowrap"
        >
          {editando ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {editando && (
        <EditFormInline
          partida={partida}
          onSave={(changes) => { onEdit(changes); setEditando(false) }}
          onCancel={() => setEditando(false)}
        />
      )}
    </div>
  )
}
