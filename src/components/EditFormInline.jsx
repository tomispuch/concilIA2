import { useState } from 'react'
import { formatFecha } from '../utils/formatters'

export default function EditFormInline({ partida, onSave, onCancel }) {
  const [form, setForm] = useState({
    fecha: partida.fecha || '',
    descripcion: partida.descripcion || '',
    monto: partida.monto ?? '',
    referencia: partida.referencia || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'monto' ? parseFloat(value) || value : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const changes = { ...form, monto: parseFloat(form.monto) }
    if (isNaN(changes.monto)) return
    onSave(changes)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#082e56]/30 focus:border-[#082e56]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Importe</label>
          <input
            type="number"
            name="monto"
            value={form.monto}
            onChange={handleChange}
            step="0.01"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#082e56]/30 focus:border-[#082e56]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
        <input
          type="text"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#082e56]/30 focus:border-[#082e56]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Referencia</label>
        <input
          type="text"
          name="referencia"
          value={form.referencia}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#082e56]/30 focus:border-[#082e56]"
        />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-[#082e56] text-white rounded hover:bg-[#0a3d72] transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  )
}
