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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-500 text-sm">Audit trail of all administrative actions and system updates</p>
        </div>
        <button
          onClick={() => refetch()}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 p-2 rounded-xl text-sm transition-colors flex items-center gap-1.5 font-bold">
          <RefreshCw size={15} /> Refresh logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search description or customer context..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          />
        </div>
        
        {/* Action filter */}
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all">
          <option value="all">All Actions</option>
          {ACTIONS.map(act => (
            <option key={act.value} value={act.value}>{act.label}</option>
          ))}
        </select>

        {/* Performed By filter */}
        <select
          value={performedBy}
          onChange={e => { setPerformedBy(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all">
          <option value="all">Performed By (All)</option>
          <option value="admin">Admin Override</option>
          <option value="system">System automated</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover-glow transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Timestamp','Action Type','Event Details','Customer Context','Originator'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-55">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading audit trail logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No activity matching filters found.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-indigo-400" />
                      {formatDatetime(log.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      log.action.includes('created') ? 'bg-green-50 text-green-700 border-green-200' :
                      log.action.includes('payment') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      log.action.includes('extended') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-gray-800 max-w-sm">
                    {log.description}
                  </td>
                  <td className="px-4 py-4">
                    {log.user ? (
                      <div>
                        <Link to={`/users/${log.user.id}`} className="font-semibold text-xs text-gray-900 hover:text-indigo-650 flex items-center gap-1 transition-colors">
                          <User size={10} className="text-gray-400" />
                          {log.user.full_name}
                        </Link>
                        <p className="text-[10px] text-gray-450">{log.user.business_name}</p>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-gray-400 whitespace-nowrap capitalize">
                    {log.performed_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-150 text-xs font-semibold text-gray-500 bg-gray-50/50">
          <span>Showing {Math.min(page * PER_PAGE + 1, total)}–{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white bg-gray-50/30 transition-colors">← Prev</button>
            <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white bg-gray-50/30 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
