import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Download, Plus } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { StatusBadge, PlanBadge } from '../components/ui/StatusBadge'
import { formatCurrency, formatDate, daysUntil } from '../lib/utils'

export default function Users() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [plan,   setPlan  ] = useState('all')
  const [page,   setPage  ] = useState(0)
  const PER_PAGE = 50

  const { users, total, loading, refetch } = useUsers({
    search, status, plan, limit: PER_PAGE, offset: page * PER_PAGE
  })

  const exportCSV = () => {
    const headers = ['Name','Business','Email','Phone','Plan','Status','Trial End','Next Billing','Last Payment','Total Paid']
    const rows    = users.map(u => [
      u.full_name, u.business_name, u.email, u.phone,
      u.plan, u.status, u.trial_end_date || '',
      u.next_billing_date || '', u.last_payment_date || '',
      u.total_paid || 0
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a   = document.createElement('a')
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'billflow-users.csv'
    a.click()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm">{total} total customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors font-medium">
            <Download size={15} /> Export CSV
          </button>
          <Link to="/users/add" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]">
            <Plus size={15} /> Add User
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search name, email, business, phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all">
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <select value={plan} onChange={e => { setPlan(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all">
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Customer','Plan','Status','Trial End','Next Billing','Last Payment','Total Paid','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-450">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-450">No users found</td></tr>
              ) : users.map(u => {
                const trialDays  = daysUntil(u.trial_end_date)
                const billingDue = daysUntil(u.next_billing_date)
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <Link to={`/users/${u.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                        {u.full_name}
                      </Link>
                      <p className="text-xs text-gray-450 mt-0.5">{u.business_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-4 py-4"><PlanBadge plan={u.plan} /></td>
                    <td className="px-4 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-4">
                      {u.trial_end_date ? (
                        <div>
                          <p className="text-gray-700 font-medium text-xs">{formatDate(u.trial_end_date)}</p>
                          {u.status === 'trial' && trialDays != null && (
                            <p className={`text-[10px] font-bold mt-0.5 ${trialDays <= 3 ? 'text-red-500' : trialDays <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                              {trialDays > 0 ? `${trialDays}d left` : 'Expired'}
                            </p>
                          )}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {u.next_billing_date ? (
                        <div>
                          <p className="text-gray-700 font-medium text-xs">{formatDate(u.next_billing_date)}</p>
                          {billingDue != null && billingDue <= 7 && (
                            <p className={`text-[10px] font-bold mt-0.5 ${billingDue <= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                              Due in {billingDue}d
                            </p>
                          )}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-700 font-medium text-xs">{formatDate(u.last_payment_date)}</p>
                      {u.last_payment_amount > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(u.last_payment_amount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-800">{formatCurrency(u.total_paid)}</td>
                    <td className="px-4 py-4">
                      <Link to={`/users/${u.id}`}
                        className="text-indigo-600 hover:text-indigo-850 text-xs font-bold bg-indigo-50 hover:bg-indigo-100/70 px-2.5 py-1.5 rounded-lg transition-colors">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                )
              })}
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
