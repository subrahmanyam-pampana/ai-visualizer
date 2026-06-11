import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import AgentControls from '../components/agent/AgentControls'
import AgentFlow from '../components/agent/AgentFlow'
import AgentLog from '../components/agent/AgentLog'
import { simulate } from '../components/agent/agentSimulator'
import PageWrapper from '../components/layout/PageWrapper'
import type { AgentStep } from '../types'

const CONCEPTS = [
  {
    id: 'what',
    title: 'What Is an AI Agent?',
    color: '#8b5cf6',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          An <strong>AI agent</strong> is an LLM that can take actions — calling tools, reading files,
          browsing the web, writing code — and iterating until a goal is achieved.
          Unlike a single prompt-response, agents run in a <strong>loop</strong>: they observe the result
          of each action and decide what to do next.
        </p>
        <div className="rounded-lg p-3 text-xs font-mono space-y-1" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ color: '#8b5cf6' }}>while goal_not_achieved:</div>
          <div className="pl-4" style={{ color: 'var(--text-secondary)' }}>thought = llm.think(context)</div>
          <div className="pl-4" style={{ color: '#3b82f6' }}>action  = llm.choose_tool(thought)</div>
          <div className="pl-4" style={{ color: '#14b8a6' }}>result  = tool.run(action)</div>
          <div className="pl-4" style={{ color: 'var(--text-secondary)' }}>context.append(result)</div>
        </div>
      </div>
    ),
  },
  {
    id: 'react',
    title: 'ReAct: Reasoning + Acting',
    color: '#f59e0b',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          <strong>ReAct</strong> (Reason + Act) is the most common agent pattern. Before each tool call,
          the model writes a "Thought" explaining its reasoning. This chain-of-thought reasoning
          significantly improves task completion accuracy.
        </p>
        <div className="rounded-lg p-3 text-xs space-y-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          {[
            { label: 'Thought', color: '#f59e0b', text: 'The user asked about the weather in Berlin. I need to call the WeatherAPI tool.' },
            { label: 'Action', color: '#3b82f6', text: 'WeatherAPI({ location: "Berlin", units: "metric" })' },
            { label: 'Observation', color: '#14b8a6', text: '{ "temp": 18, "condition": "Partly cloudy" }' },
            { label: 'Thought', color: '#f59e0b', text: 'I have the weather data. I can now compose the answer.' },
            { label: 'Answer', color: '#10b981', text: 'The weather in Berlin is 18°C and partly cloudy.' },
          ].map((step) => (
            <div key={step.label + step.text} className="flex gap-2">
              <span className="flex-shrink-0 font-semibold w-20 text-right" style={{ color: step.color }}>{step.label}:</span>
              <span style={{ color: 'var(--text-secondary)' }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'tools',
    title: 'Tool Use & Function Calling',
    color: '#3b82f6',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          Modern LLMs support <strong>function calling</strong> — you describe available tools as JSON schemas,
          and the model returns structured JSON when it wants to call one. This is much more reliable
          than parsing free-text tool calls.
        </p>
        <div className="rounded-lg p-3 text-xs font-mono" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)' }}>// Tool definition you provide:</div>
          <div style={{ color: '#3b82f6' }}>{'{'}</div>
          <div className="pl-4" style={{ color: 'var(--text-secondary)' }}>"name": "get_weather",</div>
          <div className="pl-4" style={{ color: 'var(--text-secondary)' }}>"description": "Get current weather for a city",</div>
          <div className="pl-4" style={{ color: 'var(--text-secondary)' }}>"parameters": {'{'} "location": string {'}'}</div>
          <div style={{ color: '#3b82f6' }}>{'}'}</div>
          <div className="mt-2" style={{ color: 'var(--text-muted)' }}>// Model returns:</div>
          <div style={{ color: '#10b981' }}>{'{ "tool": "get_weather", "args": { "location": "Berlin" } }'}</div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Common tools: web search, code executor, file reader, calculator, database query,
          image generation, calendar/email.
        </p>
      </div>
    ),
  },
  {
    id: 'memory',
    title: 'Agent Memory Types',
    color: '#10b981',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            {
              title: 'In-context (working)',
              color: '#6366f1',
              desc: 'The conversation history in the current context window. Fast, but limited by max tokens and lost when the session ends.',
            },
            {
              title: 'External (episodic)',
              color: '#3b82f6',
              desc: 'Past conversations stored in a vector database and retrieved by similarity. Enables long-term memory across sessions.',
            },
            {
              title: 'Semantic (knowledge)',
              color: '#10b981',
              desc: 'Facts extracted from interactions and stored as structured knowledge (entities, relationships). Retrieved by lookup.',
            },
            {
              title: 'Procedural (skills)',
              color: '#f59e0b',
              desc: 'Learned or hardcoded task workflows. Stored as prompts or code and retrieved by task type ("how to book a flight").',
            },
          ].map(({ title, color, desc }) => (
            <div key={title} className="rounded-lg p-3" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}25` }}>
              <div className="font-semibold mb-1" style={{ color }}>{title}</div>
              <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'multiagent',
    title: 'Multi-Agent Systems',
    color: '#ec4899',
    content: (
      <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>
          Complex tasks can be broken down across <strong>multiple specialized agents</strong> that collaborate.
          An <em>orchestrator</em> agent routes subtasks to <em>worker</em> agents, each with its own tools and expertise.
        </p>
        <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>Orchestrator</span>
            <span style={{ color: 'var(--text-muted)' }}>routes task →</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {['Research Agent', 'Code Agent', 'Review Agent', 'Writer Agent'].map((a) => (
              <span key={a} className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {a}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Examples: Claude Code (orchestrator + tool-use agents), AutoGen, CrewAI, LangGraph.
        </p>
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

export default function AgentPage() {
  const [query, setQuery] = useState("What's the weather in Berlin?")
  const [allSteps, setAllSteps] = useState<AgentStep[]>([])
  const [visibleCount, setVisibleCount] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const hasStarted = allSteps.length > 0
  const visibleSteps = allSteps.slice(0, visibleCount)

  const handleRun = useCallback(() => {
    const steps = simulate(query)
    setAllSteps(steps)
    setVisibleCount(0)
    setSelectedId(null)
    setIsRunning(true)

    let i = 0
    const tick = () => {
      i++
      setVisibleCount(i)
      setSelectedId(steps[i - 1]?.id ?? null)
      if (i < steps.length) {
        setTimeout(tick, 700)
      } else {
        setIsRunning(false)
      }
    }
    setTimeout(tick, 200)
  }, [query])

  const handleStep = useCallback(() => {
    if (visibleCount < allSteps.length) {
      const next = visibleCount + 1
      setVisibleCount(next)
      setSelectedId(allSteps[next - 1]?.id ?? null)
    }
  }, [visibleCount, allSteps])

  const handleReset = useCallback(() => {
    setAllSteps([])
    setVisibleCount(0)
    setSelectedId(null)
    setIsRunning(false)
  }, [])

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Agent Flows
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            AI agents extend LLMs with the ability to <strong>take actions</strong> — calling tools, reading files,
            browsing the web — and iterating until a goal is achieved. Enter a query and watch the
            agent's full reasoning loop unfold step by step.
          </p>
        </div>

        <AgentControls
          query={query}
          onQueryChange={setQuery}
          onRun={handleRun}
          onStep={handleStep}
          onReset={handleReset}
          isRunning={isRunning}
          hasStarted={hasStarted}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Flow Diagram
            </h2>
            <AgentFlow steps={visibleSteps} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Agent Trace
            </h2>
            <AgentLog steps={visibleSteps} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </div>

        <ConceptSection />
      </div>
    </PageWrapper>
  )
}
