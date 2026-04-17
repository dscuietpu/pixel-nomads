'use client'

import { useState, useRef } from 'react'
import { TrendingUp, AlertTriangle, Lightbulb, ArrowRight, BarChart2, LineChart, Loader2, Upload, RefreshCw, FileText } from 'lucide-react'
import { toast } from '@/lib/toast'
import {
  LineChart as ReLineChart,
  BarChart as ReBarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

/* ── Types ─────────────────────────────────────────────────────── */
type Confidence = 'high' | 'medium' | 'low'

interface DataInsight {
  id: string
  type: 'finding' | 'anomaly' | 'hypothesis' | 'next_step'
  text: string
  confidence: Confidence
  metric?: string
  delta?: string
}

interface ChartDataPoint {
  label: string
  [key: string]: string | number
}

interface AnalysisResult {
  summary: string
  insights: DataInsight[]
  chartType: 'line' | 'bar' | 'none'
  chartData: ChartDataPoint[]
  chartKeys: string[]
}

/* ── Helpers ────────────────────────────────────────────────────── */
function confidenceBadge(c: Confidence) {
  const map: Record<Confidence, { label: string; bg: string; color: string }> = {
    high:   { label: 'High',   bg: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
    medium: { label: 'Medium', bg: 'rgba(234,179,8,0.12)',  color: '#facc15' },
    low:    { label: 'Low',    bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
  }
  const s = map[c]
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function insightIcon(type: DataInsight['type']) {
  const props = { size: 13, className: 'flex-shrink-0 mt-0.5' }
  switch (type) {
    case 'finding':    return <TrendingUp    {...props} style={{ color: '#818cf8' }} />
    case 'anomaly':    return <AlertTriangle {...props} style={{ color: '#f59e0b' }} />
    case 'hypothesis': return <Lightbulb     {...props} style={{ color: '#34d399' }} />
    case 'next_step':  return <ArrowRight    {...props} style={{ color: '#60a5fa' }} />
  }
}

const TYPE_LABELS: Record<DataInsight['type'], string> = {
  finding:    'Finding',
  anomaly:    'Anomaly',
  hypothesis: 'Hypothesis',
  next_step:  'Next Step',
}

/* ── Extract JSON from streamed AI text ─────────────────────────── */
function extractJSON(text: string): AnalysisResult | null {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const raw    = fenced ? fenced[1] : text.match(/(\{[\s\S]*\})/)?.[1]
    if (!raw) return null
    return JSON.parse(raw) as AnalysisResult
  } catch {
    return null
  }
}

const DATA_PROMPT = `You are a product analytics expert. Analyse the pasted metrics or CSV data and return ONLY valid JSON (no markdown, no explanation) in this exact shape:

{
  "summary": "2-3 sentence overview of the data",
  "insights": [
    {
      "id": "1",
      "type": "finding" | "anomaly" | "hypothesis" | "next_step",
      "text": "Insight text",
      "confidence": "high" | "medium" | "low",
      "metric": "optional metric name",
      "delta": "optional delta e.g. +12%"
    }
  ],
  "chartType": "line" | "bar" | "none",
  "chartData": [
    { "label": "Jan", "value": 1200 }
  ],
  "chartKeys": ["value"]
}

Rules:
- Produce 6–10 insights covering all four types (findings, anomalies, hypotheses, next steps)
- If data has a time dimension → chartType "line"; if categorical → "bar"; otherwise "none"
- chartData.label = x-axis label; other keys match chartKeys
- Confidence: high = clear signal, medium = probable, low = speculative
- Return ONLY the JSON object, nothing else`

/* ── InsightCard ────────────────────────────────────────────────── */
function InsightCard({ insight }: { insight: DataInsight }) {
  return (
    <div
      className="rounded-lg p-3 flex gap-2.5"
      style={{ background: '#252525', border: '1px solid #2e2e2e' }}
    >
      {insightIcon(insight.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#555' }}>
            {TYPE_LABELS[insight.type]}
          </span>
          {insight.metric && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1e1e1e', color: '#888' }}>
              {insight.metric}
            </span>
          )}
          {insight.delta && (
            <span
              className="text-[10px] font-semibold"
              style={{ color: insight.delta.startsWith('+') ? '#4ade80' : '#f87171' }}
            >
              {insight.delta}
            </span>
          )}
          <span className="ml-auto">{confidenceBadge(insight.confidence)}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#ccc' }}>{insight.text}</p>
      </div>
    </div>
  )
}

/* ── Chart ──────────────────────────────────────────────────────── */
const CHART_COLORS = ['#6366f1', '#34d399', '#f59e0b', '#f87171', '#60a5fa']

function DataChart({ result }: { result: AnalysisResult }) {
  const [chartView, setChartView] = useState<'line' | 'bar'>(result.chartType === 'none' ? 'bar' : result.chartType)

  if (!result.chartData?.length || result.chartType === 'none') return null

  return (
    <div className="rounded-lg p-3" style={{ background: '#252525', border: '1px solid #2e2e2e' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium" style={{ color: '#aaa' }}>Chart Preview</p>
        <div className="flex gap-1">
          <button
            onClick={() => setChartView('line')}
            className="p-1 rounded transition-colors"
            style={{ background: chartView === 'line' ? 'rgba(99,102,241,0.2)' : 'transparent', color: chartView === 'line' ? '#818cf8' : '#555' }}
            title="Line chart"
          >
            <LineChart size={13} />
          </button>
          <button
            onClick={() => setChartView('bar')}
            className="p-1 rounded transition-colors"
            style={{ background: chartView === 'bar' ? 'rgba(99,102,241,0.2)' : 'transparent', color: chartView === 'bar' ? '#818cf8' : '#555' }}
            title="Bar chart"
          >
            <BarChart2 size={13} />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        {chartView === 'line' ? (
          <ReLineChart data={result.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 6, fontSize: 11 }}
              labelStyle={{ color: '#999' }}
              itemStyle={{ color: '#ccc' }}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: '#666' }} />
            {(result.chartKeys || ['value']).map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </ReLineChart>
        ) : (
          <ReBarChart data={result.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 6, fontSize: 11 }}
              labelStyle={{ color: '#999' }}
              itemStyle={{ color: '#ccc' }}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: '#666' }} />
            {(result.chartKeys || ['value']).map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </ReBarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/* ── Filter bar ─────────────────────────────────────────────────── */
const FILTERS: { id: DataInsight['type'] | 'all'; label: string }[] = [
  { id: 'all',        label: 'All'         },
  { id: 'finding',    label: 'Findings'    },
  { id: 'anomaly',    label: 'Anomalies'   },
  { id: 'hypothesis', label: 'Hypotheses'  },
  { id: 'next_step',  label: 'Next Steps'  },
]

/* ── Main Component ─────────────────────────────────────────────── */
export default function DataPanel() {
  const [input, setInput]           = useState('')
  const [status, setStatus]         = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [streamText, setStreamText] = useState('')
  const [result, setResult]         = useState<AnalysisResult | null>(null)
  const [filter, setFilter]         = useState<DataInsight['type'] | 'all'>('all')
  const [isDragging, setIsDragging] = useState(false)
  const abortRef                    = useRef<AbortController | null>(null)
  const fileInputRef                = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'
    if (!isCSV) {
      toast.error('Please upload a CSV file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setInput(text)
      toast.success(`Loaded ${file.name} — ${text.split('\n').length} rows`)
    }
    reader.readAsText(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function analyse() {
    if (!input.trim() || status === 'loading') return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('loading')
    setStreamText('')
    setResult(null)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          workflow: 'data',
          userMessage: `${DATA_PROMPT}\n\nData to analyse:\n${input}`,
          documentContext: null,
          conversationHistory: [],
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   full    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreamText(full)
      }

      const parsed = extractJSON(full)
      if (parsed) {
        setResult(parsed)
        setStatus('done')
        toast.success(`Analysis complete — ${parsed.insights.length} insights found`)
      } else {
        setStatus('error')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') setStatus('error')
    }
  }

  function reset() {
    abortRef.current?.abort()
    setInput('')
    setStatus('idle')
    setStreamText('')
    setResult(null)
    setFilter('all')
  }

  const filteredInsights = result?.insights.filter(
    i => filter === 'all' || i.type === filter
  ) ?? []

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#1a1a1a' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b"
        style={{ borderColor: '#2a2a2a' }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: '#ddd' }}>Data Analysis</p>
          <p className="text-[10px]" style={{ color: '#555' }}>Upload, paste, or drag CSV → AI interprets</p>
        </div>
        {result && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: '#666' }}
          >
            <RefreshCw size={11} />
            Reset
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Input */}
        {status !== 'done' && (
          <div className="flex flex-col gap-3">
            {/* CSV upload row */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={status === 'loading'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
                style={{ background: '#252525', color: '#aaa', border: '1px solid #2e2e2e' }}
                onMouseEnter={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = '#2e2e2e' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#252525' }}
              >
                <FileText size={12} />
                Upload CSV
              </button>
              <span className="text-[10px]" style={{ color: '#444' }}>or paste data below</span>
            </div>

            <div
              className="relative"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div
                  className="absolute inset-0 rounded-lg flex items-center justify-center z-10 pointer-events-none"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '2px dashed #6366f1' }}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <FileText size={20} style={{ color: '#818cf8' }} />
                    <span className="text-xs font-medium" style={{ color: '#818cf8' }}>Drop CSV file here</span>
                  </div>
                </div>
              )}
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Paste your metrics, CSV data, or funnel numbers here…\n\nExample:\nDate,DAU,Revenue,Churn\n2024-01,12000,48000,2.1%\n2024-02,13400,51200,1.8%\n…`}
                className="w-full rounded-lg text-xs leading-relaxed resize-none outline-none transition-colors"
                style={{
                  background: isDragging ? 'rgba(99,102,241,0.05)' : '#252525',
                  border: `1px solid ${isDragging ? '#6366f1' : '#2e2e2e'}`,
                  color: '#ccc',
                  padding: '12px',
                  minHeight: 160,
                  fontFamily: 'monospace',
                }}
                disabled={status === 'loading'}
              />
              {input && (
                <span
                  className="absolute bottom-2 right-2 text-[10px]"
                  style={{ color: '#444' }}
                >
                  {input.split('\n').length} lines
                </span>
              )}
            </div>

            <button
              onClick={analyse}
              disabled={!input.trim() || status === 'loading'}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
              style={{
                background: status === 'loading' ? 'rgba(99,102,241,0.2)' : '#6366f1',
                color: '#fff',
                cursor: !input.trim() || status === 'loading' ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Upload size={13} />
                  Analyse Data
                </>
              )}
            </button>
          </div>
        )}

        {/* Streaming preview */}
        {status === 'loading' && streamText && (
          <div
            className="rounded-lg p-3 text-[10px] font-mono leading-relaxed max-h-32 overflow-y-auto"
            style={{ background: '#111', color: '#555', border: '1px solid #222' }}
          >
            {streamText.slice(-600)}
            <span className="animate-pulse">▌</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            Analysis failed. Check that your data has clear column headers and try again.
          </div>
        )}

        {/* Results */}
        {result && status === 'done' && (
          <>
            {/* Summary */}
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#818cf8' }}>
                Summary
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#ccc' }}>{result.summary}</p>
            </div>

            {/* Chart */}
            <DataChart result={result} />

            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-2">
              {(['finding', 'anomaly', 'hypothesis', 'next_step'] as const).map(t => {
                const count = result.insights.filter(i => i.type === t).length
                return (
                  <div
                    key={t}
                    className="rounded-lg p-2 text-center cursor-pointer transition-colors"
                    style={{
                      background: filter === t ? 'rgba(99,102,241,0.15)' : '#252525',
                      border: `1px solid ${filter === t ? 'rgba(99,102,241,0.3)' : '#2e2e2e'}`,
                    }}
                    onClick={() => setFilter(filter === t ? 'all' : t)}
                  >
                    <p className="text-base font-bold" style={{ color: filter === t ? '#818cf8' : '#ccc' }}>{count}</p>
                    <p className="text-[9px] uppercase tracking-wide leading-tight" style={{ color: '#555' }}>
                      {TYPE_LABELS[t].slice(0, 6)}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as DataInsight['type'] | 'all')}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors"
                  style={{
                    background: filter === f.id ? 'rgba(99,102,241,0.2)' : '#252525',
                    color: filter === f.id ? '#818cf8' : '#666',
                    border: `1px solid ${filter === f.id ? 'rgba(99,102,241,0.3)' : '#2e2e2e'}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Insight cards */}
            <div className="flex flex-col gap-2">
              {filteredInsights.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#555' }}>
                  No {filter === 'all' ? 'insights' : TYPE_LABELS[filter as DataInsight['type']].toLowerCase()} found.
                </p>
              ) : (
                filteredInsights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </div>

            {/* Re-analyse */}
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
              style={{ color: '#555', border: '1px solid #2a2a2a' }}
            >
              <RefreshCw size={11} />
              Analyse different data
            </button>
          </>
        )}
      </div>
    </div>
  )
}
