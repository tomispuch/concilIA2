import { useState } from 'react'
import { formatMoneda } from '../utils/formatters'

function SaldoEditable({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const handleOpen = () => {
    setInput(String(value ?? ''))
    setEditing(true)
  }

  const handleSave = () => {
    const n = parseFloat(String(input).replace(/\./g, '').replace(',', '.'))
    if (!isNaN(n)) onSave(n)
    setEditing(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div>
      <p className="text-xs text-blue-200 mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="w-36 text-sm bg-white/10 text-white border border-white/40 rounded px-2 py-0.5 focus:outline-none focus:border-white"
          />
          <button onClick={handleSave} className="text-xs text-green-300 hover:text-green-200 font-medium">✓</button>
          <button onClick={() => setEditing(false)} className="text-xs text-red-300 hover:text-red-200">✕</button>
        </div>
      ) : (
        <button
          onClick={handleOpen}
          title="Click para editar"
          className="text-sm font-semibold text-left hover:text-blue-200 transition-colors underline decoration-dotted underline-offset-2"
        >
          {formatMoneda(value ?? 0)}
        </button>
      )}
    </div>
  )
}

export default function FooterSaldos({ saldo_extracto, saldo_contable, secciones, dispatch }) {
  const abs = (arr) => arr.reduce((s, p) => s + Math.abs(Number(p.monto) || 0), 0)
  const saldo_conciliado =
    (Number(saldo_extracto) || 0)
    + abs(secciones.pagos_no_contabilizados)
    - abs(secciones.pagos_no_debitados)
    - abs(secciones.cobranzas_no_contabilizadas)
    + abs(secciones.cobranzas_no_acreditadas)
  const diferencia = saldo_conciliado - (Number(saldo_contable) || 0)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#082e56] text-white z-30 border-t border-[#0a3d72]">
      <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-4 gap-6">
        <SaldoEditable
          label="Saldo extracto (click para editar)"
          value={saldo_extracto}
          onSave={v => dispatch({ type: 'SET_SALDO', campo: 'saldo_extracto', valor: v })}
        />
        <div>
          <p className="text-xs text-blue-200 mb-0.5">Saldo conciliado</p>
          <p className="text-sm font-semibold">{formatMoneda(saldo_conciliado)}</p>
        </div>
        <SaldoEditable
          label="Saldo contable (click para editar)"
          value={saldo_contable}
          onSave={v => dispatch({ type: 'SET_SALDO', campo: 'saldo_contable', valor: v })}
        />
        <div>
          <p className="text-xs text-blue-200 mb-0.5">Diferencia</p>
          <p className={`text-sm font-bold ${diferencia === 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatMoneda(diferencia)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 pb-1.5">
        <p className="text-xs text-blue-300/50">Los saldos son editables — hacé click para corregir</p>
        <a
          href="https://trs-automatizaciones.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 opacity-40 hover:opacity-80 transition-opacity"
        >
          <img src="/trs-logo.png" alt="TRS" className="h-4 object-contain brightness-200" />
          <span className="text-xs text-blue-200">TRS Automatizaciones</span>
        </a>
      </div>
    </div>
  )
}
