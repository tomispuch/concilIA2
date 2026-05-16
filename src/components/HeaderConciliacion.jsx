export default function HeaderConciliacion({ meta, progress, matchingStatus, diferencia, onGenerarExcel, generandoExcel, groqWarning, onReset, onShowHelp }) {
  const disabled = matchingStatus === 'running' || generandoExcel

  const handleReset = () => {
    if (window.confirm('¿Querés iniciar una nueva conciliación? Se perderá el trabajo actual.')) {
      onReset()
    }
  }

  return (
    <div className="sticky top-0 z-20 bg-[#082e56] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover opacity-90" />
            <div>
              <h1 className="text-sm font-bold tracking-wide">
                {meta?.empresa}
                {meta?.banco && <span className="text-blue-200 font-normal"> — {meta.banco}</span>}
                {meta?.mes && <span className="text-blue-200 font-normal"> — {meta.mes}</span>}
              </h1>
              <p className="text-xs text-blue-300">ConcilIA</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xs">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-blue-200 mb-1">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-[#0a3d72] rounded-full h-1.5">
                <div
                  className="bg-white rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {groqWarning && (
              <span className="text-xs text-amber-300 bg-amber-900/40 px-2 py-1 rounded">
                Matching semántico no disponible
              </span>
            )}
            <button
              onClick={onShowHelp}
              className="text-xs text-blue-200 hover:text-white border border-blue-400/40 hover:border-white/60 rounded-lg px-3 py-1.5 transition-colors"
            >
              ¿Cómo funciona?
            </button>
            <button
              onClick={handleReset}
              className="text-xs text-blue-200 hover:text-white border border-blue-400/40 hover:border-white/60 rounded-lg px-3 py-1.5 transition-colors"
            >
              ← Nueva conciliación
            </button>
            <button
              onClick={onGenerarExcel}
              disabled={disabled}
              className="px-4 py-2 text-sm font-medium bg-white text-[#082e56] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generandoExcel ? 'Generando...' : 'Generar Excel'}
            </button>
          </div>
        </div>

        {matchingStatus === 'running' && (
          <div className="mt-2 pb-1">
            <div className="w-full bg-[#0a3d72] rounded-full h-0.5">
              <div className="bg-blue-300 rounded-full h-0.5 animate-pulse w-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
