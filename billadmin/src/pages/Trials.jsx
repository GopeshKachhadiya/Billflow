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
    <div className="space-y-6 text-on-surface">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Trial Management</h1>
        <p className="text-on-surface-variant text-sm mt-0.5">{users.length} users on trial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-5 shadow-xs">
          <p className="text-xs text-secondary font-bold uppercase tracking-wider">Active Trials</p>
          <p className="text-3xl font-extrabold text-on-surface mt-1">{active.length}</p>
        </div>
        <div className="bg-error/10 border border-error/20 rounded-xl p-5 shadow-xs">
          <p className="text-xs text-error font-bold uppercase tracking-wider">Expiring in 7 Days</p>
          <p className="text-3xl font-extrabold text-on-surface mt-1">{urgentUsers.length}</p>
        </div>
        <div className="bg-input-bg border border-outline-variant/20 rounded-xl p-5 shadow-xs">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Expired (Unconverted)</p>
          <p className="text-3xl font-extrabold text-on-surface mt-1">{expired.length}</p>
        </div>
      </div>

      {urgentUsers.length > 0 && (
        <div className="obsidian-card rounded-xl border border-outline-variant/15 overflow-hidden">
          <div className="bg-error/5 px-5 py-3 border-b border-error/20">
            <h2 className="text-sm font-bold text-error">⚠️ Expiring Within 7 Days</h2>
          </div>
          <TrialTable users={urgentUsers} onExtend={extend} onConvert={convert} extending={extending} urgent />
        </div>
      )}

      <div className="obsidian-card rounded-xl border border-outline-variant/15 overflow-hidden">
        <div className="px-5 py-3 border-b border-outline-variant/15">
          <h2 className="text-sm font-semibold text-on-surface">All Active Trials ({active.length})</h2>
        </div>
        <TrialTable users={active} onExtend={extend} onConvert={convert} extending={extending} />
      </div>

      {expired.length > 0 && (
        <div className="obsidian-card rounded-xl border border-outline-variant/15 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/15 bg-input-bg">
            <h2 className="text-sm font-semibold text-on-surface-variant">Expired Trials ({expired.length})</h2>
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
          <tr className="bg-surface-container-low border-b border-outline-variant/15">
            {['Customer','Email','Plan','Trial End','Days Left','Actions'].map(h =>
              <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {users.map(u => {
            const left = daysUntil(u.trial_end_date)
            return (
              <tr key={u.id} className="hover:bg-surface-container-high/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-on-surface text-xs">{u.full_name}</p>
                  <p className="text-xs text-on-surface-variant">{u.business_name}</p>
                </td>
                <td className="px-4 py-3 text-on-surface-variant font-medium text-xs">{u.email}</td>
                <td className="px-4 py-3 capitalize text-xs font-semibold">{u.plan}</td>
                <td className="px-4 py-3 text-xs font-medium">{formatDate(u.trial_end_date)}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold text-xs ${left == null ? 'text-on-surface-variant/40' : left <= 0 ? 'text-error' : left <= 3 ? 'text-error' : left <= 7 ? 'text-tertiary' : 'text-primary'}`}>
                    {left == null ? '—' : left <= 0 ? 'Expired' : `${left} days`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onExtend(u, 7)}  disabled={extending === u.id}
                      className="text-xs border border-outline-variant/30 px-2.5 py-1 rounded-lg hover:bg-surface-container-high font-bold disabled:opacity-40 text-on-surface transition-colors bg-transparent">+7d</button>
                    <button onClick={() => onExtend(u, 14)} disabled={extending === u.id}
                      className="text-xs border border-outline-variant/30 px-2.5 py-1 rounded-lg hover:bg-surface-container-high font-bold disabled:opacity-40 text-on-surface transition-colors bg-transparent">+14d</button>
                    <button onClick={() => onConvert(u)}
                      className="text-xs accent-gradient hover:opacity-90 text-white px-3 py-1.5 rounded-lg font-bold shadow-md shadow-primary/10 transition-all teal-glow">→ Activate</button>
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
