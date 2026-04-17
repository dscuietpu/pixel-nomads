'use client'

import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send, Copy, Check, Trash2, FileText, BookOpen,
  Map, BarChart3, FlaskConical, TrendingUp, Wand2,
  ToggleLeft, ToggleRight, ChevronRight, Code2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import type { AIWorkflow, AIMessage, DocumentType } from '@/lib/types'

/* ── Workflow tab definitions ───────────────────────────────────── */
const WORKFLOWS: {
  id: AIWorkflow
  label: string
  emoji: string
  icon: React.ReactNode
}[] = [
  { id: 'prd',            label: 'PRD',       emoji: '✍️', icon: <FileText size={12} /> },
  { id: 'stories',        label: 'Stories',   emoji: '📋', icon: <BookOpen size={12} /> },
  { id: 'roadmap',        label: 'Roadmap',   emoji: '🗺', icon: <Map size={12} /> },
  { id: 'prioritization', label: 'Prioritize',emoji: '⚖️', icon: <BarChart3 size={12} /> },
  { id: 'research',       label: 'Research',  emoji: '🔍', icon: <FlaskConical size={12} /> },
  { id: 'data',           label: 'Data',      emoji: '📊', icon: <TrendingUp size={12} /> },
]

/* ── Starter prompts per workflow ───────────────────────────────── */
const STARTERS: Record<AIWorkflow, { label: string; prompt: string }[]> = {
  prd: [
    { label: 'Draft a PRD',         prompt: 'Draft a PRD for [describe your feature or idea here]' },
    { label: 'Review for gaps',     prompt: 'Review my PRD and identify any missing sections, unclear requirements, or logical gaps.' },
    { label: 'Rewrite problem statement', prompt: 'Rewrite the problem statement in my PRD to be clearer and more compelling.' },
    { label: 'Add success metrics', prompt: 'Suggest 5 measurable success metrics for this feature based on common product KPIs.' },
  ],
  stories: [
    { label: 'Generate from PRD',   prompt: 'Generate user stories from my PRD document. Include acceptance criteria for each.' },
    { label: 'Add edge cases',      prompt: 'What edge cases am I missing in these user stories? Add Gherkin scenarios for each.' },
    { label: 'Write acceptance criteria', prompt: 'Write Gherkin-format acceptance criteria for: [describe your feature]' },
    { label: 'Break into smaller stories', prompt: 'Break this epic into smaller, independently deliverable user stories.' },
  ],
  roadmap: [
    { label: 'Sequence features',   prompt: 'Help me sequence these features into a 3-quarter roadmap: [list your features]' },
    { label: 'Plan Q2 roadmap',     prompt: 'Draft a Q2 roadmap plan based on my current feature backlog.' },
    { label: 'Identify dependencies', prompt: 'What dependencies or blockers should I be aware of for these features?' },
    { label: 'Now / Next / Later',  prompt: 'Organise these initiatives into Now / Next / Later buckets with rationale: [list initiatives]' },
  ],
  prioritization: [
    { label: 'RICE scoring',        prompt: 'Score these features using RICE and rank them: [list your features]' },
    { label: 'Apply MoSCoW',        prompt: 'Apply MoSCoW prioritisation to my backlog and explain the reasoning.' },
    { label: 'What to build first', prompt: 'Given our goals and constraints, which feature should we build first and why?' },
    { label: 'Compare trade-offs',  prompt: 'Compare the trade-offs between building [Feature A] vs [Feature B] now.' },
  ],
  research: [
    { label: 'Synthesize interviews', prompt: 'Synthesize these user interview notes into themes and insights:\n\n[paste your notes here]' },
    { label: 'Find patterns',       prompt: 'Identify patterns and recurring themes in this customer feedback:\n\n[paste feedback here]' },
    { label: 'Surface key themes',  prompt: 'What are the top 5 themes from this research data? Include supporting quotes.' },
    { label: 'Product opportunities', prompt: 'Based on this research, what product opportunities should we prioritise?' },
  ],
  data: [
    { label: 'Analyse funnel',      prompt: 'Analyse this funnel data and identify the biggest drop-off points:\n\n[paste data here]' },
    { label: 'Spot anomalies',      prompt: 'Are there any anomalies or unexpected patterns in these metrics?\n\n[paste metrics here]' },
    { label: 'Suggest A/B tests',   prompt: 'Based on this data, what A/B tests should I run to improve conversion?' },
    { label: 'Root cause analysis', prompt: 'What might be causing this drop-off in [metric]? Walk me through possible root causes.' },
  ],
  general: [
    { label: 'Ask anything',        prompt: 'How do I [describe your PM challenge]?' },
  ],
}

/* ── Markdown renderer ──────────────────────────────────────────── */
const MarkdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2.5 last:mb-0 leading-relaxed" style={{ color: '#d4d4d8', fontSize: '0.875rem' }}>
      {children}
    </p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold mt-4 mb-2" style={{ color: '#f4f4f5' }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold mt-3.5 mb-1.5" style={{ color: '#f4f4f5' }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: '#e4e4e7' }}>{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="pl-4 mb-2.5 space-y-0.5" style={{ listStyleType: 'disc', color: '#d4d4d8' }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="pl-4 mb-2.5 space-y-0.5" style={{ listStyleType: 'decimal', color: '#d4d4d8' }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed" style={{ fontSize: '0.875rem', color: '#d4d4d8' }}>{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: '#f4f4f5', fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em style={{ color: '#a1a1aa' }}>{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="pl-3 my-2.5 text-sm italic"
      style={{ borderLeft: '2px solid #6366f1', color: '#a1a1aa', background: 'rgba(99,102,241,0.06)', padding: '0.5rem 0.75rem', borderRadius: '0 6px 6px 0' }}
    >
      {children}
    </blockquote>
  ),
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code
        className="px-1.5 py-0.5 rounded text-xs"
        style={{ background: '#27272a', color: '#a78bfa', fontFamily: 'var(--font-geist-mono, monospace)', border: '1px solid #3f3f46' }}
      >
        {children}
      </code>
    ) : (
      <code style={{ display: 'block' }}>{children}</code>
    ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre
      className="rounded-lg p-3.5 my-2.5 overflow-x-auto text-xs"
      style={{ background: '#09090b', border: '1px solid #27272a', color: '#a1a1aa', fontFamily: 'var(--font-geist-mono, monospace)', lineHeight: 1.6 }}
    >
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3" style={{ borderColor: '#27272a' }} />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-3 rounded-lg" style={{ border: '1px solid #27272a' }}>
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead style={{ background: '#18181b' }}>{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr style={{ borderBottom: '1px solid #27272a' }}>{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]" style={{ color: '#71717a' }}>{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2" style={{ color: '#d4d4d8' }}>{children}</td>
  ),
}

/* ── Extract section headings from markdown ─────────────────────── */
function extractSections(md: string): string[] {
  return md
    .split('\n')
    .filter((l) => /^#{1,3} /.test(l))
    .map((l) => l.replace(/^#{1,3} /, '').trim())
    .slice(0, 8)
}

/* ── Markdown → Tiptap-compatible HTML ─────────────────────────── */
function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inUl = false
  let inOl = false
  let inPre = false
  let preLines: string[] = []

  const flushList = () => {
    if (inUl) { html.push('</ul>'); inUl = false }
    if (inOl) { html.push('</ol>'); inOl = false }
  }

  const inline = (t: string) =>
    t
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  for (const raw of lines) {
    const line = raw

    // fenced code block
    if (line.startsWith('```')) {
      if (!inPre) { flushList(); inPre = true; preLines = [] }
      else { html.push(`<pre><code>${preLines.join('\n')}</code></pre>`); inPre = false }
      continue
    }
    if (inPre) { preLines.push(line); continue }

    // headings
    if (/^### /.test(line)) { flushList(); html.push(`<h3>${inline(line.slice(4))}</h3>`); continue }
    if (/^## /.test(line))  { flushList(); html.push(`<h2>${inline(line.slice(3))}</h2>`); continue }
    if (/^# /.test(line))   { flushList(); html.push(`<h1>${inline(line.slice(2))}</h1>`); continue }

    // hr
    if (/^---+$/.test(line.trim())) { flushList(); html.push('<hr>'); continue }

    // blockquote
    if (/^> /.test(line)) { flushList(); html.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`); continue }

    // unordered list
    if (/^[-*] /.test(line)) {
      if (inOl) { html.push('</ol>'); inOl = false }
      if (!inUl) { html.push('<ul>'); inUl = true }
      html.push(`<li>${inline(line.slice(2))}</li>`)
      continue
    }

    // ordered list
    if (/^\d+\. /.test(line)) {
      if (inUl) { html.push('</ul>'); inUl = false }
      if (!inOl) { html.push('<ol>'); inOl = true }
      html.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`)
      continue
    }

    flushList()

    if (line.trim() === '') { html.push('<p></p>'); continue }
    html.push(`<p>${inline(line)}</p>`)
  }

  flushList()
  if (inPre) html.push(`<pre><code>${preLines.join('\n')}</code></pre>`)

  return html.join('')
}

/* ── Diff utilities ─────────────────────────────────────────────── */
type AppliedDoc = { title: string; before: string; after: string }
type DiffLine   = { type: 'unchanged' | 'added' | 'removed'; text: string }

function htmlToLines(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
}

function mdToLines(md: string): string[] {
  return md.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
}

function computeDiff(beforeHtml: string, afterMd: string): DiffLine[] {
  const before = htmlToLines(beforeHtml)
  const after  = mdToLines(afterMd)

  if (!beforeHtml || before.length === 0) {
    return after.map((text) => ({ type: 'added' as const, text }))
  }
  if (before.length > 400 || after.length > 400) {
    return [
      ...before.map((text) => ({ type: 'removed' as const, text })),
      ...after.map((text) => ({ type: 'added' as const, text })),
    ]
  }

  const m = before.length, n = after.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = before[i - 1] === after[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

  const result: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && before[i - 1] === after[j - 1]) {
      result.unshift({ type: 'unchanged', text: before[i - 1] }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: after[j - 1] }); j--
    } else {
      result.unshift({ type: 'removed', text: before[i - 1] }); i--
    }
  }
  return result
}

/* ── Copy button with checkmark feedback ────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
      style={{ color: copied ? '#22c55e' : '#52525b' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = copied ? '#22c55e' : '#a1a1aa' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = copied ? '#22c55e' : '#52525b' }}
      title="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

/* ── Diff view ───────────────────────────────────────────────────── */
function DiffView({ before, after }: { before: string; after: string }) {
  const diff    = useMemo(() => computeDiff(before, after), [before, after])
  const added   = diff.filter((d) => d.type === 'added').length
  const removed = diff.filter((d) => d.type === 'removed').length

  if (added === 0 && removed === 0) {
    return (
      <div className="px-3.5 py-3 text-xs text-center" style={{ color: '#52525b', background: '#111113' }}>
        No changes detected
      </div>
    )
  }

  return (
    <div style={{ maxHeight: 260, overflowY: 'auto', background: '#0d0d0f' }}>
      <div className="flex items-center gap-3 px-3.5 py-1.5 border-b" style={{ borderColor: '#1e1e22' }}>
        <span className="text-[10px] font-mono font-medium" style={{ color: '#22c55e' }}>+{added}</span>
        <span className="text-[10px] font-mono font-medium" style={{ color: '#ef4444' }}>−{removed}</span>
        <span className="text-[10px]" style={{ color: '#3f3f46' }}>lines changed</span>
      </div>
      <div>
        {diff.map((line, idx) => {
          if (line.type === 'unchanged') return null
          return (
            <div
              key={idx}
              className="flex items-start gap-2 px-3 py-px"
              style={{
                background: line.type === 'added' ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                borderLeft: `2px solid ${line.type === 'added' ? '#166534' : '#7f1d1d'}`,
              }}
            >
              <span
                className="flex-shrink-0 text-[11px] font-bold select-none"
                style={{ color: line.type === 'added' ? '#22c55e' : '#ef4444', width: 10, textAlign: 'center' }}
              >
                {line.type === 'added' ? '+' : '−'}
              </span>
              <span
                className="text-[11px] break-all leading-relaxed"
                style={{ color: line.type === 'added' ? '#86efac' : '#fca5a5', fontFamily: 'var(--font-geist-mono, monospace)' }}
              >
                {line.text}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Message bubble ──────────────────────────────────────────────── */
function MessageBubble({
  msg, isStreaming, appliedDoc, writingToDoc,
}: {
  msg: AIMessage & { streaming?: boolean }
  isStreaming?: boolean
  appliedDoc?: AppliedDoc
  writingToDoc?: string
}) {
  const [showDiff, setShowDiff] = useState(false)
  const appliedDocTitle = appliedDoc?.title
  const isUser = msg.role === 'user'
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[88%]">
          <div
            className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{ background: '#6366f1', color: '#fff' }}
          >
            {msg.content}
          </div>
          <p className="text-right mt-1 text-[10px]" style={{ color: '#3f3f46' }}>{timeStr}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 mb-5 group">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full mt-0.5"
        style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        <Wand2 size={11} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>AI</span>
          <span className="text-[10px]" style={{ color: '#3f3f46' }}>{timeStr}</span>
          <div className="ml-auto">
            <CopyButton text={msg.content} />
          </div>
        </div>

        {/* While streaming: show writing indicator */}
        {isStreaming && writingToDoc ? (
          <div
            className="rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-2.5"
            style={{ background: '#18181b', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <span className="animate-spin inline-block flex-shrink-0">
              <Wand2 size={13} style={{ color: '#6366f1' }} />
            </span>
            <div>
              <p className="text-xs font-medium" style={{ color: '#a5b4fc' }}>Writing to editor…</p>
              <p className="text-[11px] mt-0.5 truncate max-w-[200px]" style={{ color: '#52525b' }}>{writingToDoc}</p>
            </div>
          </div>
        ) : appliedDocTitle ? (
          /* After apply: show compact action card */
          <div
            className="rounded-2xl rounded-tl-sm overflow-hidden"
            style={{ border: '1px solid #27272a' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3.5 py-2.5"
              style={{ background: '#18181b', borderBottom: '1px solid #27272a' }}
            >
              <Check size={13} style={{ color: '#22c55e' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Applied to editor</p>
                <p className="text-[11px] truncate" style={{ color: '#52525b' }}>{appliedDocTitle}</p>
              </div>
              <button
                onClick={() => setShowDiff((v) => !v)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors flex-shrink-0"
                style={{
                  background: showDiff ? 'rgba(99,102,241,0.15)' : '#27272a',
                  color: showDiff ? '#a5b4fc' : '#52525b',
                  border: `1px solid ${showDiff ? 'rgba(99,102,241,0.4)' : '#3f3f46'}`,
                }}
                title="Toggle diff view"
              >
                <Code2 size={10} />
                <span>Diff</span>
              </button>
            </div>
            {/* Sections list OR diff view */}
            {!showDiff && extractSections(msg.content).length > 0 && (
              <div className="px-3.5 py-2" style={{ background: '#111113' }}>
                {extractSections(msg.content).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3f3f46', display: 'inline-block', flexShrink: 0 }} />
                    <span className="text-[11px] truncate" style={{ color: '#71717a' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {showDiff && appliedDoc && (
              <DiffView before={appliedDoc.before} after={appliedDoc.after} />
            )}
          </div>
        ) : (
          /* No active doc: show response normally in chat */
          <div
            className="rounded-2xl rounded-tl-sm px-3.5 py-3"
            style={{ background: '#18181b', border: '1px solid #27272a' }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents as Record<string, React.ComponentType<unknown>>}
            >
              {msg.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 ml-0.5 rounded-full align-middle" style={{ background: '#818cf8', animation: 'blink 0.9s step-end infinite' }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Empty state with starter prompts ───────────────────────────── */
function EmptyState({
  workflow,
  onPrompt,
}: {
  workflow: AIWorkflow
  onPrompt: (prompt: string) => void
}) {
  const wf = WORKFLOWS.find((w) => w.id === workflow)
  const starters = STARTERS[workflow] ?? []

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-5">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 44, height: 44, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <span className="text-xl">{wf?.emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: '#e4e4e7' }}>
          {wf?.label} Assistant
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
          Your AI co-pilot for {wf?.label.toLowerCase()} work.
          <br />Try a starter below or type your own question.
        </p>
      </div>

      <div className="w-full space-y-2">
        {starters.map((s) => (
          <button
            key={s.label}
            onClick={() => onPrompt(s.prompt)}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all group"
            style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#1e1e21'
              el.style.borderColor = '#3f3f46'
              el.style.color = '#e4e4e7'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#18181b'
              el.style.borderColor = '#27272a'
              el.style.color = '#a1a1aa'
            }}
          >
            <ChevronRight size={12} className="flex-shrink-0 text-indigo-500" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Workflow → document type mapping ───────────────────────────── */
const WORKFLOW_DOC_TYPE: Partial<Record<AIWorkflow, DocumentType>> = {
  prd:      'prd',
  stories:  'user-story',
  roadmap:  'roadmap',
  research: 'research',
}

/* ── Main AIChatPanel ────────────────────────────────────────────── */
export default function AIChatPanel() {
  const {
    messages, addMessage,
    documents, activeDocId, applyAIContent,
    addDocument, setActiveDoc,
    pendingAICommand, clearPendingAICommand,
  } = useWorkspaceStore()

  const [workflow, setWorkflow] = useState<AIWorkflow>('prd')
  const [input, setInput] = useState('')
  const [useDocContext, setUseDocContext] = useState(true)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingTargetTitle, setStreamingTargetTitle] = useState<string | null>(null)
  // messageId → applied doc info (title + before/after for diff)
  const [appliedDocs, setAppliedDocs] = useState<Record<string, AppliedDoc>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const abortRef       = useRef<AbortController | null>(null)

  // Filter messages for current workflow
  const workflowMessages = useMemo(
    () => messages.filter((m) => m.workflow === workflow),
    [messages, workflow]
  )

  // Consume pending AI command from CMD+K palette
  useEffect(() => {
    if (!pendingAICommand) return
    setWorkflow(pendingAICommand.workflow)
    setInput(pendingAICommand.prompt)
    clearPendingAICommand()
    setTimeout(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }, 50)
  }, [pendingAICommand, clearPendingAICommand])

  // Scroll to bottom when messages change or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [workflowMessages.length, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [input])

  const handleSend = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim()
    if (!text || isStreaming) return

    // ── Resolve which document to write to ──────────────────────────
    // Map workflow to its matching doc type. For analytical workflows
    // (data, prioritization, general) we don't auto-apply to a doc.
    const targetDocType = WORKFLOW_DOC_TYPE[workflow] as DocumentType | undefined

    let targetDocId: string | null = null
    let targetDocTitle: string | null = null

    if (targetDocType) {
      const activeDoc = documents.find((d) => d.id === activeDocId)

      if (activeDoc?.type === targetDocType) {
        // Active doc already matches the workflow type — update it in place
        targetDocId = activeDoc.id
        targetDocTitle = activeDoc.title
      } else {
        // Active doc is a different type (e.g. user was on a Stories doc and
        // switched to the PRD tab). Always create a fresh document so we never
        // silently overwrite an unrelated existing document.
        const defaultTitles: Record<string, string> = {
          prd: 'Untitled PRD',
          'user-story': 'Untitled User Story',
          roadmap: 'Untitled Roadmap',
          research: 'Untitled Research',
        }
        const title = defaultTitles[targetDocType] ?? 'Untitled Document'
        targetDocId = addDocument({ title, content: '', type: targetDocType, tags: [] })
        targetDocTitle = title
        setActiveDoc(targetDocId)
      }
    }

    // ── Build request ────────────────────────────────────────────────
    const history = workflowMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // For editor-writing workflows include the existing doc content directly
    // in the message so the AI knows to preserve & update it.
    // For analytical workflows (no targetDocId) use the active doc as reference context.
    const targetDoc = targetDocId ? documents.find((d) => d.id === targetDocId) : null
    const existingText = targetDoc?.content
      ? targetDoc.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : ''
    const hasExistingContent = existingText.length > 30

    const contextDoc = documents.find((d) => d.id === activeDocId)
    const docContext = !targetDocId && useDocContext && contextDoc
      ? `Document title: ${contextDoc.title}\n\n${contextDoc.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`
      : undefined

    const finalMessage = targetDocId
      ? hasExistingContent
        ? `${text}\n\n[DOCUMENT EDITING RULES: The document already has content shown below. You MUST return the COMPLETE updated document in clean markdown — preserve every existing section and only apply the requested changes or additions. Do NOT remove or replace any content that was not mentioned in the request. Start directly with the first heading, no preamble or explanation.]\n\nEXISTING DOCUMENT:\n${existingText}`
        : `${text}\n\n[OUTPUT RULES: Return ONLY clean markdown document content. Start directly with the first heading (e.g. # Title), no preamble or explanation.]`
      : text

    addMessage({ role: 'user', content: text, workflow })
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingTargetTitle(targetDocTitle)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          workflow,
          userMessage: finalMessage,
          documentContext: docContext,
          conversationHistory: history,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setStreamingContent(full)
      }

      const msgId = addMessage({ role: 'assistant', content: full, workflow })

      if (targetDocId && targetDocTitle) {
        applyAIContent(targetDocId, markdownToHtml(full))
        setAppliedDocs((prev) => ({
          ...prev,
          [msgId]: { title: targetDocTitle!, before: targetDoc?.content ?? '', after: full },
        }))
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addMessage({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          workflow,
        })
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent(null)
      setStreamingTargetTitle(null)
    }
  }, [input, isStreaming, workflowMessages, useDocContext, documents, activeDocId, workflow, addMessage, addDocument, setActiveDoc, applyAIContent])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const { clearMessages } = useWorkspaceStore()

  const handleClear = () => {
    if (isStreaming) {
      abortRef.current?.abort()
      setIsStreaming(false)
      setStreamingContent(null)
    }
    clearMessages(workflow)
  }

  const showEmpty = workflowMessages.length === 0 && !isStreaming

  // Build the "live" streaming message for display
  const streamingMsg: (AIMessage & { streaming: boolean }) | null = streamingContent !== null
    ? {
        id: '__streaming__',
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date().toISOString(),
        workflow,
        streaming: true,
      }
    : null

  return (
    <div className="flex flex-col h-full" style={{ background: '#111113' }}>

      {/* ── Workflow tabs ───────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-b overflow-x-auto scrollbar-hide"
        style={{ borderColor: '#1e1e22', background: '#0d0d0f' }}
      >
        <div className="flex min-w-max">
          {WORKFLOWS.map((wf) => {
            const active = workflow === wf.id
            return (
              <button
                key={wf.id}
                onClick={() => setWorkflow(wf.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap flex-shrink-0"
                style={{ color: active ? '#a5b4fc' : '#52525b' }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#71717a' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#52525b' }}
              >
                <span>{wf.emoji}</span>
                <span>{wf.label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: '#6366f1', borderRadius: '2px 2px 0 0' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showEmpty ? (
          <EmptyState workflow={workflow} onPrompt={(p) => { setInput(p); textareaRef.current?.focus() }} />
        ) : (
          <>
            {workflowMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                appliedDoc={appliedDocs[msg.id]}
              />
            ))}
            {streamingMsg && (
              <MessageBubble
                msg={streamingMsg}
                isStreaming
                writingToDoc={streamingTargetTitle ?? undefined}
              />
            )}
            {isStreaming && !streamingContent && (
              <div className="flex gap-2.5 mb-4">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Wand2 size={11} className="text-white" />
                </div>
                <div
                  className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm"
                  style={{ background: '#18181b', border: '1px solid #27272a' }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 6, height: 6, background: '#6366f1',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Bottom controls ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t px-3 pt-2.5 pb-3 space-y-2.5"
        style={{ borderColor: '#1e1e22', background: '#0d0d0f' }}
      >
        {/* Doc context toggle + Clear */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setUseDocContext((v) => !v)}
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: useDocContext ? '#818cf8' : '#3f3f46' }}
          >
            {useDocContext
              ? <ToggleRight size={16} style={{ color: '#6366f1' }} />
              : <ToggleLeft size={16} />
            }
            <span>Use document context</span>
            {useDocContext && activeDocId && (() => {
              const d = documents.find(x => x.id === activeDocId)
              return d ? (
                <span
                  className="truncate max-w-[100px] text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
                  title={d.title}
                >
                  {d.title}
                </span>
              ) : null
            })()}
          </button>

          {workflowMessages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors"
              style={{ color: '#3f3f46' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46' }}
              title="Clear conversation"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Input area */}
        <div
          className="flex flex-col gap-2 rounded-xl p-2.5"
          style={{ background: '#18181b', border: `1px solid ${isStreaming ? 'rgba(99,102,241,0.4)' : '#2e2e32'}` }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask the ${WORKFLOWS.find((w) => w.id === workflow)?.label} AI…`}
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed disabled:opacity-50"
            style={{
              color: '#e4e4e7',
              caretColor: '#818cf8',
              minHeight: 36,
              maxHeight: 140,
            }}
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>
              <kbd
                className="px-1 py-0.5 rounded text-[9px]"
                style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#52525b' }}
              >
                ⌘↵
              </kbd>
              {' '}to send
            </span>

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isStreaming ? '#6366f1' : '#27272a',
                color: input.trim() && !isStreaming ? '#fff' : '#52525b',
              }}
            >
              {isStreaming ? (
                <>
                  <span className="animate-spin inline-block"><Wand2 size={12} /></span>
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
