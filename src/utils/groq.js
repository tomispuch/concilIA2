export async function matchearSemantico(pares) {
  const BATCH_SIZE = 20
  const resultados = []

  for (let i = 0; i < pares.length; i += BATCH_SIZE) {
    const batch = pares.slice(i, i + BATCH_SIZE)
    const prompt = `Sos un asistente contable. Analizá estos pares de transacciones y determiná si cada par corresponde probablemente a la misma operación financiera. Considerá que los conceptos pueden estar descriptos diferente en el sistema bancario vs el sistema contable.

Respondé SOLO con un array JSON sin texto adicional:
[{"par": 0, "match": true, "confianza": "alta|media|baja", "razon": "..."}]

Pares a evaluar:
${batch.map((p, i) => `Par ${i}: Extracto: "${p.extracto_item.descripcion}" $${p.extracto_item.monto} | Mayor: "${p.mayor_item.descripcion}" $${p.mayor_item.monto}`).join('\n')}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    })

    if (!res.ok) throw new Error(`Groq error: ${res.status}`)
    const data = await res.json()
    const texto = data.choices[0].message.content.trim()
    const parsed = JSON.parse(texto.replace(/```json|```/g, ''))
    resultados.push(...parsed.map((r, idx) => ({ ...r, par_id: batch[idx].id })))
  }

  return resultados
}
