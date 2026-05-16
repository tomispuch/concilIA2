import { formatMoneda, formatFecha } from '../utils/formatters'

export default function PartidaAmarilla({ partida, seccionId, onAccept, onReject }) {
  const diff = partida.match_monto !== undefined
    ? Math.abs(Math.abs(partida.monto) - Math.abs(partida.match_monto))
    : 0

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          Revisar
        </span>
        <span className="text-xs text-gray-500">{formatFecha(partida.fecha)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
        <div className="bg-white rounded p-2.5 border border-amber-100">
          <p className="text-xs text-gray-500 mb-0.5">Extracto</p>
          <p className="font-medium text-gray-800 text-xs leading-snug">{partida.descripcion}</p>
          <p className="font-semibold text-gray-900 mt-1">{formatMoneda(partida.monto)}</p>
        </div>
        <div className="bg-white rounded p-2.5 border border-amber-100">
          <p className="text-xs text-gray-500 mb-0.5">Mayor</p>
          <p className="font-medium text-gray-800 text-xs leading-snug">{partida.match_descripcion}</p>
          <p className="font-semibold text-gray-900 mt-1">
            {formatMoneda(partida.match_monto)}
            {diff > 0 && (
              <span className="ml-2 text-amber-600 text-xs font-normal">Diff: {formatMoneda(diff)}</span>
            )}
          </p>
        </div>
      </div>

      {partida.razon_match && (
        <p className="text-xs text-gray-500 italic mb-3">IA: "{partida.razon_match}"</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(seccionId, partida.id)}
          className="flex-1 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
        >
          Aceptar
        </button>
        <button
          onClick={() => onReject(seccionId, partida.id)}
          className="flex-1 py-1.5 text-sm bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors font-medium"
        >
          Rechazar
        </button>
      </div>
    </div>
  )
}
