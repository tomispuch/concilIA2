export default function HowItWorks({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-8 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">

          {/* Header */}
          <div className="bg-[#082e56] text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Logo" className="w-9 h-9 rounded-full object-cover opacity-90" />
              <div>
                <h1 className="text-lg font-bold">¿Cómo funciona ConcilIA?</h1>
                <p className="text-blue-200 text-xs">Guía completa de uso</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
          </div>

          <div className="px-8 py-6 space-y-8">

            {/* Qué es */}
            <section>
              <h2 className="text-base font-bold text-[#082e56] mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#082e56] text-white rounded-full flex items-center justify-center text-xs font-bold">?</span>
                ¿Qué es la conciliación bancaria?
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Es el proceso de comparar los movimientos del <strong>estado de cuenta del banco</strong> contra los registros del <strong>sistema contable</strong> de la empresa. El objetivo es confirmar que ambos coinciden, y explicar cualquier diferencia mediante partidas pendientes (pagos emitidos que el banco aún no procesó, cobros recibidos que aún no se registraron, etc.).
              </p>
            </section>

            <hr className="border-gray-100" />

            {/* Paso 1 */}
            <section>
              <h2 className="text-base font-bold text-[#082e56] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#082e56] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Subir los archivos
              </h2>
              <div className="space-y-3">
                {[
                  { name: 'Extracto bancario', fmt: '.xlsx o .pdf', desc: 'El estado de cuenta del banco del mes a conciliar. Debe incluir todas las transacciones del período con fecha, descripción e importe.' },
                  { name: 'Mayor contable', fmt: '.xlsx', desc: 'El libro mayor de la cuenta banco del sistema contable (Tango, SAP, etc.). Debe incluir todos los movimientos registrados en los libros para el mismo período.' },
                  { name: 'Conciliación mes anterior', fmt: '.xlsx', desc: 'El archivo Excel de la conciliación del mes anterior (generado por este mismo sistema). Permite importar automáticamente las partidas que quedaron pendientes.' },
                ].map(f => (
                  <div key={f.name} className="bg-gray-50 rounded-lg p-3 flex gap-3">
                    <div className="w-24 shrink-0">
                      <p className="text-xs font-semibold text-[#082e56]">{f.name}</p>
                      <p className="text-xs text-gray-400">{f.fmt}</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700"><strong>Importante:</strong> Una vez cargados los 3 archivos, presioná <strong>Analizar archivos</strong>. El servidor procesa los archivos (puede tardar hasta 2-3 minutos) y luego el análisis de matching corre directamente en tu navegador.</p>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Paso 2 - Resultados */}
            <section>
              <h2 className="text-base font-bold text-[#082e56] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#082e56] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Entender los resultados
              </h2>

              <div className="space-y-3">
                <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">🟢 Conciliados automáticamente</p>
                  <p className="text-xs text-gray-600 leading-relaxed">El sistema encontró exactamente la misma transacción en el banco Y en los libros contables. Estos no necesitan ninguna acción — simplemente confirman que ese movimiento está correctamente registrado en ambos lados.</p>
                </div>

                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-700 mb-1">🟡 Sugerencias de la IA</p>
                  <p className="text-xs text-gray-600 leading-relaxed">La IA de Groq analizó las descripciones y encontró pares que <em>probablemente</em> corresponden al mismo movimiento, aunque los importes difieren levemente (hasta un 5%). El usuario debe <strong>Aceptar</strong> o <strong>Rechazar</strong> cada sugerencia. Si acepta, pasan a conciliados. Si rechaza, quedan en sus secciones como items pendientes.</p>
                </div>

                <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 mb-1">🔴 Sin match — Las 4 secciones</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">Son los movimientos que solo existen en <em>uno</em> de los dos sistemas. Estos <strong>explican la diferencia</strong> entre el saldo bancario y el saldo contable. Se clasifican en 4 categorías:</p>
                  <div className="space-y-2">
                    {[
                      { sec: 'Pagos en banco no contabilizados', desc: 'El banco ya lo pagó (aparece en el extracto) pero los libros contables aún no lo registraron. Cuando se registre en contabilidad, esta partida desaparece.' },
                      { sec: 'Pagos contabilizados no debitados en banco', desc: 'Los libros ya lo registraron como pago (cheque emitido, transferencia ordenada) pero el banco todavía no lo procesó. Quedará pendiente hasta que el banco lo debite.' },
                      { sec: 'Cobranzas no contabilizadas', desc: 'El banco ya acreditó el cobro en la cuenta pero los libros aún no lo registraron. Pendiente de contabilizar.' },
                      { sec: 'Cobranzas no acreditadas en banco', desc: 'Los libros registraron el cobro pero el banco aún no acreditó el depósito. Quedará pendiente hasta que el banco lo procese.' },
                    ].map(s => (
                      <div key={s.sec} className="bg-white rounded p-2 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-700">{s.sec}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-600 mb-1">⬜ Arrastres</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Son las partidas que quedaron pendientes del mes anterior. El sistema las compara primero contra las transacciones del mes actual:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 list-none">
                    <li>→ Si el arrastre <strong>encuentra match</strong> este mes → ambos se cancelan y pasan a "Conciliados". La partida se regularizó.</li>
                    <li>→ Si el arrastre <strong>no encuentra match</strong> → queda en su sección como pendiente y pasará al siguiente mes.</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Paso 3 - Diferencia */}
            <section>
              <h2 className="text-base font-bold text-[#082e56] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#082e56] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                La diferencia y los saldos
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                La fórmula de la conciliación bancaria es:
              </p>
              <div className="bg-[#082e56] text-white rounded-lg p-4 font-mono text-xs leading-loose">
                <p>Saldo extracto bancario</p>
                <p className="text-green-300">+ Pagos en banco no contabilizados</p>
                <p className="text-red-300">− Pagos contabilizados no debitados</p>
                <p className="text-red-300">− Cobranzas no contabilizadas</p>
                <p className="text-green-300">+ Cobranzas no acreditadas en banco</p>
                <p className="border-t border-white/30 mt-2 pt-2 font-bold">= Saldo contable</p>
                <p className="text-blue-200 text-xs mt-1">Cuando Diferencia = $0, la conciliación está completa.</p>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700"><strong>Los saldos son editables:</strong> Si el sistema detectó mal el saldo extracto o contable, hacé click sobre el valor en el footer para corregirlo. Esto es frecuente cuando el extracto es un PDF — ingresá el saldo oficial que figura en el encabezado del estado de cuenta.</p>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Paso 4 - Acciones del contador */}
            <section>
              <h2 className="text-base font-bold text-[#082e56] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#082e56] text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                Qué hace el usuario
              </h2>
              <div className="space-y-2">
                {[
                  ['Revisar sugerencias IA', 'Aceptar los pares que efectivamente corresponden al mismo movimiento. Rechazar los que son coincidencias falsas.'],
                  ['Verificar las 4 secciones', 'Confirmar que cada partida esté en la sección correcta. Usar "Mover a..." para reubicar si fue auto-clasificada incorrectamente.'],
                  ['Corregir los saldos', 'Si el saldo extracto o contable está mal, hacer click en el footer para corregirlo con el valor real del estado de cuenta.'],
                  ['Editar partidas', 'Si una partida tiene datos incorrectos (fecha, descripción, importe), usar el botón "Editar" para corregirla.'],
                  ['Buscar diferencia residual', 'Si queda diferencia pequeña, revisar arrastres que ya se regularizaron y moverlos. Buscar partidas en la sección equivocada.'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3 items-start">
                    <span className="text-[#082e56] mt-0.5">→</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Paso 5 - Excel */}
            <section>
              <h2 className="text-base font-bold text-[#082e56] mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#082e56] text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                Generar el Excel
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Una vez que la <strong>Diferencia = $0</strong> (o la diferencia residual es aceptable), presioná <strong>Generar Excel</strong>. El sistema envía los datos al servidor y descarga automáticamente el archivo Excel de conciliación, listo para archivar y usar como conciliación anterior del mes siguiente.
              </p>
              <p className="text-xs text-gray-400 mt-2">Si la diferencia no es cero, el sistema te avisa antes de generar para que confirmes.</p>
            </section>

          </div>

          <div className="px-8 py-4 bg-gray-50 rounded-b-2xl flex justify-end border-t border-gray-100">
            <button onClick={onClose} className="px-6 py-2 bg-[#082e56] text-white text-sm font-medium rounded-lg hover:bg-[#0a3d72] transition-colors">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
