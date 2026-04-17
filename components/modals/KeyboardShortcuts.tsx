'use client'

import { Keyboard, X } from 'lucide-react'

interface KeyboardShortcutsProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['⌘', 'K'],    label: 'Open AI command palette' },
  { keys: ['⌘', 'N'],    label: 'New document' },
  { keys: ['⌘', 'S'],    label: 'Save document' },
  { keys: ['⌘', '/'],    label: 'Toggle AI sidebar' },
  { keys: ['?'],          label: 'Show keyboard shortcuts' },
  { keys: ['Esc'],        label: 'Close modals / cancel' },
]

const EDITOR_SHORTCUTS = [
  { keys: ['/'],          label: 'Slash command (insert template)' },
  { keys: ['⌘', 'B'],    label: 'Bold' },
  { keys: ['⌘', 'I'],    label: 'Italic' },
  { keys: ['⌘', 'U'],    label: 'Underline' },
  { keys: ['⌘', 'Z'],    label: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], label: 'Redo' },
]

function Keys({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center text-[11px] font-medium rounded px-1.5 py-0.5 min-w-[24px]"
          style={{ background: '#2a2a2a', color: '#aaa', border: '1px solid #3a3a3a', fontFamily: 'inherit' }}
        >
          {k}
        </kbd>
      ))}
    </div>
  )
}

export default function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-xl shadow-2xl overflow-hidden"
        style={{ maxWidth: 440, background: '#161616', border: '1px solid #2a2a2a' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
          <Keyboard size={15} style={{ color: '#6366f1' }} />
          <span className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Keyboard Shortcuts</span>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: '#555' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Global */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#666' }}>
              Global
            </p>
            <div className="space-y-1">
              {SHORTCUTS.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ background: '#1e1e1e' }}>
                  <span className="text-xs" style={{ color: '#ccc' }}>{label}</span>
                  <Keys keys={keys} />
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#666' }}>
              Editor
            </p>
            <div className="space-y-1">
              {EDITOR_SHORTCUTS.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ background: '#1e1e1e' }}>
                  <span className="text-xs" style={{ color: '#ccc' }}>{label}</span>
                  <Keys keys={keys} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
