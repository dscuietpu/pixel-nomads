'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import { Wand2, Minimize2, Briefcase, ListChecks } from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'

interface BubblePos { top: number; left: number }

const INLINE_AI_ACTIONS = [
  { label: 'Improve',     icon: <Wand2 size={11} />,      value: 'improve' },
  { label: 'Shorten',     icon: <Minimize2 size={11} />,  value: 'shorten' },
  { label: 'Formal',      icon: <Briefcase size={11} />,  value: 'formal' },
  { label: 'Acceptance criteria', icon: <ListChecks size={11} />, value: 'acceptance' },
]

export default function TiptapEditor({ docId }: { docId: string }) {
  const { documents, updateDocument } = useWorkspaceStore()
  const doc = documents.find((d) => d.id === docId)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [bubble, setBubble] = useState<BubblePos | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'not-prose' } } }),
      Placeholder.configure({ placeholder: 'Start writing, or select text to get AI suggestions…' }),
      Typography,
      Highlight.configure({ multicolor: false }),
    ],
    content: doc?.content ?? '',
    editorProps: { attributes: { class: 'tiptap-editor' } },
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateDocument(docId, { content: editor.getHTML() })
      }, 600)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, ' ')
      if (!text.trim() || from === to) {
        setBubble(null)
        setSelectedText('')
        return
      }
      setSelectedText(text)

      // Position bubble above the selection
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      setBubble({
        top: rect.top - containerRect.top - 44,
        left: Math.max(0, rect.left - containerRect.left + rect.width / 2 - 160),
      })
    },
    immediatelyRender: false,
  })

  // Sync content when active doc changes
  useEffect(() => {
    if (!editor || !doc) return
    if (editor.getHTML() !== doc.content) {
      editor.commands.setContent(doc.content)
    }
  }, [docId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hide bubble on outside click
  useEffect(() => {
    const hide = () => setBubble(null)
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [])

  const handleInlineAI = useCallback(async (action: string) => {
    if (!editor || !selectedText.trim()) return
    const { from, to } = editor.state.selection
    setBubble(null)
    setAiLoading(action)

    const promptMap: Record<string, string> = {
      improve:    `Improve the writing of this text. Return ONLY the improved text with no explanation:\n\n${selectedText}`,
      shorten:    `Make this text shorter and more concise. Return ONLY the revised text:\n\n${selectedText}`,
      formal:     `Rewrite this in a formal, professional tone. Return ONLY the revised text:\n\n${selectedText}`,
      acceptance: `Generate Gherkin acceptance criteria for this. Return ONLY the Gherkin scenarios:\n\n${selectedText}`,
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: action === 'acceptance' ? 'stories' : 'general',
          userMessage: promptMap[action],
          conversationHistory: [],
        }),
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result.trim()).run()
    } catch (err) {
      console.error('Inline AI error', err)
    } finally {
      setAiLoading(null)
    }
  }, [editor, selectedText])

  if (!editor) return null

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden h-full">
      {/* Floating bubble menu */}
      {bubble && (
        <div
          className="absolute z-50 flex items-center gap-0.5 rounded-lg border shadow-2xl px-1 py-1"
          style={{
            top: bubble.top,
            left: bubble.left,
            background: '#1e1e1e',
            borderColor: '#333',
            pointerEvents: aiLoading ? 'none' : 'auto',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="flex items-center gap-1 px-2 text-[10px] font-medium border-r mr-1" style={{ color: '#6366f1', borderColor: '#2a2a2a' }}>
            <Wand2 size={10} />
            AI
          </span>
          {INLINE_AI_ACTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => handleInlineAI(a.value)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
              style={{ color: aiLoading === a.value ? '#6366f1' : '#ccc' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {aiLoading === a.value
                ? <span className="animate-spin inline-block"><Wand2 size={11} /></span>
                : a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="h-full overflow-y-auto">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  )
}
