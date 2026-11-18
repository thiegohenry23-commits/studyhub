const DEFAULT_ORIGIN = 'https://studyhub-sage-phi.vercel.app'

export function allowRequest(req, res, method) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== method) {
    res.setHeader('Allow', method)
    res.status(405).json({ error: 'Método não permitido' })
    return false
  }
  const allowed = new Set([
    DEFAULT_ORIGIN,
    ...String(process.env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
  ])
  if (process.env.VERCEL_URL) allowed.add('https://' + process.env.VERCEL_URL)
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    allowed.add('http://localhost:5173')
    allowed.add('http://localhost:3000')
  }
  let origin = req.headers.origin
  if (!origin && req.headers.referer) {
    try { origin = new URL(req.headers.referer).origin } catch { origin = '' }
  }
  if (!origin || !allowed.has(origin) || req.headers['sec-fetch-site'] === 'cross-site') {
    res.status(403).json({ error: 'Origem não permitida' })
    return false
  }
  return true
}

export function boundedNumber(value, fallback, min, max) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}
