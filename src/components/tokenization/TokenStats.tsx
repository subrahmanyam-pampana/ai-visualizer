import { motion } from 'framer-motion'
import type { Token, ModelOption, ModelFamily } from '../../types'

interface Props {
  tokens: Token[]
  input: string
  model: ModelOption
}

const FAMILY_COLOR: Record<ModelFamily, string> = {
  gpt: '#10b981',
  claude: '#f59e0b',
  gemini: '#3b82f6',
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      className="flex-1 rounded-xl p-4 text-center"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <motion.div
        key={String(value)}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-1"
        style={{ color }}
      >
        {value}
      </motion.div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  )
}

export default function TokenStats({ tokens, input, model }: Props) {
  const tokenCount = tokens.length
  const charCount = input.length
  const ratio = tokenCount > 0 ? (charCount / tokenCount).toFixed(1) : '—'
  const color = FAMILY_COLOR[model.family]

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <StatCard label="Tokens" value={tokenCount} color={color} />
        <StatCard label="Characters" value={charCount} color={color} />
        <StatCard label="Chars / Token" value={ratio} color={color} />
      </div>
      {tokenCount > 0 && (
        <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
          {model.label} · {model.encoding === 'sentencepiece' ? 'SentencePiece' : `BPE ${model.encoding}`}
        </p>
      )}
    </div>
  )
}
