import { memo, useCallback, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Trash2 } from 'lucide-react'
import { FunnelNodeData, NODE_CONFIGS } from '../../types'
import { useFunnelStore } from '../../store/funnelStore'
import clsx from 'clsx'

function FunnelNode({ id, data, selected }: NodeProps<FunnelNodeData>) {
  const { deleteNode, updateNodeLabel } = useFunnelStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(data.label)

  const config = NODE_CONFIGS[data.type]
  const isThankYou = data.type === 'thankyou'

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      deleteNode(id)
    },
    [deleteNode, id]
  )

  const handleDoubleClick = useCallback(() => {
    setEditLabel(data.label)
    setIsEditing(true)
  }, [data.label])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    if (editLabel.trim() && editLabel !== data.label) {
      updateNodeLabel(id, editLabel.trim())
    }
  }, [editLabel, data.label, id, updateNodeLabel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBlur()
      } else if (e.key === 'Escape') {
        setIsEditing(false)
        setEditLabel(data.label)
      }
    },
    [handleBlur, data.label]
  )

  return (
    <div
      className={clsx(
        'relative bg-slate-800 rounded-xl shadow-lg border-2 transition-all duration-200 min-w-[180px]',
        selected ? 'border-indigo-500 shadow-indigo-500/25' : 'border-slate-600',
        'hover:border-indigo-400'
      )}
      role="group"
      aria-label={`${data.label} node`}
    >
      {/* Top color bar */}
      <div
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />

      {/* Node content */}
      <div className="p-4">
        {/* Icon and Label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" role="img" aria-label={config.label}>
            {config.icon}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-slate-700 text-white text-sm font-semibold px-2 py-1 rounded border border-indigo-500 outline-none flex-1"
              aria-label="Edit node label"
            />
          ) : (
            <h3
              className="text-white text-sm font-semibold cursor-pointer hover:text-indigo-300"
              onDoubleClick={handleDoubleClick}
              title="Double-click to edit"
            >
              {data.label}
            </h3>
          )}
        </div>

        {/* Placeholder thumbnail */}
        <div
          className="bg-slate-700 rounded-lg h-16 mb-3 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-slate-500 text-xs">Page Preview</span>
        </div>

        {/* Button */}
        <button
          className="w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: config.color }}
          aria-label={`${data.buttonLabel} button preview`}
          tabIndex={-1}
        >
          {data.buttonLabel}
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className={clsx(
            'absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white',
            'flex items-center justify-center opacity-0 group-hover:opacity-100',
            'transition-opacity hover:bg-red-600 focus:opacity-100'
          )}
          aria-label={`Delete ${data.label}`}
          title="Delete node"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Input Handle (top) - not for entry nodes */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-500 !border-slate-800"
        aria-label="Connect from another node"
      />

      {/* Output Handle (bottom) - not for Thank You */}
      {!isThankYou && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-indigo-500 !border-slate-800"
          aria-label="Connect to another node"
        />
      )}
    </div>
  )
}

export default memo(FunnelNode)
