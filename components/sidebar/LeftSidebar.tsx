'use client'

import { useState } from 'react'
import {
  Sparkles, ChevronDown, ChevronRight,
  Circle, User, Sun, Moon, Keyboard,
} from 'lucide-react'
import type { Theme, FeatureStatus } from '@/lib/types'
import { useWorkspaceStore } from '@/lib/store'
import FileExplorer from './FileExplorer'

const STATUS_COLORS: Record<FeatureStatus, string> = {
  Now:  '#22c55e',
  Next: '#6366f1',
  Later:'#f59e0b',
  Done: '#6b7280',
}

interface LeftSidebarProps {
  onToggleTheme: () => void
  theme: Theme
}

export default function LeftSidebar({ onToggleTheme, theme }: LeftSidebarProps) {
  const { features } = useWorkspaceStore()
  const [featuresOpen, setFeaturesOpen] = useState(true)

  const counts = features.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1
    return acc
  }, {})

  return (
    <aside
      className="flex flex-col h-full w-full border-r"
      style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: '#2a2a2a' }}
      >
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 28, height: 28, background: '#6366f1' }}
        >
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: '#f0f0f0' }}>
          Prodify-AI
        </span>
      </div>

      {/* File Explorer */}
      <FileExplorer />

      {/* Features */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: '#2a2a2a' }}>
        <button
          onClick={() => setFeaturesOpen(v => !v)}
          className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: '#888' }}
        >
          {featuresOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <span className="text-[10px] uppercase tracking-wider">Features</span>
        </button>

        {featuresOpen && (
          <div className="grid grid-cols-2 gap-1 px-2 pb-2.5">
            {(['Now', 'Next', 'Later', 'Done'] as FeatureStatus[]).map(s => (
              <div
                key={s}
                className="flex items-center justify-between px-2 py-1.5 rounded-md"
                style={{ background: '#222' }}
              >
                <div className="flex items-center gap-1.5">
                  <Circle size={5} fill={STATUS_COLORS[s]} stroke="none" />
                  <span className="text-[11px]" style={{ color: '#888' }}>{s}</span>
                </div>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: STATUS_COLORS[s] }}>
                  {counts[s] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-t flex-shrink-0"
        style={{ borderColor: '#2a2a2a' }}
      >
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 26, height: 26, background: '#333', color: '#aaa' }}
        >
          <User size={13} />
        </div>
        <p className="text-[11px] font-medium truncate flex-1" style={{ color: '#ddd' }}>
          Product Manager
        </p>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded transition-colors hover:bg-white/10 flex-shrink-0"
          style={{ color: '#555' }}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
        <span className="flex-shrink-0" style={{ color: '#555' }} title="Press ? for shortcuts">
          <Keyboard size={13} />
        </span>
      </div>
    </aside>
  )
}
