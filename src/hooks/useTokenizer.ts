import { useState, useEffect, useRef, useCallback } from 'react'
import type { Token, ModelOption } from '../types'

const PALETTE_SIZE = 20

// ── GPT (gpt-tokenizer, BPE) ───────────────────────────────────────────────

async function tokenizeGPT(text: string, encoding: string): Promise<Token[]> {
  // gpt-tokenizer exports named encoding modules
  let encMod: { encode: (t: string) => number[]; decode: (ids: number[]) => string }
  if (encoding === 'o200k_base') {
    encMod = await import('gpt-tokenizer/encoding/o200k_base')
  } else {
    encMod = await import('gpt-tokenizer/encoding/cl100k_base')
  }

  const ids = encMod.encode(text)
  return ids.map((id) => ({
    id,
    text: encMod.decode([id]),
    colorIndex: id % PALETTE_SIZE,
  }))
}

// ── Gemini (SentencePiece via @lenml/tokenizer-gemini) ─────────────────────

type GeminiTok = { encode: (t: string) => Record<string, number>; batch_decode: (ids: number[][]) => string[] }
let geminiTok: GeminiTok | null = null

async function getGeminiTok() {
  if (!geminiTok) {
    const mod = await import('@lenml/tokenizer-gemini')
    geminiTok = mod.fromPreTrained() as unknown as GeminiTok
  }
  return geminiTok!
}

async function tokenizeGemini(text: string): Promise<Token[]> {
  const tok = await getGeminiTok()
  const raw = tok.encode(text)
  // raw is a plain object with numeric string keys → values are token IDs
  const ids = Object.values(raw) as number[]
  // Decode each ID individually to get its text fragment
  const texts = tok.batch_decode(ids.map((id) => [id]))
  return ids.map((id, i) => ({
    id,
    text: texts[i] ?? '',
    colorIndex: id % PALETTE_SIZE,
  }))
}

// ── Main hook ──────────────────────────────────────────────────────────────

export function useTokenizer(input: string, model: ModelOption) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tokenize = useCallback(
    async (text: string) => {
      if (!text) {
        setTokens([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        let result: Token[]
        if (model.family === 'gemini') {
          result = await tokenizeGemini(text)
        } else {
          result = await tokenizeGPT(text, model.encoding)
        }
        setTokens(result)
      } catch (e) {
        console.error('Tokenizer error:', e)
        setTokens([])
      } finally {
        setLoading(false)
      }
    },
    [model.family, model.encoding],
  )

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => tokenize(input), 200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [input, tokenize])

  return { tokens, loading }
}
