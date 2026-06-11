import { motion } from 'framer-motion'

type Status = 'idle' | 'active' | 'done'

interface Props {
  label: string
  description: string
  icon: string
  status: Status
  index: number
  accentColor?: string
}

export default function RAGNode({ label, description, icon, status, index, accentColor = '#6366f1' }: Props) {
  const activeGlow = `0 0 20px ${accentColor}50`
  const styles = {
    idle:   { border: 'var(--border)',   bg: 'var(--bg-card)',             text: 'var(--text-muted)' },
    active: { border: accentColor,       bg: `${accentColor}12`,           text: 'var(--text-primary)', glow: activeGlow },
    done:   { border: '#10b981',         bg: 'rgba(16,185,129,0.06)',       text: 'var(--text-primary)' },
  }
  const s = styles[status]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className="rounded-xl p-4 w-36 text-center relative"
      style={{
        border: `1.5px solid ${s.border}`,
        backgroundColor: s.bg,
        boxShadow: 'glow' in s ? s.glow : undefined,
        transition: 'border-color 0.3s, background-color 0.3s, box-shadow 0.3s',
      }}
    >
      {status === 'active' && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ border: `1.5px solid ${accentColor}` }}
        />
      )}
      <div className="text-2xl mb-2">{icon}</div>
      <div
        className="text-xs font-semibold mb-1 uppercase tracking-wide"
        style={{ color: status === 'idle' ? 'var(--text-muted)' : accentColor }}
      >
        {label}
      </div>
      <div className="text-xs leading-tight" style={{ color: s.text }}>
        {description}
      </div>
      {status === 'done' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: '#10b981', color: 'white' }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  )
}
