import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  Workspace,
  Document,
  Feature,
  AIMessage,
  ResearchInsight,
  FileNode,
  FileNodeType,
  DocumentType,
  SaveStatus,
  AIWorkflow,
} from './types'

// ── DB sync helpers (fire-and-forget) ────────────────────────────────
function dbPost(path: string, body: unknown) {
  fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .catch(console.error)
}
function dbPatch(path: string, body: unknown) {
  fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .catch(console.error)
}
function dbDelete(path: string, body?: unknown) {
  fetch(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    .catch(console.error)
}

function calcRice(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort === 0) return 0
  return Math.round((reach * impact * (confidence / 100)) / effort)
}

interface WorkspaceActions {
  loadWorkspace: () => Promise<void>

  // Document actions
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  setActiveDoc: (id: string | null) => void

  // Feature actions
  addFeature: (feature: Omit<Feature, 'id' | 'riceScore'>) => string
  updateFeature: (id: string, updates: Partial<Omit<Feature, 'id'>>) => void
  deleteFeature: (id: string) => void

  // AI message actions
  addMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => string
  clearMessages: (workflow?: AIWorkflow) => void

  // Insight actions
  addInsight: (insight: Omit<ResearchInsight, 'id'>) => string
  updateInsight: (id: string, updates: Partial<ResearchInsight>) => void
  deleteInsight: (id: string) => void

  // File tree actions
  addFolder: (name: string, parentId: string | null) => string
  addDocumentFile: (type: DocumentType, title: string, parentId: string | null) => string
  renameFileNode: (id: string, name: string) => void
  deleteFileNode: (id: string) => void

  // UI actions
  setActiveSidebarTab: (tab: string) => void
  setActiveFolderId: (id: string | null) => void
  setTheme: (t: 'dark' | 'light') => void
  setSaveStatus: (s: SaveStatus) => void
  setPendingAICommand: (workflow: AIWorkflow, prompt: string) => void
  clearPendingAICommand: () => void
  applyAIContent: (id: string, html: string) => void
}

export const useWorkspaceStore = create<Workspace & WorkspaceActions>()((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────
  documents:        [],
  features:         [],
  messages:         [],
  insights:         [],
  fileNodes:        [],
  activeDocId:      null,
  activeFolderId:   null,
  activeSidebarTab: 'chat',
  theme:            'dark',
  saveStatus:       'idle',
  pendingAICommand: null,
  aiContentVersion: 0,
  isLoading:        false,

  // ── Load everything from DB on mount ──────────────────────────────
  loadWorkspace: async () => {
    set({ isLoading: true })
    try {
      const [docsRes, featuresRes, messagesRes, insightsRes, fileNodesRes] = await Promise.all([
        fetch('/api/db/documents'),
        fetch('/api/db/features'),
        fetch('/api/db/messages'),
        fetch('/api/db/insights'),
        fetch('/api/db/filenodes'),
      ])
      const [documents, features, messages, insights, fileNodes] = await Promise.all([
        docsRes.json(),
        featuresRes.json(),
        messagesRes.json(),
        insightsRes.json(),
        fileNodesRes.ok ? fileNodesRes.json() : Promise.resolve([]),
      ])
      // Only make a document active if it has a matching FileNode in the tree.
      // Documents without a FileNode are orphans (created via old code or
      // partial deletes) — they'd show in the editor but not in the sidebar.
      const fileNodeIds = new Set<string>(fileNodes.map((n: FileNode) => n.id))
      const firstVisibleDoc = documents.find((d: Document) => fileNodeIds.has(d.id))

      set({
        documents,
        features,
        messages,
        insights,
        fileNodes,
        activeDocId: firstVisibleDoc?.id ?? null,
        isLoading: false,
      })
    } catch (err) {
      console.error('Failed to load workspace:', err)
      set({ isLoading: false })
    }
  },

  // ── Document actions ───────────────────────────────────────────────
  addDocument: (doc) => {
    const id  = uuidv4()
    const ts  = new Date().toISOString()
    const newDoc: Document = { ...doc, id, createdAt: ts, updatedAt: ts }
    set((state) => ({ documents: [...state.documents, newDoc] }))
    dbPost('/api/db/documents', newDoc)
    return id
  },

  updateDocument: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    }))
    dbPatch(`/api/db/documents/${id}`, updates)
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocId: state.activeDocId === id ? (state.documents.find(d => d.id !== id)?.id ?? null) : state.activeDocId,
    }))
    dbDelete(`/api/db/documents/${id}`)
  },

  setActiveDoc: (id) => set({ activeDocId: id }),

  // ── Feature actions ────────────────────────────────────────────────
  addFeature: (feature) => {
    const id        = uuidv4()
    const riceScore = calcRice(feature.reach, feature.impact, feature.confidence, feature.effort)
    const newFeature: Feature = { ...feature, id, riceScore }
    set((state) => ({ features: [...state.features, newFeature] }))
    dbPost('/api/db/features', newFeature)
    return id
  },

  updateFeature: (id, updates) => {
    let updated!: Feature
    set((state) => ({
      features: state.features.map((f) => {
        if (f.id !== id) return f
        updated = { ...f, ...updates }
        updated.riceScore = calcRice(updated.reach, updated.impact, updated.confidence, updated.effort)
        return updated
      }),
    }))
    dbPatch(`/api/db/features/${id}`, { ...updates, riceScore: updated?.riceScore })
  },

  deleteFeature: (id) => {
    set((state) => ({ features: state.features.filter((f) => f.id !== id) }))
    dbDelete(`/api/db/features/${id}`)
  },

  // ── AI message actions ─────────────────────────────────────────────
  addMessage: (msg) => {
    const id        = uuidv4()
    const timestamp = new Date().toISOString()
    const newMsg: AIMessage = { ...msg, id, timestamp }
    set((state) => ({ messages: [...state.messages, newMsg] }))
    dbPost('/api/db/messages', newMsg)
    return id
  },

  clearMessages: (workflow) => {
    set((state) => ({
      messages: workflow
        ? state.messages.filter((m) => m.workflow !== workflow)
        : [],
    }))
    dbDelete('/api/db/messages', workflow ? { workflow } : undefined)
  },

  // ── Insight actions ────────────────────────────────────────────────
  addInsight: (insight) => {
    const id = uuidv4()
    const newInsight: ResearchInsight = { ...insight, id }
    set((state) => ({ insights: [...state.insights, newInsight] }))
    dbPost('/api/db/insights', newInsight)
    return id
  },

  updateInsight: (id, updates) => {
    set((state) => ({
      insights: state.insights.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
    dbPatch(`/api/db/insights/${id}`, updates)
  },

  deleteInsight: (id) => {
    set((state) => ({ insights: state.insights.filter((i) => i.id !== id) }))
    dbDelete(`/api/db/insights/${id}`)
  },

  // ── File tree actions ──────────────────────────────────────────────
  addFolder: (name, parentId) => {
    const id  = uuidv4()
    const ts  = new Date().toISOString()
    const newNode: FileNode = { id, name, type: 'folder', parentId, children: [], createdAt: ts }
    const parentChildren = parentId
      ? [...(get().fileNodes.find(n => n.id === parentId)?.children ?? []), id]
      : null
    set((state) => ({
      fileNodes: [
        ...state.fileNodes.map(n =>
          n.id === parentId ? { ...n, children: [...n.children, id] } : n
        ),
        newNode,
      ],
    }))
    dbPost('/api/db/filenodes', newNode)
    if (parentId && parentChildren) dbPatch(`/api/db/filenodes/${parentId}`, { children: parentChildren })
    return id
  },

  addDocumentFile: (type, title, parentId) => {
    const id  = uuidv4()
    const ts  = new Date().toISOString()
    const newDoc: Document  = { id, title, content: '', type, tags: [], createdAt: ts, updatedAt: ts }
    const newNode: FileNode = { id, name: title, type, parentId, children: [], createdAt: ts }
    const parentChildren = parentId
      ? [...(get().fileNodes.find(n => n.id === parentId)?.children ?? []), id]
      : null
    set((state) => ({
      documents: [...state.documents, newDoc],
      fileNodes: [
        ...state.fileNodes.map(n =>
          n.id === parentId ? { ...n, children: [...n.children, id] } : n
        ),
        newNode,
      ],
      activeDocId: id,
    }))
    dbPost('/api/db/documents', newDoc)
    dbPost('/api/db/filenodes', newNode)
    if (parentId && parentChildren) dbPatch(`/api/db/filenodes/${parentId}`, { children: parentChildren })
    return id
  },

  renameFileNode: (id, name) => {
    const node = get().fileNodes.find(n => n.id === id)
    const isDoc = node && node.type !== 'folder'
    set((state) => ({
      fileNodes: state.fileNodes.map(n => n.id === id ? { ...n, name } : n),
      documents: isDoc
        ? state.documents.map(d => d.id === id ? { ...d, title: name, updatedAt: new Date().toISOString() } : d)
        : state.documents,
    }))
    dbPatch(`/api/db/filenodes/${id}`, { name })
    if (isDoc) dbPatch(`/api/db/documents/${id}`, { title: name })
  },

  deleteFileNode: (id) => {
    const state = get()
    // Collect all descendant IDs recursively
    const toDelete = new Set<string>()
    const collect = (nodeId: string) => {
      const node = state.fileNodes.find(n => n.id === nodeId)
      if (!node) return
      toDelete.add(nodeId)
      node.children.forEach(collect)
    }
    collect(id)
    const docIds = Array.from(toDelete).filter(nId => {
      const n = state.fileNodes.find(f => f.id === nId)
      return n && n.type !== 'folder'
    })
    const deletedNode = state.fileNodes.find(n => n.id === id)
    set((s) => ({
      fileNodes: s.fileNodes
        .filter(n => !toDelete.has(n.id))
        .map(n => n.id === deletedNode?.parentId
          ? { ...n, children: n.children.filter(cId => !toDelete.has(cId)) }
          : n
        ),
      documents: s.documents.filter(d => !docIds.includes(d.id)),
      activeDocId: docIds.includes(s.activeDocId ?? '') ? null : s.activeDocId,
    }))
    // Update parent children in DB
    if (deletedNode?.parentId) {
      const updatedParent = get().fileNodes.find(n => n.id === deletedNode.parentId)
      if (updatedParent) dbPatch(`/api/db/filenodes/${deletedNode.parentId}`, { children: updatedParent.children })
    }
    toDelete.forEach(nId => dbDelete(`/api/db/filenodes/${nId}`))
    docIds.forEach(dId => dbDelete(`/api/db/documents/${dId}`))
  },

  // ── UI actions ─────────────────────────────────────────────────────
  setActiveSidebarTab:    (tab)             => set({ activeSidebarTab: tab }),
  setActiveFolderId:      (id)              => set({ activeFolderId: id }),
  setTheme:               (theme)           => set({ theme }),
  setSaveStatus:          (saveStatus)      => set({ saveStatus }),
  setPendingAICommand:    (workflow, prompt) => set({ pendingAICommand: { workflow, prompt } }),
  clearPendingAICommand:  ()                => set({ pendingAICommand: null }),

  applyAIContent: (id, html) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, content: html, updatedAt: new Date().toISOString() } : d
      ),
      aiContentVersion: state.aiContentVersion + 1,
    }))
    dbPatch(`/api/db/documents/${id}`, { content: html })
  },
}))
