import { useUsers } from '../hooks/useUsers'
import { updateUser, logActivity } from '../hooks/useUsers'
import { formatDate, daysUntil } from '../lib/utils'
import { useState } from 'react'

export default function Trials() {
  const { users, loading, refetch } = useUsers({ status: 'trial', limit: 200 })
  const [extending, setExtending] = useState(null)

  const extend = async (user, days) => {
    setExtending(user.id)
    const cur = user.trial_end_date ? new Date(user.trial_end_date) : new Date()
    const newEnd = new Date(Math.max(cur, new Date()))
    newEnd.setDate(newEnd.getDate() + days)
    await updateUser(user.id, { trial_end_date: newEnd.toISOString().split('T')[0] })
    await logActivity(user.id, 'trial_extended', `Trial extended by ${days} days to ${newEnd.toISOString().split('T')[0]}`, 'admin')
    setExtending(null)
    refetch()
  }

  const convert = async (user) => {
    if (!confirm(`Convert ${user.full_name} from trial to active paid account?`)) return
    await updateUser(user.id, {
      status: 'active', converted_from_trial: true, activated_at: new Date().toISOString()
    })
    await logActivity(user.id, 'trial_converted', 'Converted from trial to active account', 'admin')
    refetch()
  }

  const todayStr  = new Date().toISOString().split('T')[0]
  const active    = users.filter(u => u.trial_end_date >= todayStr)
  const expired   = users.filter(u => u.trial_end_date < todayStr)
  const urgentUsers = active.filter(u => {
    const d = daysUntil(u.trial_end_date)
    return d != null && d <= 7
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Trial Management</h1>
        <p className="text-gray-550 dark:text-slate-400 text-sm">{users.length} users on trial</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 shadow-xs">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Active Trials</p>
          <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">{active.length}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 shadow-xs">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Expiring in 7 Days</p>
          <p className="text-3xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">{urgentUsers.length}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <p className="text-xs text-gray-600 dark:text-slate-400 font-bold uppercase tracking-wider">Expired (Unconverted)</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-200 mt-1">{expired.length}</p>
        </div>
      </div>

      {urgentUsers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm overflow-hidden hover-glow transition-all">
          <div className="bg-rose-50/50 dark:bg-rose-950/10 px-5 py-3 border-b border-rose-100 dark:border-rose-900/30">
            <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400">⚠️ Expiring Within 7 Days</h2>
          </div>
          <TrialTable users={urgentUsers} onExtend={extend} onConvert={convert} extending={extending} urgent />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden hover-glow transition-all">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-205">All Active Trials ({active.length})</h2>
        </div>
        <TrialTable users={active} onExtend={extend} onConvert={convert} extending={extending} />
      </div>

      {expired.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden hover-glow transition-all">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
            <h2 className="text-sm font-semibold text-gray-755 dark:text-slate-300">Expired Trials ({expired.length})</h2>
          </div>
          <TrialTable users={expired} onExtend={extend} onConvert={convert} extending={extending} />
        </div>
      )}
    </div>
  )
}

function TrialTable({ users, onExtend, onConvert, extending }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-950/40 border-b border-gray-150 dark:border-slate-800">
            {['Customer','Email','Plan','Trial End','Days Left','Actions'].map(h =>
              <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {users.map(u => {
            const left = daysUntil(u.trial_end_date)
            return (
              <tr key={u.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-900 dark:text-slate-200 text-xs">{u.full_name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{u.business_name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-slate-400 font-medium text-xs">{u.email}</td>
                <td className="px-4 py-3 capitalize text-xs font-semibold">{u.plan}</td>
                <td className="px-4 py-3 text-xs font-medium">{formatDate(u.trial_end_date)}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold text-xs ${left == null ? 'text-gray-400' : left <= 0 ? 'text-rose-650' : left <= 3 ? 'text-rose-500' : left <= 7 ? 'text-amber-500' : 'text-green-600'}`}>
                    {left == null ? '—' : left <= 0 ? 'Expired' : `${left} days`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onExtend(u, 7)}  disabled={extending === u.id}
                      className="text-xs border border-gray-300 dark:border-slate-800 px-2.5 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 font-bold disabled:opacity-40 text-gray-700 dark:text-slate-300 transition-colors">+7d</button>
                    <button onClick={() => onExtend(u, 14)} disabled={extending === u.id}
                      className="text-xs border border-gray-300 dark:border-slate-800 px-2.5 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 font-bold disabled:opacity-40 text-gray-700 dark:text-slate-300 transition-colors">+14d</button>
                    <button onClick={() => onConvert(u)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-bold shadow-sm shadow-green-100 transition-colors">→ Activate</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
