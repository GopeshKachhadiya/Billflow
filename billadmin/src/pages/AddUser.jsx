import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '../hooks/useUsers'
import { generateLicenseKey, callAdminWebhook } from '../lib/utils'
import { supabase } from '../lib/supabase'

const PLANS = [
  { id: 'starter',      name: 'Starter',      price: 499,  desc: '50 bills/mo, 100 customers, Email only' },
  { id: 'professional', name: 'Professional', price: 999,  desc: '500 bills/mo, 1000 customers, Email + WhatsApp' },
  { id: 'enterprise',   name: 'Enterprise',   price: 1999, desc: 'Unlimited, all features, Multi-user, Priority support' },
]

export default function AddUser() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name:        '',
    business_name:    '',
    email:            '',
    phone:            '',
    gstin:            '',
    city:             '',
    state:            '',
    plan:             'starter',
    billing_cycle:    'monthly',
    plan_price:       499,
    status:           'trial',
    trial_days:       14,
    trial_start_date: new Date().toISOString().split('T')[0],
    trial_end_date:   new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    referral_source:  '',
    notes:            '',
    license_key:      generateLicenseKey(),
    their_supabase_url: '',
    their_supabase_key: '',
    their_n8n_url:    'http://localhost:5678',
    their_n8n_secret: '',
    app_version:      '1.0.0',
    password:         '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectPlan = (plan) => {
    const p = PLANS.find(p => p.id === plan)
    const prices = { monthly: p.price, quarterly: Math.round(p.price * 3 * 0.9), yearly: Math.round(p.price * 12 * 0.8) }
    set('plan', plan)
    set('plan_price', prices[form.billing_cycle])
  }

  const selectCycle = (cycle) => {
    const p     = PLANS.find(p => p.id === form.plan)
    const prices = { monthly: p.price, quarterly: Math.round(p.price * 3 * 0.9), yearly: Math.round(p.price * 12 * 0.8) }
    set('billing_cycle', cycle)
    set('plan_price', prices[cycle])
  }

  const updateTrialDays = (days) => {
    const end = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
    set('trial_days', days)
    set('trial_end_date', end)
  }

  const handleSubmit = async () => {
    if (!form.password || form.password.length < 6) {
      alert('Please set a password for the user (minimum 6 characters).')
      return
    }
    setSaving(true)
    try {
      // Step 1: Create the Supabase Auth account so the user can log into the consumer app
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true  // Auto-confirm email so user can log in immediately
      })
      if (authError) throw new Error('Failed to create auth account: ' + authError.message)

      // Step 2: Insert into admin_users table (exclude password from DB record)
      const userData = { ...form }
      delete userData.password
      
      // Dynamic configuration from environment variables
      userData.their_supabase_url = import.meta.env.VITE_SUPABASE_URL || ''
      userData.their_supabase_key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      userData.their_n8n_url      = import.meta.env.VITE_N8N_BASE_URL || ''
      userData.their_n8n_secret   = import.meta.env.VITE_N8N_SECRET || ''

      if (form.status === 'active') {
        userData.activated_at   = new Date().toISOString()
        userData.next_billing_date = form.trial_start_date
      }
      const created = await createUser(userData)

      // Step 3: Fire webhook for welcome email
      await callAdminWebhook('/webhook/admin-user-added', {
        event:         'new_user_added',
        user_email:    form.email,
        user_name:     form.full_name,
        business_name: form.business_name,
        plan:          form.plan,
        status:        form.status,
        trial_end:     form.trial_end_date,
        license_key:   form.license_key
      })
      navigate(`/users/${created.id}`)
    } catch (e) {
      alert('Error: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Add New User</h1>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 p-4 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs">
        {['Profile','Plan & Trial'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 justify-center first:justify-start last:justify-end">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === i+1 ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-500/20' : step > i+1 ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-slate-950 text-gray-400 dark:text-slate-500'}`}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span className={`text-xs font-semibold ${step === i+1 ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-550'}`}>{s}</span>
            {i < 1 && <span className="text-gray-200 dark:text-slate-800 mx-2 flex-1 border-t border-dashed border-gray-300 dark:border-slate-700" />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b border-gray-150 dark:border-slate-800 pb-2">Customer Info</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Full Name*',     'full_name',    'text',     'Rajesh Kumar'],
                ['Business Name*', 'business_name','text',     'Rajesh Enterprises'],
                ['Email*',         'email',        'email',    'rajesh@example.com'],
                ['Password*',      'password',     'password', 'Min 6 characters'],
                ['Phone*',         'phone',        'tel',      '9876543210'],
                ['GSTIN',          'gstin',        'text',     '27AABCU9603R1ZX'],
                ['City',           'city',         'text',     'Mumbai'],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    className="w-full border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra"
                  className="w-full border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Referral Source</label>
                <select value={form.referral_source} onChange={e => set('referral_source', e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-all">
                  <option value="">Select...</option>
                  <option value="referral">Referral</option>
                  <option value="google">Google Search</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="direct">Direct / Walk-in</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Internal Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                placeholder="Any internal notes about this customer..." />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 border-b border-gray-150 dark:border-slate-800 pb-2">Select Plan</h2>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map(p => (
                  <button key={p.id} type="button" onClick={() => selectPlan(p.id)}
                    className={`text-left border-2 rounded-xl p-4 transition-all hover:scale-[1.01] ${form.plan === p.id ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                    <p className="font-bold text-gray-900 dark:text-slate-200 text-sm">{p.name}</p>
                    <p className="text-indigo-650 dark:text-indigo-400 font-extrabold mt-1">₹{p.price}<span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">/mo</span></p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b border-gray-150 dark:border-slate-800 pb-2">Billing Cycle</h2>
              <div className="flex gap-3">
                {[['monthly','Monthly', 0],['quarterly','Quarterly (10% off)',10],['yearly','Yearly (20% off)',20]].map(([v,l,disc]) => (
                  <button key={v} type="button" onClick={() => selectCycle(v)}
                    className={`flex-1 border-2 rounded-xl p-3 text-sm text-center transition-all ${form.billing_cycle === v ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                    <p className="font-semibold text-xs uppercase tracking-wider">{l}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">₹{form.plan_price}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b border-gray-150 dark:border-slate-800 pb-2">Account Activation</h2>
              <div className="flex gap-3">
                {[['trial','Start 14-Day Trial'],['active','Activate Immediately (Paid)']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => set('status', v)}
                    className={`flex-1 border-2 rounded-xl p-3 text-sm text-center font-semibold transition-all ${form.status === v ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {form.status === 'trial' && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b border-gray-150 dark:border-slate-800 pb-2">Trial Duration</h2>
                <div className="flex gap-3">
                  {[7,14,30].map(d => (
                    <button key={d} type="button" onClick={() => updateTrialDays(d)}
                      className={`flex-1 border-2 rounded-xl p-3 text-sm font-semibold text-center transition-all ${form.trial_days === d ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                      {d} Days
                    </button>
                  ))}
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-semibold bg-indigo-50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30">Trial ends on: <span className="font-mono">{form.trial_end_date}</span></p>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Summary</p>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <p>Plan: <b className="text-slate-800 dark:text-slate-250 capitalize">{form.plan}</b> · <span className="capitalize">{form.billing_cycle}</span></p>
                <p>Price: <b className="text-slate-800 dark:text-slate-250">₹{form.plan_price}</b></p>
                <p>Status: <b className="text-slate-800 dark:text-slate-250 capitalize">{form.status}</b></p>
                {form.status === 'trial' && <p>Trial Ends: <b className="text-slate-800 dark:text-slate-250">{form.trial_end_date}</b></p>}
                <p>License Key: <b className="font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/40 rounded-lg px-2 py-0.5 leading-relaxed">{form.license_key}</b></p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="border border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-slate-800">← Back</button>
          ) : <div />}
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!form.full_name || !form.email || !form.business_name || !form.password || form.password.length < 6)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-150 transition-all">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-green-150 transition-all">
              {saving ? 'Creating Account...' : '✓ Create User & Send Welcome Email'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
