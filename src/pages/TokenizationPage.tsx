import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import TokenInput from '../components/tokenization/TokenInput'
import TokenDisplay from '../components/tokenization/TokenDisplay'
import TokenStats from '../components/tokenization/TokenStats'
import ModelSelector from '../components/tokenization/ModelSelector'
import { useTokenizer } from '../hooks/useTokenizer'
import { MODEL_OPTIONS } from '../types'
import type { ModelOption } from '../types'

const EXAMPLE_TEXT = `Tokenization is the process of converting text into smaller units called tokens. GPT-4 splits "unbelievable" into ["un","belie","vable"], while Gemini uses a different SentencePiece vocabulary. The same sentence can produce different token counts across models — which directly affects pricing and context window usage.`

const FAMILY_CONCEPTS = {
  gpt: {
    algo: 'Byte-Pair Encoding (BPE)',
    algoDetail: `BPE starts with individual bytes/characters and repeatedly merges the most frequent adjacent pair into a new token. OpenAI trains this on a massive text corpus, learning ~100K (cl100k) or ~200K (o200k) merge rules.`,
    steps: [
      'Start with character-level vocabulary (bytes + Unicode)',
      'Count all adjacent pair frequencies in the training corpus',
      'Merge the most frequent pair into a single new token',
      'Repeat until vocabulary size is reached (100K or 200K)',
      'Encode new text by greedily applying learned merge rules',
    ],
    pros: ['Handles any text, even unknown words', 'Efficient for English and code', 'Consistent tokenization — same string always maps to same tokens'],
    cons: ['Less efficient for non-Latin scripts (Arabic, CJK uses more tokens)', 'Space handling can be surprising (leading space is part of token)'],
    color: '#10b981',
  },
  claude: {
    algo: 'BPE (proprietary, cl100k compatible)',
    algoDetail: `Anthropic has not publicly released Claude's tokenizer. Claude 2 used a vocabulary close to cl100k_base. Claude 3+ uses an updated proprietary tokenizer with improved multilingual coverage. Token counts match cl100k within ~5% for English text.`,
    steps: [
      'Same BPE algorithm as GPT (merge-based)',
      'Different training corpus → different merge rules',
      'Proprietary vocabulary not publicly accessible',
      'Claude 3 adds improved tokenization for 100+ languages',
      'Special tokens for conversation structure (<|user|>, <|assistant|>)',
    ],
    pros: ['Optimized for long-context reasoning (200K window)', 'Better handling of structured data (JSON, XML)', 'Improved multilingual token efficiency vs GPT-4'],
    cons: ['Exact tokenizer not available — only approximations', 'Token boundaries differ from GPT for the same input'],
    color: '#f59e0b',
  },
  gemini: {
    algo: 'SentencePiece (Unigram Language Model)',
    algoDetail: `Unlike BPE which builds up from characters, SentencePiece's Unigram LM starts with a large candidate vocabulary and prunes it. Each token is assigned a log-probability; the tokenizer finds the segmentation that maximizes the total probability of the token sequence.`,
    steps: [
      'Initialize with a large candidate vocabulary (seeds)',
      'Assign log-probability to each candidate token',
      'For each sentence, find the most probable segmentation',
      'Remove tokens that least improve the overall likelihood',
      'Repeat pruning until target vocabulary size (256K for Gemini)',
    ],
    pros: ['Language-agnostic: trained directly on raw bytes', 'Much more efficient for CJK, Arabic, code (same char = fewer tokens)', '256K vocab → better compression → more content per context window'],
    cons: ['Tokenization is probabilistic — can vary slightly', 'Less predictable token boundaries for English vs BPE'],
    color: '#3b82f6',
  },
}

function ConceptPanel({ model }: { model: ModelOption }) {
  const [open, setOpen] = useState(false)
  const concept = FAMILY_CONCEPTS[model.family]

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${concept.color}40` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer"
        style={{ backgroundColor: `${concept.color}10` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: concept.color }}>
            How {model.label} tokenizes
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{ backgroundColor: `${concept.color}20`, color: concept.color }}
          >
            {concept.algo}
          </span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: concept.color }} /> : <ChevronDown size={14} style={{ color: concept.color }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-4" style={{ backgroundColor: 'var(--bg-card)' }}>
              {/* Algorithm description */}
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {concept.algoDetail}
              </p>

              {/* Steps */}
              <div>
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Algorithm steps
                </h4>
                <ol className="space-y-1.5">
                  {concept.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${concept.color}20`, color: concept.color }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Pros / Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>Strengths</h4>
                  <ul className="space-y-1">
                    {concept.pros.map((p, i) => (
                      <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#10b981' }}>✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>Limitations</h4>
                  <ul className="space-y-1">
                    {concept.cons.map((c, i) => (
                      <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#ef4444' }}>✗</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TokenizationPage() {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0])
  const { tokens, loading } = useTokenizer(input, selectedModel)

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Tokenization
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            LLMs don't process text directly — they convert it into <strong>tokens</strong> first.
            Different models use different tokenization algorithms, producing different token boundaries
            for the same input. Select a model below to see its real tokenizer in action.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: model selector + input */}
          <div className="lg:col-span-1 space-y-6">
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
            </div>
          </div>

          {/* Right: input + visualization */}
          <div className="lg:col-span-2 space-y-4">
            <TokenInput
              value={input}
              onChange={setInput}
              onLoadExample={() => setInput(EXAMPLE_TEXT)}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Token Visualization
                  {loading && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>tokenizing…</span>
                  )}
                </h2>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Hover a chip to see token ID
                </span>
              </div>
              <TokenDisplay tokens={tokens} input={input} loading={loading} />
            </div>

            <TokenStats tokens={tokens} input={input} model={selectedModel} />
          </div>
        </div>

        {/* Algorithm deep-dive panel */}
        <ConceptPanel model={selectedModel} />

        {/* Cross-model comparison callout */}
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Why do token counts differ across models?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: '#10b981' }}>GPT (BPE, 100–200K vocab)</div>
              <p>Merges byte-pairs greedily. Common English words and code patterns get single tokens. Non-Latin text uses more tokens per character.</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: '#f59e0b' }}>Claude (BPE, proprietary)</div>
              <p>Conceptually the same BPE approach but trained on a different corpus with updated merge rules. Claude 3+ has better multilingual compression.</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: '#3b82f6' }}>Gemini (SentencePiece, 256K vocab)</div>
              <p>Larger vocabulary + probabilistic Unigram LM. Much more efficient for CJK and Arabic — often 30–50% fewer tokens than BPE for those scripts.</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
