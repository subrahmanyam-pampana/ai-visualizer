export interface Token {
  id: number
  text: string
  colorIndex: number
}

export type ModelFamily = 'gpt' | 'claude' | 'gemini'

export interface ModelOption {
  id: string
  label: string
  family: ModelFamily
  encoding: string
  description: string
  contextWindow: string
  tokenizer: string
  note?: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    family: 'gpt',
    encoding: 'o200k_base',
    description: 'OpenAI\'s flagship multimodal model',
    contextWindow: '128K tokens',
    tokenizer: 'BPE (o200k_base) — 200k vocab',
  },
  {
    id: 'gpt-4',
    label: 'GPT-4',
    family: 'gpt',
    encoding: 'cl100k_base',
    description: 'OpenAI\'s original GPT-4',
    contextWindow: '8K–128K tokens',
    tokenizer: 'BPE (cl100k_base) — 100k vocab',
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT-3.5',
    family: 'gpt',
    encoding: 'cl100k_base',
    description: 'OpenAI GPT-3.5 Turbo',
    contextWindow: '16K tokens',
    tokenizer: 'BPE (cl100k_base) — 100k vocab',
  },
  {
    id: 'claude-3-5',
    label: 'Claude 3.5',
    family: 'claude',
    encoding: 'cl100k_base',
    description: 'Anthropic\'s Claude 3.5 Sonnet',
    contextWindow: '200K tokens',
    tokenizer: 'BPE (cl100k_base compatible) — proprietary',
    note: 'Claude\'s tokenizer is not publicly released. This uses cl100k_base as a close approximation — token counts differ by ~5%.',
  },
  {
    id: 'claude-2',
    label: 'Claude 2',
    family: 'claude',
    encoding: 'cl100k_base',
    description: 'Anthropic\'s Claude 2',
    contextWindow: '100K tokens',
    tokenizer: 'BPE (cl100k_base compatible) — proprietary',
    note: 'Claude\'s tokenizer is not publicly released. This uses cl100k_base as a close approximation — token counts differ by ~5%.',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    family: 'gemini',
    encoding: 'sentencepiece',
    description: 'Google\'s Gemini 1.5 Pro',
    contextWindow: '1M tokens',
    tokenizer: 'SentencePiece (Unigram LM) — 256k vocab',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    family: 'gemini',
    encoding: 'sentencepiece',
    description: 'Google\'s fast Gemini 2.0',
    contextWindow: '1M tokens',
    tokenizer: 'SentencePiece (Unigram LM) — 256k vocab',
  },
]

export type RAGStepStatus = 'idle' | 'active' | 'done'

export interface RAGStep {
  id: string
  label: string
  description: string
  icon: string
}

export interface DocumentChunk {
  id: string
  title: string
  body: string
  embedding: number[]
}

export type AgentStepType = 'input' | 'think' | 'tool_call' | 'observation' | 'answer'

export interface AgentStep {
  id: string
  type: AgentStepType
  text: string
  tool?: string
  args?: string
}
