import { useMemo } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { useFunnelStore } from '../store/funnelStore'
import clsx from 'clsx'

function ValidationPanel() {
  const { getValidationIssues, nodes } = useFunnelStore()

  const issues = useMemo(() => getValidationIssues(), [getValidationIssues, nodes])

  if (nodes.length === 0) {
    return (
      <div
        className="bg-slate-800 border-t border-slate-700 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <AlertCircle size={16} />
          <span>Drag elements from the palette to start building your funnel</span>
        </div>
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div
        className="bg-slate-800 border-t border-slate-700 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle size={16} />
          <span>Funnel looks good! No validation issues.</span>
        </div>
      </div>
    )
  }

  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')

  return (
    <div
      className="bg-slate-800 border-t border-slate-700 px-4 py-3"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        {/* Summary */}
        <div className="flex items-center gap-2 text-sm">
          {errors.length > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle size={16} />
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle size={16} />
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Issue list */}
        <ul className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
          {issues.slice(0, 5).map((issue, index) => (
            <li
              key={index}
              className={clsx(
                'text-sm',
                issue.type === 'error' ? 'text-red-400' : 'text-yellow-400'
              )}
            >
              {issue.message}
            </li>
          ))}
          {issues.length > 5 && (
            <li className="text-slate-400 text-sm">
              +{issues.length - 5} more issues
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default ValidationPanel
