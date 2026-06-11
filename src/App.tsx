import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import TabBar from './components/layout/TabBar'
import TokenizationPage from './pages/TokenizationPage'
import RAGPage from './pages/RAGPage'
import AgentPage from './pages/AgentPage'
import { Moon, Sun } from 'lucide-react'

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored !== 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <HashRouter>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <header
          className="border-b sticky top-0 z-50"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                AI
              </div>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                AI Concepts Visualizer
              </span>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <TabBar />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/tokenization" replace />} />
            <Route path="/tokenization" element={<TokenizationPage />} />
            <Route path="/rag" element={<RAGPage />} />
            <Route path="/agent" element={<AgentPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
