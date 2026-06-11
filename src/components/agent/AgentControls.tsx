import { Play, SkipForward, RotateCcw } from 'lucide-react'

const EXAMPLES = [
  "What's the weather in Berlin?",
  'Calculate 42 * 7',
  'Search for latest AI news',
  'Explain how neural networks learn',
]

interface Props {
  query: string
  onQueryChange: (v: string) => void
  onRun: () => void
  onStep: () => void
  onReset: () => void
  isRunning: boolean
  hasStarted: boolean
}

export default function AgentControls({ query, onQueryChange, onRun, onStep, onReset, isRunning, hasStarted }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          User Query
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !hasStarted && onRun()}
          placeholder="Ask the agent anything..."
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onQueryChange(ex)}
            className="text-xs px-2 py-1 rounded-md transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {!hasStarted ? (
          <button
            onClick={onRun}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Play size={14} />
            Run Agent
          </button>
        ) : (
          <button
            onClick={onStep}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-40"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <SkipForward size={14} />
            Next Step
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  )
}
