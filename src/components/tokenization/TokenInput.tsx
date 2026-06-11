interface Props {
  value: string
  onChange: (v: string) => void
  onLoadExample: () => void
}

export default function TokenInput({ value, onChange, onLoadExample }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Input Text
        </label>
        <button
          onClick={onLoadExample}
          className="text-xs px-3 py-1 rounded-md transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          Load example
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or paste any text here to see how it gets tokenized..."
        rows={4}
        className="w-full rounded-xl p-4 text-sm font-mono resize-y focus:outline-none transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  )
}
