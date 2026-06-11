import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/tokenization', label: 'Tokenization' },
  { to: '/rag', label: 'RAG' },
  { to: '/agent', label: 'Agent Flows' },
]

export default function TabBar() {
  return (
    <nav className="max-w-7xl mx-auto px-6 flex gap-1">
      {tabs.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent hover:border-slate-600'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
