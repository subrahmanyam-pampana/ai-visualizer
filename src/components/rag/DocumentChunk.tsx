import { motion } from 'framer-motion'
import type { DocumentChunk } from '../../types'

interface Props {
  chunk: DocumentChunk
  similarity: number
  index: number
}

export default function DocumentChunkCard({ chunk, similarity, index }: Props) {
  const pct = Math.round(similarity * 100)
  const color = pct > 60 ? '#10b981' : pct > 40 ? '#f59e0b' : '#64748b'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
      className="rounded-lg p-3"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {chunk.title}
        </span>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {pct}%
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {chunk.body.slice(0, 120)}…
      </p>
    </motion.div>
  )
}
