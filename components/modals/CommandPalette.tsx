'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FileText, BookOpen, FlaskConical, Map, LayoutDashboard,
  MessageSquare, BarChart3, TrendingUp, Sparkles, ArrowRight,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from '@/lib/toast'
import type { DocumentType, AIWorkflow } from '@/lib/types'

const WORKFLOW_DEFAULT_PROMPTS: Record<AIWorkflow, string> = {
  prd:            'Draft a PRD for [describe your feature or idea here]',
  stories:        'Generate user stories from my PRD document. Include acceptance criteria for each.',
  roadmap:        'Help me sequence these features into a 3-quarter roadmap: [list your features]',
  prioritization: 'Score these features using RICE and rank them: [list your features]',
  research:       'Synthesize these user interview notes into themes and insights:\n\n[paste your notes here]',
  data:           'Analyse this funnel data and identify the biggest drop-off points:\n\n[paste data here]',
  general:        'How do I [describe your PM challenge]?',
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

type CommandMode = 'ai' | 'nav'

const WORKFLOWS: { id: AIWorkflow; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'prd',           label: 'Write PRD',         description: 'Generate a full Product Requirements Document', icon: <FileText size={14} /> },
  { id: 'stories',       label: 'Write User Stories', description: 'Create stories with Gherkin acceptance criteria', icon: <BookOpen size={14} /> },
  { id: 'prioritization',label: 'Prioritize Features',description: 'RICE scoring and MoSCoW classification',         icon: <BarChart3 size={14} /> },
  { id: 'roadmap',       label: 'Plan Roadmap',       description: 'Now / Next / Later planning and sequencing',     icon: <Map size={14} /> },
  { id: 'research',      label: 'Analyze Research',   description: 'Synthesize themes from user interviews',         icon: <FlaskConical size={14} /> },
  { id: 'data',          label: 'Analyze Data',       description: 'Interpret metrics and generate hypotheses',      icon: <TrendingUp size={14} /> },
  { id: 'general',       label: 'General Chat',       description: 'Ask anything about product management',         icon: <MessageSquare size={14} /> },
]

const NEW_DOC_OPTIONS: { type: DocumentType; label: string; icon: React.ReactNode }[] = [
  { type: 'prd',         label: 'New PRD',           icon: <FileText size={14} />       },
  { type: 'user-story',  label: 'New User Story',    icon: <BookOpen size={14} />       },
  { type: 'research',    label: 'New Research Note', icon: <FlaskConical size={14} />   },
  { type: 'roadmap',     label: 'New Roadmap Doc',   icon: <Map size={14} />            },
  { type: 'general',     label: 'New General Note',  icon: <LayoutDashboard size={14} />},
]

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { addDocument, setActiveDoc, setActiveSidebarTab, setPendingAICommand } = useWorkspaceStore()
  const [query, setQuery]     = useState('')
  const [mode, setMode]       = useState<CommandMode>('ai')
  const [selected, setSelected] = useState(0)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setMode('ai')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = mode === 'ai'
    ? WORKFLOWS.filter(w =>
        !query || w.label.toLowerCase().includes(query.toLowerCase()) ||
        w.description.toLowerCase().includes(query.toLowerCase())
      )
    : NEW_DOC_OPTIONS.filter(d =>
        !query || d.label.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => setSelected(0), [query, mode])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); handleSelect(selected) }
    if (e.key === 'Tab')       { e.preventDefault(); setMode(m => m === 'ai' ? 'nav' : 'ai') }
  }

  function handleSelect(idx: number) {
    if (mode === 'ai') {
      const w = filtered[idx] as typeof WORKFLOWS[number]
      if (!w) return
      setPendingAICommand(w.id, WORKFLOW_DEFAULT_PROMPTS[w.id])
      setActiveSidebarTab('chat')
      onClose()
    } else {
      const d = filtered[idx] as typeof NEW_DOC_OPTIONS[number]
      if (!d) return
      const titles: Record<DocumentType, string> = {
        prd: 'Untitled PRD', 'user-story': 'Untitled User Story',
        research: 'Untitled Research', roadmap: 'Untitled Roadmap', general: 'Untitled Note',
      }
      const id = addDocument({ title: titles[d.type], content: '', type: d.type, tags: [] })
      setActiveDoc(id)
      toast.success(`Created ${d.label}`)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-xl shadow-2xl overflow-hidden"
        style={{
          maxWidth: 560,
          background: '#161616',
          border: '1px solid #2a2a2a',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
          <Sparkles size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={mode === 'ai' ? 'Ask AI or choose a workflow…' : 'Create a new document…'}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#f0f0f0' }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#2a2a2a', color: '#555' }}>ESC</kbd>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 px-3 pt-2.5 pb-1">
          {(['ai', 'nav'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
              style={{
                background: mode === m ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: mode === m ? '#818cf8' : '#555',
              }}
            >
              {m === 'ai' ? '✦ AI Workflows' : '+ New Document'}
            </button>
          ))}
          <span className="ml-auto text-[10px] self-center" style={{ color: '#444' }}>Tab to switch</span>
        </div>

        {/* Results */}
        <div className="pb-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-xs text-center" style={{ color: '#555' }}>No results</p>
          ) : (
            filtered.map((item, i) => {
              const isAI = mode === 'ai'
              const w = item as typeof WORKFLOWS[number]
              const d = item as typeof NEW_DOC_OPTIONS[number]
              return (
                <button
                  key={isAI ? w.id : d.type}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => setSelected(i)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left"
                  style={{ background: selected === i ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                >
                  <span style={{ color: selected === i ? '#818cf8' : '#555' }}>
                    {isAI ? w.icon : d.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: selected === i ? '#e0e0e0' : '#aaa' }}>
                      {isAI ? w.label : d.label}
                    </p>
                    {isAI && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: '#555' }}>{w.description}</p>
                    )}
                  </div>
                  {selected === i && <ArrowRight size={12} style={{ color: '#6366f1', flexShrink: 0 }} />}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-4 px-4 py-2 border-t"
          style={{ borderColor: '#2a2a2a', background: '#111' }}
        >
          {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="text-[9px] px-1 py-0.5 rounded" style={{ background: '#222', color: '#555' }}>{key}</kbd>
              <span className="text-[10px]" style={{ color: '#444' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
