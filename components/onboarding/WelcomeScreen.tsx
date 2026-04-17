'use client'

import { FileText, Map, FlaskConical, Sparkles, ArrowRight } from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from '@/lib/toast'
import type { DocumentType } from '@/lib/types'

const CARDS = [
  {
    icon: <FileText size={22} />,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.2)',
    title: 'Write your first PRD',
    description: 'AI helps you write a complete Product Requirements Document from a single prompt.',
    type: 'prd' as DocumentType,
    docTitle: 'Untitled PRD',
    tab: 'chat',
  },
  {
    icon: <Map size={22} />,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
    title: 'Plan your roadmap',
    description: 'Drag features across Now / Next / Later to build a visual product roadmap.',
    type: 'roadmap' as DocumentType,
    docTitle: 'Product Roadmap',
    tab: 'roadmap',
  },
  {
    icon: <FlaskConical size={22} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    title: 'Analyze user research',
    description: 'Paste interview notes and let AI surface themes, quotes, and opportunities.',
    type: 'research' as DocumentType,
    docTitle: 'User Research',
    tab: 'research',
  },
]

export default function WelcomeScreen() {
  const { addDocument, setActiveDoc, setActiveSidebarTab } = useWorkspaceStore()

  function handleCard(card: typeof CARDS[number]) {
    const id = addDocument({ title: card.docTitle, content: '', type: card.type, tags: [] })
    setActiveDoc(id)
    setActiveSidebarTab(card.tab)
    toast.success(`Created ${card.docTitle}`)
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-8 py-16"
      style={{ background: '#0f0f0f', minHeight: 0 }}
    >
      {/* Logo & headline */}
      <div className="flex flex-col items-center gap-4 mb-12 text-center">
        <div
          className="flex items-center justify-center rounded-2xl mb-2"
          style={{ width: 56, height: 56, background: '#6366f1' }}
        >
          <Sparkles size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f0f0f0' }}>
          Welcome to Prodify-AI
        </h1>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: '#666' }}>
          Your AI-powered product management workspace. Get started by picking one of the quick starts below.
        </p>
      </div>

      {/* Quick-start cards */}
      <div className="grid grid-cols-1 gap-4 w-full" style={{ maxWidth: 480 }}>
        {CARDS.map((card) => (
          <button
            key={card.type}
            onClick={() => handleCard(card)}
            className="flex items-start gap-4 p-4 rounded-xl text-left transition-all group"
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
              style={{ width: 40, height: 40, background: card.bg, color: card.color }}
            >
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#e0e0e0' }}>{card.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#888' }}>{card.description}</p>
            </div>
            <ArrowRight
              size={16}
              className="flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1"
              style={{ color: card.color }}
            />
          </button>
        ))}
      </div>

      <p className="mt-8 text-[11px]" style={{ color: '#444' }}>
        Or use <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#1e1e1e', color: '#666' }}>⌘K</kbd> to open the command palette
      </p>
    </div>
  )
}
