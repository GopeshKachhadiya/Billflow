import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, RefreshCw, Calendar, User } from 'lucide-react'
import { useActivityLog } from '../hooks/useActivityLog'
import { formatDatetime } from '../lib/utils'

export default function ActivityLogs() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [performedBy, setPerformedBy] = useState('all')
  const [page, setPage] = useState(0)
  const PER_PAGE = 50

  const { logs, total, loading, refetch } = useActivityLog({
    search,
    action,
    performed_by: performedBy,
    limit: PER_PAGE,
    offset: page * PER_PAGE
  })

  // List of standard admin actions to filter on
  const ACTIONS = [
    { value: 'user_created', label: 'User Created' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'trial_extended', label: 'Trial Extended' },
    { value: 'trial_converted', label: 'Trial Converted' },
    { value: 'status_changed', label: 'Status Changed' }
  ]

  return (
    <div className="space-y-5 text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Activity Logs</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Audit trail of all administrative actions and system updates</p>
        </div>
        <button
          onClick={() => refetch()}
          className="border border-outline-variant/30 hover:bg-surface-container-high text-on-surface p-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5 font-bold bg-surface-container-low shadow-sm">
          <RefreshCw size={15} /> Refresh logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-4 flex flex-wrap gap-3 shadow-sm transition-colors duration-200">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search description or customer context..."
            className="w-full pl-9 pr-4 py-2 border-none rounded-xl text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
          />
        </div>
        
        {/* Action filter */}
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(0) }}
          className="border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer">
          <option value="all">All Actions</option>
          {ACTIONS.map(act => (
            <option key={act.value} value={act.value}>{act.label}</option>
          ))}
        </select>

        {/* Performed By filter */}
        <select
          value={performedBy}
          onChange={e => { setPerformedBy(e.target.value); setPage(0) }}
          className="border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer">
          <option value="all">Performed By (All)</option>
          <option value="admin">Admin Override</option>
          <option value="system">System automated</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-outline-variant/15">
                {['Timestamp','Action Type','Event Details','Customer Context','Originator'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-on-surface-variant">Loading audit trail logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-on-surface-variant">No activity matching filters found.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="px-4 py-4 text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-secondary" />
                      {formatDatetime(log.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      log.action.includes('created') ? 'bg-primary/10 text-primary border-primary/20' :
                      log.action.includes('payment') ? 'bg-secondary/10 text-secondary border-secondary/20' :
                      log.action.includes('extended') ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                      'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-on-surface max-w-sm">
                    {log.description}
                  </td>
                  <td className="px-4 py-4">
                    {log.user ? (
                      <div>
                        <Link to={`/users/${log.user.id}`} className="font-semibold text-xs text-on-surface hover:text-primary flex items-center gap-1 transition-colors">
                          <User size={10} className="text-on-surface-variant" />
                          {log.user.full_name}
                        </Link>
                        <p className="text-[10px] text-on-surface-variant">{log.user.business_name}</p>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap capitalize">
                    {log.performed_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/15 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40">
          <span>Showing {Math.min(page * PER_PAGE + 1, total)}–{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-outline-variant/30 rounded-lg disabled:opacity-40 hover:bg-surface-container-high bg-surface-container-low text-on-surface transition-colors">← Prev</button>
            <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-outline-variant/30 rounded-lg disabled:opacity-40 hover:bg-surface-container-high bg-surface-container-low text-on-surface transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
