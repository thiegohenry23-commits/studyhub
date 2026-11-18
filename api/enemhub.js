const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.length === 0) return true
  if (!origin) return true
  return ALLOWED_ORIGINS.includes(origin)
}

const BASE = 'https://api.enemhub.com.br/v1/vestibulares'

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Origem não permitida' })
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ENEMHUB_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ENEMHUB_API_KEY não configurada no servidor' })
    return
  }

  const resource = String(req.query?.resource || 'questions')
  const allowed = ['exams', 'questions', 'subjects']
  if (!allowed.includes(resource)) {
    res.status(400).json({ error: 'resource inválido' })
    return
  }

  // Pass-through params
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k === 'resource') continue
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x))
    else if (v != null) params.append(k, v)
  }

  try {
    const url = `${BASE}/${resource}?${params.toString()}`
    const r = await fetch(url, { headers: { 'X-API-Key': apiKey } })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      res.status(r.status).json({ error: data?.error || data?.message || r.statusText, code: data?.code })
      return
    }
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}