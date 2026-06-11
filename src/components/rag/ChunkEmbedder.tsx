import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  DIM_LABELS,
  textEmbed,
  getHighlights,
  RAG_DOCUMENTS,
  cosineSimilarity,
  pcaFit,
  pcaProject,
} from './ragData'

// One distinct colour per dimension (16 hues, works on dark bg)
const DIM_COLORS = [
  '#f97316', // pasta      — orange
  '#eab308', // baking     — amber
  '#ef4444', // grilling   — red
  '#ec4899', // sauce      — pink
  '#a855f7', // spice      — purple
  '#6366f1', // dairy      — indigo
  '#22c55e', // vegetable  — green
  '#14b8a6', // technique  — teal
  '#8b5cf6', // bread      — violet
  '#d946ef', // dessert    — fuchsia
  '#f43f5e', // protein    — rose
  '#84cc16', // acid       — lime
  '#facc15', // fat        — yellow
  '#fb923c', // temperature— orange-400
  '#4ade80', // vegetarian — green-400
  '#38bdf8', // storage    — sky
]

const PRESETS = [
  { label: 'Carbonara', text: 'carbonara pasta guanciale eggs pecorino cheese' },
  { label: 'Bread', text: 'knead bread dough flour yeast sourdough starter' },
  { label: 'Grilling', text: 'sear steak grill high heat rest juices' },
  { label: 'Tomato sauce', text: 'simmer tomato sauce garlic reduce broth' },
  { label: 'Cookies', text: 'sugar chocolate cookie butter sweet vanilla' },
  { label: 'Vinaigrette', text: 'lemon vinegar mustard vinaigrette oil acid' },
]

const W = 380
const H = 300
const PAD = 36

const DOC_VECTORS = RAG_DOCUMENTS.map(d => d.embedding)
const PCA_MODEL = pcaFit(DOC_VECTORS)
const DOC_PTS = DOC_VECTORS.map(v => pcaProject(v, PCA_MODEL))

// Fixed bounds fitted on the document corpus only — never changes, so docs never jump
const DOC_BOUNDS = (() => {
  const xs = DOC_PTS.map(p => p[0])
  const ys = DOC_PTS.map(p => p[1])
  const xRange = Math.max(...xs) - Math.min(...xs) || 1
  const yRange = Math.max(...ys) - Math.min(...ys) || 1
  const px = xRange * 0.18
  const py = yRange * 0.18
  return {
    xMin: Math.min(...xs) - px,
    xMax: Math.max(...xs) + px,
    yMin: Math.min(...ys) - py,
    yMax: Math.max(...ys) + py,
  }
})()

function debounce<T extends (s: string) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout>
  return ((s: string) => { clearTimeout(t); t = setTimeout(() => fn(s), ms) }) as T
}

function toSVG(
  v: [number, number],
  bounds: typeof DOC_BOUNDS,
): [number, number] {
  const { xMin, xMax, yMin, yMax } = bounds
  // Clamp so the user dot never leaves the plot area
  const cx = Math.max(PAD + 8, Math.min(W - PAD - 8,
    PAD + ((v[0] - xMin) / (xMax - xMin)) * (W - 2 * PAD)))
  const cy = Math.max(PAD + 8, Math.min(H - PAD - 8,
    PAD + ((v[1] - yMin) / (yMax - yMin)) * (H - 2 * PAD)))
  return [cx, cy]
}

export default function ChunkEmbedder() {
  const [input, setInput] = useState(PRESETS[0].text)
  const [committed, setCommitted] = useState(PRESETS[0].text)
  const debouncedRef = useRef(debounce(setCommitted, 200))

  useEffect(() => { debouncedRef.current(input) }, [input])

  const vec = useMemo(() => textEmbed(committed), [committed])

  const maxVal = useMemo(() => Math.max(...vec.map(Math.abs), 0.001), [vec])

  const highlights = useMemo(() => getHighlights(input), [input])

  const userPt = useMemo(() => pcaProject(vec, PCA_MODEL), [vec])

  // Use fixed doc bounds — docs never shift, user dot is clamped inside the plot
  const docSVG = DOC_PTS.map(p => toSVG(p, DOC_BOUNDS))
  const [ux, uy] = toSVG(userPt, DOC_BOUNDS)

  // Ranked nearest docs
  const ranked = useMemo(() =>
    RAG_DOCUMENTS
      .map((d, i) => ({ ...d, sim: (cosineSimilarity(vec, d.embedding) + 1) / 2, i }))
      .sort((a, b) => b.sim - a.sim),
    [vec],
  )

  // Render input text with coloured keyword spans
  const highlightedText = useMemo(() => {
    if (!highlights.length) return <span style={{ color: 'var(--text-secondary)' }}>{input}</span>
    const parts: React.ReactNode[] = []
    let cursor = 0
    for (const { start, end, dimIndex } of highlights) {
      if (start > cursor) parts.push(<span key={`t${cursor}`} style={{ color: 'var(--text-secondary)' }}>{input.slice(cursor, start)}</span>)
      parts.push(
        <span
          key={`h${start}`}
          style={{
            color: DIM_COLORS[dimIndex],
            borderBottom: `2px solid ${DIM_COLORS[dimIndex]}`,
            paddingBottom: 1,
            fontWeight: 500,
          }}
        >
          {input.slice(start, end)}
        </span>
      )
      cursor = end
    }
    if (cursor < input.length) parts.push(<span key={`t${cursor}`} style={{ color: 'var(--text-secondary)' }}>{input.slice(cursor)}</span>)
    return parts
  }, [input, highlights])

  return (
    <div
      className="rounded-xl p-6 space-y-4"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">🧮</span>
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
          Chunk → Vector → Semantic Space
        </h2>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Type any text and watch it get converted to a 16-dimensional vector, then placed in semantic space. Coloured words activate the matching dimension.
      </p>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Column 1: Input ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#6366f1', color: '#fff' }}
            >1</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Text Chunk
            </span>
          </div>

          {/* Live-highlighted read layer + invisible textarea stacked */}
          <div className="relative rounded-lg" style={{ border: '1px solid var(--border)' }}>
            {/* Highlight render layer */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-lg px-3 py-2 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words"
              style={{ fontFamily: 'inherit', zIndex: 1 }}
            >
              {highlightedText}
            </div>
            {/* Actual textarea (transparent text so highlight shows through) */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              className="relative w-full rounded-lg px-3 py-2 text-sm leading-relaxed resize-none outline-none bg-transparent"
              style={{
                color: 'transparent',
                caretColor: 'var(--text-primary)',
                border: 'none',
                zIndex: 2,
                fontFamily: 'inherit',
              }}
              placeholder="Type a text chunk…"
            />
          </div>

          {/* Presets */}
          <div className="space-y-1">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try:</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setInput(p.text)}
                  className="text-xs px-2 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: input === p.text ? 'rgba(99,102,241,0.18)' : 'var(--bg-card)',
                    border: `1px solid ${input === p.text ? '#6366f1' : 'var(--border)'}`,
                    color: input === p.text ? '#6366f1' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Column 2: Embedding vector ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#6366f1', color: '#fff' }}
            >2</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Embedding Vector
            </span>
          </div>

          <div className="space-y-1">
            {vec.map((val, i) => {
              const pct = Math.abs(val) / maxVal * 100
              const isActive = pct > 8
              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="text-xs w-20 text-right flex-shrink-0 truncate"
                    style={{
                      color: isActive ? DIM_COLORS[i] : 'var(--text-muted)',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'color 0.2s',
                    }}
                  >
                    {DIM_LABELS[i]}
                  </span>
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ height: 6, backgroundColor: 'var(--bg-card)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      style={{ backgroundColor: isActive ? DIM_COLORS[i] : 'var(--border)' }}
                    />
                  </div>
                  <span
                    className="text-xs w-10 flex-shrink-0 font-mono"
                    style={{ color: isActive ? DIM_COLORS[i] : 'var(--text-muted)' }}
                  >
                    {val.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Column 3: Semantic space ────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#6366f1', color: '#fff' }}
            >3</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Semantic Space
            </span>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="rounded-lg w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
            {/* Grid */}
            {[0.25, 0.5, 0.75].map(t => (
              <g key={t}>
                <line x1={PAD} x2={W - PAD} y1={PAD + t * (H - 2 * PAD)} y2={PAD + t * (H - 2 * PAD)}
                  stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                <line x1={PAD + t * (W - 2 * PAD)} x2={PAD + t * (W - 2 * PAD)} y1={PAD} y2={H - PAD}
                  stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
              </g>
            ))}

            {/* Connection lines: user → top-3 */}
            {ranked.slice(0, 3).map(({ i, sim }) => {
              const [dx, dy] = docSVG[i]
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={ux} y1={uy} x2={dx} y2={dy}
                  stroke={`rgba(99,102,241,${0.2 + sim * 0.4})`}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )
            })}

            {/* Document dots */}
            {RAG_DOCUMENTS.map((doc, i) => {
              const [cx, cy] = docSVG[i]
              const sim = ranked.find(r => r.i === i)?.sim ?? 0
              const isTop3 = ranked.slice(0, 3).some(r => r.i === i)
              return (
                <g key={doc.id}>
                  {isTop3 && (
                    <motion.circle
                      cx={cx} cy={cy} r={10}
                      fill="none"
                      stroke="rgba(99,102,241,0.25)"
                      strokeWidth={1.5}
                      animate={{ r: [10, 14, 10] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                    />
                  )}
                  <circle
                    cx={cx} cy={cy}
                    r={isTop3 ? 5 : 3.5}
                    fill={`rgba(99,102,241,${0.25 + sim * 0.75})`}
                    stroke={isTop3 ? '#6366f1' : 'none'}
                    strokeWidth={1.5}
                  />
                  {/* Label for top-3 */}
                  {isTop3 && (
                    <text
                      x={cx + 7} y={cy + 4}
                      fontSize={9}
                      fill="#6366f1"
                      style={{ pointerEvents: 'none' }}
                    >
                      {doc.title.length > 14 ? doc.title.slice(0, 13) + '…' : doc.title}
                    </text>
                  )}
                </g>
              )
            })}

            {/* User chunk dot — animated position */}
            <motion.circle
              animate={{ cx: ux, cy: uy }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              r={7}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.7))' }}
            />
            <motion.text
              animate={{ x: ux + 10, y: uy + 4 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              fontSize={9}
              fill="#f97316"
              fontWeight={600}
              style={{ pointerEvents: 'none' }}
            >
              your chunk
            </motion.text>

            {/* Axis labels */}
            <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">PC1 →</text>
            <text x={10} y={H / 2} textAnchor="middle" fontSize={9} fill="var(--text-muted)"
              transform={`rotate(-90, 10, ${H / 2})`}>PC2</text>
          </svg>

          {/* Top-3 nearest */}
          <div className="space-y-1">
            {ranked.slice(0, 3).map((doc, rank) => (
              <div key={doc.id} className="flex items-center gap-2">
                <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: '#6366f1' }}>
                  #{rank + 1}
                </span>
                <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {doc.title}
                </span>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: '#6366f1' }}>
                  {(doc.sim * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
