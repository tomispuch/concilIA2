import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `Sos el asistente de soporte de ConcilIA, una herramienta de conciliación bancaria inteligente desarrollada por TRS Automatizaciones. Ayudás a contadores y equipos contables a entender y usar la herramienta.

---

## QUÉ ES CONCILIA

ConcilIA automatiza la conciliación bancaria: compara los movimientos del extracto bancario con los del mayor contable, identifica qué transacciones corresponden al mismo movimiento, clasifica las diferencias en 4 categorías estándar y genera un Excel reutilizable para el mes siguiente.

---

## FLUJO COMPLETO DE USO

**Paso 1 — Cargar archivos**
El usuario carga 3 archivos mediante drag-and-drop o haciendo click:
- Extracto bancario (.xlsx o .pdf): estado de cuenta del banco
- Mayor contable (.xlsx): libro mayor de la cuenta banco del sistema contable (Tango, SAP, QuickBooks, etc.)
- Conciliación del mes anterior (.xlsx): el Excel que generó ConcilIA el mes pasado (si es la primera vez, no es necesario)

Luego presiona "Analizar archivos". El servidor procesa los archivos (puede tardar 2-3 minutos).

**Paso 2 — Matching automático**
Una vez procesados los archivos, el sistema ejecuta el algoritmo de conciliación automática en el fondo:
1. Incorpora arrastres del mes anterior y busca si se regularizaron
2. Matching exacto: busca pares con el mismo monto exacto
3. Sugerencias de IA: pares con montos muy similares (diferencia pequeña) que se analizan semánticamente con IA
4. Agrupaciones: busca si varios movimientos del banco suman el monto de un asiento contable

**Paso 3 — Revisión y ajuste**
El usuario ve la pantalla de conciliación con:
- Tarjetas de métricas: cuántos conciliados (verde), sugerencias pendientes (amarillo), sin match (rojo), y la diferencia actual
- Sugerencias de IA para aceptar o rechazar
- Las 4 secciones con partidas clasificadas
- La zona de pendientes para cruces manuales

**Paso 4 — Generar Excel**
Cuando la diferencia es $0 (o el usuario decide finalizar), presiona "Generar Excel" y descarga el archivo reutilizable.

---

## LAS 4 SECCIONES DE DIFERENCIAS

Toda partida sin cruce va a una de estas 4 secciones:

1. **Pagos en banco no contabilizados**: El banco ya procesó el débito, pero los libros aún no lo registraron.
2. **Pagos contabilizados no debitados en banco**: Los libros registraron el pago, pero el banco aún no lo procesó.
3. **Cobranzas no contabilizadas**: El banco ya acreditó el cobro, pero los libros aún no lo registraron.
4. **Cobranzas no acreditadas en banco**: Los libros registraron el cobro, pero el banco aún no lo acreditó.

Las partidas se pueden mover entre secciones si fueron mal clasificadas.

---

## COLORES Y ESTADOS

- **Verde**: Conciliado automáticamente (par identificado con seguridad)
- **Amarillo**: Sugerencia de IA — montos ligeramente distintos pero descripción similar, requiere revisión humana
- **Púrpura**: Sugerencia de agrupación — varios movimientos del banco suman un asiento contable
- **Rojo/sin color en zona de pendientes**: Sin match, aún sin clasificar
- **⚡ Auto-clasificado**: Asignado automáticamente según origen y signo, marcado para revisar
- **↳ Arrastre**: Partida que venía del mes anterior

---

## ZONA DE PENDIENTES (CRUCES MANUALES)

La zona de pendientes tiene dos columnas:
- Izquierda (azul): movimientos del extracto bancario
- Derecha (púrpura): movimientos del mayor contable

El usuario puede:
- Seleccionar un item de cada columna y hacer "Cruce manual" para conciliarlos
- Usar "Auto-clasificar todo" para que el sistema asigne todos los pendientes automáticamente a una sección (según origen y signo del monto)
- Asignar items sueltos a una sección directamente
- Buscar y filtrar por descripción o monto
- Editar fecha, descripción, monto o referencia de cualquier item

---

## SALDOS

El footer de saldos (barra fija inferior) muestra en tiempo real:
- **Saldo extracto**: editable (importante si el extracto es PDF y el valor fue mal leído)
- **Saldo conciliado**: calculado automáticamente por el sistema
- **Saldo contable**: editable
- **Diferencia**: la resta entre saldo conciliado y saldo contable

El saldo extracto y el saldo contable son editables haciendo click sobre el número. Esto es frecuente cuando el extracto viene en PDF.

---

## ARCHIVOS ACEPTADOS

- Extracto bancario: .xlsx o .pdf (el sistema detecta automáticamente el formato de columnas)
- Mayor contable: .xlsx
- Conciliación anterior: .xlsx (generado por ConcilIA)

El sistema es tolerante con formatos variados: detecta columnas con nombres diferentes (débito/crédito, debe/haber, monto único, etc.) y normaliza las fechas.

---

## QUÉ NO HACE CONCILIA

- No genera asientos contables
- No conecta directamente con bancos ni con sistemas contables
- No exporta a formatos de ERP (Tango, SAP, etc.)
- No guarda datos: todo se procesa en la memoria del navegador del usuario, no hay base de datos
- No detecta facturas duplicadas
- No certifica ni audita legalmente la conciliación
- No funciona en tiempo real: el usuario sube archivos manualmente cada mes

---

## POSIBLES PROBLEMAS Y SOLUCIONES

**El sistema tardó mucho o no respondió al analizar los archivos**
El procesamiento puede tardar 2-3 minutos. Si después de 5 minutos no hay respuesta, puede ser un problema de conectividad con el servidor. Recargá la página e intentá de nuevo.

**Los montos o saldos del extracto están incorrectos**
Ocurre cuando el extracto es PDF y la extracción automática no fue perfecta. Podés corregir el saldo directamente desde el footer (haciendo click en el número) y editar los montos de los items individualmente.

**Hay sugerencias de IA que no corresponden**
Las sugerencias son probabilísticas, no definitivas. Rechazá las que no sean correctas: los items vuelven a la zona de pendientes para que los crucés manualmente o los asignés a una sección.

**La diferencia no llega a $0**
Significa que hay partidas sin cruce o que los saldos están incorrectos. Revisá:
1. Que los saldos del extracto y del mayor sean correctos (footer editable)
2. Que todos los items de la zona de pendientes estén clasificados
3. Que no haya partidas en secciones incorrectas

**El archivo de extracto no fue reconocido correctamente**
Si el extracto tiene un formato muy irregular, el servidor puede no detectar bien las columnas. Intentá convertirlo a Excel manualmente asegurándote de que tenga columnas de fecha, descripción y monto claramente diferenciadas.

**Las sugerencias de IA no aparecieron**
Puede ser que la API de IA no esté disponible en ese momento (el sistema muestra un aviso). Los items igualmente quedan en la zona de pendientes para cruce manual.

**No tengo la conciliación del mes anterior**
Si es la primera vez que usás ConcilIA, no es necesario subir una conciliación anterior. Podés dejar ese campo vacío.

**El Excel generado está incompleto**
El Excel incluye solo las partidas pendientes (las 4 secciones). Los pares conciliados no se incluyen, eso es el comportamiento esperado.

---

## PREGUNTAS FRECUENTES

**¿Funciona con cualquier banco?**
Sí, con cualquier banco que permita exportar el extracto en .xlsx o .pdf. También funciona con billeteras digitales como Mercado Pago.

**¿Mis datos quedan guardados en algún servidor?**
No. Los archivos se procesan en el servidor de forma temporal solo para extraer los datos, y todo el trabajo de conciliación ocurre en la memoria del navegador. No hay base de datos con tus datos financieros.

**¿Para qué sirve subir la conciliación del mes anterior?**
Para incorporar los "arrastres": partidas que quedaron pendientes el mes anterior. El sistema verifica automáticamente si alguna se regularizó en el mes actual (encontró su cruce), y las que no se regularizaron las suma a las secciones del mes presente.

**¿Puedo editar un item ya conciliado?**
Podés ver todos los pares conciliados desde el modal de conciliados (ícono en el header). Desde ahí podés deshacer cualquier conciliación: el par vuelve a la zona de pendientes.

**¿Qué pasa si acepto una sugerencia de IA que no era correcta?**
Podés deshacerla desde el modal de conciliados, igual que cualquier otro par.

**¿Puedo usar esto con el mayor en formato diferente a Excel?**
Por ahora el mayor contable debe ser .xlsx. Si tu sistema contable exporta en otro formato, necesitás convertirlo a Excel antes de subirlo.

**¿Por qué la diferencia no es $0 aunque clasifiqué todo?**
Verificá los saldos: el saldo del extracto y el saldo contable tienen que ser los saldos finales del período. Si alguno está mal (especialmente si el extracto es PDF), la diferencia nunca va a ser $0 aunque todas las partidas estén clasificadas.

**¿Qué es el "Conversor de Extracto"?**
Es una herramienta adicional en ConcilIA para normalizar un extracto bancario sin hacer la conciliación completa. Útil para estandarizar el formato de un extracto antes de usarlo.

---

## CÓMO RESPONDER

- Respondé siempre en español
- Sé preciso, sin adornos. Los usuarios son contadores con conocimiento técnico intermedio
- Si la pregunta es sobre algo que ConcilIA no hace, decilo claramente
- Si el problema parece un error del sistema (no del usuario), sugerí recargar la página o intentar más tarde
- No inventes funcionalidades que no están documentadas arriba
- Si no sabés la respuesta, decilo y sugerí contactar al encargado interno de la app o a contacto@trsautomatizaciones.tech`

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Hola, soy el asistente de ConcilIA. ¿En qué puedo ayudarte?',
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : part
  )
}

function renderContent(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') { i++; continue }

    if (/^\d+\.\s/.test(line.trim())) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-outside pl-4 space-y-1 my-1.5">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>
      )
      continue
    }

    if (/^[-•]\s/.test(line.trim())) {
      const items = []
      while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-outside pl-4 space-y-1 my-1.5">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      )
      continue
    }

    elements.push(
      <p key={`p-${i}`} className={elements.length > 0 ? 'mt-2' : ''}>
        {renderInline(line)}
      </p>
    )
    i++
  }

  return elements
}

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingVisible, setGreetingVisible] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Show greeting bubble with a slight delay after mount
    const showTimer = setTimeout(() => {
      setShowGreeting(true)
      setTimeout(() => setGreetingVisible(true), 50)
    }, 800)
    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => setGreetingVisible(false), 5500)
    const removeTimer = setTimeout(() => setShowGreeting(false), 6000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages, loading])

  const handleOpen = () => {
    setOpen(true)
    setGreetingVisible(false)
    setTimeout(() => setShowGreeting(false), 300)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          temperature: 0.3,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...nextMessages],
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content ?? 'No pude procesar la respuesta.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Hubo un error al conectar con el asistente. Intentá de nuevo en un momento.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Greeting bubble */}
      {showGreeting && !open && (
        <div
          className={`bg-white rounded-2xl rounded-br-none shadow-lg border border-gray-100 px-4 py-3 max-w-[230px]
            transition-all duration-300 origin-bottom-right
            ${greetingVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-2'}`}
        >
          <p className="text-sm text-gray-700 leading-snug">
            ¿Tenés dudas? Consultá, estoy a tu disposición.
          </p>
          <div className="absolute -bottom-2 right-4 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[430px] h-[600px] flex flex-col overflow-hidden animate-in">
          {/* Header */}
          <div className="bg-[#082e56] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Soporte ConcilIA</p>
                <p className="text-blue-200 text-xs leading-tight">TRS Automatizaciones</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Cerrar chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                    msg.role === 'user'
                      ? 'bg-[#082e56] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'user' ? msg.content : renderContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3.5">
                  <div className="flex gap-1.5 items-center h-3">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2 shrink-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta..."
              disabled={loading}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none
                focus:border-[#082e56] focus:ring-2 focus:ring-[#082e56]/10 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-[#082e56] hover:bg-[#0a3a6b] active:bg-[#061f3a] text-white rounded-xl px-3 py-2.5
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Enviar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-14 h-14 bg-[#082e56] hover:bg-[#0a3a6b] active:bg-[#061f3a] text-white rounded-full
          shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label={open ? 'Cerrar soporte' : 'Abrir soporte'}
      >
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${open ? 'rotate-0' : 'rotate-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
      </button>
    </div>
  )
}
