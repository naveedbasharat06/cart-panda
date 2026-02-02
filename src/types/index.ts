import { Node, Edge } from 'reactflow'

export type NodeType = 'sales' | 'order' | 'upsell' | 'downsell' | 'thankyou'

export interface FunnelNodeData {
  type: NodeType
  label: string
  buttonLabel: string
  hasWarning?: boolean
  warningMessage?: string
}

export type FunnelNode = Node<FunnelNodeData>
export type FunnelEdge = Edge

export interface FunnelState {
  nodes: FunnelNode[]
  edges: FunnelEdge[]
  nodeCounters: Record<NodeType, number>
}

export interface ValidationIssue {
  type: 'error' | 'warning'
  message: string
  nodeId?: string
}

export const NODE_CONFIGS: Record<NodeType, {
  label: string
  buttonLabel: string
  color: string
  icon: string
  description: string
}> = {
  sales: {
    label: 'Sales Page',
    buttonLabel: 'Buy Now',
    color: '#3b82f6',
    icon: '📄',
    description: 'Landing page to capture interest',
  },
  order: {
    label: 'Order Page',
    buttonLabel: 'Complete Order',
    color: '#8b5cf6',
    icon: '🛒',
    description: 'Checkout and payment page',
  },
  upsell: {
    label: 'Upsell',
    buttonLabel: 'Yes, Add This!',
    color: '#10b981',
    icon: '⬆️',
    description: 'Offer additional products',
  },
  downsell: {
    label: 'Downsell',
    buttonLabel: 'Get This Instead',
    color: '#f59e0b',
    icon: '⬇️',
    description: 'Alternative offer if upsell declined',
  },
  thankyou: {
    label: 'Thank You',
    buttonLabel: 'Continue',
    color: '#ec4899',
    icon: '🎉',
    description: 'Order confirmation page',
  },
}
