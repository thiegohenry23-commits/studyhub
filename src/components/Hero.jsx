import React from 'react'
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hero() {
  const ref = React.useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })

  const { scrollYProgress } = useScroll()
  const yBg = useTransform(scrollYProgress, [0, 1], [0, -120])
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.3])

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    mx.set(x * 40)
    my.set(y * 40)
  }
  const handleLeave = () => { mx.set(0); my.set(0) }

  const orb1X = useTransform(sx, (v) => v * 1.2)
  const orb1Y = useTransform(sy, (v) => v * 1.2)
  const orb2X = useTransform(sx, (v) => -v * 0.8)
  const orb2Y = useTransform(sy, (v) => -v * 0.8)

  return (
    <section
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative min-h-screen flex items-center overflow-hidden pt-28"
    >
      <motion.div style={{ y: yBg, opacity }} className="absolute inset-0 grid-bg opacity-60" />

      {/* abstract shapes reacting to mouse */}
      <motion.div
        style={{ x: orb1X, y: orb1Y }}
        className="absolute -top-32 -right-20 w-[520px] h-[520px] rounded-full blur-3xl opacity-60"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-pink animate-pulse-slow" />
      </motion.div>
      <motion.div
        style={{ x: orb2X, y: orb2Y }}
        className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-neon-violet to-neon-cyan animate-float" />
      </motion.div>

      <div className="absolute inset-0 noise" />

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-white/80 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          Nova geração de aprendizado com IA
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-display font-bold tracking-tighter leading-[0.9] text-[12vw] md:text-[8.5vw] lg:text-[7.5rem]"
        >
          Estude <span className="text-gradient">mais rápido.</span>
          <br />
          Entenda <span className="text-gradient">de verdade.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="mt-8 max-w-2xl text-lg md:text-xl text-gray-600 dark:text-white/60 leading-relaxed"
        >
          Uma plataforma imersiva que combina aulas interativas, quizzes inteligentes e um tutor de IA
          que simplifica qualquer assunto em segundos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            to="/explore"
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold bg-white text-ink-950 hover:scale-[1.02] transition-transform"
          >
            Começar agora
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/quiz/Matemática"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold glass hover:bg-white/10 transition-colors"
          >
            <Play className="w-4 h-4" /> Ver demonstração
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-20 flex items-center gap-6 text-gray-400 dark:text-white/40 text-sm"
        >
          <div className="h-px w-12 bg-white/20" />
          Role para explorar
        </motion.div>
      </div>
    </section>
  )
}