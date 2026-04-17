'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, rectIntersection,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Wand2, ArrowUpDown, ArrowUp, ArrowDown,
  BarChart3, LayoutGrid, Loader2, Info,
  Sparkles, Check,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from '@/lib/toast'
import type { Feature, FeaturePriority, MoscowType } from '@/lib/types'

/* ── Constants ───────────────────────────────────────────────────── */
const PRIORITY_COLOR: Record<FeaturePriority, string> = {
  P0: '#f87171', P1: '#fb923c', P2: '#fbbf24', P3: '#4ade80',
}

const MOSCOW_CFG: {
  id: MoscowType; label: string; short: string
  color: string; bg: string; ring: string; desc: string
}[] = [
  { id: 'Must',   label: 'Must Have',   short: 'M', color: '#f87171', bg: 'rgba(239,68,68,0.07)',  ring: 'rgba(239,68,68,0.25)',  desc: 'Non-negotiable for launch'     },
  { id: 'Should', label: 'Should Have', short: 'S', color: '#fb923c', bg: 'rgba(249,115,22,0.07)', ring: 'rgba(249,115,22,0.25)', desc: 'High value, include if possible' },
  { id: 'Could',  label: 'Could Have',  short: 'C', color: '#818cf8', bg: 'rgba(99,102,241,0.07)', ring: 'rgba(99,102,241,0.25)', desc: 'Nice to have, defer if needed'   },
  { id: 'Wont',   label: "Won't Have",  short: 'W', color: '#71717a', bg: 'rgba(113,113,122,0.07)',ring: 'rgba(113,113,122,0.25)', desc: 'Out of scope this cycle'         },
]

/* ── Row tier coloring ───────────────────────────────────────────── */
function getTier(score: number, scores: number[]): 'high' | 'mid' | 'low' {
  if (scores.length < 2) return 'mid'
  const sorted = [...scores].sort((a, b) => b - a)
  const p25 = sorted[Math.max(0, Math.floor(sorted.length * 0.25) - 1)]
  const p75 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))]
  if (score >= p25) return 'high'
  if (score <= p75) return 'low'
  return 'mid'
}

const TIER_STYLE = {
  high: { bar: '#22c55e', bg: 'rgba(34,197,94,0.06)',   text: '#4ade80' },
  mid:  { bar: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  text: '#fbbf24' },
  low:  { bar: '#ef4444', bg: 'rgba(239,68,68,0.06)',   text: '#f87171' },
}

/* ── Inline editable number cell ─────────────────────────────────── */
function NumCell({
  value, min = 0, max = 100000,
  onCommit, highlight,
}: {
  value: number; min?: number; max?: number
  onCommit: (v: number) => void; highlight?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = useCallback(() => {
    const n = parseFloat(draft)
    if (!isNaN(n)) onCommit(Math.min(max, Math.max(min, n)))
    else setDraft(String(value))
    setEditing(false)
  }, [draft, min, max, value, onCommit])

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) }
          e.stopPropagation()
        }}
        className="w-full text-center text-[11px] font-mono outline-none rounded"
        style={{
          background: '#27272a', color: '#e4e4e7',
          border: '1px solid #6366f1', padding: '1px 2px',
        }}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      className="block text-center text-[11px] font-mono cursor-text rounded px-0.5 py-0.5 transition-colors"
      style={{ color: highlight ? '#a5b4fc' : '#a1a1aa' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.background = '#27272a' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.background = 'transparent' }}
      title="Click to edit"
    >
      {typeof value === 'number' && value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}
    </span>
  )
}

/* ── AI reasoning panel ──────────────────────────────────────────── */
interface AIReasoning { id: string; reach: number; impact: number; confidence: number; effort: number; riceScore: number; reasoning: string }

function ReasoningPanel({ items, features, onApply, onClose }: {
  items: AIReasoning[]
  features: Feature[]
  onApply: () => void
  onClose: () => void
}) {
  return (
    <div
      className="border-t flex flex-col"
      style={{ borderColor: '#27272a', background: '#0d0d0f', maxHeight: 240 }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0" style={{ borderColor: '#1e1e22' }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: '#818cf8' }} />
          <span className="text-xs font-semibold" style={{ color: '#e4e4e7' }}>AI Scoring Suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onApply}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors"
            style={{ background: '#6366f1', color: '#fff' }}
          >
            <Check size={11} /> Apply all
          </button>
          <button onClick={onClose} className="text-[11px] px-2 py-1 rounded-lg" style={{ color: '#52525b' }}>
            Dismiss
          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {items.map((item) => {
          const feat = features.find(f => f.id === item.id)
          if (!feat) return null
          return (
            <div key={item.id} className="px-3 py-2.5 border-b" style={{ borderColor: '#1a1a1a' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium truncate mr-2" style={{ color: '#d4d4d8', maxWidth: 140 }}>
                  {feat.title}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {(['reach','impact','confidence','effort'] as const).map(k => (
                    <span key={k} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: '#27272a', color: '#71717a' }}>
                      {k[0].toUpperCase()}:{item[k]}
                    </span>
                  ))}
                  <span className="text-[11px] font-mono font-bold ml-1" style={{ color: '#818cf8' }}>
                    {item.riceScore.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: '#52525b' }}>{item.reasoning}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── RICE Table ──────────────────────────────────────────────────── */
type SortCol = 'riceScore' | 'reach' | 'impact' | 'confidence' | 'effort' | 'title'
type SortDir = 'asc' | 'desc'

function RICETable() {
  const { features, updateFeature } = useWorkspaceStore()
  const [sort, setSort]       = useState<{ col: SortCol; dir: SortDir }>({ col: 'riceScore', dir: 'desc' })
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [aiItems, setAiItems] = useState<AIReasoning[]>([])
  const [aiError, setAiError] = useState('')
  const [showReasoning, setShowReasoning] = useState(false)

  const allScores = useMemo(() => features.map(f => f.riceScore), [features])

  const sorted = useMemo(() => {
    return [...features].sort((a, b) => {
      const av = a[sort.col as keyof Feature] as number | string
      const bv = b[sort.col as keyof Feature] as number | string
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sort.dir === 'desc' ? -cmp : cmp
    })
  }, [features, sort])

  const toggleSort = (col: SortCol) => {
    setSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { col, dir: 'desc' }
    )
  }

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sort.col !== col) return <ArrowUpDown size={9} style={{ color: '#3f3f46' }} />
    return sort.dir === 'desc'
      ? <ArrowDown size={9} style={{ color: '#818cf8' }} />
      : <ArrowUp size={9} style={{ color: '#818cf8' }} />
  }

  /* ── AI Scoring ─────────────────────────────────────────────── */
  const handleAIScore = useCallback(async () => {
    setAiState('loading')
    setAiError('')
    const featureList = features.map(f =>
      `ID: ${f.id}\nTitle: ${f.title}\nDescription: ${f.description || 'No description'}\nCurrent status: ${f.status}`
    ).join('\n\n')

    const prompt = `You are a product prioritisation expert. Score these features using RICE methodology.

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "features": [
    {
      "id": "<exact feature ID>",
      "reach": <number: users/quarter, realistic 100-50000>,
      "impact": <number: 0.25 | 0.5 | 1 | 2 | 3>,
      "confidence": <number: 10-100 percent>,
      "effort": <number: person-weeks, 0.5-20>,
      "riceScore": <number: calculated (reach × impact × confidence/100) / effort>,
      "reasoning": "<2 sentences explaining the scores>"
    }
  ]
}

Features to score:
${featureList}`

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: 'prioritization',
          userMessage: prompt,
          conversationHistory: [],
        }),
      })
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }

      // Extract JSON — handle markdown code fences or raw JSON
      const jsonMatch = full.match(/```(?:json)?\s*([\s\S]*?)```/) || full.match(/(\{[\s\S]*\})/)
      if (!jsonMatch) throw new Error('Could not parse AI response')
      const parsed = JSON.parse(jsonMatch[1])
      if (!parsed.features?.length) throw new Error('No features in response')

      setAiItems(parsed.features)
      setAiState('done')
      setShowReasoning(true)
      toast.info(`AI scored ${parsed.features.length} features`)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unknown error')
      setAiState('error')
    }
  }, [features])

  const applyAIScores = useCallback(() => {
    aiItems.forEach(item => {
      updateFeature(item.id, {
        reach: item.reach,
        impact: item.impact,
        confidence: item.confidence,
        effort: item.effort,
      })
    })
    setShowReasoning(false)
    setAiState('idle')
    setAiItems([])
  }, [aiItems, updateFeature])

  /* ── Header cell ────────────────────────────────────────────── */
  const TH = ({ col, label, title }: { col: SortCol; label: string; title?: string }) => (
    <th
      className="text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none px-1 py-2"
      style={{ color: sort.col === col ? '#818cf8' : '#52525b', whiteSpace: 'nowrap' }}
      onClick={() => toggleSort(col)}
      title={title}
    >
      <div className="flex items-center justify-center gap-0.5">
        {label}
        <SortIcon col={col} />
      </div>
    </th>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: '#e4e4e7' }}>RICE Scores</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#27272a', color: '#52525b' }}>
            {features.length}
          </span>
        </div>
        <button
          onClick={handleAIScore}
          disabled={aiState === 'loading' || features.length === 0}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
          onMouseEnter={(e) => { if (aiState !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.2)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)' }}
        >
          {aiState === 'loading'
            ? <><Loader2 size={11} className="animate-spin" /> Analyzing…</>
            : <><Wand2 size={11} /> AI Score</>
          }
        </button>
      </div>

      {aiState === 'error' && (
        <div className="mx-3 mb-2 px-2.5 py-2 rounded-lg text-[11px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {aiError}
        </div>
      )}

      {/* Legend */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 pb-2">
        {(['high','mid','low'] as const).map(t => (
          <div key={t} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TIER_STYLE[t].bar }} />
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>
              {t === 'high' ? 'Top 25%' : t === 'mid' ? 'Mid 50%' : 'Bottom 25%'}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, background: '#0d0d0f', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid #1e1e22' }}>
              <TH col="title"      label="Feature"    />
              <TH col="reach"      label="R"          title="Reach (users/quarter)" />
              <TH col="impact"     label="I"          title="Impact (0.25–3)" />
              <TH col="confidence" label="C"          title="Confidence (%)" />
              <TH col="effort"     label="E"          title="Effort (person-weeks)" />
              <TH col="riceScore"  label="Score"      title="RICE = (R×I×C%) / E" />
              <th className="text-[10px] font-semibold uppercase tracking-wider px-1 py-2 text-center" style={{ color: '#52525b' }}>P</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => {
              const tier  = getTier(f.riceScore, allScores)
              const ts    = TIER_STYLE[tier]
              return (
                <tr
                  key={f.id}
                  style={{
                    background: ts.bg,
                    borderBottom: '1px solid #1a1a1a',
                    borderLeft: `2px solid ${ts.bar}`,
                  }}
                >
                  {/* Feature name */}
                  <td className="px-2 py-2">
                    <p className="text-[11px] font-medium truncate" style={{ color: '#d4d4d8' }} title={f.title}>
                      {f.title}
                    </p>
                  </td>

                  {/* Reach */}
                  <td className="px-1 py-1">
                    <NumCell
                      value={f.reach} min={0} max={1000000}
                      onCommit={(v) => updateFeature(f.id, { reach: v as number })}
                    />
                  </td>

                  {/* Impact */}
                  <td className="px-1 py-1">
                    <select
                      value={f.impact}
                      onChange={(e) => updateFeature(f.id, { impact: parseFloat(e.target.value) })}
                      className="w-full text-center text-[11px] font-mono rounded outline-none cursor-pointer"
                      style={{ background: 'transparent', color: '#a1a1aa', border: 'none', padding: '2px 0' }}
                    >
                      {[0.25, 0.5, 1, 2, 3].map(v => (
                        <option key={v} value={v} style={{ background: '#18181b' }}>{v}</option>
                      ))}
                    </select>
                  </td>

                  {/* Confidence */}
                  <td className="px-1 py-1">
                    <NumCell
                      value={f.confidence} min={10} max={100}
                      onCommit={(v) => updateFeature(f.id, { confidence: v as number })}
                    />
                  </td>

                  {/* Effort */}
                  <td className="px-1 py-1">
                    <NumCell
                      value={f.effort} min={0.5} max={52}
                      onCommit={(v) => updateFeature(f.id, { effort: v as number })}
                    />
                  </td>

                  {/* RICE Score */}
                  <td className="px-1 py-2 text-center">
                    <span className="text-[12px] font-bold font-mono" style={{ color: ts.text }}>
                      {f.riceScore >= 1000
                        ? (f.riceScore / 1000).toFixed(1) + 'k'
                        : f.riceScore}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-1 py-1 text-center">
                    <select
                      value={f.priority}
                      onChange={(e) => updateFeature(f.id, { priority: e.target.value as FeaturePriority })}
                      className="text-[10px] font-bold rounded outline-none cursor-pointer w-full text-center"
                      style={{
                        background: 'transparent', border: 'none',
                        color: PRIORITY_COLOR[f.priority],
                      }}
                    >
                      {(['P0','P1','P2','P3'] as FeaturePriority[]).map(p => (
                        <option key={p} value={p} style={{ background: '#18181b', color: PRIORITY_COLOR[p] }}>{p}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {features.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs" style={{ color: '#555' }}>
            No features yet — add some in the <strong style={{ color: '#818cf8' }}>Roadmap</strong> tab
          </div>
        )}
      </div>

      {/* AI Reasoning Panel */}
      {showReasoning && aiItems.length > 0 && (
        <ReasoningPanel
          items={aiItems}
          features={features}
          onApply={applyAIScores}
          onClose={() => { setShowReasoning(false); setAiState('idle') }}
        />
      )}

      {/* Column glossary */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-3 py-1.5 border-t"
        style={{ borderColor: '#1a1a1a', background: '#0a0a0b' }}
      >
        {[
          { k: 'R', v: 'Reach/qtr' },
          { k: 'I', v: 'Impact' },
          { k: 'C', v: 'Confidence%' },
          { k: 'E', v: 'Effort wks' },
        ].map(({ k, v }) => (
          <span key={k} className="text-[9px]" style={{ color: '#27272a' }} title={v}>
            <span style={{ color: '#3f3f46' }}>{k}</span>=<span>{v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── MoSCoW draggable chip ───────────────────────────────────────── */
function MosCowChip({ feature, isDragOverlay }: { feature: Feature; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: feature.id,
    disabled: isDragOverlay,
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragOverlay ? '0 8px 24px rgba(0,0,0,0.6)' : 'none',
      }}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border select-none mb-1.5"
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
    >
      <span className="text-[11px] font-medium truncate flex-1" style={{ background: '#18181b', borderColor: '#27272a', color: '#d4d4d8' }}>
        {feature.title}
      </span>
      <span className="text-[9px] font-bold flex-shrink-0" style={{ color: PRIORITY_COLOR[feature.priority] }}>
        {feature.priority}
      </span>
    </div>
  )
}

/* ── MoSCoW Quadrant (droppable) ─────────────────────────────────── */
function MosCowQuadrant({
  cfg, features, total,
}: {
  cfg: typeof MOSCOW_CFG[number]
  features: Feature[]
  total: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cfg.id })
  const pct = total > 0 ? Math.round((features.length / total) * 100) : 0

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: isOver ? cfg.bg : '#111113',
        border: `1px solid ${isOver ? cfg.ring : '#1e1e22'}`,
        transition: 'background 0.12s, border-color 0.12s',
        minHeight: 120,
      }}
    >
      {/* Header */}
      <div className="px-2.5 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${cfg.ring}30` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.ring}` }}
            >
              {cfg.short}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{features.length}</span>
            <span
              className="text-[9px] px-1 py-0.5 rounded font-medium"
              style={{ background: '#27272a', color: '#52525b' }}
            >
              {pct}%
            </span>
          </div>
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: '#3f3f46' }}>{cfg.desc}</p>
      </div>

      {/* Feature chips */}
      <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto" style={{ minHeight: 60 }}>
        {features.map(f => (
          <MosCowChip key={f.id} feature={f} />
        ))}
        {features.length === 0 && (
          <div
            className="flex items-center justify-center h-10 rounded-lg border border-dashed text-[10px]"
            style={{ borderColor: '#27272a', color: '#2e2e32' }}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

/* ── MoSCoW View ──────────────────────────────────────────────────── */
function MoSCoWView() {
  const { features, updateFeature } = useWorkspaceStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const byBucket = useMemo(() => {
    const map = new Map<MoscowType, Feature[]>()
    MOSCOW_CFG.forEach(q => map.set(q.id, []))
    features.forEach(f => map.get(f.moscow)?.push(f))
    return map
  }, [features])

  const activeFeature = activeId ? features.find(f => f.id === activeId) : null

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const target = over.id as MoscowType
    if (MOSCOW_CFG.some(q => q.id === target)) {
      updateFeature(active.id as string, { moscow: target })
    }
  }

  /* Scope summary */
  const scopeSummary = useMemo(() => {
    return MOSCOW_CFG.map(q => ({
      ...q,
      count: byBucket.get(q.id)?.length ?? 0,
      pct: features.length > 0
        ? Math.round(((byBucket.get(q.id)?.length ?? 0) / features.length) * 100)
        : 0,
    }))
  }, [byBucket, features])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Scope scope bar */}
        <div className="flex-shrink-0 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#52525b' }}>Scope</span>
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>— {features.length} features</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {scopeSummary.map(q => (
              <div
                key={q.id}
                style={{ width: `${q.pct}%`, background: q.color, transition: 'width 0.3s', minWidth: q.count > 0 ? 3 : 0 }}
                title={`${q.label}: ${q.count} (${q.pct}%)`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {scopeSummary.map(q => q.count > 0 && (
              <span key={q.id} className="flex items-center gap-1 text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: q.color }} />
                <span style={{ color: '#52525b' }}>{q.short} {q.pct}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* 2×2 Grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {MOSCOW_CFG.map(cfg => (
              <MosCowQuadrant
                key={cfg.id}
                cfg={cfg}
                features={byBucket.get(cfg.id) ?? []}
                total={features.length}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 120, easing: 'ease' }}>
        {activeFeature && <MosCowChip feature={activeFeature} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}

/* ── Main Panel ──────────────────────────────────────────────────── */
export default function PrioritizationPanel() {
  const [view, setView] = useState<'rice' | 'moscow'>('rice')

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      {/* View toggle */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 pt-3 pb-2">
        {([
          { id: 'rice',   label: 'RICE',   icon: <BarChart3 size={11} /> },
          { id: 'moscow', label: 'MoSCoW', icon: <LayoutGrid size={11} /> },
        ] as { id: 'rice' | 'moscow'; label: string; icon: React.ReactNode }[]).map(v => {
          const active = view === v.id
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? '#6366f1'  : '#18181b',
                color:      active ? '#fff'     : '#52525b',
                border:     `1px solid ${active ? '#6366f1' : '#27272a'}`,
              }}
            >
              {v.icon}
              {v.label}
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-1" style={{ color: '#3f3f46' }}>
          <Info size={11} />
          <span className="text-[10px]">Click cells to edit</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'rice' ? <RICETable /> : <MoSCoWView />}
      </div>
    </div>
  )
}
