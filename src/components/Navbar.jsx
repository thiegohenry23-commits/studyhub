import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeToggle.jsx'

export default function Navbar({ onOpenChat }) {
  const [open, setOpen] = React.useState(false)
  const loc = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="glass-strong rounded-2xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-ink-950" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">StudyHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/', label: 'Início' },
              { to: '/explore', label: 'Explorar' },
              { to: '/simulados', label: 'Simulados' },
              { to: '/simulados-hub', label: 'Simulados Hub (teste)' },
              { to: '/quiz/Matemática', label: 'Prática' }
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  loc.pathname === l.to ? 'text-neon-cyan' : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-xl glass hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onOpenChat}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950 hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" /> Tutor IA
            </button>
            <button className="md:hidden p-2 rounded-xl glass" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col gap-1"
          >
            <Link to="/" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5">Início</Link>
            <Link to="/explore" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5">Explorar</Link>
            <Link to="/simulados" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5 dark:hover:bg-white/5">Simulados</Link>
            <Link to="/simulados-hub" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5 dark:hover:bg-white/5">Simulados Hub (teste)</Link>
            <Link to="/quiz/Matemática" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5">Prática</Link>
            <button onClick={() => { setOpen(false); onOpenChat() }} className="px-4 py-2 rounded-xl text-sm text-left bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950 font-semibold">Tutor IA</button>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}