'use client'

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from 'react'
import { useEditor, EditorContent, Extension } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  Bold, Italic, UnderlineIcon, Heading1, Heading2,
  List, ListOrdered, Quote, Code, Minus,
  Wand2, Minimize2, Briefcase, ListChecks,
  FileText, BookOpen, BarChart3, LayoutGrid, FlaskConical,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'

/* ── Types ─────────────────────────────────────────────────────── */
interface BubblePos { top: number; left: number; fromViewport?: boolean }
interface SlashPos  { top: number; left: number }

/* ── Slash command definitions ──────────────────────────────────── */
const SLASH_COMMANDS = [
  {
    id: 'prd',
    label: 'PRD',
    description: 'Product Requirements Document',
    icon: FileText,
    content: `<h1>Product Requirements Document</h1>
<h2>Problem Statement</h2><p>What user pain or business problem does this solve?</p>
<h2>Goals &amp; Success Metrics</h2>
<ul><li>Goal 1 — <em>metric | baseline → target</em></li><li>Goal 2</li></ul>
<h2>User Stories</h2>
<ul><li>As a <strong>[persona]</strong>, I want to <strong>[action]</strong> so that <strong>[outcome]</strong>.</li></ul>
<h2>Scope</h2>
<h3>In Scope</h3><ul><li>Feature or behaviour included</li></ul>
<h3>Out of Scope</h3><ul><li>Explicitly excluded work</li></ul>
<h2>Functional Requirements</h2>
<ol><li>Specific, testable requirement</li><li>Another requirement</li></ol>
<h2>Timeline &amp; Milestones</h2>
<ul><li><strong>Discovery</strong> — Week 1–2</li><li><strong>Design</strong> — Week 3</li><li><strong>Build</strong> — Week 4–6</li><li><strong>Launch</strong> — Week 7</li></ul>
<h2>Open Questions</h2>
<ol><li>Unresolved decision or dependency</li><li>Another open question</li></ol>`,
  },
  {
    id: 'story',
    label: 'User Story',
    description: 'Story + Gherkin acceptance criteria',
    icon: BookOpen,
    content: `<h2>User Story</h2>
<p><strong>As a</strong> [specific persona]<br><strong>I want to</strong> [specific action or capability]<br><strong>So that</strong> [concrete benefit or outcome]</p>
<h2>Acceptance Criteria</h2>
<pre><code>Scenario: [descriptive scenario name]
  Given [initial context or precondition]
  When [action taken]
  Then [expected outcome]
  And [additional outcome]</code></pre>
<h2>Story Points</h2><p>Estimate: <strong>[1 / 2 / 3 / 5 / 8]</strong> — [brief justification]</p>
<h2>Dependencies</h2><ul><li>None</li></ul>
<h2>Definition of Done</h2>
<ul><li>Code reviewed and merged</li><li>Acceptance criteria passing</li><li>Unit tests written</li></ul>`,
  },
  {
    id: 'rice',
    label: 'RICE Scoring',
    description: 'RICE prioritisation table',
    icon: BarChart3,
    content: `<h2>RICE Scoring</h2>
<p>Formula: <code>(Reach × Impact × Confidence%) ÷ Effort</code></p>
<table>
  <thead><tr><th>Feature</th><th>Reach</th><th>Impact</th><th>Confidence</th><th>Effort</th><th>RICE Score</th></tr></thead>
  <tbody>
    <tr><td>Feature A</td><td>5000</td><td>2</td><td>80%</td><td>3</td><td>2,667</td></tr>
    <tr><td>Feature B</td><td>2000</td><td>3</td><td>70%</td><td>2</td><td>2,100</td></tr>
    <tr><td>Feature C</td><td>8000</td><td>1</td><td>90%</td><td>1</td><td>7,200</td></tr>
  </tbody>
</table>
<p><em>Reach: users per quarter · Impact: 0.25 / 0.5 / 1 / 2 / 3 · Confidence: % · Effort: person-weeks</em></p>`,
  },
  {
    id: 'moscow',
    label: 'MoSCoW',
    description: 'MoSCoW prioritisation matrix',
    icon: LayoutGrid,
    content: `<h2>MoSCoW Prioritisation</h2>
<h3>✅ Must Have</h3>
<ul><li>[Feature] — critical, non-negotiable for launch</li></ul>
<h3>🟡 Should Have</h3>
<ul><li>[Feature] — high value, include if possible</li></ul>
<h3>🔵 Could Have</h3>
<ul><li>[Feature] — nice to have, defer if under pressure</li></ul>
<h3>⛔ Won't Have (now)</h3>
<ul><li>[Feature] — explicitly out of scope for this cycle</li></ul>`,
  },
  {
    id: 'insight',
    label: 'Research Insight',
    description: 'User research insight block',
    icon: FlaskConical,
    content: `<h2>Research Insight</h2>
<p><strong>Theme:</strong> [theme name]</p>
<p><strong>Frequency:</strong> [X out of Y participants]</p>
<p><strong>Summary:</strong> 2–3 sentence synthesis of what users said or did.</p>
<blockquote><p>"[Direct quote from a participant.]"</p></blockquote>
<blockquote><p>"[Another supporting quote.]"</p></blockquote>
<p><strong>Severity:</strong> Critical / High / Medium / Low</p>
<p><strong>Opportunity:</strong> One sentence on the product opportunity this suggests.</p>`,
  },
] as const

type SlashCommandId = typeof SLASH_COMMANDS[number]['id']

/* ── Slash command Tiptap extension ─────────────────────────────── */
const SlashPluginKey = new PluginKey('slash-command')

function createSlashExtension(
  onOpen: (pos: SlashPos, query: string) => void,
  onClose: () => void,
) {
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: SlashPluginKey,
          props: {
            handleKeyDown(view, event) {
              if (event.key === 'Escape') { onClose(); return false }
              return false
            },
          },
        }),
      ]
    },
  })
}

/* ── Formatting toolbar buttons ─────────────────────────────────── */
interface FmtBtn {
  label: string
  icon: React.ReactNode
  action: (editor: ReturnType<typeof useEditor>) => void
  isActive: (editor: ReturnType<typeof useEditor>) => boolean
}

const FMT_BUTTONS: FmtBtn[] = [
  {
    label: 'Bold', icon: <Bold size={13} />,
    action: (e) => e!.chain().focus().toggleBold().run(),
    isActive: (e) => e?.isActive('bold') ?? false,
  },
  {
    label: 'Italic', icon: <Italic size={13} />,
    action: (e) => e!.chain().focus().toggleItalic().run(),
    isActive: (e) => e?.isActive('italic') ?? false,
  },
  {
    label: 'Underline', icon: <UnderlineIcon size={13} />,
    action: (e) => e!.chain().focus().toggleUnderline().run(),
    isActive: (e) => e?.isActive('underline') ?? false,
  },
  { label: '|', icon: null, action: () => {}, isActive: () => false }, // divider
  {
    label: 'H1', icon: <Heading1 size={13} />,
    action: (e) => e!.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e?.isActive('heading', { level: 1 }) ?? false,
  },
  {
    label: 'H2', icon: <Heading2 size={13} />,
    action: (e) => e!.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e?.isActive('heading', { level: 2 }) ?? false,
  },
  { label: '|', icon: null, action: () => {}, isActive: () => false },
  {
    label: 'Bullet list', icon: <List size={13} />,
    action: (e) => e!.chain().focus().toggleBulletList().run(),
    isActive: (e) => e?.isActive('bulletList') ?? false,
  },
  {
    label: 'Numbered list', icon: <ListOrdered size={13} />,
    action: (e) => e!.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e?.isActive('orderedList') ?? false,
  },
  {
    label: 'Quote', icon: <Quote size={13} />,
    action: (e) => e!.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e?.isActive('blockquote') ?? false,
  },
  {
    label: 'Code block', icon: <Code size={13} />,
    action: (e) => e!.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e?.isActive('codeBlock') ?? false,
  },
  {
    label: 'Divider', icon: <Minus size={13} />,
    action: (e) => e!.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
  },
]

/* ── Inline AI actions ──────────────────────────────────────────── */
const AI_ACTIONS = [
  { label: 'Improve',    icon: <Wand2 size={11} />,      value: 'improve' },
  { label: 'Shorten',    icon: <Minimize2 size={11} />,  value: 'shorten' },
  { label: 'Formal',     icon: <Briefcase size={11} />,  value: 'formal' },
  { label: 'Acceptance', icon: <ListChecks size={11} />, value: 'acceptance' },
]

/* ── Helpers ─────────────────────────────────────────────────────── */
function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
function readingMinutes(words: number) {
  return Math.max(1, Math.ceil(words / 200))
}

/* ── Main Editor component ──────────────────────────────────────── */
export default function Editor({ docId }: { docId: string }) {
  const { documents, updateDocument, setSaveStatus, aiContentVersion } = useWorkspaceStore()
  const doc = documents.find((d) => d.id === docId)

  const containerRef   = useRef<HTMLDivElement>(null)
  const scrollRef      = useRef<HTMLDivElement>(null)
  const saveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Toolbar state ────────────────────────────────────────────── */
  const [toolbar, setToolbar]         = useState<BubblePos | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [aiLoading, setAiLoading]     = useState<string | null>(null)

  /* ── Slash command state ──────────────────────────────────────── */
  const [slashOpen, setSlashOpen]     = useState(false)
  const [slashPos, setSlashPos]       = useState<SlashPos>({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery]   = useState('')
  const [slashIndex, setSlashIndex]   = useState(0)
  const slashStartRef = useRef<number | null>(null)   // editor pos where "/" was typed

  /* ── Word count ───────────────────────────────────────────────── */
  const [wordCount, setWordCount] = useState(0)

  /* ── Slash helpers ──────────────────────────────────────────────  */
  const openSlash = useCallback((pos: SlashPos, query: string) => {
    setSlashPos(pos)
    setSlashQuery(query)
    setSlashIndex(0)
    setSlashOpen(true)
  }, [])
  const closeSlash = useCallback(() => {
    setSlashOpen(false)
    setSlashQuery('')
    slashStartRef.current = null
  }, [])

  const filteredSlash = useMemo(() =>
    SLASH_COMMANDS.filter(
      (c) =>
        c.id.startsWith(slashQuery.toLowerCase()) ||
        c.label.toLowerCase().startsWith(slashQuery.toLowerCase())
    ),
    [slashQuery]
  )

  /* ── Editor setup ───────────────────────────────────────────────  */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'not-prose' } } }),
      Placeholder.configure({
        placeholder: 'Start writing your PRD, paste user research, or ask AI to draft something…',
      }),
      Typography,
      Highlight.configure({ multicolor: false }),
      Underline,
      Table.configure({ resizable: false, HTMLAttributes: { class: 'editor-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      createSlashExtension(openSlash, closeSlash),
    ],
    content: doc?.content ?? '',
    editorProps: { attributes: { class: 'editor-prose' } },

    onUpdate: ({ editor }) => {
      const text = editor.getText()
      setWordCount(countWords(text))

      // Auto-save debounce (2 s)
      setSaveStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateDocument(docId, { content: editor.getHTML() })
        setSaveStatus('saved')
        // Reset back to idle after 3 s
        setTimeout(() => setSaveStatus('idle'), 3000)
      }, 2000)

      // Slash command detection
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 30), from, '\n', '\0'
      )
      const slashMatch = textBefore.match(/(?:^|\n|[ \t])\/(\w*)$/)

      if (slashMatch) {
        const query = slashMatch[1] ?? ''
        const slashAbsPos = from - query.length - 1
        slashStartRef.current = slashAbsPos

        try {
          const coords = editor.view.coordsAtPos(from)
          const containerRect = containerRef.current?.getBoundingClientRect()
          if (containerRect) {
            openSlash(
              {
                top: coords.bottom - containerRect.top + 6,
                left: Math.max(0, coords.left - containerRect.left),
              },
              query
            )
          }
        } catch { /* pos out of bounds — ignore */ }
      } else {
        if (slashOpen) closeSlash()
      }
    },

    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, ' ')

      if (!text.trim() || from === to) {
        setToolbar(null)
        setSelectedText('')
        return
      }
      setSelectedText(text)

      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      setToolbar({
        top: rect.top - containerRect.top - 48,
        left: Math.max(0, rect.left - containerRect.left + rect.width / 2 - 220),
      })
    },

    immediatelyRender: false,
  })

  /* ── Slash keyboard navigation ──────────────────────────────────  */
  useEffect(() => {
    if (!slashOpen || !editor) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % filteredSlash.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + filteredSlash.length) % filteredSlash.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        insertSlashTemplate(filteredSlash[slashIndex]?.id)
      } else if (e.key === 'Escape') {
        closeSlash()
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [slashOpen, filteredSlash, slashIndex, editor]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Insert slash template ──────────────────────────────────────  */
  const insertSlashTemplate = useCallback((id: SlashCommandId | undefined) => {
    if (!editor || !id) return
    const cmd = SLASH_COMMANDS.find((c) => c.id === id)
    if (!cmd) return

    const { from } = editor.state.selection
    const start = slashStartRef.current ?? from - slashQuery.length - 1

    // Delete the "/" and any query text typed after it
    editor
      .chain()
      .focus()
      .deleteRange({ from: start, to: from })
      .insertContentAt(start, cmd.content)
      .run()

    closeSlash()
  }, [editor, slashQuery, closeSlash])

  /* ── Sync content when doc changes or AI applies content ────────  */
  useEffect(() => {
    if (!editor || !doc) return
    if (editor.getHTML() !== doc.content) {
      editor.commands.setContent(doc.content || '')
      setWordCount(countWords(editor.getText()))
    }
  }, [docId, aiContentVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Hide toolbar on outside click ─────────────────────────────  */
  useEffect(() => {
    const hide = () => setToolbar(null)
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [])

  /* ── Inline AI ──────────────────────────────────────────────────  */
  const handleAI = useCallback(async (action: string) => {
    if (!editor || !selectedText.trim()) return
    const { from, to } = editor.state.selection
    setToolbar(null)
    setAiLoading(action)

    const prompts: Record<string, string> = {
      improve:    `Improve the writing. Return ONLY the improved text:\n\n${selectedText}`,
      shorten:    `Make this shorter. Return ONLY the revised text:\n\n${selectedText}`,
      formal:     `Rewrite formally. Return ONLY the revised text:\n\n${selectedText}`,
      acceptance: `Generate Gherkin acceptance criteria. Return ONLY the scenarios:\n\n${selectedText}`,
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: action === 'acceptance' ? 'stories' : 'general',
          userMessage: prompts[action],
          conversationHistory: [],
        }),
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result.trim()).run()
    } catch (err) {
      console.error('AI error', err)
    } finally {
      setAiLoading(null)
    }
  }, [editor, selectedText])

  if (!editor) return null

  const readTime = readingMinutes(wordCount)

  return (
    <div ref={containerRef} className="relative flex-1 flex flex-col overflow-hidden">

      {/* ── Floating formatting toolbar ──────────────────────────── */}
      {toolbar && (
        <div
          className="absolute z-40 flex items-center rounded-xl border shadow-2xl px-1.5 py-1.5 gap-0.5"
          style={{
            top: toolbar.top,
            left: toolbar.left,
            background: '#18181b',
            borderColor: '#2e2e32',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: aiLoading ? 'none' : 'auto',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Formatting buttons */}
          {FMT_BUTTONS.map((btn, i) => {
            if (btn.label === '|') {
              return (
                <div key={`div-${i}`} className="w-px h-4 mx-1" style={{ background: '#2e2e32' }} />
              )
            }
            const active = btn.isActive(editor)
            return (
              <button
                key={btn.label}
                title={btn.label}
                onMouseDown={(e) => { e.preventDefault(); btn.action(editor) }}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                style={{
                  color: active ? '#818cf8' : '#a1a1aa',
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#27272a'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {btn.icon}
              </button>
            )
          })}

          {/* AI section divider */}
          <div className="w-px h-4 mx-1" style={{ background: '#2e2e32' }} />
          <span className="flex items-center gap-1 px-1.5 text-[10px] font-semibold" style={{ color: '#6366f1' }}>
            <Wand2 size={10} /> AI
          </span>

          {AI_ACTIONS.map((a) => (
            <button
              key={a.value}
              title={a.label}
              onClick={() => handleAI(a.value)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors"
              style={{ color: aiLoading === a.value ? '#6366f1' : '#a1a1aa' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#27272a' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {aiLoading === a.value
                ? <span className="animate-spin inline-block"><Wand2 size={11} /></span>
                : a.icon
              }
              <span className="hidden lg:inline">{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Slash command menu ───────────────────────────────────── */}
      {slashOpen && filteredSlash.length > 0 && (
        <div
          className="absolute z-50 rounded-xl border shadow-2xl overflow-hidden"
          style={{
            top: slashPos.top,
            left: slashPos.left,
            width: 280,
            background: '#18181b',
            borderColor: '#2e2e32',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: '#2e2e32' }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#52525b' }}>
              Insert template
            </span>
          </div>
          {filteredSlash.map((cmd, i) => {
            const Icon = cmd.icon
            const active = i === slashIndex
            return (
              <button
                key={cmd.id}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors"
                style={{
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
                }}
                onMouseEnter={() => setSlashIndex(i)}
                onClick={() => insertSlashTemplate(cmd.id)}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: active ? 'rgba(99,102,241,0.2)' : '#27272a',
                  }}
                >
                  <Icon size={15} style={{ color: active ? '#818cf8' : '#71717a' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: active ? '#e4e4e7' : '#a1a1aa' }}>
                    {cmd.label}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#52525b' }}>
                    {cmd.description}
                  </p>
                </div>
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                  style={{ background: '#27272a', color: '#52525b' }}
                >
                  /{cmd.id}
                </span>
              </button>
            )
          })}
          <div className="px-3 py-1.5 border-t flex items-center gap-3" style={{ borderColor: '#2e2e32' }}>
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>↑↓ navigate</span>
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>↵ insert</span>
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>Esc dismiss</span>
          </div>
        </div>
      )}

      {/* ── Editor scroll area ───────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Centered notion-like content area */}
        <div className="mx-auto px-8 py-12" style={{ maxWidth: 800 }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-8 py-2 border-t flex-shrink-0 select-none"
        style={{ borderColor: '#1a1a1a', background: '#0d0d0d' }}
      >
        <span className="text-[11px]" style={{ color: '#3f3f46' }}>
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <span className="text-[11px]" style={{ color: '#3f3f46' }}>·</span>
        <span className="text-[11px]" style={{ color: '#3f3f46' }}>
          {readTime} min read
        </span>
        {aiLoading && (
          <>
            <span className="text-[11px]" style={{ color: '#3f3f46' }}>·</span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#6366f1' }}>
              <span className="animate-spin inline-block"><Wand2 size={10} /></span>
              AI writing…
            </span>
          </>
        )}
        <span className="ml-auto text-[11px]" style={{ color: '#3f3f46' }}>
          Type <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: '#1e1e1e', color: '#52525b', border: '1px solid #2a2a2a' }}>/</kbd> for templates
        </span>
      </div>
    </div>
  )
}
