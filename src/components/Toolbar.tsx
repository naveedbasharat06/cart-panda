import { useCallback, useRef } from 'react'
import { Download, Upload, Trash2, Save } from 'lucide-react'
import { useFunnelStore } from '../store/funnelStore'
import clsx from 'clsx'

function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { exportJSON, importJSON, clearCanvas, nodes, edges } = useFunnelStore()

  const handleExport = useCallback(() => {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `funnel-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportJSON])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const json = event.target?.result as string
        const success = importJSON(json)
        if (!success) {
          alert('Failed to import funnel. Please check the file format.')
        }
      }
      reader.readAsText(file)

      // Reset input
      e.target.value = ''
    },
    [importJSON]
  )

  const handleClear = useCallback(() => {
    if (nodes.length === 0) return
    if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      clearCanvas()
    }
  }, [clearCanvas, nodes.length])

  const buttonClass = clsx(
    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
  )

  return (
    <header
      className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between"
      role="toolbar"
      aria-label="Funnel builder toolbar"
    >
      {/* Logo / Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-white font-bold text-xl">Funnel Builder</h1>
        <span className="text-slate-500 text-sm">
          {nodes.length} nodes • {edges.length} connections
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 text-slate-400 text-sm mr-4">
          <Save size={16} className="text-green-500" />
          <span>Auto-saved</span>
        </div>

        {/* Import */}
        <button
          onClick={handleImport}
          className={clsx(buttonClass, 'bg-slate-700 text-white hover:bg-slate-600')}
          aria-label="Import funnel from JSON file"
        >
          <Upload size={16} />
          Import JSON
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        {/* Export */}
        <button
          onClick={handleExport}
          className={clsx(buttonClass, 'bg-indigo-600 text-white hover:bg-indigo-500')}
          disabled={nodes.length === 0}
          aria-label="Export funnel as JSON file"
        >
          <Download size={16} />
          Export JSON
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className={clsx(
            buttonClass,
            'bg-red-600/20 text-red-400 hover:bg-red-600/30',
            nodes.length === 0 && 'opacity-50 cursor-not-allowed'
          )}
          disabled={nodes.length === 0}
          aria-label="Clear canvas"
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>
    </header>
  )
}

export default Toolbar
