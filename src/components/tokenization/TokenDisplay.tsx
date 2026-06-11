import { AnimatePresence } from 'framer-motion'
import TokenChip from './TokenChip'
import type { Token } from '../../types'

interface Props {
  tokens: Token[]
  input: string
  loading?: boolean
}

export default function TokenDisplay({ tokens, input, loading }: Props) {
  if (!input) {
    return (
      <div
        className="min-h-24 rounded-xl p-4 flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Start typing above to see tokens appear here...
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-24 rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <div className="flex flex-wrap gap-0">
        <AnimatePresence mode="popLayout">
          {tokens.map((token, i) => (
            <TokenChip key={`${token.id}-${token.text}-${i}`} token={token} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
