'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Folder, FolderOpen, FileText, BookOpen, FlaskConical, Map, File,
  ChevronRight, ChevronDown, FolderPlus, Plus, Pencil, Trash2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import type { FileNode, FileNodeType, DocumentType } from '@/lib/types'

/* ── Design tokens (match rest of app) ──────────────────────────── */
const BG        = '#1a1a1a'
const BORDER    = '#2a2a2a'
const HOVER_BG  = 'rgba(255,255,255,0.05)'
const ACTIVE_BG = 'rgba(99,102,241,0.12)'
const ACTIVE_FG = '#a5b4fc'
const MUTED     = '#666'
const LABEL_FG  = '#aaa'

/* ── Node metadata ───────────────────────────────────────────────── */
const NODE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  folder:       { icon: <Folder size={13} />,       color: '#f59e0b', label: 'Folder'       },
  prd:          { icon: <FileText size={13} />,     color: '#818cf8', label: 'PRD'           },
  'user-story': { icon: <BookOpen size={13} />,     color: '#4ade80', label: 'User Story'    },
  research:     { icon: <FlaskConical size={13} />, color: '#fcd34d', label: 'Research'      },
  roadmap:      { icon: <Map size={13} />,          color: '#60a5fa', label: 'Roadmap'       },
  general:      { icon: <File size={13} />,         color: '#9ca3af', label: 'Note'          },
}

const DOC_TYPES: DocumentType[] = ['prd', 'user-story', 'research', 'roadmap', 'general']

/* ── Helpers ─────────────────────────────────────────────────────── */
function getOrderedChildren(nodes: FileNode[], parentId: string | null): FileNode[] {
  if (parentId === null) return nodes.filter(n => n.parentId === null)
  const parent = nodes.find(n => n.id === parentId)
  if (!parent) return []
  return parent.children
    .map(id => nodes.find(n => n.id === id))
    .filter((n): n is FileNode => !!n)
}

/* ── Inline type-picker grid ─────────────────────────────────────── */
function TypePicker({
  includeFolder = false,
  indent = 0,
  onSelect,
}: {
  includeFolder?: boolean
  indent?: number
  onSelect: (type: FileNodeType) => void
}) {
  const types: FileNodeType[] = includeFolder ? ['folder', ...DOC_TYPES] : DOC_TYPES

  return (
    <div style={{ paddingLeft: indent + 6, paddingRight: 6, paddingTop: 4, paddingBottom: 6 }}>
      <div
        className="rounded-md p-2"
        style={{ background: '#111', border: `1px solid ${BORDER}` }}
      >
        <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: MUTED }}>
          Select type
        </p>
        <div className="grid grid-cols-2 gap-1">
          {types.map(t => {
            const m = NODE_META[t]
            return (
              <button
                key={t}
                onClick={() => onSelect(t)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors text-left"
                style={{ background: '#1a1a1a', color: LABEL_FG, border: `1px solid ${BORDER}` }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = ACTIVE_BG
                  ;(e.currentTarget as HTMLButtonElement).style.color = ACTIVE_FG
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = BG
                  ;(e.currentTarget as HTMLButtonElement).style.color = LABEL_FG
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = BORDER
                }}
              >
                <span style={{ color: m.color, flexShrink: 0 }}>{m.icon}</span>
                <span className="truncate">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Inline name input ───────────────────────────────────────────── */
function InlineInput({
  type, indent, onCommit, onCancel,
}: {
  type: FileNodeType
  indent: number
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const [val, setVal] = useState('')
  const ref  = useRef<HTMLInputElement>(null)
  const meta = NODE_META[type]

  useEffect(() => { ref.current?.focus() }, [])

  const commit = useCallback(() => {
    const name = val.trim()
    if (name) onCommit(name)
    else onCancel()
  }, [val, onCommit, onCancel])

  return (
    <div
      className="flex items-center gap-2 py-1 pr-2"
      style={{ paddingLeft: indent + 6 }}
    >
      <span style={{ color: meta.color, flexShrink: 0 }}>{meta.icon}</span>
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); commit() }
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={commit}
        placeholder={type === 'folder' ? 'Folder name' : meta.label + ' name'}
        className="flex-1 min-w-0 text-xs outline-none px-2 py-1 rounded"
        style={{
          color: '#f0f0f0',
          background: ACTIVE_BG,
          border: '1px solid rgba(99,102,241,0.4)',
        }}
      />
    </div>
  )
}

/* ── Tree state ─────────────────────────────────────────────────── */
type CreatingState = { parentId: string | null; type: FileNodeType } | null

interface TreeState {
  collapsed:       Set<string>
  renamingId:      string | null
  renameValue:     string
  creating:        CreatingState
  typePickerFor:   string | null
  onToggle:        (id: string) => void
  onStartRename:   (id: string, name: string) => void
  onRenameChange:  (v: string) => void
  onCommitRename:  () => void
  onCancelRename:  () => void
  onSetCreating:   (v: CreatingState) => void
  onSetTypePicker: (id: string | null) => void
  onNewItem:       (parentId: string | null, type: FileNodeType, name: string) => void
  onDelete:        (id: string) => void
}

/* ── Tree row ────────────────────────────────────────────────────── */
function TreeNode({ node, depth, tree }: { node: FileNode; depth: number; tree: TreeState }) {
  const { fileNodes, activeDocId, setActiveDoc } = useWorkspaceStore()

  const isFolder      = node.type === 'folder'
  const isExpanded    = !tree.collapsed.has(node.id)
  const isActive      = activeDocId === node.id
  const isRenaming    = tree.renamingId === node.id
  const showPicker    = tree.typePickerFor === node.id
  const meta          = NODE_META[node.type] ?? NODE_META['general']
  const children      = getOrderedChildren(fileNodes, node.id)
  const indent        = depth * 14

  const [hovered, setHovered] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (isRenaming) renameRef.current?.focus() }, [isRenaming])

  return (
    <>
      <div
        className="flex items-center rounded text-xs transition-colors cursor-pointer"
        style={{
          paddingLeft:  indent + 6,
          paddingRight: 6,
          height: 28,
          background: isActive ? ACTIVE_BG : hovered ? HOVER_BG : 'transparent',
          color:      isActive ? ACTIVE_FG : LABEL_FG,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (isRenaming) return
          if (isFolder) tree.onToggle(node.id)
          else setActiveDoc(node.id)
        }}
        onDoubleClick={() => { if (!isRenaming) tree.onStartRename(node.id, node.name) }}
      >
        {/* Chevron / spacer */}
        <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 16, color: MUTED }}>
          {isFolder
            ? (isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />)
            : null}
        </span>

        {/* Icon */}
        <span
          className="flex-shrink-0 mr-1.5 flex items-center"
          style={{ color: isActive ? ACTIVE_FG : meta.color }}
        >
          {isFolder
            ? (isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />)
            : meta.icon}
        </span>

        {/* Name / rename */}
        {isRenaming ? (
          <input
            ref={renameRef}
            value={tree.renameValue}
            onChange={e => tree.onRenameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); tree.onCommitRename() }
              if (e.key === 'Escape') tree.onCancelRename()
            }}
            onBlur={tree.onCommitRename}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 text-xs outline-none px-1.5 py-0.5 rounded"
            style={{ color: '#f0f0f0', background: ACTIVE_BG, border: '1px solid rgba(99,102,241,0.4)' }}
          />
        ) : (
          <span className="flex-1 min-w-0 truncate leading-tight">{node.name}</span>
        )}

        {/* Hover actions */}
        {(hovered || showPicker) && !isRenaming && (
          <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
            {isFolder && (
              <button
                title="Add inside folder"
                onClick={e => {
                  e.stopPropagation()
                  tree.onSetTypePicker(showPicker ? null : node.id)
                }}
                className="flex items-center justify-center rounded transition-colors hover:bg-white/10"
                style={{ width: 18, height: 18, color: showPicker ? '#818cf8' : MUTED, fontWeight: 600, fontSize: 15 }}
              >
                {showPicker ? '×' : '+'}
              </button>
            )}
            <button
              title="Rename"
              onClick={e => { e.stopPropagation(); tree.onStartRename(node.id, node.name) }}
              className="flex items-center justify-center rounded transition-colors hover:bg-white/10"
              style={{ width: 18, height: 18, color: MUTED }}
            >
              <Pencil size={11} />
            </button>
            <button
              title="Delete"
              onClick={e => { e.stopPropagation(); tree.onDelete(node.id) }}
              className="flex items-center justify-center rounded transition-colors hover:bg-red-500/20"
              style={{ width: 18, height: 18, color: MUTED }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = MUTED   }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isFolder && isExpanded && (
        <>
          {showPicker && (
            <TypePicker
              includeFolder
              indent={(depth + 1) * 14}
              onSelect={type => {
                tree.onSetTypePicker(null)
                tree.onSetCreating({ parentId: node.id, type })
              }}
            />
          )}
          {tree.creating?.parentId === node.id && (
            <InlineInput
              type={tree.creating.type}
              indent={(depth + 1) * 14}
              onCommit={name => { tree.onNewItem(node.id, tree.creating!.type, name); tree.onSetCreating(null) }}
              onCancel={() => tree.onSetCreating(null)}
            />
          )}
          {children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} tree={tree} />
          ))}
          {children.length === 0 && !showPicker && tree.creating?.parentId !== node.id && (
            <p
              className="text-[11px] italic"
              style={{ paddingLeft: (depth + 1) * 14 + 22, paddingTop: 3, paddingBottom: 3, color: '#3a3a3a' }}
            >
              Empty folder
            </p>
          )}
        </>
      )}
    </>
  )
}

/* ── FileExplorer ────────────────────────────────────────────────── */
export default function FileExplorer() {
  const { fileNodes, addFolder, addDocumentFile, renameFileNode, deleteFileNode } = useWorkspaceStore()

  const [collapsed,     setCollapsed]     = useState<Set<string>>(new Set())
  const [renamingId,    setRenamingId]    = useState<string | null>(null)
  const [renameValue,   setRenameValue]   = useState('')
  const [creating,      setCreating]      = useState<CreatingState>(null)
  const [typePickerFor, setTypePickerFor] = useState<string | null>(null)
  const [docPickerOpen, setDocPickerOpen] = useState(false)

  const toggleFolder = (id: string) =>
    setCollapsed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const expandFolder = (id: string | null) => {
    if (!id) return
    setCollapsed(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const startRename  = (id: string, name: string) => { setRenamingId(id); setRenameValue(name) }
  const cancelRename = () => { setRenamingId(null); setRenameValue('') }
  const commitRename = () => {
    if (renamingId && renameValue.trim()) renameFileNode(renamingId, renameValue.trim())
    cancelRename()
  }

  const handleNewItem = (parentId: string | null, type: FileNodeType, name: string) => {
    if (type === 'folder') addFolder(name, parentId)
    else addDocumentFile(type as DocumentType, name, parentId)
    expandFolder(parentId)
  }

  const handleDelete = (id: string) => {
    const node = fileNodes.find(n => n.id === id)
    if (!node) return
    const label = node.type === 'folder' && node.children.length > 0
      ? `"${node.name}" and all its contents`
      : `"${node.name}"`
    if (!confirm(`Delete ${label}?`)) return
    deleteFileNode(id)
  }

  const tree: TreeState = {
    collapsed, renamingId, renameValue, creating, typePickerFor,
    onToggle:        toggleFolder,
    onStartRename:   startRename,
    onRenameChange:  setRenameValue,
    onCommitRename:  commitRename,
    onCancelRename:  cancelRename,
    onSetCreating:   setCreating,
    onSetTypePicker: setTypePickerFor,
    onNewItem:       handleNewItem,
    onDelete:        handleDelete,
  }

  const rootNodes = getOrderedChildren(fileNodes, null)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Buttons ── */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 space-y-1.5">
        {/* New Folder */}
        <button
          onClick={() => { setDocPickerOpen(false); setCreating({ parentId: null, type: 'folder' }) }}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
          style={{ border: `1px solid ${BORDER}`, color: '#888' }}
        >
          <FolderPlus size={13} style={{ color: '#f59e0b' }} />
          New Folder
        </button>

        {/* New Document */}
        <button
          onClick={() => { setCreating(null); setDocPickerOpen(v => !v) }}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{
            background: docPickerOpen ? 'rgba(99,102,241,0.2)' : '#6366f1',
            color: '#fff',
          }}
        >
          <Plus size={13} />
          New Document
          <ChevronDown
            size={11}
            className="ml-auto opacity-70 transition-transform"
            style={{ transform: docPickerOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Inline type picker (root level) */}
        {docPickerOpen && (
          <TypePicker
            indent={0}
            onSelect={type => { setDocPickerOpen(false); setCreating({ parentId: null, type }) }}
          />
        )}
      </div>

      {/* Divider + label */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3 pb-1.5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: MUTED }}>
          Files
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
          style={{ background: '#2a2a2a', color: MUTED }}
        >
          {fileNodes.filter(n => n.type !== 'folder').length}
        </span>
      </div>

      {/* ── Tree ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Root inline creator */}
        {creating?.parentId === null && (
          <InlineInput
            type={creating.type}
            indent={0}
            onCommit={name => { handleNewItem(null, creating.type, name); setCreating(null) }}
            onCancel={() => setCreating(null)}
          />
        )}

        {rootNodes.map(node => (
          <TreeNode key={node.id} node={node} depth={0} tree={tree} />
        ))}

        {rootNodes.length === 0 && !creating && !docPickerOpen && (
          <div className="px-3 py-8 text-center space-y-1">
            <p className="text-xs" style={{ color: '#555' }}>No files yet</p>
            <p className="text-[10px]" style={{ color: '#444' }}>
              Create a folder or document above
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
