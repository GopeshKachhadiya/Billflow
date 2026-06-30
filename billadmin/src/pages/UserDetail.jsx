import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Trash2, Send, RefreshCw } from 'lucide-react'
import { useUser, updateUser, addPayment, logActivity, deleteUser } from '../hooks/useUsers'
import { StatusBadge, PlanBadge } from '../components/ui/StatusBadge'
import { formatCurrency, formatDate, formatDatetime, daysUntil, callAdminWebhook } from '../lib/utils'
import { supabase } from '../lib/supabase'

export default function UserDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user, payments, notes, logs, loading, refetch } = useUser(id)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showNoteModal,    setShowNoteModal   ] = useState(false)
  const [editingConfig,    setEditingConfig   ] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount:'', payment_date:'', payment_method:'bank_transfer', reference:'', notes:'' })
  const [noteText,    setNoteText   ] = useState('')
  const [noteCategory, setNoteCategory] = useState('general')
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  if (!user)   return <div className="text-center py-20 text-gray-550 font-semibold">User not found.</div>

  const trialDaysLeft  = daysUntil(user.trial_end_date)
  const billingDaysLeft = daysUntil(user.next_billing_date)

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return
    const updates = { status: newStatus }
    if (newStatus === 'active' && !user.activated_at) updates.activated_at = new Date().toISOString()
    if (newStatus === 'suspended') updates.suspended_at = new Date().toISOString()
    if (newStatus === 'cancelled') updates.cancelled_at = new Date().toISOString()
    await updateUser(id, updates)
    await callAdminWebhook('/webhook/admin-user-status', {
      event: 'status_changed', user_email: user.email, user_name: user.full_name,
      business_name: user.business_name, new_status: newStatus
    })
    refetch()
  }

  const handleDeleteUser = async () => {
    if (!confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY delete user "${user.full_name}"?\n\nThis will remove all database records, activity logs, payments, and disable their login credentials. This action CANNOT be undone.`)) return
    
    setSaving(true)
    try {
      await deleteUser(id)
      await callAdminWebhook('/webhook/admin-user-deleted', {
        event: 'user_deleted',
        user_email: user.email,
        user_name: user.full_name,
        business_name: user.business_name
      }).catch(err => console.error('Webhook error:', err))
      
      alert('User deleted successfully.')
      navigate('/users')
    } catch (e) {
      alert('Error deleting user: ' + e.message)
      setSaving(false)
    }
  }

  const handleExtendTrial = async (days) => {
    const current  = user.trial_end_date ? new Date(user.trial_end_date) : new Date()
    const newEnd   = new Date(Math.max(current, new Date()))
    newEnd.setDate(newEnd.getDate() + days)
    await updateUser(id, { trial_end_date: newEnd.toISOString().split('T')[0] })
    await logActivity(id, 'trial_extended', `Trial extended by ${days} days`, 'admin')
    refetch()
  }

  const handleAddPayment = async (e) => {
    e.preventDefault(); setSaving(true)
    await addPayment(id, paymentForm)
    await callAdminWebhook('/webhook/admin-payment-received', {
      event: 'payment_received', user_email: user.email,
      user_name: user.full_name, business_name: user.business_name,
      amount: paymentForm.amount, reference: paymentForm.reference
    })
    setShowPaymentModal(false)
    setPaymentForm({ amount:'', payment_date:'', payment_method:'bank_transfer', reference:'', notes:'' })
    setSaving(false); refetch()
  }

  const handleAddNote = async (e) => {
    e.preventDefault(); setSaving(true)
    await supabase.from('admin_support_notes').insert([{ user_id: id, note: noteText, category: noteCategory, created_by: 'admin' }])
    setShowNoteModal(false); setNoteText(''); setSaving(false); refetch()
  }

  const handleSendEmail = async (template) => {
    await callAdminWebhook('/webhook/admin-send-email', {
      template, user_email: user.email, user_name: user.full_name,
      business_name: user.business_name, plan: user.plan,
      trial_end_date: user.trial_end_date, next_billing_date: user.next_billing_date
    })
    alert('Email queued via n8n.')
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link to="/users" className="text-on-surface-variant hover:text-primary bg-surface-container-low p-2.5 border border-outline-variant/30 rounded-xl hover:shadow-sm transition-all"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-on-surface leading-tight">{user.full_name}</h1>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mt-0.5">{user.business_name} · <span className="font-mono lowercase text-on-surface-variant/70 font-normal">{user.email}</span></p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={user.status} />
          <PlanBadge plan={user.plan} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Profile + Billing + Config */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile Card */}
          <div className="obsidian-card p-6 rounded-xl">
            <h2 className="text-sm font-semibold text-on-surface mb-4 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Profile Details</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              {[
                ['Full Name',      user.full_name],
                ['Business Name',  user.business_name],
                ['Email',          user.email],
                ['Phone',          user.phone || '—'],
                ['GSTIN',          user.gstin || '—'],
                ['City / State',   `${user.city || '—'}, ${user.state || '—'}`],
                ['Onboarded',      formatDate(user.onboarded_at)],
                ['Referral Source',user.referral_source || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-on-surface font-semibold mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Card */}
          <div className="obsidian-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
              <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Billing Information</h2>
              <button onClick={() => setShowPaymentModal(true)}
                className="text-xs accent-gradient text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-bold shadow-md shadow-primary/10">
                <Plus size={12} /> Record Payment
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              {[
                ['Plan',           user.plan],
                ['Billing Cycle',  user.billing_cycle],
                ['Plan Price',     formatCurrency(user.plan_price) + ' / ' + user.billing_cycle],
                ['Total Paid',     formatCurrency(user.total_paid)],
                ['Last Payment',   formatDate(user.last_payment_date) + ' — ' + formatCurrency(user.last_payment_amount)],
                ['Next Billing',   user.next_billing_date ? `${formatDate(user.next_billing_date)} (${billingDaysLeft != null ? billingDaysLeft + 'd' : '—'})` : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-on-surface font-semibold mt-1 capitalize">{value}</p>
                </div>
              ))}
            </div>

            {/* Payment History */}
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Payment Logs</h3>
            {payments.length === 0 ? (
              <p className="text-xs text-on-surface-variant bg-input-bg p-4 rounded-xl text-center">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-on-surface-variant bg-surface-container-low border-b border-outline-variant/15">
                      <th className="p-2">Date</th><th className="p-2">Amount</th>
                      <th className="p-2">Method</th><th className="p-2">Reference</th><th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {payments.map(p => (
                      <tr key={p.id} className="text-on-surface">
                        <td className="p-2">{formatDate(p.payment_date)}</td>
                        <td className="p-2 font-bold text-primary">{formatCurrency(p.amount)}</td>
                        <td className="p-2 capitalize">{p.payment_method}</td>
                        <td className="p-2 font-mono text-on-surface-variant">{p.reference || '—'}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'received' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BillFlow Config */}
          <div className="obsidian-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
              <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider">BillFlow Configuration</h2>
              <button onClick={() => setEditingConfig(v => !v)} className="text-xs text-primary hover:text-white font-bold transition-colors">
                {editingConfig ? 'Cancel' : 'Edit Configuration'}
              </button>
            </div>
            {editingConfig ? (
              <ConfigEditForm user={user} onSave={async (data) => {
                await updateUser(id, data); setEditingConfig(false); refetch()
              }} />
            ) : (
              <div className="grid grid-cols-1 gap-3 text-sm">
                {[
                  ['License Key',     user.license_key   || '—'],
                  ['Supabase URL',    user.their_supabase_url || '—'],
                  ['Supabase Key',    user.their_supabase_key ? '••••••••' + user.their_supabase_key.slice(-6) : '—'],
                  ['n8n URL',         user.their_n8n_url  || '—'],
                  ['n8n Secret',      user.their_n8n_secret ? '••••••••' : '—'],
                  ['App Version',     user.app_version   || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex border-b border-outline-variant/10 pb-2">
                    <span className="text-on-surface-variant font-bold uppercase tracking-wider text-xs w-32 shrink-0">{label}</span>
                    <span className="text-on-surface font-mono text-xs break-all">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN — Actions + Trial + Notes + Log */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="obsidian-card p-6 rounded-xl">
            <h2 className="text-sm font-semibold text-on-surface mb-3 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => handleSendEmail('welcome')}
                className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high flex items-center gap-2 font-bold transition-colors">
                <Send size={12} /> Send Welcome Email
              </button>
              <button onClick={() => handleSendEmail('trial_reminder')}
                className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-surface-container text-secondary hover:bg-surface-container-high flex items-center gap-2 font-bold transition-colors">
                <Send size={12} /> Send Trial Reminder
              </button>
              <button onClick={() => handleSendEmail('payment_reminder')}
                className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-surface-container text-tertiary hover:bg-surface-container-high flex items-center gap-2 font-bold transition-colors">
                <Send size={12} /> Send Payment Reminder
              </button>
              <hr className="my-3 border-outline-variant/20" />
              {user.status !== 'active' && (
                <button onClick={() => handleStatusChange('active')}
                  className="w-full text-center text-xs px-3 py-2.5 rounded-xl accent-gradient text-white font-bold transition-colors shadow-md shadow-primary/10">
                  ✓ Activate Account
                </button>
              )}
              {user.status === 'trial' && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Extend Trial</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleExtendTrial(7)}  className="flex-1 text-[11px] font-bold px-2 py-1.5 border border-outline-variant/30 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors">+7d</button>
                    <button onClick={() => handleExtendTrial(14)} className="flex-1 text-[11px] font-bold px-2 py-1.5 border border-outline-variant/30 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors">+14d</button>
                    <button onClick={() => handleExtendTrial(30)} className="flex-1 text-[11px] font-bold px-2 py-1.5 border border-outline-variant/30 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors">+30d</button>
                  </div>
                </div>
              )}
              {user.status === 'active' && (
                <button onClick={() => handleStatusChange('suspended')}
                  className="w-full text-center text-xs px-3 py-2.5 rounded-xl bg-tertiary-dark hover:bg-tertiary text-white font-bold transition-colors">
                  ⏸ Suspend Account
                </button>
              )}
              {user.status === 'suspended' && (
                <button onClick={() => handleStatusChange('active')}
                  className="w-full text-center text-xs px-3 py-2.5 rounded-xl accent-gradient text-white font-bold transition-colors shadow-md shadow-primary/10">
                  ▶ Reactivate Account
                </button>
              )}
              {user.status !== 'cancelled' && (
                <button onClick={() => handleStatusChange('cancelled')}
                  className="w-full text-center text-xs px-3 py-2.5 rounded-xl bg-[#ffb4ab]/10 text-error hover:bg-[#ffb4ab]/20 font-bold transition-colors">
                  ✕ Cancel Account
                </button>
              )}
              <button onClick={handleDeleteUser} disabled={saving}
                className="w-full text-center text-xs px-3 py-2.5 rounded-xl bg-error-container/20 hover:bg-error-container/30 border border-error-container/35 text-error font-bold transition-colors mt-2 flex items-center justify-center gap-1.5 shadow-sm">
                <Trash2 size={12} /> Delete User Permanently
              </button>
            </div>
          </div>

          {/* Trial Status */}
          {user.status === 'trial' && (
            <div className={`rounded-xl border p-4 shadow-sm ${trialDaysLeft != null && trialDaysLeft <= 3 ? 'bg-error/10 border-error/25 text-error' : 'bg-primary/10 border-primary/25 text-primary'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider">Trial Days Remaining</p>
              <p className="text-3xl font-extrabold mt-1">{trialDaysLeft != null ? trialDaysLeft : '—'} days</p>
              <p className="text-xs opacity-75 mt-0.5">Expires {formatDate(user.trial_end_date)}</p>
            </div>
          )}

          {/* Support Notes */}
          <div className="obsidian-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-3 border-b border-outline-variant/20 pb-2">
              <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Internal Notes</h2>
              <button onClick={() => setShowNoteModal(true)} className="text-xs text-primary hover:text-white font-bold transition-colors">+ Add Note</button>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-on-surface-variant bg-input-bg p-4 rounded-xl text-center">No notes yet.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {notes.map(n => (
                  <div key={n.id} className="text-xs border-l-2 border-primary pl-3 py-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider capitalize">{n.category}</span>
                      <span className="text-[10px] text-on-surface-variant/70 font-medium">{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-on-surface leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="obsidian-card p-6 rounded-xl">
            <h2 className="text-sm font-semibold text-on-surface mb-3 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">User Logs</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">No events logged yet.</p>
              ) : logs.map(l => (
                <div key={l.id} className="text-xs border-b border-outline-variant/10 pb-2">
                  <p className="text-on-surface font-semibold leading-tight">{l.description}</p>
                  <p className="text-[10px] text-on-surface-variant/70 font-mono mt-0.5">{formatDatetime(l.created_at)} · {l.performed_by}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

       {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-surface-container rounded-2xl shadow-2xl w-full max-w-md p-6 border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2">Record Payment — {user.full_name}</h3>
            <form onSubmit={handleAddPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Amount (₹)*</label>
                  <input type="number" required value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({...p, amount: e.target.value}))}
                    className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Payment Date*</label>
                  <input type="date" required value={paymentForm.payment_date}
                    onChange={e => setPaymentForm(p => ({...p, payment_date: e.target.value}))}
                    className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Payment Method</label>
                <select value={paymentForm.payment_method}
                  onChange={e => setPaymentForm(p => ({...p, payment_method: e.target.value}))}
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer">
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">UTR / Reference No.</label>
                <input type="text" value={paymentForm.reference}
                  onChange={e => setPaymentForm(p => ({...p, reference: e.target.value}))}
                  placeholder="UTR1234567890"
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Notes</label>
                <textarea value={paymentForm.notes}
                  onChange={e => setPaymentForm(p => ({...p, notes: e.target.value}))}
                  rows={2}
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-outline-variant/30 text-on-surface py-2 rounded-xl text-sm font-semibold hover:bg-surface-container-high bg-transparent transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 accent-gradient text-white py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-md shadow-primary/10">
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-surface-container rounded-2xl shadow-2xl w-full max-w-md p-6 border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-4 border-b border-outline-variant/20 pb-2">Add Internal Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Category</label>
                <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)}
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer">
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="sales">Sales</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Note*</label>
                <textarea required value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNoteModal(false)}
                  className="flex-1 border border-outline-variant/30 text-on-surface py-2 rounded-xl text-sm font-semibold hover:bg-surface-container-high bg-transparent transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 accent-gradient text-white py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-md shadow-primary/10">
                  {saving ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline config edit form
function ConfigEditForm({ user, onSave }) {
  const [form, setForm] = useState({
    their_supabase_url:  user.their_supabase_url  || '',
    their_supabase_key:  user.their_supabase_key  || '',
    their_n8n_url:       user.their_n8n_url        || '',
    their_n8n_secret:    user.their_n8n_secret     || '',
    license_key:         user.license_key          || '',
    app_version:         user.app_version          || '1.0.0',
  })
  const [saving, setSaving] = useState(false)
  const handle = async (e) => {
    e.preventDefault(); setSaving(true)
    await onSave(form); setSaving(false)
  }
  return (
    <form onSubmit={handle} className="space-y-3 text-sm">
      {[
        ['License Key',    'license_key',          'BF-XXXXX-XXXXX-XXXXX'],
        ['Supabase URL',   'their_supabase_url',   'https://xxx.supabase.co'],
        ['Supabase Key',   'their_supabase_key',   'eyJ...'],
        ['n8n URL',        'their_n8n_url',         'http://localhost:5678'],
        ['n8n Secret',     'their_n8n_secret',      'secret-token'],
        ['App Version',    'app_version',           '1.0.0'],
      ].map(([label, key, ph]) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{label}</label>
          <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
            placeholder={ph}
            className="w-full border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none font-mono" />
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="w-full accent-gradient text-white py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-md shadow-primary/10 mt-2">
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </form>
  )
}
