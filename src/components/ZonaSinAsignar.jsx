import { useState, useMemo } from 'react'
import { formatMoneda, formatFecha } from '../utils/formatters'
import EditFormInline from './EditFormInline'

const SECCIONES = [
  { id: 'pagos_no_contabilizados', label: 'Pagos banco no contabilizados' },
  { id: 'pagos_no_debitados', label: 'Pagos contab. no debitados' },
  { id: 'cobranzas_no_contabilizadas', label: 'Cobr. no contabilizadas' },
  { id: 'cobranzas_no_acreditadas', label: 'Cobr. no acreditadas' },
]

function sortear(items, orden) {
  const s = [...items]
  if (orden === 'fecha_asc') s.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  if (orden === 'fecha_desc') s.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  if (orden === 'monto_asc') s.sort((a, b) => Math.abs(a.monto) - Math.abs(b.monto))
  if (orden === 'monto_desc') s.sort((a, b) => Math.abs(b.monto) - Math.abs(a.monto))
  if (orden === 'desc_asc') s.sort((a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''))
  return s
}

function ItemColumna({ partida, checked, onToggle, onAsignar, onEdit, tipo }) {
  const [editando, setEditando] = useState(false)
  const isArr = partida.origen === 'arrastre'
  const borderSel = tipo === 'banco' ? 'border-blue-400 bg-blue-50' : 'border-purple-400 bg-purple-50'
  const borderNorm = tipo === 'banco'
    ? (isArr ? 'border-slate-200 bg-slate-50' : 'border-blue-100 bg-white hover:border-blue-300')
    : (isArr ? 'border-slate-200 bg-slate-50' : 'border-purple-100 bg-white hover:border-purple-300')

  return (
    <div className={`border rounded-lg p-2.5 transition-all ${checked ? borderSel : borderNorm}`}>
      <div className="flex items-start gap-2 cursor-pointer" onClick={onToggle}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          className="mt-0.5 w-4 h-4 accent-[#082e56] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1">
              {isArr && <span className="text-xs text-slate-500 font-medium border border-slate-300 rounded px-1">arrastre</span>}
              <span className="text-xs text-gray-400">{formatFecha(partida.fecha)}</span>
            </div>
            <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
              {formatMoneda(Math.abs(Number(partida.monto) || 0))}
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-snug break-words">{partida.descripcion}</p>
          {partida.referencia && <p className="text-xs text-gray-400 mt-0.5">Ref: {partida.referencia}</p>}
        </div>
      </div>
      <div className="flex gap-1 mt-2 pt-1.5 border-t border-gray-100">
        <select
          onChange={e => { if (e.target.value) { onAsignar(e.target.value); e.target.value = '' } }}
          defaultValue=""
          onClick={e => e.stopPropagation()}
          className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-500 focus:outline-none"
        >
          <option value="" disabled>Asignar a sección...</option>
          {SECCIONES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button
          onClick={e => { e.stopPropagation(); setEditando(v => !v) }}
          className="text-xs text-gray-400 hover:text-[#082e56] border border-gray-200 rounded px-2 py-1 bg-white"
        >
          Editar
        </button>
      </div>
      {editando && (
        <EditFormInline
          partida={partida}
          onSave={changes => { onEdit(changes); setEditando(false) }}
          onCancel={() => setEditando(false)}
        />
      )}
    </div>
  )
}

function OrdenSelect({ value, onChange, colorClass }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`text-xs border rounded px-2 py-1 bg-white focus:outline-none ${colorClass}`}
    >
      <option value="fecha_asc">Fecha ↑</option>
      <option value="fecha_desc">Fecha ↓</option>
      <option value="monto_asc">Monto ↑</option>
      <option value="monto_desc">Monto ↓</option>
      <option value="desc_asc">Descripción A→Z</option>
    </select>
  )
}

export default function ZonaSinAsignar({ partidas, dispatch }) {
  const [selBanco, setSelBanco] = useState(new Set())
  const [selLibros, setSelLibros] = useState(new Set())
  const [ordenBanco, setOrdenBanco] = useState('fecha_asc')
  const [ordenLibros, setOrdenLibros] = useState('fecha_asc')
  const [busquedaBanco, setBusquedaBanco] = useState('')
  const [busquedaLibros, setBusquedaLibros] = useState('')

  const matchBusqueda = (p, q) => {
    if (!q) return true
    const ql = q.toLowerCase()
    const montoAbs = Math.abs(Number(p.monto) || 0)
    return (
      p.descripcion?.toLowerCase().includes(ql) ||
      String(montoAbs).includes(ql) ||
      formatMoneda(montoAbs).includes(ql)
    )
  }

  const itemsBanco = useMemo(() =>
    sortear(partidas.filter(p => p.origen === 'extracto' || (p.origen === 'arrastre' && p._seccionOrigen !== 'pagos_no_debitados' && p._seccionOrigen !== 'cobranzas_no_acreditadas'))
      .filter(p => matchBusqueda(p, busquedaBanco)),
    ordenBanco),
  [partidas, ordenBanco, busquedaBanco])

  const itemsLibros = useMemo(() =>
    sortear(partidas.filter(p => p.origen === 'mayor' || (p.origen === 'arrastre' && (p._seccionOrigen === 'pagos_no_debitados' || p._seccionOrigen === 'cobranzas_no_acreditadas')))
      .filter(p => matchBusqueda(p, busquedaLibros)),
    ordenLibros),
  [partidas, ordenLibros, busquedaLibros])

  const toggleBanco = (id) => setSelBanco(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleLibros = (id) => setSelLibros(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selBancoItems = itemsBanco.filter(p => selBanco.has(p.id))
  const selLibrosItems = itemsLibros.filter(p => selLibros.has(p.id))
  const sumBanco = selBancoItems.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0)
  const sumLibros = selLibrosItems.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0)
  const puedeMarcar = selBanco.size > 0 && selLibros.size > 0
  const dif = Math.abs(sumBanco - sumLibros)

  const handleCruce = () => {
    const pct = Math.max(sumBanco, sumLibros) > 0 ? dif / Math.max(sumBanco, sumLibros) : 0
    if (pct > 0.05 && !window.confirm(`Diferencia de ${formatMoneda(dif)} (${(pct * 100).toFixed(1)}%). ¿Confirmar cruce?`)) return
    dispatch({ type: 'CRUCE_MANUAL', bancoIds: [...selBanco], librosIds: [...selLibros] })
    setSelBanco(new Set())
    setSelLibros(new Set())
  }

  const handleAsignarMasivo = (seccionId) => {
    const todos = [...selBanco, ...selLibros]
    todos.forEach(id => dispatch({ type: 'ASSIGN_SECTION', partidaId: id, targetSeccionId: seccionId }))
    setSelBanco(new Set())
    setSelLibros(new Set())
  }

  if (partidas.length === 0) return (
    <div className="bg-white border border-green-200 rounded-xl p-5 text-center">
      <p className="text-green-600 font-medium text-sm">✓ Todos los movimientos están clasificados</p>
    </div>
  )

  const haySeleccion = selBanco.size > 0 || selLibros.size > 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold">Movimientos pendientes</h3>
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{partidas.length}</span>
          <span className="text-xs text-gray-400">— seleccioná items en ambas columnas para marcar un cruce</span>
          <div className="relative group">
            <button className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold flex items-center justify-center transition-colors">?</button>
            <div className="absolute left-0 top-6 z-20 w-72 bg-gray-900 text-gray-100 text-xs rounded-lg p-3 shadow-xl hidden group-hover:block leading-relaxed">
              <p className="font-semibold text-white mb-1">¿Por qué estos movimientos están acá?</p>
              <p>El sistema no pudo encontrar una contraparte automática para ellos. Asignarlos sin confirmación sería adivinar y podría arruinar el saldo.</p>
              <p className="mt-2">Tenés tres opciones por cada ítem:</p>
              <ul className="mt-1 space-y-1 list-none">
                <li>→ <span className="text-blue-300">Asignar a sección</span> si no tiene contraparte</li>
                <li>→ <span className="text-green-300">Marcar como cruce</span> si encontrás su par en la otra columna</li>
                <li>→ <span className="text-yellow-300">Editar</span> si los datos están incorrectos</li>
              </ul>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm(`¿Clasificar automáticamente los ${partidas.length} movimientos pendientes?\n\nExtracto (débitos) → "Pagos banco no contabilizados"\nExtracto (créditos) → "Cobranzas no contabilizadas"\nMayor (débitos) → "Pagos contabilizados no debitados"\nMayor (créditos) → "Cobranzas no acreditadas"\n\nQuedan marcados como "auto" para que los puedas revisar.`))
              dispatch({ type: 'AUTO_CLASIFICAR_PENDIENTES' })
          }}
          className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-3 py-1.5 transition-colors shrink-0"
        >
          Auto-clasificar todo
        </button>
      </div>

      {/* Barra de acción — visible debajo del header cuando hay selección */}
      {haySeleccion && (
        <div className="bg-[#082e56] text-white px-4 py-3 border-b border-[#0a3d72] flex items-center gap-4 flex-wrap">
          {puedeMarcar ? (
            <>
              <div className="text-xs text-blue-200">
                <span className="text-white font-medium">{selBanco.size} banco</span> ({formatMoneda(sumBanco)})
                {' '} + <span className="text-white font-medium">{selLibros.size} libros</span> ({formatMoneda(sumLibros)})
                {dif > 0 && (
                  <span className={`ml-2 ${dif / Math.max(sumBanco, sumLibros) < 0.05 ? 'text-green-300' : 'text-amber-300'}`}>
                    · dif {formatMoneda(dif)}
                  </span>
                )}
              </div>
              <button
                onClick={handleCruce}
                className="px-4 py-1.5 text-xs font-bold bg-green-500 hover:bg-green-400 rounded-lg transition-colors"
              >
                ✓ Marcar como cruce
              </button>
            </>
          ) : (
            <span className="text-xs text-blue-300">
              {selBanco.size > 0
                ? `${selBanco.size} banco seleccionados — seleccioná también items del mayor para hacer cruce`
                : `${selLibros.size} libros seleccionados — seleccioná también items del banco para hacer cruce`}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <select
              onChange={e => { if (e.target.value) { handleAsignarMasivo(e.target.value); e.target.value = '' } }}
              defaultValue=""
              className="text-xs border border-blue-400 rounded px-2 py-1.5 bg-white/10 text-white focus:outline-none"
            >
              <option value="" disabled className="text-gray-800">Asignar a sección...</option>
              {SECCIONES.map(s => <option key={s.id} value={s.id} className="text-gray-800">{s.label}</option>)}
            </select>
            <button onClick={() => { setSelBanco(new Set()); setSelLibros(new Set()) }} className="text-xs text-blue-300 hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Dos columnas */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">

        {/* === COLUMNA BANCO === */}
        <div className="flex flex-col">
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#082e56]" />
              <span className="text-xs font-bold text-[#082e56] uppercase tracking-wide">Extracto bancario</span>
              <span className="text-xs font-semibold text-[#082e56] bg-blue-200 rounded-full px-1.5">{itemsBanco.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <OrdenSelect value={ordenBanco} onChange={setOrdenBanco} colorClass="border-blue-200 focus:border-[#082e56]" />
              {selBanco.size > 0 && (
                <button onClick={() => setSelBanco(new Set())} className="text-xs text-blue-400 hover:text-[#082e56]">✕ {selBanco.size}</button>
              )}
            </div>
          </div>
          <div className="px-3 pt-2 pb-1">
            <input
              type="text"
              placeholder="Buscar..."
              value={busquedaBanco}
              onChange={e => setBusquedaBanco(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#082e56]"
            />
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            {itemsBanco.length === 0
              ? <p className="text-xs text-gray-300 italic text-center py-6">Sin movimientos del banco</p>
              : itemsBanco.map(p => (
                <ItemColumna
                  key={p.id}
                  partida={p}
                  checked={selBanco.has(p.id)}
                  onToggle={() => toggleBanco(p.id)}
                  onAsignar={sec => dispatch({ type: 'ASSIGN_SECTION', partidaId: p.id, targetSeccionId: sec })}
                  onEdit={changes => dispatch({ type: 'EDIT_PARTIDA', location: 'sin_asignar', partidaId: p.id, changes })}
                  tipo="banco"
                />
              ))
            }
          </div>
        </div>

        {/* === COLUMNA LIBROS === */}
        <div className="flex flex-col">
          <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Mayor contable</span>
              <span className="text-xs font-semibold text-purple-700 bg-purple-200 rounded-full px-1.5">{itemsLibros.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <OrdenSelect value={ordenLibros} onChange={setOrdenLibros} colorClass="border-purple-200 focus:border-purple-600" />
              {selLibros.size > 0 && (
                <button onClick={() => setSelLibros(new Set())} className="text-xs text-purple-400 hover:text-purple-700">✕ {selLibros.size}</button>
              )}
            </div>
          </div>
          <div className="px-3 pt-2 pb-1">
            <input
              type="text"
              placeholder="Buscar..."
              value={busquedaLibros}
              onChange={e => setBusquedaLibros(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600"
            />
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            {itemsLibros.length === 0
              ? <p className="text-xs text-gray-300 italic text-center py-6">Sin movimientos del mayor</p>
              : itemsLibros.map(p => (
                <ItemColumna
                  key={p.id}
                  partida={p}
                  checked={selLibros.has(p.id)}
                  onToggle={() => toggleLibros(p.id)}
                  onAsignar={sec => dispatch({ type: 'ASSIGN_SECTION', partidaId: p.id, targetSeccionId: sec })}
                  onEdit={changes => dispatch({ type: 'EDIT_PARTIDA', location: 'sin_asignar', partidaId: p.id, changes })}
                  tipo="libros"
                />
              ))
            }
          </div>
        </div>
      </div>

    </div>
  )
}
