import { formatMoneda } from '../utils/formatters'

export default function MetricasCards({ secciones, sin_asignar, conciliados, sugerencias: sugs, saldo_extracto, saldo_contable }) {
  const abs = (arr) => arr.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0)
  // Fórmula correcta de conciliación bancaria:
  // Saldo extracto + pagos_nc - pagos_nd - cobr_nc + cobr_na = Saldo contable
  const saldo_conciliado =
    (Number(saldo_extracto) || 0)
    + abs(secciones.pagos_no_contabilizados)
    - abs(secciones.pagos_no_debitados)
    - abs(secciones.cobranzas_no_contabilizadas)
    + abs(secciones.cobranzas_no_acreditadas)
  const diferencia = saldo_conciliado - (Number(saldo_contable) || 0)
  const sinMatch = sin_asignar.length

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <p className="text-xs text-gray-500 font-medium">Conciliados</p>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {conciliados.reduce((s, c) => s + (c.esGrupal ? (c.extracto?.length || 0) + (c.mayor?.length || 0) : 2), 0) / 2 | 0}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">pares conciliados</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <p className="text-xs text-gray-500 font-medium">Sugerencias IA</p>
        </div>
        <p className="text-2xl font-bold text-gray-900">{sugs.length}</p>
        <p className="text-xs text-gray-400 mt-0.5">pendientes de revisión</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <p className="text-xs text-gray-500 font-medium">Sin match</p>
        </div>
        <p className="text-2xl font-bold text-gray-900">{sinMatch}</p>
        <p className="text-xs text-gray-400 mt-0.5">sin asignar</p>
      </div>

      <div className={`border rounded-xl p-4 shadow-sm ${diferencia === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${diferencia === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="text-xs text-gray-500 font-medium">Diferencia actual</p>
        </div>
        <p className={`text-lg font-bold ${diferencia === 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatMoneda(diferencia)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {diferencia === 0 ? 'Conciliado' : 'Por resolver'}
        </p>
      </div>
    </div>
  )
}
