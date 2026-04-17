'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastItem } from '@/lib/toast'

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const icons = {
    success: <CheckCircle2 size={15} style={{ color: '#4ade80', flexShrink: 0 }} />,
    error:   <XCircle      size={15} style={{ color: '#f87171', flexShrink: 0 }} />,
    info:    <Info         size={15} style={{ color: '#60a5fa', flexShrink: 0 }} />,
  }
  const borders = {
    success: 'rgba(74,222,128,0.2)',
    error:   'rgba(248,113,113,0.2)',
    info:    'rgba(96,165,250,0.2)',
  }

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-xl transition-all duration-300"
      style={{
        background: '#1e1e1e',
        border: `1px solid ${borders[toast.type]}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        maxWidth: 320,
        minWidth: 220,
      }}
    >
      {icons[toast.type]}
      <span className="text-xs flex-1 leading-snug" style={{ color: '#ddd' }}>
        {toast.message}
      </span>
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
        style={{ color: '#555' }}
      >
        <X size={12} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed bottom-5 right-5 flex flex-col gap-2 z-[9999] pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  )
}
