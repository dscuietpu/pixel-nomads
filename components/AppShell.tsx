'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useWorkspaceStore } from '@/lib/store'
import LeftSidebar from './sidebar/LeftSidebar'
import EditorPanel from './editor/EditorPanel'
import RightPanel from './sidebar/RightPanel'
import ToastContainer from './ui/Toast'
import CommandPalette from './modals/CommandPalette'
import KeyboardShortcuts from './modals/KeyboardShortcuts'
import WelcomeScreen from './onboarding/WelcomeScreen'

export default function AppShell() {
  const {
    documents, theme, setTheme,
    addDocument, setActiveDoc, setActiveSidebarTab,
    activeSidebarTab, loadWorkspace, isLoading,
  } = useWorkspaceStore()

  useEffect(() => { loadWorkspace() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [shortcutsOpen,  setShortcutsOpen]  = useState(false)

  /* ── Apply theme class to <html> ─────────────────────────────── */
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
    }
  }, [theme])

  /* ── Global keyboard shortcuts ───────────────────────────────── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName

      // CMD+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen(true)
        return
      }
      // CMD+N → new general note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        const id = addDocument({ title: 'Untitled Note', content: '', type: 'general', tags: [] })
        setActiveDoc(id)
        return
      }
      // CMD+/ → cycle AI sidebar tabs
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        const tabs = ['chat', 'roadmap', 'prioritize', 'research', 'data']
        const idx  = tabs.indexOf(activeSidebarTab)
        setActiveSidebarTab(tabs[(idx + 1) % tabs.length])
        return
      }
      // ? → keyboard shortcuts (not when in input/textarea/contenteditable)
      if (
        e.key === '?' &&
        tag !== 'INPUT' && tag !== 'TEXTAREA' &&
        !(e.target as HTMLElement).isContentEditable &&
        !e.metaKey && !e.ctrlKey
      ) {
        setShortcutsOpen(true)
        return
      }
      // Esc → close modals
      if (e.key === 'Escape') {
        setCmdPaletteOpen(false)
        setShortcutsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSidebarTab, addDocument, setActiveDoc, setActiveSidebarTab])

  const noDocuments = documents.length === 0

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
        <div className="text-center space-y-3">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
          <p className="text-xs" style={{ color: '#555' }}>Loading workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="h-screen overflow-hidden"
        style={{ background: theme === 'dark' ? '#0f0f0f' : '#f5f5f5', minWidth: 1024 }}
      >
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left sidebar */}
          <Panel defaultSize={18} minSize={12} maxSize={30}>
            <LeftSidebar onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} theme={theme} />
          </Panel>

          <PanelResizeHandle className="group w-1 relative flex items-center justify-center" style={{ background: '#2a2a2a' }}>
            <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-indigo-500/30 group-data-[resize-handle-active]:bg-indigo-500/50 transition-colors" />
          </PanelResizeHandle>

          {/* Center editor */}
          <Panel minSize={30}>
            <div className="flex flex-col h-full overflow-hidden">
              {noDocuments ? <WelcomeScreen /> : <EditorPanel />}
            </div>
          </Panel>

          <PanelResizeHandle className="group w-1 relative flex items-center justify-center" style={{ background: '#2a2a2a' }}>
            <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-indigo-500/30 group-data-[resize-handle-active]:bg-indigo-500/50 transition-colors" />
          </PanelResizeHandle>

          {/* Right panel */}
          <Panel defaultSize={28} minSize={20} maxSize={45}>
            <RightPanel />
          </Panel>
        </PanelGroup>
      </div>

      {/* Overlays */}
      <CommandPalette    open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
      <KeyboardShortcuts open={shortcutsOpen}  onClose={() => setShortcutsOpen(false)} />
      <ToastContainer />
    </>
  )
}
