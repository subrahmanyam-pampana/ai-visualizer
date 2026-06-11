import { motion, AnimatePresence } from 'framer-motion'
import type { AgentStep } from '../../types'

const TYPE_CONFIG: Record<
  AgentStep['type'],
  { label: string; color: string; bg: string; icon: string }
> = {
  input: { label: 'User', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '👤' },
  think: { label: 'Think', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🧠' },
  tool_call: { label: 'Tool', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '🔧' },
  observation: { label: 'Observe', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', icon: '👁️' },
  answer: { label: 'Answer', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
}

interface Props {
  steps: AgentStep[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function AgentLog({ steps, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2 overflow-y-auto max-h-96">
      <AnimatePresence>
        {steps.map((step, idx) => {
          const cfg = TYPE_CONFIG[step.type]
          const isSelected = step.id === selectedId
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => onSelect(step.id)}
              className="rounded-lg p-3 cursor-pointer transition-colors"
              style={{
                backgroundColor: isSelected ? cfg.bg : 'var(--bg-card)',
                border: `1px solid ${isSelected ? cfg.color : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{cfg.icon}</span>
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
                {step.tool && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                  >
                    {step.tool}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {step.args ? step.args : step.text}
              </p>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {steps.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="text-2xl mb-2">🤖</div>
          <p className="text-xs">Agent trace will appear here...</p>
        </div>
      )}
    </div>
  )
}
