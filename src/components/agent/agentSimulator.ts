import type { AgentStep } from '../../types'

interface Scenario {
  keywords: string[]
  steps: Omit<AgentStep, 'id'>[]
}

const SCENARIOS: Scenario[] = [
  {
    keywords: ['weather', 'temperature', 'forecast', 'rain', 'sunny'],
    steps: [
      { type: 'think', text: 'The user is asking about weather. I should use the WeatherAPI tool to get current conditions.' },
      { type: 'tool_call', text: 'Calling WeatherAPI', tool: 'WeatherAPI', args: '{ "location": "Berlin", "units": "metric" }' },
      { type: 'observation', text: 'WeatherAPI returned: {"temp": 18, "condition": "Partly cloudy", "humidity": 65, "wind_kph": 14}' },
      { type: 'think', text: 'I have the weather data. I can now compose a clear, friendly answer for the user.' },
      { type: 'answer', text: 'The weather in Berlin is currently 18°C and partly cloudy. Humidity is at 65% with light winds of 14 km/h. A good day to be outside!' },
    ],
  },
  {
    keywords: ['calculate', 'math', 'compute', '+', '-', '*', '/', 'multiply', 'divide', 'sum', 'add'],
    steps: [
      { type: 'think', text: 'The user wants a calculation. I should use the Calculator tool to get the precise result.' },
      { type: 'tool_call', text: 'Calling Calculator', tool: 'Calculator', args: '{ "expression": "42 * 7" }' },
      { type: 'observation', text: 'Calculator returned: { "result": 294, "expression": "42 * 7" }' },
      { type: 'answer', text: '42 × 7 = 294. The Calculator tool confirms the result.' },
    ],
  },
  {
    keywords: ['search', 'find', 'news', 'latest', 'recent', 'lookup', 'look up'],
    steps: [
      { type: 'think', text: 'The user wants to search for information. I\'ll use the WebSearch tool to find relevant results.' },
      { type: 'tool_call', text: 'Calling WebSearch', tool: 'WebSearch', args: '{ "query": "latest AI news 2024", "num_results": 3 }' },
      { type: 'observation', text: 'WebSearch returned 3 results:\n1. "GPT-5 announced with multimodal reasoning" — OpenAI Blog\n2. "Anthropic releases Claude 3.5 Sonnet" — TechCrunch\n3. "Google DeepMind\'s Gemini Ultra benchmark results" — Nature' },
      { type: 'think', text: 'I found relevant search results. I\'ll summarize the key news for the user.' },
      { type: 'answer', text: 'Here are the latest AI highlights: OpenAI announced GPT-5 with enhanced multimodal reasoning. Anthropic released Claude 3.5 Sonnet. Google DeepMind published Gemini Ultra benchmark results showing competitive performance across tasks.' },
    ],
  },
  {
    keywords: [],
    steps: [
      { type: 'think', text: 'Let me analyze this question carefully. I need to break it down into sub-problems.' },
      { type: 'tool_call', text: 'Calling KnowledgeBase', tool: 'KnowledgeBase', args: '{ "query": "general knowledge lookup" }' },
      { type: 'observation', text: 'KnowledgeBase returned relevant context about the topic from internal documents.' },
      { type: 'think', text: 'I now have enough information to compose a comprehensive answer based on the retrieved context.' },
      { type: 'answer', text: 'Based on my analysis and the retrieved knowledge: This is a multi-faceted topic. The key insight is that breaking complex problems into smaller parts and using appropriate tools makes the agent significantly more capable than relying on memory alone.' },
    ],
  },
]

export function simulate(input: string): AgentStep[] {
  const lower = input.toLowerCase()
  const scenario = SCENARIOS.find((s) => s.keywords.some((k) => lower.includes(k))) ?? SCENARIOS[SCENARIOS.length - 1]

  const inputStep: AgentStep = { id: 'step-0', type: 'input', text: input }
  return [
    inputStep,
    ...scenario.steps.map((s, i) => ({ ...s, id: `step-${i + 1}` })),
  ]
}
