import { useState, useRef } from 'react'

function Dropzone({ label, hint, accept, file, onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 select-none
        ${dragging ? 'border-[#082e56] bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-[#082e56] hover:bg-gray-50'}
        ${file ? 'border-green-400 bg-green-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]) }}
      />
      {file ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">Hacé click para reemplazar</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400 mt-1">{hint}</p>
          <p className="text-xs text-gray-300 mt-1">Arrastrá o hacé click</p>
        </div>
      )}
    </div>
  )
}

export default function StepUpload({ onAnalizar, error, onClearError, onShowHelp, onGoConversor }) {
  const [extracto, setExtracto] = useState(null)
  const [mayor, setMayor] = useState(null)
  const [anterior, setAnterior] = useState(null)

  const ready = extracto && mayor && anterior

  const handleAnalizar = () => {
    if (!ready) return
    onClearError()
    onAnalizar(extracto, mayor, anterior)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#082e56] text-white px-6 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-9 h-9 rounded-full object-cover opacity-90" />
            <div>
              <h1 className="text-base font-bold tracking-wide">ConcilIA</h1>
              <p className="text-xs text-blue-300">Conciliación bancaria inteligente</p>
            </div>
          </div>
          <button
            onClick={onShowHelp}
            className="text-xs text-blue-200 hover:text-white border border-blue-400/40 hover:border-white/60 rounded-lg px-3 py-1.5 transition-colors"
          >
            ¿Cómo funciona?
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Nueva conciliación</h2>
            <p className="text-sm text-gray-500">Cargá los tres archivos para comenzar el análisis</p>
          </div>

          <div className="space-y-4">
            <Dropzone
              label="Extracto bancario"
              hint=".xlsx o .pdf"
              accept=".xlsx,.xls,.pdf"
              file={extracto}
              onFile={setExtracto}
            />
            <Dropzone
              label="Mayor contable"
              hint=".xlsx"
              accept=".xlsx,.xls"
              file={mayor}
              onFile={setMayor}
            />
            <Dropzone
              label="Conciliación mes anterior"
              hint=".xlsx"
              accept=".xlsx,.xls"
              file={anterior}
              onFile={setAnterior}
            />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={handleAnalizar}
                className="text-xs text-red-600 underline hover:text-red-800 shrink-0"
              >
                Reintentar
              </button>
            </div>
          )}

          <button
            onClick={handleAnalizar}
            disabled={!ready}
            className="mt-6 w-full py-3 text-sm font-semibold bg-[#082e56] text-white rounded-xl hover:bg-[#0a3d72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {ready ? 'Analizar archivos' : `Faltan ${[!extracto, !mayor, !anterior].filter(Boolean).length} archivo${[!extracto, !mayor, !anterior].filter(Boolean).length > 1 ? 's' : ''}`}
          </button>

          <div className="mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={onGoConversor}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-[#082e56] hover:bg-blue-50/40 transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 group-hover:text-[#082e56]">Convertir extracto bancario</p>
                <p className="text-xs text-gray-400 mt-0.5">Normalizá y clasificá un extracto sin hacer conciliación</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#082e56] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-center">
            <a
              href="https://trs-automatizaciones.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity group"
            >
              <img src="/trs-logo.png" alt="TRS Automatizaciones" className="h-7 object-contain" />
              <div className="text-left">
                <p className="text-xs text-gray-400 leading-none">Desarrollado por</p>
                <p className="text-sm font-semibold text-gray-600 group-hover:text-[#FA133A] transition-colors">TRS Automatizaciones</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
