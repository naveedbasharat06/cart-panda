import { create } from 'zustand'
import {
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow'
import { FunnelNode, FunnelEdge, NodeType, NODE_CONFIGS, ValidationIssue } from '../types'

const STORAGE_KEY = 'funnel-builder-state'

interface FunnelStore {
  nodes: FunnelNode[]
  edges: FunnelEdge[]
  nodeCounters: Record<NodeType, number>

  // Actions
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void
  updateNodeLabel: (nodeId: string, label: string) => void

  // Persistence
  saveToStorage: () => void
  loadFromStorage: () => void
  exportJSON: () => string
  importJSON: (json: string) => boolean
  clearCanvas: () => void

  // Validation
  getValidationIssues: () => ValidationIssue[]
}

const getInitialCounters = (): Record<NodeType, number> => ({
  sales: 0,
  order: 0,
  upsell: 0,
  downsell: 0,
  thankyou: 0,
})

export const useFunnelStore = create<FunnelStore>((set, get) => ({
  nodes: [],
  edges: [],
  nodeCounters: getInitialCounters(),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FunnelNode[],
    }))
    // Auto-save after changes
    setTimeout(() => get().saveToStorage(), 100)
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
    setTimeout(() => get().saveToStorage(), 100)
  },

  onConnect: (connection) => {
    const { nodes, edges } = get()

    // Find source node
    const sourceNode = nodes.find((n) => n.id === connection.source)

    // Rule: Thank You page cannot have outgoing edges
    if (sourceNode?.data.type === 'thankyou') {
      console.warn('Thank You page cannot have outgoing connections')
      return
    }

    // Check if Sales Page already has an outgoing edge
    if (sourceNode?.data.type === 'sales') {
      const existingEdges = edges.filter((e) => e.source === connection.source)
      if (existingEdges.length >= 1) {
        // Allow but will show warning
        console.warn('Sales Page should have only one outgoing edge')
      }
    }

    const newEdge: Edge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
      },
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }

    set((state) => ({
      edges: addEdge(newEdge, state.edges),
    }))

    setTimeout(() => get().saveToStorage(), 100)
  },

  addNode: (type, position) => {
    const { nodeCounters } = get()
    const config = NODE_CONFIGS[type]

    // Increment counter for this type
    const newCount = nodeCounters[type] + 1

    // Generate label (e.g., "Upsell 1", "Upsell 2")
    const label = type === 'sales' || type === 'order' || type === 'thankyou'
      ? config.label
      : `${config.label} ${newCount}`

    const newNode: FunnelNode = {
      id: `${type}-${Date.now()}`,
      type: 'funnelNode',
      position,
      data: {
        type,
        label,
        buttonLabel: config.buttonLabel,
      },
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
      nodeCounters: {
        ...state.nodeCounters,
        [type]: newCount,
      },
    }))

    setTimeout(() => get().saveToStorage(), 100)
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }))
    setTimeout(() => get().saveToStorage(), 100)
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }))
    setTimeout(() => get().saveToStorage(), 100)
  },

  updateNodeLabel: (nodeId, label) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label } }
          : node
      ),
    }))
    setTimeout(() => get().saveToStorage(), 100)
  },

  saveToStorage: () => {
    const { nodes, edges, nodeCounters } = get()
    const state = { nodes, edges, nodeCounters }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { nodes, edges, nodeCounters } = JSON.parse(stored)
        set({ nodes, edges, nodeCounters })
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  },

  exportJSON: () => {
    const { nodes, edges, nodeCounters } = get()
    return JSON.stringify({ nodes, edges, nodeCounters }, null, 2)
  },

  importJSON: (json) => {
    try {
      const { nodes, edges, nodeCounters } = JSON.parse(json)
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        throw new Error('Invalid format')
      }
      set({ nodes, edges, nodeCounters: nodeCounters || getInitialCounters() })
      get().saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to import JSON:', error)
      return false
    }
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      nodeCounters: getInitialCounters(),
    })
    localStorage.removeItem(STORAGE_KEY)
  },

  getValidationIssues: () => {
    const { nodes, edges } = get()
    const issues: ValidationIssue[] = []

    // Find orphan nodes (no incoming or outgoing edges)
    nodes.forEach((node) => {
      const hasIncoming = edges.some((e) => e.target === node.id)
      const hasOutgoing = edges.some((e) => e.source === node.id)

      if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
        issues.push({
          type: 'warning',
          message: `"${node.data.label}" is disconnected`,
          nodeId: node.id,
        })
      }
    })

    // Check Sales Page rules
    const salesNodes = nodes.filter((n) => n.data.type === 'sales')
    salesNodes.forEach((node) => {
      const outgoing = edges.filter((e) => e.source === node.id)
      if (outgoing.length > 1) {
        issues.push({
          type: 'warning',
          message: `"${node.data.label}" has multiple outgoing connections (should have 1)`,
          nodeId: node.id,
        })
      }
      if (outgoing.length === 0 && nodes.length > 1) {
        issues.push({
          type: 'warning',
          message: `"${node.data.label}" has no outgoing connection`,
          nodeId: node.id,
        })
      }
    })

    // Check Thank You page rules
    const thankYouNodes = nodes.filter((n) => n.data.type === 'thankyou')
    thankYouNodes.forEach((node) => {
      const outgoing = edges.filter((e) => e.source === node.id)
      if (outgoing.length > 0) {
        issues.push({
          type: 'error',
          message: `"${node.data.label}" should not have outgoing connections`,
          nodeId: node.id,
        })
      }
    })

    // Check for multiple entry points (multiple nodes with no incoming)
    const entryPoints = nodes.filter((node) => {
      const hasIncoming = edges.some((e) => e.target === node.id)
      return !hasIncoming && node.data.type !== 'thankyou'
    })
    if (entryPoints.length > 1 && nodes.length > 1) {
      issues.push({
        type: 'warning',
        message: `Funnel has ${entryPoints.length} entry points (usually should be 1)`,
      })
    }

    return issues
  },
}))
