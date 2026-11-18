import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Bot, User } from 'lucide-react'

const SYSTEM_PROMPT = `Você é um tutor de estudos amigável, didático e paciente. Responda em português do Brasil.
Simplifique conceitos, use exemplos claros e curtos. Se o aluno errar, corrija com gentileza.
Mantenha respostas concisas (até ~120 palavras) e focadas no aprendizado.`

export default function ChatAI({ open, onClose }) {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', text: 'Olá! Sou seu tutor de IA. Posso simplificar qualquer assunto. O que você gostaria de entender?' }
  ])
  const [input, setInput] = React.useState('')
  const [typing, setTyping] = React.useState(false)
  const scrollRef = React.useRef(null)

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, typing])

  const send = async () => {
    const t = input.trim()
    if (!t || typing) return
    const userMsg = { role: 'user', text: t }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setTyping(true)

    try {
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...nextMessages.map((m) => ({ role: m.role, content: m.text }))
      ]

      // Produção: proxy serverless (chave fica no servidor)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, temperature: 0.7, max_tokens: 1024 })
      })


      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`${res.status} ${res.statusText} — ${errText.slice(0, 200)}`)
      }
      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'Não consegui gerar uma resposta. Tente novamente.'
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `⚠️ Erro ao consultar a IA: ${err.message}` }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white dark:bg-ink-950/70 backdrop-blur-xl"
          />

          <motion.div
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl h-[85vh] glass-strong rounded-3xl flex flex-col overflow-hidden shadow-glowv"
          >
            {/* header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
                  <Bot className="w-5 h-5 text-ink-950" />
                </div>
                <div>
                  <div className="font-display font-bold">Tutor IA</div>
                  <div className="text-xs text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-ink-950" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-neon-violet to-neon-pink text-gray-900 dark:text-white rounded-br-sm'
                          : 'glass rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-ink-950" />
                  </div>
                  <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-neon-cyan"
                        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* input */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 glass rounded-2xl px-4 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Pergunte algo ao tutor..."
                  className="flex-1 bg-transparent outline-none text-sm py-2 placeholder:text-gray-400 dark:text-white/40"
                />
                <button
                  onClick={send}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-violet flex items-center justify-center text-ink-950 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400 dark:text-white/40">
                <Sparkles className="w-3 h-3" /> Tutor IA · Groq (gpt-oss-20b) — respostas em tempo real
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}