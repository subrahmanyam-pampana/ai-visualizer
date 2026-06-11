import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TOKEN_COLORS } from './COLORS'
import type { Token } from '../../types'

interface Props {
  token: Token
}

export default function TokenChip({ token }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const color = TOKEN_COLORS[token.colorIndex]

  const displayText = token.text
    .replace(/ /g, '·')
    .replace(/\n/g, '↵')
    .replace(/\t/g, '→')

  const isWhitespace = token.text.trim() === ''

  return (
    <div className="relative inline-block" style={{ margin: '2px' }}>
      <motion.span
        layout
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-block px-2 py-1 rounded-md text-sm font-mono cursor-default select-none"
        style={{
          borderBottom: `3px solid ${color}`,
          backgroundColor: `${color}18`,
          color: isWhitespace ? color : 'var(--text-primary)',
          minWidth: '1.5rem',
          textAlign: 'center',
        }}
      >
        {displayText || <span style={{ opacity: 0.4 }}>_</span>}
      </motion.span>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap z-10 pointer-events-none"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            ID: {token.id}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
