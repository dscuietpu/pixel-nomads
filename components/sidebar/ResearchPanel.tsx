'use client'

import { useState, useCallback, useRef } from 'react'
import {
  FlaskConical, Wand2, Loader2, ChevronDown, ChevronUp,
  Quote, Link2, Download, Trash2, Plus, Check, X,
  AlertCircle, Lightbulb,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from '@/lib/toast'

/* ── Types ───────────────────────────────────────────────────────── */
interface ParsedTheme {
  id: string
  title: string
  summary: string
  quotes: string[]
  frequency: number
  total: number
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  opportunity: string
  suggestedFeatures: string[]
}

interface ParsedResearch {
  themes: ParsedTheme[]
  participantCount: number
  researchSummary: string
}

/* ── Severity config ─────────────────────────────────────────────── */
const SEV_CFG = {
  Critical: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  ring: 'rgba(239,68,68,0.25)' },
  High:     { color: '#fb923c', bg: 'rgba(249,115,22,0.1)', ring: 'rgba(249,115,22,0.25)' },
  Medium:   { color: '#fbbf24', bg: 'rgba(234,179,8,0.1)',  ring: 'rgba(234,179,8,0.25)'  },
  Low:      { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  ring: 'rgba(34,197,94,0.25)'  },
}

/* ── Link to Feature dropdown ────────────────────────────────────── */
function LinkFeatureDropdown({
  linkedIds,
  onLink,
}: {
  themeId: string
  linkedIds: string[]
  onLink: (featureId: string) => void
}) {
  const { features } = useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  if (features.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors"
        style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <Link2 size={10} />
        Link feature
        <ChevronDown size={9} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 mt-1 rounded-xl border overflow-hidden shadow-2xl"
          style={{ width: 220, background: '#18181b', borderColor: '#2e2e32', top: '100%' }}
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider border-b" style={{ color: '#52525b', borderColor: '#27272a' }}>
            Link to feature
          </p>
          <div className="max-h-48 overflow-y-auto">
            {features.map(f => {
              const linked = linkedIds.includes(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => { onLink(f.id); setOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs transition-colors"
                  style={{ color: linked ? '#818cf8' : '#a1a1aa' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#27272a' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  {linked ? <Check size={11} style={{ color: '#818cf8', flexShrink: 0 }} /> : <Plus size={11} style={{ flexShrink: 0, color: '#52525b' }} />}
                  <span className="truncate">{f.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Theme Card ──────────────────────────────────────────────────── */
function ThemeCard({
  theme,
  linkedFeatureIds,
  onLink,
  onDelete,
}: {
  theme: ParsedTheme
  linkedFeatureIds: string[]
  onLink: (themeId: string, featureId: string) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEV_CFG[theme.severity] ?? SEV_CFG.Medium
  const freqPct = theme.total > 0 ? Math.round((theme.frequency / theme.total) * 100) : 0

  return (
    <div
      className="rounded-xl border mb-3 overflow-hidden"
      style={{ background: '#111113', borderColor: '#1e1e22', borderLeft: `3px solid ${sev.color}` }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xs font-semibold leading-snug flex-1" style={{ color: '#e4e4e7' }}>
            {theme.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.ring}` }}
            >
              {theme.severity}
            </span>
            <button
              onClick={() => onDelete(theme.id)}
              className="p-0.5 rounded transition-colors opacity-40 hover:opacity-100"
              style={{ color: '#ef4444' }}
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Frequency bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: '#52525b' }}>
              {theme.frequency} of {theme.total} participants · {freqPct}%
            </span>
            <span className="text-[10px] font-semibold" style={{ color: sev.color }}>{freqPct}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${freqPct}%`, background: sev.color }}
            />
          </div>
        </div>

        {/* Summary */}
        <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#a1a1aa' }}>
          {theme.summary}
        </p>

        {/* Opportunity */}
        {theme.opportunity && (
          <div
            className="flex items-start gap-2 rounded-lg px-2.5 py-2 mb-2.5"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <Lightbulb size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
            <p className="text-[10px] leading-relaxed" style={{ color: '#818cf8' }}>{theme.opportunity}</p>
          </div>
        )}

        {/* Expand / collapse quotes */}
        {theme.quotes.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] transition-colors mb-1"
            style={{ color: expanded ? '#818cf8' : '#52525b' }}
          >
            <Quote size={10} />
            {theme.quotes.length} quote{theme.quotes.length !== 1 ? 's' : ''}
            {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
        )}
      </div>

      {/* Quotes */}
      {expanded && theme.quotes.length > 0 && (
        <div className="px-3 pb-2 space-y-2">
          {theme.quotes.map((q, i) => (
            <blockquote
              key={i}
              className="flex items-start gap-2 rounded-lg px-2.5 py-2"
              style={{ background: '#0d0d0f', border: '1px solid #1e1e22' }}
            >
              <Quote size={10} className="flex-shrink-0 mt-0.5" style={{ color: '#3f3f46' }} />
              <p className="text-[11px] italic leading-relaxed" style={{ color: '#71717a' }}>
                &ldquo;{q}&rdquo;
              </p>
            </blockquote>
          ))}
        </div>
      )}

      {/* Suggested features + link */}
      <div className="px-3 pb-3 flex items-center flex-wrap gap-2">
        {theme.suggestedFeatures.slice(0, 2).map((sf, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: '#1e1e22', color: '#52525b' }}
          >
            {sf}
          </span>
        ))}
        <div className="ml-auto">
          <LinkFeatureDropdown
            themeId={theme.id}
            linkedIds={linkedFeatureIds}
            onLink={(fid) => onLink(theme.id, fid)}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Export helpers ──────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function exportAsMarkdown(research: ParsedResearch, notes: string): void {
  const lines: string[] = [
    '# User Research Insights',
    '',
    `> **Summary:** ${research.researchSummary}`,
    `> **Participants:** ${research.participantCount}`,
    '',
  ]
  research.themes.forEach((t, i) => {
    lines.push(`## Theme ${i + 1}: ${t.title}`)
    lines.push('')
    lines.push(`**Severity:** ${t.severity} · **Frequency:** ${t.frequency}/${t.total} (${Math.round((t.frequency / (t.total || 1)) * 100)}%)`)
    lines.push('')
    lines.push(t.summary)
    lines.push('')
    if (t.quotes.length) {
      lines.push('### Supporting Quotes')
      t.quotes.forEach(q => lines.push(`> "${q}"`))
      lines.push('')
    }
    if (t.opportunity) {
      lines.push(`**Opportunity:** ${t.opportunity}`)
      lines.push('')
    }
    if (t.suggestedFeatures.length) {
      lines.push(`**Suggested features:** ${t.suggestedFeatures.join(', ')}`)
      lines.push('')
    }
    lines.push('---')
    lines.push('')
  })

  const md = lines.join('\n')
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'research-insights.md'
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Main ResearchPanel ──────────────────────────────────────────── */
export default function ResearchPanel() {
  const { insights, addInsight, updateInsight } = useWorkspaceStore()

  const [notes, setNotes]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [parsed, setParsed]     = useState<ParsedResearch | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /* ── Analyze with AI ─────────────────────────────────────────── */
  const handleAnalyze = useCallback(async () => {
    if (!notes.trim()) return
    setStatus('loading')
    setErrorMsg('')
    abortRef.current = new AbortController()

    const prompt = `Analyze these user research notes and extract structured insights.

Return ONLY valid JSON (no markdown, no text outside the JSON object):
{
  "researchSummary": "<1-2 sentence overview of what was studied>",
  "participantCount": <number>,
  "themes": [
    {
      "id": "theme-<n>",
      "title": "<short theme name>",
      "summary": "<2-3 sentence synthesis>",
      "quotes": ["<exact quote 1>", "<exact quote 2>", "<exact quote 3>"],
      "frequency": <number of participants who mentioned this>,
      "total": <total participant count>,
      "severity": "Critical" | "High" | "Medium" | "Low",
      "opportunity": "<one sentence product opportunity>",
      "suggestedFeatures": ["<feature idea 1>", "<feature idea 2>"]
    }
  ]
}

User research notes to analyze:
${notes}`

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          workflow: 'research',
          userMessage: prompt,
          conversationHistory: [],
        }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value, { stream: true })
      }

      const jsonMatch = full.match(/```(?:json)?\s*([\s\S]*?)```/) || full.match(/(\{[\s\S]*\})/)
      if (!jsonMatch) throw new Error('Could not parse AI response as JSON')
      const data: ParsedResearch = JSON.parse(jsonMatch[1])
      if (!data.themes?.length) throw new Error('No themes found in response')

      // Save to Zustand insights store
      data.themes.forEach(t => {
        addInsight({
          theme: t.title,
          summary: t.summary,
          quotes: t.quotes,
          frequency: t.frequency,
          linkedFeatures: [],
        })
      })

      setParsed(data)
      setStatus('done')
      toast.success(`Research analysed — ${data.themes.length} themes found`)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setErrorMsg(err.message)
        setStatus('error')
      }
    }
  }, [notes, addInsight])

  const handleLinkFeature = useCallback((themeId: string, featureId: string) => {
    const insight = insights.find(i => i.theme === parsed?.themes.find(t => t.id === themeId)?.title)
    if (insight) {
      const already = insight.linkedFeatures.includes(featureId)
      updateInsight(insight.id, {
        linkedFeatures: already
          ? insight.linkedFeatures.filter(id => id !== featureId)
          : [...insight.linkedFeatures, featureId],
      })
    }
  }, [insights, parsed, updateInsight])

  const handleDeleteTheme = useCallback((themeId: string) => {
    if (!parsed) return
    setParsed({ ...parsed, themes: parsed.themes.filter(t => t.id !== themeId) })
  }, [parsed])

  const handleClear = () => {
    setNotes('')
    setParsed(null)
    setStatus('idle')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: '#1a1a1a' }}
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={13} style={{ color: '#818cf8' }} />
          <span className="text-xs font-semibold" style={{ color: '#e4e4e7' }}>Research Insights</span>
          {parsed && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
            >
              {parsed.themes.length} themes
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {parsed && (
            <button
              onClick={() => exportAsMarkdown(parsed, notes)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors"
              style={{ background: '#18181b', color: '#52525b', border: '1px solid #27272a' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b' }}
              title="Export as Markdown"
            >
              <Download size={11} />
              Export
            </button>
          )}
          {(parsed || notes) && (
            <button
              onClick={handleClear}
              className="p-1 rounded transition-colors"
              style={{ color: '#3f3f46' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46' }}
              title="Clear all"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Paste zone — hidden after analysis */}
      {!parsed && (
        <div className="flex-shrink-0 p-3">
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#52525b' }}>
            Paste interview notes, survey responses, or feedback
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Paste raw user research here…

Example:
User 1: "I couldn't find where to create a new project..."
User 2: "The onboarding was confusing, I almost gave up..."
User 3: "Navigation feels unintuitive on mobile..."`}
            rows={9}
            className="w-full resize-none rounded-xl outline-none text-xs leading-relaxed p-3"
            style={{
              background: '#111113',
              border: '1px solid #1e1e22',
              color: '#d4d4d8',
              caretColor: '#818cf8',
              fontFamily: 'var(--font-geist-mono, monospace)',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'rgba(99,102,241,0.4)' }}
            onBlur={(e)  => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#1e1e22' }}
          />

          {status === 'error' && (
            <div className="mt-2 flex items-start gap-2 px-2.5 py-2 rounded-lg text-[11px]"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!notes.trim() || status === 'loading'}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: '#6366f1', color: '#fff' }}
            onMouseEnter={(e) => { if (notes.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#4f46e5' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f1' }}
          >
            {status === 'loading' ? (
              <><Loader2 size={14} className="animate-spin" /> Analyzing research…</>
            ) : (
              <><Wand2 size={14} /> Analyze with AI</>
            )}
          </button>
        </div>
      )}

      {/* Research summary banner */}
      {parsed && (
        <div
          className="flex-shrink-0 mx-3 mt-2 mb-1 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={11} style={{ color: '#818cf8' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#818cf8' }}>
              {parsed.participantCount} participants · {parsed.themes.length} themes
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: '#71717a' }}>
            {parsed.researchSummary}
          </p>
          <button
            onClick={() => { setParsed(null); setStatus('idle') }}
            className="mt-2 text-[10px] transition-colors"
            style={{ color: '#3f3f46' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#818cf8' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46' }}
          >
            ← Analyze different notes
          </button>
        </div>
      )}

      {/* Themes list */}
      {parsed && (
        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2">
          {parsed.themes.map((theme) => {
            const storeInsight = insights.find(i => i.theme === theme.title)
            return (
              <ThemeCard
                key={theme.id}
                theme={theme}
                linkedFeatureIds={storeInsight?.linkedFeatures ?? []}
                onLink={handleLinkFeature}
                onDelete={handleDeleteTheme}
              />
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!parsed && status === 'idle' && !notes && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3 pb-8">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{ width: 44, height: 44, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <FlaskConical size={20} style={{ color: '#818cf8' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#e4e4e7' }}>Research Synthesizer</p>
          <p className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
            Paste raw interview notes, survey responses, or customer feedback above.
            AI will surface themes, frequency, quotes, and product opportunities.
          </p>
        </div>
      )}
    </div>
  )
}
