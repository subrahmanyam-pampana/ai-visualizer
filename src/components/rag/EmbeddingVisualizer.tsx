import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RAG_DOCUMENTS, cosineSimilarity, queryEmbedding, pcaFit, pcaProject } from './ragData'

const QUERY_SEED = 37
const W = 420
const H = 320
const PAD = 36

// Pre-fit PCA on doc corpus — same model used by EmbeddingExplorer
const DOC_VECTORS = RAG_DOCUMENTS.map(d => d.embedding)
const PCA_MODEL = pcaFit(DOC_VECTORS)

interface Point {
  id: string
  title: string
  x: number  // SVG coords
  y: number
  embedding: number[]
  similarity: number  // cosine sim with query (0–1)
  isQuery: boolean
}

// Map a value in [min,max] to [lo,hi]
function scale(v: number, min: number, max: number, lo: number, hi: number) {
  if (max === min) return (lo + hi) / 2
  return lo + ((v - min) / (max - min)) * (hi - lo)
}

function simColor(sim: number): string {
  // low (cold blue) → high (warm green)
  const r = Math.round(scale(sim, 0, 1, 99, 16))
  const g = Math.round(scale(sim, 0, 1, 120, 185))
  const b = Math.round(scale(sim, 0, 1, 240, 129))
  return `rgb(${r},${g},${b})`
}

function VectorBarChart({ embedding, color }: { embedding: number[]; color: string }) {
  const max = Math.max(...embedding.map(Math.abs))
  return (
    <div className="flex items-end gap-0.5 h-10">
      {embedding.map((v, i) => {
        const pct = max === 0 ? 0 : Math.abs(v) / max
        return (
          <div key={i} className="flex flex-col items-center gap-0" style={{ width: 10 }}>
            {v >= 0 ? (
              <>
                <div style={{ height: `${pct * 18}px`, width: 8, backgroundColor: color, borderRadius: 2, marginTop: 'auto' }} />
                <div style={{ height: 18, width: 8 }} /> {/* below axis */}
              </>
            ) : (
              <>
                <div style={{ height: 18, width: 8 }} /> {/* above axis */}
                <div style={{ height: `${pct * 18}px`, width: 8, backgroundColor: `${color}80`, borderRadius: 2 }} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  // How many document embeddings have been placed in the vector store (0 = none yet)
  docsEmbedded: number
  // Whether the query has been embedded
  queryEmbedded: boolean
  // Whether retrieval lines should show
  showRetrieval: boolean
}

export default function EmbeddingVisualizer({ docsEmbedded, queryEmbedded, showRetrieval }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const queryVec = useMemo(() => queryEmbedding(QUERY_SEED), [])

  // Project docs and query using the shared PCA model
  const docProjected = useMemo(
    () => RAG_DOCUMENTS.map(d => pcaProject(d.embedding, PCA_MODEL)),
    []
  )
  const queryProjected = useMemo(() => pcaProject(queryVec, PCA_MODEL), [queryVec])

  // Scale bounds — include query so it doesn't fall outside
  const allRaw = useMemo(() => [...docProjected, queryProjected], [docProjected, queryProjected])
  const xs = allRaw.map(p => p[0])
  const ys = allRaw.map(p => p[1])
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)

  const points: Point[] = useMemo(() => {
    const docPoints = RAG_DOCUMENTS.map((doc, i) => ({
      id: doc.id,
      title: doc.title,
      x: scale(docProjected[i][0], xMin, xMax, PAD, W - PAD),
      y: scale(docProjected[i][1], yMin, yMax, PAD, H - PAD),
      embedding: doc.embedding,
      similarity: (cosineSimilarity(queryVec, doc.embedding) + 1) / 2,
      isQuery: false,
    }))
    const qPt: Point = {
      id: 'query',
      title: 'Your Query',
      x: scale(queryProjected[0], xMin, xMax, PAD, W - PAD),
      y: scale(queryProjected[1], yMin, yMax, PAD, H - PAD),
      embedding: queryVec,
      similarity: 1,
      isQuery: true,
    }
    return [...docPoints, qPt]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docProjected, queryProjected, queryVec, xMin, xMax, yMin, yMax])

  const visibleDocs = points.filter(p => !p.isQuery).slice(0, docsEmbedded)
  const queryPt = points.find(p => p.isQuery)!

  const top3 = [...points]
    .filter(p => !p.isQuery)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)

  const hoveredPt = hovered ? points.find(p => p.id === hovered) : null

  if (docsEmbedded === 0 && !queryEmbedded) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-sm"
        style={{ height: H, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        Embedding vectors will appear here during the Embed step…
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Embedding Space <span className="font-normal normal-case">(PCA projection → 2D)</span>
        </h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} /> Documents
          </span>
          {queryEmbedded && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rotate-45 inline-block" style={{ backgroundColor: '#6366f1' }} /> Query
            </span>
          )}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ display: 'block' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(t => (
            <g key={t} opacity={0.18}>
              <line x1={PAD + t * (W - 2 * PAD)} y1={PAD} x2={PAD + t * (W - 2 * PAD)} y2={H - PAD} stroke="currentColor" strokeWidth={1} />
              <line x1={PAD} y1={PAD + t * (H - 2 * PAD)} x2={W - PAD} y2={PAD + t * (H - 2 * PAD)} stroke="currentColor" strokeWidth={1} />
            </g>
          ))}

          {/* Retrieval similarity arcs: query → top-3 */}
          {showRetrieval && queryEmbedded && top3.map(doc => {
            const alpha = 0.2 + doc.similarity * 0.7
            const strokeW = 1 + doc.similarity * 2.5
            return (
              <motion.line
                key={`arc-${doc.id}`}
                x1={queryPt.x} y1={queryPt.y}
                x2={doc.x} y2={doc.y}
                stroke={simColor(doc.similarity)}
                strokeWidth={strokeW}
                strokeOpacity={alpha}
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: top3.indexOf(doc) * 0.15 }}
              />
            )
          })}

          {/* Similarity radius ring around query when retrieval active */}
          {showRetrieval && queryEmbedded && (() => {
            const nearestSim = top3[0]?.similarity ?? 0.5
            const farthestSim = top3[2]?.similarity ?? 0.3
            // Draw a faint circle at the distance of the 3rd result
            const d3 = top3[2]
            if (!d3) return null
            const r = Math.hypot(queryPt.x - d3.x, queryPt.y - d3.y)
            void nearestSim; void farthestSim
            return (
              <motion.circle
                cx={queryPt.x} cy={queryPt.y} r={r}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1}
                strokeOpacity={0.15}
                strokeDasharray="3 4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ transformOrigin: `${queryPt.x}px ${queryPt.y}px` }}
                transition={{ duration: 0.5 }}
              />
            )
          })()}

          {/* Document dots */}
          <AnimatePresence>
            {visibleDocs.map((pt, i) => {
              const isTop3 = showRetrieval && top3.some(t => t.id === pt.id)
              const color = showRetrieval ? simColor(pt.similarity) : '#f59e0b'
              const r = isTop3 ? 9 : 7
              return (
                <motion.g
                  key={pt.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 20 }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(pt.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <circle
                    cx={pt.x} cy={pt.y} r={r}
                    fill={color}
                    fillOpacity={hovered === pt.id ? 1 : 0.75}
                    stroke={hovered === pt.id ? 'white' : color}
                    strokeWidth={hovered === pt.id ? 1.5 : 0}
                  />
                  {isTop3 && (
                    <motion.circle
                      cx={pt.x} cy={pt.y}
                      r={r + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                      animate={{ r: [r + 3, r + 7, r + 3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </motion.g>
              )
            })}
          </AnimatePresence>

          {/* Query dot (diamond) */}
          {queryEmbedded && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered('query')}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Diamond = rotated rect */}
              <motion.rect
                x={queryPt.x - 8} y={queryPt.y - 8}
                width={16} height={16}
                rx={2}
                fill="#6366f1"
                fillOpacity={hovered === 'query' ? 1 : 0.9}
                stroke={hovered === 'query' ? 'white' : '#6366f1'}
                strokeWidth={hovered === 'query' ? 1.5 : 0}
                style={{ transformOrigin: `${queryPt.x}px ${queryPt.y}px`, transform: 'rotate(45deg)' }}
                animate={showRetrieval ? { filter: ['drop-shadow(0 0 4px #6366f1)', 'drop-shadow(0 0 10px #6366f1)', 'drop-shadow(0 0 4px #6366f1)'] } : {}}
                transition={{ repeat: Infinity, duration: 1.6 }}
              />
            </motion.g>
          )}

          {/* Axis labels */}
          <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.35}>PC1</text>
          <text x={8} y={H / 2} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.35} transform={`rotate(-90, 8, ${H / 2})`}>PC2</text>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredPt && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-3 left-3 right-3 rounded-lg p-3 pointer-events-none"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: hoveredPt.isQuery ? '#6366f1' : '#f59e0b' }}>
                  {hoveredPt.isQuery ? '◆ Query vector' : `● ${hoveredPt.title}`}
                </span>
                {!hoveredPt.isQuery && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{
                      backgroundColor: `${simColor(hoveredPt.similarity)}22`,
                      color: simColor(hoveredPt.similarity),
                    }}
                  >
                    sim {(hoveredPt.similarity * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              {/* 16-bar vector sparkline */}
              <div className="mb-1">
                <VectorBarChart
                  embedding={hoveredPt.embedding}
                  color={hoveredPt.isQuery ? '#6366f1' : simColor(hoveredPt.similarity)}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                16-dim vector · bars show magnitude per dimension (↑ positive, ↓ negative)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Similarity score legend when retrieval is active */}
      {showRetrieval && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Similarity:</span>
          <div className="flex items-center gap-1">
            <div
              className="h-2 rounded-full"
              style={{
                width: 80,
                background: 'linear-gradient(to right, rgb(99,120,240), rgb(16,185,129))',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>low → high</span>
          </div>
          {top3.map((doc, i) => (
            <span
              key={doc.id}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${simColor(doc.similarity)}20`, color: simColor(doc.similarity) }}
            >
              #{i + 1} {doc.title} · {(doc.similarity * 100).toFixed(0)}%
            </span>
          ))}
        </motion.div>
      )}
    </div>
  )
}
