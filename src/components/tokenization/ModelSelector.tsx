import { MODEL_OPTIONS } from '../../types'
import type { ModelOption, ModelFamily } from '../../types'

const FAMILY_COLORS: Record<ModelFamily, { active: string; bg: string; dot: string }> = {
  gpt: { active: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  claude: { active: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  gemini: { active: '#3b82f6', bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6' },
}

const FAMILY_LABELS: Record<ModelFamily, { name: string; company: string }> = {
  gpt: { name: 'GPT', company: 'OpenAI' },
  claude: { name: 'Claude', company: 'Anthropic' },
  gemini: { name: 'Gemini', company: 'Google' },
}

interface Props {
  selected: ModelOption
  onChange: (model: ModelOption) => void
}

export default function ModelSelector({ selected, onChange }: Props) {
  const families: ModelFamily[] = ['gpt', 'claude', 'gemini']

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Model
      </label>

      {families.map((family) => {
        const models = MODEL_OPTIONS.filter((m) => m.family === family)
        const col = FAMILY_COLORS[family]
        const lbl = FAMILY_LABELS[family]
        const isFamilyActive = selected.family === family

        return (
          <div key={family}>
            {/* Family label */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: col.dot }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.active }}>
                {lbl.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                — {lbl.company}
              </span>
            </div>

            {/* Model buttons */}
            <div className="flex flex-wrap gap-2 pl-4">
              {models.map((m) => {
                const isActive = selected.id === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => onChange(m)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    style={{
                      backgroundColor: isActive ? col.bg : 'var(--bg-secondary)',
                      border: `1.5px solid ${isActive ? col.active : 'var(--border)'}`,
                      color: isActive ? col.active : 'var(--text-secondary)',
                      boxShadow: isActive ? `0 0 10px ${col.active}30` : undefined,
                    }}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>

            {/* Active model detail */}
            {isFamilyActive && (
              <div
                className="mt-2 ml-4 rounded-lg px-3 py-2 text-xs space-y-1"
                style={{ backgroundColor: col.bg, border: `1px solid ${col.active}40` }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: col.active }} className="font-semibold">{selected.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{selected.contextWindow}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-medium">Tokenizer: </span>{selected.tokenizer}
                </div>
                {selected.note && (
                  <div
                    className="rounded px-2 py-1 text-xs mt-1"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#f59e0b',
                    }}
                  >
                    ⚠ {selected.note}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
