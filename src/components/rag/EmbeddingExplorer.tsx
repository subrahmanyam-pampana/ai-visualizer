import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RAG_DOCUMENTS, textEmbed, cosineSimilarity, pcaFit, pcaProject, DIM_LABELS } from './ragData'

const W = 440
const H = 340
const PAD = 40

const EXAMPLES = [
  'What ingredients do I need to make pasta carbonara?',
  'How long should I knead bread dough?',
  'What can I substitute for meat in a stew?',
  'How do I make a vinaigrette dressing?',
  'What spices go into garam masala?',
]

// Pre-fit PCA on the document corpus — stable reference frame
const DOC_VECTORS = RAG_DOCUMENTS.map(d => d.embedding)
const PCA_MODEL = pcaFit(DOC_VECTORS)

// Project all docs once
const DOC_PROJECTED = DOC_VECTORS.map(v => pcaProject(v, PCA_MODEL))

function scaleToSVG(pts: [number, number][]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const xs = pts.map(p => p[0])
  const ys = pts.map(p => p[1])
  return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) }
}

function mapX(v: number, xMin: number, xMax: number) {
  return xMin === xMax ? W / 2 : PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD)
}
function mapY(v: number, yMin: number, yMax: number) {
  return yMin === yMax ? H / 2 : PAD + ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD)
}

function simToColor(sim: number): string {
  const t = Math.max(0, Math.min(1, sim))
  const r = Math.round(99 + t * (16 - 99))
  const g = Math.round(120 + t * (185 - 120))
  const b = Math.round(240 + t * (129 - 240))
  return `rgb(${r},${g},${b})`
}

function debounce<T extends (s: string) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout>
  return ((s: string) => { clearTimeout(t); t = setTimeout(() => fn(s), ms) }) as T
}

export default function EmbeddingExplorer() {
  const [input, setInput] = useState('')
  const [committed, setCommitted] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const debouncedRef = useRef(debounce(setCommitted, 250))

  useEffect(() => { debouncedRef.current(input) }, [input])

  const userVec = useMemo(
    () => committed.trim() ? textEmbed(committed) : null,
    [committed]
  )

  const userPt = useMemo(
    () => userVec ? pcaProject(userVec, PCA_MODEL) : null,
    [userVec]
  )

  // Scale bounds — include user point so it never falls outside
  const allPts = useMemo(() => [
    ...DOC_PROJECTED,
    ...(userPt ? [userPt] : []),
  ], [userPt])

  const bounds = useMemo(() => scaleToSVG(allPts), [allPts])

  // Similarities between user input and each doc
  const similarities = useMemo(() => {
    if (!userVec) return []
    return RAG_DOCUMENTS.map(doc => ({
      ...doc,
      sim: cosineSimilarity(userVec, doc.embedding),
    })).sort((a, b) => b.sim - a.sim)
  }, [userVec])

  const top3 = similarities.slice(0, 3)

  const hovered = hoveredId
    ? (hoveredId === '__user__'
        ? { id: '__user__', title: 'Your text', embedding: userVec ?? [], sim: 1 }
        : { ...RAG_DOCUMENTS.find(d => d.id === hoveredId)!, sim: similarities.find(s => s.id === hoveredId)?.sim ?? 0 })
    : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Text → Vector Explorer
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Type any text and watch it convert to a 16-dimensional embedding vector in real time.
          The scatter plot shows where your text lands in the same semantic space as the document corpus.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type any text to embed it — try describing a concept, asking a question, or pasting a sentence…"
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: `1.5px solid ${input ? '#6366f1' : 'var(--border)'}`,
            color: 'var(--text-primary)',
          }}
        />
        {/* Example pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Try:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: input === ex ? 'rgba(99,102,241,0.12)' : 'var(--bg-secondary)',
                border: `1px solid ${input === ex ? '#6366f1' : 'var(--border)'}`,
                color: input === ex ? '#6366f1' : 'var(--text-muted)',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {userVec ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: vector bar chart + scatter plot ── */}
          <div className="space-y-4">

            {/* 16-bar vector chart */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Embedding vector — 16 dimensions
              </p>
              <div className="flex items-end justify-between gap-1" style={{ height: 80 }}>
                {userVec.map((val, i) => {
                  const absMax = Math.max(...userVec.map(Math.abs))
                  const pct = absMax === 0 ? 0 : Math.abs(val) / absMax
                  const barH = Math.max(2, pct * 60)
                  const isHot = pct > 0.5
                  return (
                    <motion.div
                      key={i}
                      className="flex flex-col items-center gap-0.5 flex-1"
                      title={`${DIM_LABELS[i]}: ${val.toFixed(3)}`}
                    >
                      {/* positive bar (above mid-line) */}
                      <motion.div
                        animate={{ height: val >= 0 ? barH : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{
                          width: '100%',
                          backgroundColor: isHot ? '#6366f1' : '#6366f180',
                          borderRadius: '3px 3px 0 0',
                          minHeight: 0,
                        }}
                      />
                      {/* axis line */}
                      <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border)' }} />
                      {/* negative bar (below mid-line) */}
                      <motion.div
                        animate={{ height: val < 0 ? barH : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{
                          width: '100%',
                          backgroundColor: '#6366f140',
                          borderRadius: '0 0 3px 3px',
                          minHeight: 0,
                        }}
                      />
                    </motion.div>
                  )
                })}
              </div>
              {/* Dimension labels — show 4 evenly spaced */}
              <div className="flex justify-between mt-1">
                {[0, 4, 8, 12, 15].map(i => (
                  <span key={i} className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                    {DIM_LABELS[i]}
                  </span>
                ))}
              </div>
              {/* Hot dimensions callout */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {userVec
                  .map((v, i) => ({ v, i }))
                  .filter(({ v }) => v > 0.15)
                  .sort((a, b) => b.v - a.v)
                  .slice(0, 5)
                  .map(({ v, i }) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        color: '#6366f1',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                      {DIM_LABELS[i]} {(v * 100).toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>

            {/* Scatter plot */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Embedding space (PCA → 2D)
                </p>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} /> Docs
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 inline-block rotate-45" style={{ backgroundColor: '#6366f1' }} /> You
                  </span>
                </div>
              </div>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: 'block' }}>
                {/* Grid */}
                {[0.25, 0.5, 0.75].map(t => (
                  <g key={t} opacity={0.12}>
                    <line x1={PAD + t * (W - 2 * PAD)} y1={PAD} x2={PAD + t * (W - 2 * PAD)} y2={H - PAD} stroke="currentColor" strokeWidth={1} />
                    <line x1={PAD} y1={PAD + t * (H - 2 * PAD)} x2={W - PAD} y2={PAD + t * (H - 2 * PAD)} stroke="currentColor" strokeWidth={1} />
                  </g>
                ))}

                {/* Lines from user to top-3 */}
                {top3.map((doc, idx) => {
                  const docPt = DOC_PROJECTED[RAG_DOCUMENTS.findIndex(d => d.id === doc.id)]
                  const ux = mapX(userPt![0], bounds.xMin, bounds.xMax)
                  const uy = mapY(userPt![1], bounds.yMin, bounds.yMax)
                  const dx = mapX(docPt[0], bounds.xMin, bounds.xMax)
                  const dy = mapY(docPt[1], bounds.yMin, bounds.yMax)
                  return (
                    <motion.line
                      key={doc.id}
                      x1={ux} y1={uy} x2={dx} y2={dy}
                      stroke={simToColor(doc.sim)}
                      strokeWidth={1 + doc.sim * 2}
                      strokeOpacity={0.35 + doc.sim * 0.5}
                      strokeDasharray="4 3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                    />
                  )
                })}

                {/* Doc dots */}
                {RAG_DOCUMENTS.map((doc, i) => {
                  const pt = DOC_PROJECTED[i]
                  const cx = mapX(pt[0], bounds.xMin, bounds.xMax)
                  const cy = mapY(pt[1], bounds.yMin, bounds.yMax)
                  const isTop3 = top3.some(t => t.id === doc.id)
                  const sim = similarities.find(s => s.id === doc.id)?.sim ?? 0
                  const color = simToColor(sim)
                  return (
                    <g
                      key={doc.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredId(doc.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <circle cx={cx} cy={cy} r={isTop3 ? 9 : 6}
                        fill={color} fillOpacity={hoveredId === doc.id ? 1 : 0.75}
                        stroke={hoveredId === doc.id ? 'white' : 'none'} strokeWidth={1.5}
                      />
                      {isTop3 && (
                        <motion.circle cx={cx} cy={cy} r={13}
                          fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.35}
                          animate={{ r: [12, 16, 12] }}
                          transition={{ repeat: Infinity, duration: 2, delay: top3.findIndex(t => t.id === doc.id) * 0.3 }}
                        />
                      )}
                    </g>
                  )
                })}

                {/* User diamond */}
                {userPt && (
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    style={{ cursor: 'pointer', transformOrigin: `${mapX(userPt[0], bounds.xMin, bounds.xMax)}px ${mapY(userPt[1], bounds.yMin, bounds.yMax)}px` }}
                    onMouseEnter={() => setHoveredId('__user__')}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <motion.rect
                      x={mapX(userPt[0], bounds.xMin, bounds.xMax) - 8}
                      y={mapY(userPt[1], bounds.yMin, bounds.yMax) - 8}
                      width={16} height={16} rx={2}
                      fill="#6366f1"
                      stroke={hoveredId === '__user__' ? 'white' : '#6366f1'}
                      strokeWidth={hoveredId === '__user__' ? 1.5 : 0}
                      style={{
                        transformOrigin: `${mapX(userPt[0], bounds.xMin, bounds.xMax)}px ${mapY(userPt[1], bounds.yMin, bounds.yMax)}px`,
                        transform: 'rotate(45deg)',
                      }}
                      animate={{ filter: ['drop-shadow(0 0 3px #6366f1)', 'drop-shadow(0 0 8px #6366f1)', 'drop-shadow(0 0 3px #6366f1)'] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                    />
                  </motion.g>
                )}

                <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3}>PC1</text>
                <text x={8} y={H / 2} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.3} transform={`rotate(-90,8,${H / 2})`}>PC2</text>
              </svg>

              {/* Hover tooltip */}
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    key={hovered.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="mx-3 mb-3 rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: hovered.id === '__user__' ? '#6366f1' : simToColor(hovered.sim) }}>
                        {hovered.id === '__user__' ? '◆ Your text' : `● ${hovered.title}`}
                      </span>
                      {hovered.id !== '__user__' && (
                        <span className="text-xs font-mono" style={{ color: simToColor(hovered.sim) }}>
                          sim {(hovered.sim * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {/* Mini vector sparkline */}
                    <div className="flex items-center gap-0.5 h-6">
                      {(hovered.embedding as number[]).map((v, i) => {
                        const absMax = Math.max(...(hovered.embedding as number[]).map(Math.abs))
                        const h = absMax === 0 ? 0 : (Math.abs(v) / absMax) * 20
                        return (
                          <div key={i} style={{
                            width: 10, height: h,
                            backgroundColor: v >= 0 ? (hovered.id === '__user__' ? '#6366f1' : simToColor(hovered.sim)) : '#6366f130',
                            borderRadius: 2, alignSelf: 'flex-end',
                          }} />
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: nearest documents ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Nearest documents by cosine similarity
            </p>
            <div className="space-y-2">
              {similarities.map((doc, rank) => {
                const barW = Math.max(4, doc.sim * 100)
                const color = simToColor(doc.sim)
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rank * 0.04 }}
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: rank < 3 ? `${color}08` : 'var(--bg-card)',
                      border: `1px solid ${rank < 3 ? `${color}40` : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono w-4 text-center"
                          style={{ color: rank < 3 ? color : 'var(--text-muted)' }}
                        >
                          #{rank + 1}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: rank < 3 ? color : 'var(--text-secondary)' }}>
                          {doc.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono" style={{ color }}>
                        {(doc.sim * 100).toFixed(1)}%
                      </span>
                    </div>
                    {/* Similarity bar */}
                    <div className="rounded-full overflow-hidden mb-2" style={{ height: 3, backgroundColor: 'var(--border)' }}>
                      <motion.div
                        style={{ height: '100%', backgroundColor: color, borderRadius: 9999 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ delay: rank * 0.04 + 0.1, type: 'spring', stiffness: 200, damping: 25 }}
                      />
                    </div>
                    {rank < 3 && (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {doc.body.slice(0, 100)}…
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-12 text-center"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}
        >
          <div className="text-3xl mb-3">🔢</div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Start typing to generate an embedding
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Your text will be converted to a 16-dimensional vector and placed in the document space
          </p>
        </div>
      )}
    </div>
  )
}
