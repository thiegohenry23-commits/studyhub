import { allowRequest, boundedNumber } from '../lib/server-security.js'

export default async function handler(req, res) {
  if (!allowRequest(req, res, 'POST')) return
  if (String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
    return res.status(415).json({ error: 'Envie JSON' })
  }
  const messages = req.body?.messages
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 200 ||
      messages.some((m) => !m || !['system', 'user', 'assistant'].includes(m.role) ||
        typeof m.content !== 'string' || !m.content.trim() || m.content.length > 8000)) {
    return res.status(400).json({ error: 'Mensagens inválidas ou muito longas' })
  }
  if (messages.reduce((total, m) => total + m.content.length, 0) > 64000) {
    return res.status(413).json({ error: 'Conversa muito longa' })
  }
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Tutor temporariamente indisponível' })
  // Preserve the tutor instruction and the most recent conversation.
  const instruction = messages[0].role === 'system' ? [messages[0]] : []
  const recent = instruction.length ? messages.slice(1).slice(-39) : messages.slice(-40)
  const safeMessages = [...instruction, ...recent].map(({ role, content }) => ({ role, content }))
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: safeMessages,
        temperature: boundedNumber(req.body.temperature, 0.7, 0, 2),
        max_tokens: Math.trunc(boundedNumber(req.body.max_tokens, 1024, 1, 4096))
      })
    })
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 502).json({ error: 'Tutor indisponível. Tente novamente em instantes.' })
    const data = await upstream.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return res.status(502).json({ error: 'Resposta inválida do tutor' })
    return res.status(200).json({ choices: [{ message: { role: 'assistant', content } }] })
  } catch {
    return res.status(502).json({ error: 'Falha ao consultar o tutor. Tente novamente.' })
  }
}
