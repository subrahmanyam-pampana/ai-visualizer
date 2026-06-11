import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RAGNode from './RAGNode'
import RAGControls from './RAGControls'
import DocumentChunkCard from './DocumentChunk'
import EmbeddingVisualizer from './EmbeddingVisualizer'
import { RAG_DOCUMENTS, cosineSimilarity, queryEmbedding } from './ragData'

type NodeStatus = 'idle' | 'active' | 'done'

// ── Ingestion pipeline steps ──────────────────────────────────────────────
const INGEST_STEPS = [
  { id: 'load',    label: 'Load',    description: 'Raw documents collected',     icon: '📂', color: '#f59e0b' },
  { id: 'chunk',   label: 'Chunk',   description: 'Split into fixed-size chunks', icon: '✂️',  color: '#f59e0b' },
  { id: 'embed',   label: 'Embed',   description: 'Each chunk → dense vector',   icon: '🔢', color: '#f59e0b' },
  { id: 'store',   label: 'Store',   description: 'Vectors saved in vector DB',  icon: '🗄️',  color: '#10b981' }, // shared node
]

// ── Query pipeline steps ──────────────────────────────────────────────────
const QUERY_STEPS = [
  { id: 'query',    label: 'Query',    description: 'User question received',         icon: '💬', color: '#6366f1' },
  { id: 'qembed',  label: 'Embed',    description: 'Query encoded to vector',         icon: '🔢', color: '#6366f1' },
  { id: 'retrieve',label: 'Retrieve', description: 'Similarity search in vector DB',  icon: '🔍', color: '#6366f1' }, // linked to Store
  { id: 'augment', label: 'Augment',  description: 'Chunks injected into prompt',     icon: '📄', color: '#6366f1' },
  { id: 'generate',label: 'Generate', description: 'LLM produces grounded answer',    icon: '✨', color: '#6366f1' },
]

const TOTAL_STEPS = INGEST_STEPS.length + QUERY_STEPS.length
const QUERY_SEED = 37

// Sample source documents shown during ingestion
const SOURCE_DOCS = [
  { id: 's1', title: 'italian_recipes.pdf', size: '1.8 MB', type: 'PDF' },
  { id: 's2', title: 'baking_basics.md', size: '62 KB', type: 'Markdown' },
  { id: 's3', title: 'kitchen_tips.txt', size: '94 KB', type: 'Text' },
]

// Sample chunk previews
const SAMPLE_CHUNKS = [
  { id: 'c1', doc: 'italian_recipes.pdf', preview: 'Authentic carbonara requires guanciale, eggs, Pecorino Romano, and black pepper — no cream. Reserve pasta water to…', tokens: 210 },
  { id: 'c2', doc: 'baking_basics.md', preview: 'Knead the dough until it passes the windowpane test: stretch a small piece thin enough to see light through without tearing…', tokens: 185 },
  { id: 'c3', doc: 'kitchen_tips.txt', preview: 'Rest meat 5–10 minutes after grilling to let the juices redistribute. Cutting too soon means they run onto the board…', tokens: 198 },
  { id: 'c4', doc: 'italian_recipes.pdf', preview: 'Combine lemon juice and olive oil in a 1:3 ratio for a classic vinaigrette. Whisk in a teaspoon of Dijon mustard to…', tokens: 167 },
]

function nodeStatus(globalStep: number, pipelineStart: number, nodeIndex: number): NodeStatus {
  const abs = pipelineStart + nodeIndex
  if (globalStep < abs) return 'idle'
  if (globalStep === abs) return 'active'
  return 'done'
}



export default function RAGFlow() {
  const [query, setQuery] = useState('What ingredients do I need to make pasta carbonara?')
  const [globalStep, setGlobalStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [streamedAnswer, setStreamedAnswer] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const storeIsDone = globalStep >= INGEST_STEPS.length - 1
  const vectorStoreActive = storeIsDone

  const rankedDocs = RAG_DOCUMENTS.map((doc) => ({
    ...doc,
    similarity: (cosineSimilarity(queryEmbedding(QUERY_SEED), doc.embedding) + 1) / 2,
  })).sort((a, b) => b.similarity - a.similarity).slice(0, 3)

  const finalAnswer =
    'Based on the retrieved recipes: To make authentic pasta carbonara you need guanciale (cured pork cheek), eggs, Pecorino Romano cheese, black pepper, and spaghetti or rigatoni. Render the guanciale until crispy, then toss the hot drained pasta with a mixture of eggs and grated cheese, using reserved starchy pasta water to create a creamy sauce — no cream needed.'

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setIsRunning(false)
  }, [])

  const step = useCallback(() => {
    setGlobalStep(s => {
      if (s >= TOTAL_STEPS - 1) { stop(); return s }
      return s + 1
    })
  }, [stop])

  const handlePlay = useCallback(() => {
    if (isRunning) { stop(); return }
    if (globalStep >= TOTAL_STEPS - 1) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setGlobalStep(s => {
        if (s >= TOTAL_STEPS - 1) { stop(); return s }
        return s + 1
      })
    }, 1600)
  }, [isRunning, globalStep, stop])

  const handleReset = useCallback(() => {
    stop()
    setGlobalStep(-1)
    setStreamedAnswer('')
  }, [stop])

  // Streaming answer when generate step hits
  const generateStepAbs = INGEST_STEPS.length + QUERY_STEPS.length - 1
  useEffect(() => {
    if (globalStep === generateStepAbs) {
      setStreamedAnswer('')
      let i = 0
      const t = setInterval(() => {
        i++
        setStreamedAnswer(finalAnswer.slice(0, i * 3))
        if (i * 3 >= finalAnswer.length) clearInterval(t)
      }, 20)
      return () => clearInterval(t)
    }
  }, [globalStep, generateStepAbs])

  // Cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // Query step index is offset by ingestion length
  const qStart = INGEST_STEPS.length
  const retrieveAbsStep = qStart + 2

  return (
    <div className="space-y-5">
      <RAGControls
        query={query}
        onQueryChange={setQuery}
        isRunning={isRunning}
        phase={globalStep >= TOTAL_STEPS ? 'done' : globalStep < INGEST_STEPS.length ? 'ingestion' : 'query'}
        currentStep={globalStep}
        totalSteps={TOTAL_STEPS}
        onPlay={handlePlay}
        onStep={step}
        onReset={handleReset}
      />

      {/* ── Both pipelines canvas ───────────────────────────────────────── */}
      <div
        className="rounded-xl p-6 overflow-x-auto"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="min-w-max space-y-0 mx-auto w-fit">

          {/* ── Ingestion pipeline row ── */}
          <div className="mb-1">
            <div className="flex items-center gap-1 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>
                Data Ingestion
              </span>
            </div>
            <div className="flex items-center gap-2">
              {INGEST_STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <RAGNode
                    label={s.label}
                    description={s.description}
                    icon={s.icon}
                    status={nodeStatus(globalStep, 0, idx)}
                    index={idx}
                    accentColor={s.color}
                  />
                  {idx < INGEST_STEPS.length - 1 && (
                    <div className="relative flex flex-col items-center w-8">
                      <motion.div className="h-0.5 w-full" style={{
                        backgroundColor: globalStep > idx ? '#f59e0b' : 'var(--border)',
                        transition: 'background-color 0.4s',
                      }} />
                      {globalStep === idx && (
                        <motion.div className="w-1.5 h-1.5 rounded-full absolute top-1/2 -translate-y-1/2"
                          style={{ backgroundColor: '#f59e0b' }}
                          animate={{ x: [0, 28, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Connector: Vector Store → Retrieve ── */}
          <div className="flex items-start" style={{ paddingLeft: 3 * (144 + 8 + 32 + 8) + 144 / 2 - 1 }}>
            {/* aligns under the 4th ingestion node (Store) center */}
            <div className="flex flex-col items-center">
              <motion.div className="w-0.5 h-5"
                style={{ backgroundColor: vectorStoreActive ? '#10b981' : 'var(--border)', transition: 'background-color 0.5s' }} />
              <motion.div
                className="text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap"
                style={{
                  backgroundColor: vectorStoreActive ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)',
                  border: `1px solid ${vectorStoreActive ? '#10b981' : 'var(--border)'}`,
                  color: vectorStoreActive ? '#10b981' : 'var(--text-muted)',
                  transition: 'all 0.5s',
                }}
              >
                used by Retrieve →
              </motion.div>
              <motion.div className="w-0.5 h-5"
                style={{ backgroundColor: vectorStoreActive ? '#10b981' : 'var(--border)', transition: 'background-color 0.5s' }} />
              <div className="w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `6px solid ${vectorStoreActive ? '#10b981' : 'var(--border)'}`,
                  transition: 'border-top-color 0.5s',
                }}
              />
            </div>
          </div>

          {/* ── Query pipeline row ── */}
          <div className="mt-1">
            <div className="flex items-center gap-1 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6366f1' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>
                Query Pipeline
              </span>
            </div>
            <div className="flex items-center gap-2">
              {QUERY_STEPS.map((s, idx) => {
                const absIdx = qStart + idx
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <RAGNode
                      label={s.label}
                      description={s.description}
                      icon={s.icon}
                      status={nodeStatus(globalStep, qStart, idx)}
                      index={idx}
                      accentColor={s.color}
                    />
                    {idx < QUERY_STEPS.length - 1 && (
                      <div className="relative flex flex-col items-center w-8">
                        <motion.div className="h-0.5 w-full" style={{
                          backgroundColor: globalStep > absIdx ? '#6366f1' : 'var(--border)',
                          transition: 'background-color 0.4s',
                        }} />
                        {globalStep === absIdx && (
                          <motion.div className="w-1.5 h-1.5 rounded-full absolute top-1/2 -translate-y-1/2"
                            style={{ backgroundColor: '#6366f1' }}
                            animate={{ x: [0, 28, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Embedding visualizer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {globalStep >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <EmbeddingVisualizer
              docsEmbedded={
                // During ingest embed step (step 2): reveal docs one-by-one based on sub-progress
                // After step 2 done: all 10 embedded
                globalStep === 2 ? Math.ceil(RAG_DOCUMENTS.length * 0.5)  // show half mid-step
                  : globalStep >= 3 ? RAG_DOCUMENTS.length
                  : 0
              }
              queryEmbedded={globalStep >= qStart + 1}   // query embed step = qStart+1
              showRetrieval={globalStep >= retrieveAbsStep}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Side panels: ingestion details + retrieval results ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Source documents — visible when Load step runs */}
        <AnimatePresence>
          {globalStep >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                <span>📂</span> Source Documents
              </h3>
              <div className="space-y-1.5">
                {SOURCE_DOCS.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-lg px-3 py-2 flex items-center justify-between"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{doc.title}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doc.size}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chunks — visible when Chunk step runs */}
        <AnimatePresence>
          {globalStep >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                <span>✂️</span> Chunks (sample)
              </h3>
              <div className="space-y-1.5">
                {SAMPLE_CHUNKS.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-mono" style={{ color: '#f59e0b' }}>{c.doc}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.tokens} tok</span>
                    </div>
                    <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                      {c.preview}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Retrieved docs + generated answer — query phase */}
        <div className="space-y-4">
          <AnimatePresence>
            {globalStep >= retrieveAbsStep && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: '#6366f1' }}>
                  <span>🔍</span> Retrieved Chunks
                </h3>
                <div className="space-y-2">
                  {rankedDocs.map((doc, i) => (
                    <DocumentChunkCard key={doc.id} chunk={doc} similarity={doc.similarity} index={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {globalStep >= generateStepAbs && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: '#6366f1' }}>
                  <span>✨</span> Generated Answer
                </h3>
                <div
                  className="rounded-lg p-3 text-sm leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {streamedAnswer}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                    style={{ backgroundColor: '#6366f1' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
