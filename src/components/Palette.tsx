import { DragEvent } from 'react'
import { NodeType, NODE_CONFIGS } from '../types'
import clsx from 'clsx'

const nodeTypes: NodeType[] = ['sales', 'order', 'upsell', 'downsell', 'thankyou']

function Palette() {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside
      className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col"
      aria-label="Node palette"
    >
      <h2 className="text-white font-semibold text-lg mb-4">Funnel Elements</h2>
      <p className="text-slate-400 text-xs mb-4">
        Drag elements to the canvas to build your funnel
      </p>

      <nav className="flex-1 space-y-2" aria-label="Draggable node types">
        {nodeTypes.map((type) => {
          const config = NODE_CONFIGS[type]
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className={clsx(
                'bg-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing',
                'border border-slate-600 hover:border-indigo-500',
                'transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
              )}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${config.label} to canvas`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // TODO: Could add keyboard-based node placement
                  e.preventDefault()
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: config.color }}
                  aria-hidden="true"
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-medium truncate">
                    {config.label}
                  </h3>
                  <p className="text-slate-400 text-xs truncate">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Help text */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
        <h3 className="text-slate-300 text-xs font-medium mb-1">Keyboard Shortcuts</h3>
        <ul className="text-slate-400 text-xs space-y-1">
          <li><kbd className="bg-slate-600 px-1 rounded">Delete</kbd> - Remove selected</li>
          <li><kbd className="bg-slate-600 px-1 rounded">Shift</kbd> + Click - Multi-select</li>
          <li>Double-click node - Edit label</li>
        </ul>
      </div>
    </aside>
  )
}

export default Palette
