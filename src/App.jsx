import React, { useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import SubjectCards from './components/SubjectCards.jsx'
import ChatAI from './components/ChatAI.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { ThemeProvider } from './components/ThemeToggle.jsx'

const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const Simulados = lazy(() => import('./pages/Simulados.jsx'))

function PageFallback() {
  return (
    <div className="pt-32 max-w-6xl mx-auto px-6">
      <div className="glass rounded-3xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen relative">
          <Navbar onOpenChat={() => setChatOpen(true)} />
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Routes location={location}>
                  <Route
                    path="/"
                    element={
                      <main>
                        <Hero />
                        <SubjectCards />
                        <section className="max-w-6xl mx-auto px-6 py-24">
                          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
                            Por que estudar aqui?
                          </h2>
                          <p className="text-gray-600 dark:text-white/60 max-w-2xl text-lg">
                            Uma experiência de aprendizado imersiva, com IA que simplifica, personaliza e acelera sua jornada.
                          </p>
                          <div className="grid md:grid-cols-3 gap-6 mt-12">
                            {[
                              { t: 'IA Tutor', d: 'Explicações adaptadas ao seu ritmo e estilo.' },
                              { t: 'Prática gamificada', d: 'Quizzes com feedback instantâneo.' },
                              { t: 'Progresso vivo', d: 'Visualize sua evolução em tempo real.' }
                            ].map((f) => (
                              <div key={f.t} className="glass rounded-2xl p-6 hover:border-neon-cyan/40 transition-colors">
                                <div className="font-display text-xl font-semibold mb-2 text-gradient">{f.t}</div>
                                <p className="text-gray-600 dark:text-white/60 text-sm">{f.d}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </main>
                    }
                  />
                  <Route path="/quiz/:subject" element={<Quiz onOpenChat={() => setChatOpen(true)} />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/simulados" element={<Simulados />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
          <ChatAI open={chatOpen} onClose={() => setChatOpen(false)} />
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}