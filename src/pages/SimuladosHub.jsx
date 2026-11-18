import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Brain, CheckCircle2, XCircle, RotateCcw, Play, Loader2, Star, History, Shuffle, Filter } from 'lucide-react'
import { toggleFavorite, isFavorite } from '../lib/favorites.js'

const API = '/api/enemhub'

function seededRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function triParams(q, idx) {
  const diff = q.difficulty === 'Fácil' ? -1 : q.difficulty === 'Difícil' ? 1 : 0
  return {
    a: 1.3 + seededRand(idx * 3 + 1) * 0.6,
    b: diff + seededRand(idx * 7 + 2) * 0.6 - 0.3,
    c: 0.1 + seededRand(idx * 11 + 3) * 0.1
  }
}

function triScore(responses) {
  const allCorrect = responses.every((r) => r.correct)
  const allIncorrect = responses.every((r) => !r.correct)
  if (allCorrect) return 1000
  if (allIncorrect) return 0
  let theta = 0
  for (let iter = 0; iter < 60; iter++) {
    let num = 0, info = 0
    for (const r of responses) {
      const e = Math.exp(-r.a * (theta - r.b))
      const P = r.c + (1 - r.c) / (1 + e)
      const dP = (r.a * (P - r.c) * (1 - P)) / (1 - r.c)
      const u = r.correct ? 1 : 0
      const denom = P * (1 - P)
      if (denom <= 0) continue
      num += (dP * (u - P)) / denom
      info += (dP * dP) / denom
    }
    if (info <= 0) break
    const delta = num / info
    theta += delta
    if (theta > 4) theta = 4
    if (theta < -4) theta = -4
    if (Math.abs(delta) < 1e-8) break
  }
  return Math.round(Math.max(0, Math.min(1000, 500 + 100 * theta)))
}

function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
}

export default function SimuladosHub() {
  const [mode, setMode] = React.useState('intro') // intro | config | loading | exam | result
  const [exams, setExams] = React.useState([])
  const [subjects, setSubjects] = React.useState([])
  const [examId, setExamId] = React.useState('')
  const [subjectId, setSubjectId] = React.useState('')
  const [difficulty, setDifficulty] = React.useState('')
  const [quantity, setQuantity] = React.useState(10)
  const [questions, setQuestions] = React.useState([])
  const [answers, setAnswers] = React.useState({})
  const [current, setCurrent] = React.useState(0)
  const [result, setResult] = React.useState(null)
  const [error, setError] = React.useState('')
  const [loadingMsg, setLoadingMsg] = React.useState('')
  const [showOnlyWrong, setShowOnlyWrong] = React.useState(false)

  const loadCatalog = async () => {
    setError('')
    setMode('loading')
    setLoadingMsg('Carregando catálogo de exames...')
    try {
      const [exRes, subRes] = await Promise.all([
        fetch(`${API}?resource=exams`),
        fetch(`${API}?resource=subjects`)
      ])
      if (!exRes.ok) throw new Error(`Exames: ${exRes.status}`)
      if (!subRes.ok) throw new Error(`Matérias: ${subRes.status}`)
      const exData = await exRes.json()
      const subData = await subRes.json()
      setExams(exData.data || [])
      setSubjects(subData.data || subData || [])
      setMode('config')
    } catch (e) {
      setError(e.message || 'Erro ao carregar catálogo.')
      setMode('intro')
    }
  }

  const fetchQuestions = async () => {
    setError('')
    setMode('loading')
    setLoadingMsg('Buscando questões no EnemHub...')
    try {
      const params = new URLSearchParams()
      if (examId) params.set('examId', examId)
      if (subjectId) params.set('subjectId', subjectId)
      if (difficulty) params.set('difficulty', difficulty)
      params.set('include', 'gabarito')
      params.set('limit', '20')

      let all = []
      let offset = 0
      while (all.length < quantity) {
        params.set('offset', String(offset))
        const res = await fetch(`${API}?resource=questions&${params.toString()}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || `Erro ${res.status}`)
        }
        const data = await res.json()
        const qs = data.data || []
        all = all.concat(qs)
        if (!data.meta?.has_more) break
        offset = data.meta?.next_offset ?? (offset + qs.length)
        if (qs.length === 0) break
      }

      all = all.slice(0, quantity)

      if (all.length === 0) throw new Error('Nenhuma questão encontrada para os filtros.')

      const mapped = all.map((q, idx) => {
        const params = triParams(q, idx)
        const correctIdx = q.alternatives.findIndex((a) => a.isCorrect)
        return {
          id: q.id,
          year: q.year,
          difficulty: q.difficulty,
          area: q.subject?.area || '',
          subject: q.subject?.name || '',
          examName: q.exam?.name || '',
          institution: q.exam?.institution || '',
          q: q.statement,
          opts: q.alternatives.map((a) => a.text || ''),
          correct: correctIdx >= 0 ? correctIdx : 0,
          resolution: q.resolution || null,
          ...params
        }
      })

      setQuestions(mapped)
      setAnswers({})
      setCurrent(0)
      setResult(null)
      setMode('exam')
    } catch (e) {
      setError(e.message || 'Erro ao buscar questões.')
      setMode('config')
    }
  }

  const handleAnswer = (qid, idx) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }))
  }

  const finish = () => {
    const responses = questions.map((q) => ({
      ...q,
      correctIndex: q.correct,
      correct: answers[q.id] === q.correct
    }))
    const overall = triScore(responses)
    const areaNames = [...new Set(questions.map((q) => q.area).filter(Boolean))]
    const areas = {}
    for (const area of areaNames) {
      areas[area] = triScore(responses.filter((r) => r.area === area))
    }
    const correctCount = responses.filter((r) => r.correct).length
    setResult({ overall, areas, correctCount, total: responses.length, responses })
    setMode('result')
  }

  const reset = () => {
    setQuestions([])
    setAnswers({})
    setCurrent(0)
    setResult(null)
    setMode('intro')
  }

  const q = questions[current]

  return (
    <div className="pt-28 pb-24 max-w-6xl mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs text-white/70 dark:text-white/70 mb-4">
          <ClipboardList className="w-3 h-3 text-neon-cyan" /> Simulados EnemHub (teste)
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Simulados <span className="text-gradient">EnemHub</span>
        </h1>
        <p className="text-gray-600 dark:text-white/60 mt-3 max-w-2xl">
          Questões reais do ENEM e vestibulares (FUVEST, UERJ, etc.) via EnemHub API, com gabarito e resolução.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="glass rounded-3xl p-8">
              <p className="text-gray-700 dark:text-white/80 mb-4">
                Este é um <strong>ambiente de teste</strong> usando a API do EnemHub (créditos limitados no plano Free).
                Cada questão custa 6 créditos (3 da questão + 3 do gabarito). Mantenha a quantidade baixa.
              </p>
              <button
                onClick={loadCatalog}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950"
              >
                <Play className="w-4 h-4" /> Carregar catálogo
              </button>
            </div>
            {error && <div className="text-rose-300 text-sm">{error}</div>}
          </motion.div>
        )}

        {mode === 'config' && (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-3xl p-8 space-y-6">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Configurar simulado (EnemHub)</h2>

            <div>
              <label className="block text-sm text-gray-600 dark:text-white/60 mb-2">Exame</label>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none"
              >
                <option value="" className="bg-ink-900 dark:bg-ink-900">Todos os exames</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id} className="bg-ink-900 dark:bg-ink-900">
                    {e.name}{e.institution ? ` — ${e.institution}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-white/60 mb-2">Matéria</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none"
              >
                <option value="" className="bg-ink-900 dark:bg-ink-900">Todas as matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-ink-900 dark:bg-ink-900">
                    {s.name}{s.area ? ` (${s.area})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-white/60 mb-2">Dificuldade</label>
              <div className="flex gap-2 flex-wrap">
                {['', 'Fácil', 'Média', 'Difícil'].map((d) => (
                  <button
                    key={d || 'all'}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      difficulty === d ? 'bg-neon-cyan/20 border border-neon-cyan/60' : 'glass hover:bg-white/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {d || 'Todas'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-white/60 mb-2">Quantidade (máx. 20 por requisição; cada questão custa 6 créditos)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-28 glass rounded-xl px-4 py-3 bg-transparent outline-none"
              />
            </div>

            {error && <div className="text-rose-300 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => setMode('intro')} className="px-5 py-2.5 rounded-xl glass hover:bg-white/10 dark:hover:bg-white/10 text-sm">Voltar</button>
              <button
                onClick={fetchQuestions}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950"
              >
                <Play className="w-4 h-4" /> Buscar questões
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-3xl p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neon-cyan" />
            <p className="text-gray-700 dark:text-white/70">{loadingMsg}</p>
          </motion.div>
        )}

        {mode === 'exam' && q && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div className="text-xs text-gray-500 dark:text-white/50">
                Questão {current + 1} de {questions.length} · {q.subject} · {q.examName} ({q.year}) · {q.difficulty}
              </div>
              <div className="text-xs text-gray-500 dark:text-white/50">{Object.keys(answers).length} respondidas</div>
            </div>
            <div className="h-2 rounded-full bg-white/10 dark:bg-white/10 overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>

            <div
              className="mb-6 text-gray-800 dark:text-white/85 leading-relaxed text-sm md:text-base max-h-[40vh] overflow-y-auto scrollbar-thin pr-2 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.q) }}
            />

            <div className="space-y-3 mb-8">
              {q.opts.map((opt, i) => {
                const selected = answers[q.id] === i
                const isCorrect = i === q.correct
                const show = answers[q.id] !== undefined
                let cls = 'glass hover:bg-white/10 dark:hover:bg-white/10'
                if (show) {
                  if (isCorrect) cls = 'bg-emerald-500/20 border-emerald-400/60'
                  else if (selected) cls = 'bg-rose-500/20 border-rose-400/60'
                  else cls = 'glass opacity-50'
                } else if (selected) {
                  cls = 'bg-neon-cyan/20 border-neon-cyan/60'
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(q.id, i)}
                    disabled={show}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-colors disabled:cursor-default ${cls}`}
                  >
                    <span className="inline-flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-white/10 dark:bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm flex-1">{opt}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {answers[q.id] !== undefined && (
              <div className={`rounded-2xl p-5 border mb-6 ${
                answers[q.id] === q.correct ? 'bg-emerald-500/15 border-emerald-400/40' : 'bg-rose-500/15 border-rose-400/40'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {answers[q.id] === q.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="font-display font-bold text-gray-900 dark:text-white">
                    {answers[q.id] === q.correct ? 'Correto!' : 'Resposta incorreta'}
                  </span>
                </div>
                {answers[q.id] !== q.correct && (
                  <p className="text-gray-700 dark:text-white/70 text-sm">
                    Gabarito: <span className="font-bold text-neon-cyan">{String.fromCharCode(65 + q.correct)}</span>
                  </p>
                )}
                {q.resolution && (
                  <div className="mt-3 text-sm text-gray-700 dark:text-white/70">
                    <div className="font-semibold mb-1">Resolução:</div>
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.resolution) }} />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="px-5 py-2.5 rounded-xl glass hover:bg-white/10 dark:hover:bg-white/10 text-sm disabled:opacity-40"
              >
                Anterior
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => c + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950 font-semibold text-sm"
                >
                  Próxima →
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950 font-semibold text-sm"
                >
                  Finalizar
                </button>
              )}
            </div>
          </motion.div>
        )}

        {mode === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="glass rounded-3xl p-8 text-center">
              <div className="font-display text-6xl font-bold text-gradient mb-2">{result.overall}</div>
              <p className="text-gray-600 dark:text-white/60 mb-2">Nota TRI estimada (escala 0–1000)</p>
              <p className="text-sm text-gray-500 dark:text-white/50">{result.correctCount} acertos de {result.total}</p>
            </div>

            <div className="glass rounded-3xl p-8">
              <h3 className="font-display text-xl font-bold mb-4 text-gray-900 dark:text-white">Notas por área</h3>
              <div className="space-y-3">
                {Object.entries(result.areas).map(([area, score]) => (
                  <div key={area} className="flex items-center gap-4">
                    <div className="w-52 text-sm font-medium text-gray-700 dark:text-white/80 truncate">{area}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/10 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet" style={{ width: `${score / 10}%` }} />
                    </div>
                    <div className="w-12 text-right font-display font-bold text-sm">{score}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Gabarito</h3>
                <button
                  onClick={() => setShowOnlyWrong((s) => !s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    showOnlyWrong ? 'bg-rose-500/20 border border-rose-400/60' : 'glass hover:bg-white/10 dark:hover:bg-white/10'
                  }`}
                >
                  {showOnlyWrong ? 'Mostrando apenas erros' : 'Mostrar apenas erros'}
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                {result.responses
                  .filter((r) => (showOnlyWrong ? !r.correct : true))
                  .map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 dark:bg-white/5">
                      {r.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{r.subject} · {r.examName} ({r.year})</div>
                        <div className="text-xs text-gray-600 dark:text-white/60">
                          Sua resposta: {answers[r.id] !== undefined ? String.fromCharCode(65 + answers[r.id]) : '—'} · Gabarito: {String.fromCharCode(65 + r.correctIndex)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={reset} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold glass hover:bg-white/10 dark:hover:bg-white/10">
                <RotateCcw className="w-4 h-4" /> Refazer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}