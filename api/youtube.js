import { allowRequest, boundedNumber } from '../lib/server-security.js'

export default async function handler(req, res) {
  if (!allowRequest(req, res, 'GET')) return
  const q = req.query?.q
  if (typeof q !== 'string' || !q.trim() || q.length > 200) {
    return res.status(400).json({ error: 'Informe um assunto com até 200 caracteres' })
  }
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Busca de vídeos temporariamente indisponível' })
  const maxResults = Math.trunc(boundedNumber(req.query?.maxResults, 6, 1, 12))
  const params = new URLSearchParams({ part: 'snippet', q: q.trim(), type: 'video', maxResults: String(maxResults), key: apiKey })
  try {
    const upstream = await fetch('https://www.googleapis.com/youtube/v3/search?' + params, { signal: AbortSignal.timeout(15000) })
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 502).json({ error: 'Busca indisponível. Tente novamente em instantes.' })
    const data = await upstream.json()
    if (!Array.isArray(data.items)) return res.status(502).json({ error: 'Resposta inválida da busca' })
    return res.status(200).json({ items: data.items })
  } catch {
    return res.status(502).json({ error: 'Falha ao buscar vídeos. Tente novamente.' })
  }
}
