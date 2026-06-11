import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import RAGFlow from '../components/rag/RAGFlow'
import ChunkEmbedder from '../components/rag/ChunkEmbedder'
import EmbeddingExplorer from '../components/rag/EmbeddingExplorer'

const CONCEPTS = [
  {
    id: 'problem',
    title: 'The Problem RAG Solves',
    color: '#ef4444',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          LLMs have a <strong>knowledge cutoff</strong> — they only know what was in their training data.
          They also <strong>hallucinate</strong>: when asked about facts they don't know, they confidently generate
          plausible-sounding but wrong answers.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="rounded-lg p-3 text-xs space-y-1" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="font-semibold" style={{ color: '#ef4444' }}>Without RAG</div>
            <p>Model answers from parametric memory → stale, unverifiable, prone to hallucination</p>
          </div>
          <div className="rounded-lg p-3 text-xs space-y-1" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div className="font-semibold" style={{ color: '#10b981' }}>With RAG</div>
            <p>Model answers from retrieved documents → grounded, verifiable, up-to-date</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'embeddings',
    title: 'What Are Embeddings?',
    color: '#6366f1',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          An <strong>embedding</strong> is a dense numeric vector (e.g. 1536 numbers) that encodes the
          semantic meaning of a piece of text. Semantically similar texts produce vectors that are
          geometrically close in high-dimensional space.
        </p>
        <div className="rounded-lg p-3 text-xs font-mono space-y-1" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ color: '#6366f1' }}>"dog"     → [0.21, -0.43, 0.87, …] (1536 dims)</div>
          <div style={{ color: '#6366f1' }}>"puppy"   → [0.19, -0.41, 0.85, …] ← very close!</div>
          <div style={{ color: 'var(--text-muted)' }}>"aircraft" → [0.93, 0.12, -0.34, …] ← far away</div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Similarity is measured by <strong>cosine similarity</strong> — the cosine of the angle between two vectors.
          A score of 1.0 = identical meaning, 0 = unrelated, −1 = opposite meaning.
        </p>
      </div>
    ),
  },
  {
    id: 'retrieval',
    title: 'How Retrieval Works',
    color: '#14b8a6',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          Documents are pre-processed into chunks (typically 256–1024 tokens), embedded, and stored in a
          <strong> vector database</strong>. At query time:
        </p>
        <ol className="space-y-2 text-xs">
          {[
            'The user\'s query is embedded using the same model as the documents',
            'The vector DB performs Approximate Nearest Neighbor (ANN) search — finding the k chunks with highest cosine similarity',
            'Top-k chunks are returned (typically k = 3–10)',
            'Chunks are injected into the LLM prompt as context ("Here are relevant passages: …")',
          ].map((step, i) => (
            <li key={i} className="flex gap-3" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'rgba(20,184,166,0.2)', color: '#14b8a6' }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Popular vector databases: <strong>Pinecone</strong>, <strong>Weaviate</strong>, <strong>Chroma</strong>,
          <strong> pgvector</strong> (Postgres extension), <strong>FAISS</strong> (Facebook, in-memory).
        </p>
      </div>
    ),
  },
  {
    id: 'limitations',
    title: 'RAG Limitations & Improvements',
    color: '#f59e0b',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { title: 'Chunking quality', desc: 'Bad chunk boundaries split related content, hurting retrieval. Semantic chunking and sliding windows help.' },
            { title: 'Query-document gap', desc: 'Queries and documents use different phrasing. HyDE (Hypothetical Document Embedding) or query expansion reduces this.' },
            { title: 'Top-k selection', desc: 'Fixed k may miss relevant docs or include noise. Re-ranking with a cross-encoder model improves precision.' },
            { title: 'Lost in the middle', desc: 'LLMs focus on start/end of context, ignoring middle. Reorder retrieved chunks or use advanced prompting.' },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="font-semibold mb-1" style={{ color: '#f59e0b' }}>{title}</div>
              <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

function ConceptSection() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Concepts
      </h2>
      {CONCEPTS.map((c) => (
        <div key={c.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.color}30` }}>
          <button
            onClick={() => setOpenId(openId === c.id ? null : c.id)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
            style={{ backgroundColor: openId === c.id ? `${c.color}10` : 'var(--bg-card)' }}
          >
            <span className="text-sm font-medium" style={{ color: openId === c.id ? c.color : 'var(--text-primary)' }}>
              {c.title}
            </span>
            {openId === c.id
              ? <ChevronUp size={14} style={{ color: c.color }} />
              : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>
          <AnimatePresence>
            {openId === c.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-4" style={{ backgroundColor: 'var(--bg-card)', borderTop: `1px solid ${c.color}20` }}>
                  {c.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function RAGPage() {
  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Retrieval-Augmented Generation
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            RAG gives LLMs access to external knowledge at inference time — without retraining.
            It grounds responses in retrieved documents, dramatically reducing hallucination and enabling
            up-to-date answers. Click Play to walk through every step of the pipeline.
          </p>
        </div>

        <RAGFlow />

        {/* ── Chunk → Vector → Graph explainer ── */}
        <ChunkEmbedder />

        {/* ── Interactive embedding explorer ── */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <EmbeddingExplorer />
        </div>

        <ConceptSection />
      </div>
    </PageWrapper>
  )
}
