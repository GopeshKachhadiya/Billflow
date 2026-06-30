import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, AlertTriangle, Clock, CreditCard, Wallet, Plus, Search, Calendar } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import { usePayments } from '../hooks/usePayments'
import { useUsers, addPayment } from '../hooks/useUsers'
import KPICard from '../components/ui/KPICard'
import { formatCurrency, formatDate, callAdminWebhook } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function Dashboard() {
  const { stats, loading, error } = useStats()
  const { payments, stats: paymentStats, loading: paymentsLoading, refetch } = usePayments()
  const { users, loading: usersLoading } = useUsers({ limit: 1000 })
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({
    userId: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    notes: ''
  })

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!form.userId || !form.amount || !form.payment_date) return
    
    setSaving(true)
    try {
      const selectedUser = users?.find(u => u.id === form.userId)
      if (!selectedUser) throw new Error('User not found')
      
      await addPayment(form.userId, {
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference: form.reference,
        notes: form.notes,
        status: 'received'
      })

      await callAdminWebhook('/webhook/admin-payment-received', {
        event: 'payment_received',
        user_email: selectedUser.email,
        user_name: selectedUser.full_name,
        business_name: selectedUser.business_name,
        amount: form.amount,
        reference: form.reference
      })

      setShowCollectModal(false)
      setForm({ userId: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', reference: '', notes: '' })
      refetch()
    } catch (err) {
      alert('Failed to record payment: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredPayments = payments?.filter(p =>
    (p.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.reference || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const activeUsersForPayment = users?.filter(u => u.status !== 'cancelled') || []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white" />
    </div>
  )

  if (error) return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border border-red-200 dark:border-red-900/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-xs">
      <p className="font-semibold">Failed to load statistics</p>
      <p className="mt-1">{error.message}</p>
    </div>
  )

  if (!stats) return null

  return (
    <div className="space-y-6 text-zinc-900 dark:text-white pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-900">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link to="/users/add"
          className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <Plus size={14} /> Add New User
        </Link>
      </div>

      {/* Alerts */}
      {stats.expiringTrials?.length > 0 && (
        <div className="bg-amber-500/5 dark:bg-[#0e0e11] border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
              <AlertTriangle size={15} />
            </div>
            <div>
              <p className="font-semibold text-xs text-amber-600 dark:text-amber-500">
                Attention Required: {stats.expiringTrials.length} trial{stats.expiringTrials.length > 1 ? 's' : ''} expiring within 7 days
              </p>
              <p className="text-[0.75rem] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-relaxed max-w-xl truncate">
                {stats.expiringTrials.map(u => `${u.full_name} (${u.business_name})`).join(', ')}
              </p>
            </div>
          </div>
          <Link to="/trials" className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white font-semibold text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            Manage Trials
          </Link>
        </div>
      )}

      {/* KPI Cards — Revenue */}
      <div className="space-y-2">
        <h2 className="text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">Revenue Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="MRR" value={formatCurrency(stats.mrr)} icon={CreditCard} progress={72} trend="+12%" />
          <KPICard title="ARR" value={formatCurrency(stats.arr)} icon={TrendingUp} progress={85} trend="+8%" />
          <KPICard title="Collections" value={formatCurrency(stats.monthRevenue)} icon={Wallet} progress={60} subtitle="This Month" />
          <KPICard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} progress={100} subtitle="All-Time" />
        </div>
      </div>

      {/* KPI Cards — Users */}
      <div className="space-y-2">
        <h2 className="text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">User Acquisition & Retention</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Users" value={stats.total} icon={Users} subtitle="Total accounts" />
          <KPICard title="Active" value={stats.active} icon={Users} subtitle="Subscribers" />
          <KPICard title="On Trial" value={stats.trial} icon={Clock} subtitle="Trials" />
          <KPICard title="Suspended" value={stats.suspended} icon={AlertTriangle} subtitle="Flagged" />
          <KPICard title="Conv. Rate" value={stats.conversionRate + '%'} icon={TrendingUp} subtitle="Trial to paid" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#1f1f23] p-5 rounded-xl flex flex-col gap-4 h-[350px]">
          <div className="flex justify-between items-center">
            <h4 className="text-[0.75rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Monthly Revenue Trend</h4>
          </div>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-grad-start)" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="var(--chart-grad-end)" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v)} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => ['₹' + v.toLocaleString('en-IN'), 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', backgroundColor: 'var(--card-bg)', color: 'var(--on-surface-rgb)' }} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[3,3,0,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#1f1f23] p-5 rounded-xl flex flex-col gap-4 h-[350px]">
          <div className="flex justify-between items-center">
            <h4 className="text-[0.75rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Customer Growth Trend</h4>
          </div>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-grad-start)" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="var(--chart-grad-end)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', backgroundColor: 'var(--card-bg)', color: 'var(--on-surface-rgb)' }} />
                <Area type="monotone" dataKey="users" stroke="var(--chart-line-stroke)" strokeWidth={1.5} fill="url(#areaGrad)" dot={{ r: 3, strokeWidth: 1, fill: 'var(--chart-line-stroke)', stroke: 'rgb(var(--bg-color-rgb))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Billing Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">Billing & Payments</h2>
          <button
            onClick={() => setShowCollectModal(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Collect Payment
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Collected" value={formatCurrency(paymentStats?.totalCollected)} icon={Wallet} subtitle="All-Time" />
          <KPICard title="Expected MRR" value={formatCurrency(
            (paymentStats?.planBreakdown?.starter || 0) + 
            (paymentStats?.planBreakdown?.professional || 0) + 
            (paymentStats?.planBreakdown?.enterprise || 0)
          )} icon={CreditCard} subtitle="Active billing" />
          <KPICard title="Upcoming Dues" value={(paymentStats?.upcomingDues?.length || 0) + ' accounts'} icon={Calendar} subtitle="Next 90 days" />
        </div>

        {/* Recent Payments Table Card */}
        <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#1f1f23] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider">Recent Payments</h2>
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-550" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase font-semibold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/55 dark:divide-zinc-900 text-zinc-600 dark:text-zinc-300">
                {paymentsLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-zinc-400 dark:text-zinc-500">Loading payments...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-zinc-400 dark:text-zinc-550">No payment logs found.</td></tr>
                ) : filteredPayments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/users/${p.user_id}`} className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300">
                        {p.user_name}
                      </Link>
                      <p className="text-[0.7rem] text-zinc-400 dark:text-zinc-500">{p.business_name}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 capitalize text-zinc-500 dark:text-zinc-400">{p.payment_method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400 dark:text-zinc-500">{p.reference || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${p.status === 'received' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-[#0e0e11] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-850 text-zinc-900 dark:text-white">
            <h3 className="text-sm font-bold mb-4 border-b border-zinc-100 dark:border-zinc-855 pb-2">Record Customer Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Select Customer*</label>
                <select
                  required
                  value={form.userId}
                  onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer">
                  <option value="" className="bg-white dark:bg-zinc-950">Choose customer...</option>
                  {activeUsersForPayment.map(u => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-zinc-950">
                      {u.full_name} ({u.business_name} - {u.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Amount (₹)*</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="2599"
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Date*</label>
                  <input
                    type="date"
                    required
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 cursor-pointer">
                  <option value="bank_transfer" className="bg-white dark:bg-zinc-950">Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi" className="bg-white dark:bg-zinc-950">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="cheque" className="bg-white dark:bg-zinc-950">Cheque</option>
                  <option value="cash" className="bg-white dark:bg-zinc-950">Cash</option>
                  <option value="razorpay" className="bg-white dark:bg-zinc-950">Razorpay</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">UTR / UPI Ref Number</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="UTR1234567890"
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Enter reference or internal notes..."
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="flex-1 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 py-2 rounded-lg text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-transparent transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">
                  {saving ? 'Recording...' : 'Collect Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}