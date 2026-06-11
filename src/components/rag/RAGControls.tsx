import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react'

type Phase = 'ingestion' | 'query' | 'done'

interface Props {
  query: string
  onQueryChange: (v: string) => void
  isRunning: boolean
  phase: Phase
  currentStep: number
  totalSteps: number
  onPlay: () => void
  onStep: () => void
  onReset: () => void
}

const PHASE_LABELS: Record<Phase, { label: string; color: string }> = {
  ingestion: { label: 'Ingestion Pipeline', color: '#f59e0b' },
  query:     { label: 'Query Pipeline',     color: '#6366f1' },
  done:      { label: 'Complete',           color: '#10b981' },
}

export default function RAGControls({
  query, onQueryChange, isRunning, phase,
  currentStep, totalSteps, onPlay, onStep, onReset,
}: Props) {
  const isDone = phase === 'done'
  const pl = PHASE_LABELS[phase]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${pl.color}18`, color: pl.color, border: `1px solid ${pl.color}40` }}
          >
            {pl.label}
          </span>
          {!isDone && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              step {Math.max(currentStep + 1, 0)} / {totalSteps}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPlay}
            disabled={isDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40"
            style={{
              backgroundColor: isRunning ? '#f59e0b20' : pl.color,
              color: isRunning ? '#f59e0b' : 'white',
              border: isRunning ? '1px solid #f59e0b' : 'none',
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play All'}
          </button>
          <button
            onClick={onStep}
            disabled={isDone || isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-40"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <SkipForward size={14} />
            Step
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          Query
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  )
}
