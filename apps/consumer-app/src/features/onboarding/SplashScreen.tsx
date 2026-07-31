import { motion } from 'framer-motion'
import { FloMark } from '@/components/FloMark'

/** Shown once per cold load, for a fixed minimum duration — see App.tsx. */
export function SplashScreen() {
  return (
    <div className="phone-shell items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#131c30] to-[#1e2a47]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 40px rgba(59,130,246,0.45)', '0 0 0px rgba(59,130,246,0)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-3xl"
        >
          <FloMark className="h-20 w-20" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-5 font-display text-2xl font-bold tracking-tight text-white"
        >
          FloPay
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-1 text-xs font-medium text-white/50"
        >
          Money, moved simply
        </motion.p>
      </motion.div>
    </div>
  )
}
