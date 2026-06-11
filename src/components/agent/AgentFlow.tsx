import { motion, AnimatePresence } from 'framer-motion'
import type { AgentStep } from '../../types'

const TYPE_CONFIG: Record<
  AgentStep['type'],
  { color: string; bg: string; border: string; icon: string; shape: 'rect' | 'diamond' | 'pill' }
> = {
  input: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6', icon: '👤', shape: 'pill' },
  think: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b40', icon: '🧠', shape: 'diamond' },
  tool_call: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#3b82f640', icon: '🔧', shape: 'rect' },
  observation: { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', border: '#14b8a640', icon: '👁️', shape: 'rect' },
  answer: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#10b981', icon: '✅', shape: 'pill' },
}

interface Props {
  steps: AgentStep[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function AgentFlow({ steps, selectedId, onSelect }: Props) {
  if (steps.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          minHeight: '300px',
        }}
      >
        <div className="text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm">Enter a query and click "Run Agent" to watch the flow</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6 overflow-y-auto"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        maxHeight: '480px',
      }}
    >
      <div className="flex flex-col items-center gap-0">
        <AnimatePresence>
          {steps.map((step, idx) => {
            const cfg = TYPE_CONFIG[step.type]
            const isSelected = step.id === selectedId
            const isDiamond = cfg.shape === 'diamond'
            const isPill = cfg.shape === 'pill'

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Connector line from previous */}
                {idx > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 24, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-0.5"
                    style={{ backgroundColor: cfg.color + '60' }}
                  />
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  onClick={() => onSelect(step.id)}
                  className="cursor-pointer w-72"
                  style={{
                    transform: isDiamond ? 'none' : undefined,
                  }}
                >
                  {isDiamond ? (
                    // Diamond shape for Think steps
                    <div className="relative flex items-center justify-center" style={{ height: '80px' }}>
                      <div
                        className="absolute w-16 h-16"
                        style={{
                          backgroundColor: isSelected ? cfg.bg : 'var(--bg-card)',
                          border: `1.5px solid ${isSelected ? cfg.color : cfg.border}`,
                          transform: 'rotate(45deg)',
                          boxShadow: isSelected ? `0 0 16px ${cfg.color}40` : undefined,
                          transition: 'all 0.2s',
                        }}
                      />
                      <div className="relative z-10 text-center" style={{ color: cfg.color }}>
                        <div className="text-lg">{cfg.icon}</div>
                        <div className="text-xs font-semibold">Think</div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="px-4 py-3 transition-all"
                      style={{
                        backgroundColor: isSelected ? cfg.bg : 'var(--bg-card)',
                        border: `1.5px solid ${isSelected ? cfg.color : cfg.border}`,
                        borderRadius: isPill ? '9999px' : '12px',
                        boxShadow: isSelected ? `0 0 16px ${cfg.color}40` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>
                              {step.type === 'tool_call' ? step.tool : step.type}
                            </span>
                          </div>
                          <p
                            className="text-xs truncate"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {step.args ?? step.text.slice(0, 60) + (step.text.length > 60 ? '…' : '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
