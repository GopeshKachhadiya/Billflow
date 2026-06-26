import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Plus, ArrowUpRight, Search, FileText, Calendar, Wallet } from 'lucide-react'
import { usePayments } from '../hooks/usePayments'
import { useUsers, addPayment } from '../hooks/useUsers'
import { formatCurrency, formatDate, callAdminWebhook } from '../lib/utils'
import { StatusBadge, PlanBadge } from '../components/ui/StatusBadge'
import KPICard from '../components/ui/KPICard'

export default function Billing() {
  const { payments, stats, loading: paymentsLoading, refetch } = usePayments()
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
    if (!form.userId || !form.amount || !form.payment_date) {
      alert('Please fill out all required fields')
      return
    }

    setSaving(true)
    try {
      const selectedUser = users.find(u => u.id === form.userId)
      await addPayment(form.userId, {
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference: form.reference,
        notes: form.notes,
        status: 'received'
      })

      // Trigger n8n webhook alert
      if (selectedUser) {
        await callAdminWebhook('/webhook/admin-payment-received', {
          event: 'payment_received',
          user_email: selectedUser.email,
          user_name: selectedUser.full_name,
          business_name: selectedUser.business_name,
          amount: form.amount,
          reference: form.reference
        })
      }

      setShowCollectModal(false)
      setForm({
        userId: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference: '',
        notes: ''
      })
      refetch()
    } catch (err) {
      console.error(err)
      alert('Failed to record payment: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredPayments = payments.filter(p =>
    p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeUsersForPayment = users.filter(u => u.status !== 'cancelled')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage customer plans and collections</p>
        </div>
        <button
          onClick={() => setShowCollectModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-green-100 hover:scale-[1.02] flex items-center gap-2">
          <Plus size={16} /> Collect Manual Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Collected (All-Time)" value={formatCurrency(stats.totalCollected)} color="green" icon={Wallet} subtitle="Confirmed payments" />
        <KPICard title="Expected MRR Run-rate" value={formatCurrency(
          (stats.planBreakdown.starter || 0) + (stats.planBreakdown.professional || 0) + (stats.planBreakdown.enterprise || 0)
        )} color="indigo" icon={CreditCard} subtitle="Active billing cycle sum" />
        <KPICard title="Upcoming Dues (Next 90 Days)" value={stats.upcomingDues.length + ' accounts'} color="blue" icon={Calendar} subtitle="Subscribers with next payment setup" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Tables of Upcoming Dues & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Dues */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover-glow transition-all">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Upcoming Dues (Next 90 Days)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Due Amount</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-55">
                  {paymentsLoading ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-400">Loading dues...</td></tr>
                  ) : stats.upcomingDues.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-400">No dues pending in next 90 days.</td></tr>
                  ) : stats.upcomingDues.map((due, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/users/${due.user_id}`} className="font-semibold text-gray-950 text-xs hover:text-indigo-650">
                          {due.user_name}
                        </Link>
                        <p className="text-[10px] text-gray-400">{due.business_name}</p>
                      </td>
                      <td className="px-4 py-3"><PlanBadge plan={due.plan} /></td>
                      <td className="px-4 py-3 font-bold text-gray-900 text-xs">{formatCurrency(due.amount)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-600">{formatDate(due.due_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${due.days_left <= 7 ? 'text-rose-600' : due.days_left <= 30 ? 'text-amber-500' : 'text-gray-450'}`}>
                          {due.days_left === 0 ? 'Due Today' : `${due.days_left} days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover-glow transition-all">
            <div className="px-5 py-4 border-b border-gray-150 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">All Received Payments</h2>
              <div className="relative w-full max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer, reference..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Reference</th>
                    <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-55">
                  {paymentsLoading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading payments...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No payment logs found.</td></tr>
                  ) : filteredPayments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-gray-600">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/users/${p.user_id}`} className="font-semibold text-xs text-gray-900 hover:text-indigo-650">
                          {p.user_name}
                        </Link>
                        <p className="text-[10px] text-gray-400">{p.business_name}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 text-xs">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 capitalize text-xs font-semibold text-gray-655">{p.payment_method.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.reference || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'received' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-750 border border-red-200'}`}>
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

        {/* RIGHT COLUMN - Plan Distribution */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover-glow transition-all">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">Revenue Distribution By Plan</h2>
            <div className="space-y-4">
              {[
                { name: 'Starter Plan', key: 'starter', color: 'bg-slate-100 border-slate-200 text-slate-700', value: stats.planBreakdown.starter || 0 },
                { name: 'Professional Plan', key: 'professional', color: 'bg-indigo-100 border-indigo-200 text-indigo-700', value: stats.planBreakdown.professional || 0 },
                { name: 'Enterprise Plan', key: 'enterprise', color: 'bg-purple-100 border-purple-200 text-purple-700', value: stats.planBreakdown.enterprise || 0 }
              ].map(plan => {
                const total = (stats.planBreakdown.starter || 0) + (stats.planBreakdown.professional || 0) + (stats.planBreakdown.enterprise || 0)
                const percent = total > 0 ? Math.round((plan.value / total) * 100) : 0
                return (
                  <div key={plan.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${plan.key === 'starter' ? 'bg-slate-400' : plan.key === 'professional' ? 'bg-indigo-500' : 'bg-purple-500'}`} />
                        {plan.name}
                      </span>
                      <span>{formatCurrency(plan.value)} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${plan.key === 'starter' ? 'bg-slate-400' : plan.key === 'professional' ? 'bg-indigo-500' : 'bg-purple-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Automated Billing Alerts</h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              When trial runs finish or a subscription is created, notifications will trigger via n8n directly to customers. All upcoming dues in the next 30 days are scheduled to trigger automated reminders on day 12 and 13.
            </p>
          </div>
        </div>
      </div>

      {/* Collect Manual Payment Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Record Customer Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Customer*</label>
                <select
                  required
                  value={form.userId}
                  onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">Choose customer...</option>
                  {activeUsersForPayment.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.business_name} - {u.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount (₹)*</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="2599"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date*</label>
                  <input
                    type="date"
                    required
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">UTR / UPI Ref Number</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="UTR1234567890"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Enter manual reference or internal payment notes..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-sm">
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
