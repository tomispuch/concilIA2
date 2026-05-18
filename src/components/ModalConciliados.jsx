import { formatMoneda, formatFecha } from '../utils/formatters'

function FilaPartida({ partida }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{formatFecha(partida.fecha)}</p>
      <p className="text-xs text-gray-800 leading-snug break-words">{partida.descripcion}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatMoneda(Math.abs(Number(partida.monto) || 0))}</p>
    </div>
  )
}

function PilaConciliada({ items }) {
  if (!Array.isArray(items)) return <FilaPartida partida={items} />
  return (
    <div className="space-y-2">
      {items.map((p, i) => <FilaPartida key={p.id || i} partida={p} />)}
    </div>
  )
}

export default function ModalConciliados({ conciliados, onClose, onDeshacer }) {
  if (!conciliados) return null

  const total = conciliados.reduce(
    (s, c) => s + (c.esGrupal ? (c.extracto?.length || 0) + (c.mayor?.length || 0) : 2),
    0
  ) / 2 | 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <h2 className="text-base font-bold text-gray-800">Pares conciliados</h2>
            <span className="text-xs font-semibold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">{total}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Header columnas */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-6 py-2 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Extracto bancario</span>
          <span>Mayor contable</span>
          <span className="w-16" />
        </div>

        {/* Lista */}
        <div className="divide-y divide-gray-100 overflow-y-auto" style={{ maxHeight: 520 }}>
          {conciliados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Sin pares conciliados todavía</p>
          ) : conciliados.map((c, i) => (
            <div key={c.id || i} className="grid grid-cols-[1fr_1fr_auto] gap-4 px-6 py-3 hover:bg-gray-50 transition-colors items-start">
              <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                <PilaConciliada items={c.extracto} />
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                <PilaConciliada items={c.mayor} />
              </div>
              <div className="flex items-center w-16 justify-end">
                <button
                  onClick={() => onDeshacer(c.id)}
                  className="text-xs text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded px-2 py-1 transition-colors"
                  title="Deshacer cruce"
                >
                  Deshacer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
