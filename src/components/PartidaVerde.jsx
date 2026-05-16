import { formatMoneda, formatFecha } from '../utils/formatters'

export default function PartidaVerde({ partida, seccionId, onUndoMatch }) {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            Conciliado
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-xs text-gray-500">{formatFecha(partida.fecha)}</span>
              <span className="text-sm font-medium text-gray-800 truncate">{partida.descripcion}</span>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatMoneda(partida.monto)}</span>
            </div>
            {partida.match_descripcion && (
              <p className="text-xs text-gray-500 mt-1">
                Ref. mayor: {partida.match_descripcion}
                {partida.match_monto !== undefined && partida.match_monto !== partida.monto && (
                  <span className="ml-1 text-amber-600">({formatMoneda(partida.match_monto)})</span>
                )}
              </p>
            )}
            {partida.editado && (
              <span className="text-xs text-blue-500">editado</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onUndoMatch(seccionId, partida.id)}
          className="shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors underline"
        >
          Deshacer match
        </button>
      </div>
    </div>
  )
}
