import { useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useFunnelStore } from './store/funnelStore'
import { nodeTypes } from './components/nodes'
import Palette from './components/Palette'
import Toolbar from './components/Toolbar'
import ValidationPanel from './components/ValidationPanel'
import { NodeType } from './types'

function FunnelBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    loadFromStorage,
  } = useFunnelStore()

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as NodeType
      if (!type || !reactFlowInstance.current || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(type, position)
    },
    [addNode]
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
    },
    [onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange]
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection)
    },
    [onConnect]
  )

  return (
    <div className="flex h-screen w-screen bg-slate-900">
      {/* Skip link for accessibility */}
      <a href="#canvas" className="skip-link">
        Skip to canvas
      </a>

      {/* Left Sidebar - Palette */}
      <Palette />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <Toolbar />

        {/* React Flow Canvas */}
        <div
          id="canvas"
          ref={reactFlowWrapper}
          className="flex-1"
          role="application"
          aria-label="Funnel builder canvas. Drag nodes from the palette to create your funnel."
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#6366f1', strokeWidth: 2 },
            }}
            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode={['Shift']}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls
              className="bg-slate-800 border-slate-700 rounded-lg"
              aria-label="Canvas zoom and pan controls"
            />
            <MiniMap
              className="bg-slate-800 border-slate-700 rounded-lg"
              nodeColor={(node) => {
                switch (node.data?.type) {
                  case 'sales': return '#3b82f6'
                  case 'order': return '#8b5cf6'
                  case 'upsell': return '#10b981'
                  case 'downsell': return '#f59e0b'
                  case 'thankyou': return '#ec4899'
                  default: return '#6366f1'
                }
              }}
              aria-label="Minimap showing overview of funnel"
            />
          </ReactFlow>
        </div>

        {/* Validation Panel */}
        <ValidationPanel />
      </div>
    </div>
  )
}

function App() {
  return (
    <ReactFlowProvider>
      <FunnelBuilder />
    </ReactFlowProvider>
  )
}

export default App
