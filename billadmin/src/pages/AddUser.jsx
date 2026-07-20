import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '../hooks/useUsers'
import { generateLicenseKey, callAdminWebhook } from '../lib/utils'
import { supabase } from '../lib/supabase'

const PLANS = [
  { id: 'standard',      name: 'Standard',      price: 700,  desc: 'Unlimited bills, unlimited customers, Email + WhatsApp + SMS automations, Multi-user support' }
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
    plan:             'standard',
    billing_cycle:    'monthly',
    plan_price:       700,
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
    const prices = { monthly: 700, half_yearly: 3600, yearly: 6000 }
    set('plan', 'standard')
    set('plan_price', prices[form.billing_cycle])
  }

  const selectCycle = (cycle) => {
    const prices = { monthly: 700, half_yearly: 3600, yearly: 6000 }
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
      // Step 1: Create or recover the Supabase Auth account so the user can log into the consumer app
      let authUserId = null
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true // Auto-confirm email so user can log in immediately
      })

      if (authError) {
        // If account is already registered, find its ID and update password/status
        if (authError.message?.toLowerCase().includes('already') || authError.message?.toLowerCase().includes('registered') || authError.status === 422 || authError.code === 'email_exists') {
          const { data: { users: existingUsers }, error: listErr } = await supabase.auth.admin.listUsers()
          if (listErr) throw new Error('Failed to check existing users: ' + listErr.message)
          const existing = existingUsers?.find(u => u.email?.toLowerCase() === form.email.trim().toLowerCase())
          if (existing) {
            authUserId = existing.id
            await supabase.auth.admin.updateUserById(existing.id, {
              password: form.password,
              email_confirm: true
            })
          } else {
            throw new Error('Failed to create auth account: ' + authError.message)
          }
        } else {
          throw new Error('Failed to create auth account: ' + authError.message)
        }
      } else {
        authUserId = authData.user.id
      }

      // Step 2: Insert into admin_users table (ensure id equals authUserId so deletion stays synced)
      const userData = { ...form, id: authUserId }
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
    <div className="max-w-2xl text-on-surface">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Add New User</h1>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-8 bg-surface-container-low p-4 border border-outline-variant/10 rounded-xl shadow-sm">
        {['Profile','Plan & Trial'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 justify-center first:justify-start last:justify-end">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === i+1 ? 'accent-gradient text-white shadow-sm ring-4 ring-primary/20' : step > i+1 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span className={`text-xs font-semibold ${step === i+1 ? 'text-primary' : 'text-on-surface-variant'}`}>{s}</span>
            {i < 1 && <span className="mx-2 flex-1 border-t border-dashed border-outline-variant/30" />}
          </div>
        ))}
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-xl p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-on-surface mb-2 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Customer Info</h2>
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
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none placeholder:text-on-surface-variant/40" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra"
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none placeholder:text-on-surface-variant/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Referral Source</label>
                <select value={form.referral_source} onChange={e => set('referral_source', e.target.value)}
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer">
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
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Internal Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none placeholder:text-on-surface-variant/40"
                placeholder="Any internal notes about this customer..." />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-on-surface mb-3 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Select Plan</h2>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map(p => (
                  <button key={p.id} type="button" onClick={() => selectPlan(p.id)}
                    className={`text-left border-2 rounded-xl p-4 transition-all hover:scale-[1.01] ${form.plan === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 bg-surface-container hover:border-on-surface-variant text-on-surface-variant'}`}>
                    <p className="font-bold text-on-surface text-sm">{p.name}</p>
                    <p className="text-primary font-extrabold mt-1">₹{p.price}<span className="text-[10px] text-on-surface-variant font-normal">/mo</span></p>
                    <p className="text-[11px] text-on-surface-variant/75 mt-2 leading-relaxed">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-on-surface mb-2 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Billing Cycle</h2>
              <div className="flex gap-3">
                {[
                  ['monthly','Monthly', 700],
                  ['half_yearly','6 Months', 3600],
                  ['yearly','Yearly', 6000]
                ].map(([v,l,pr]) => (
                  <button key={v} type="button" onClick={() => selectCycle(v)}
                    className={`flex-1 border-2 rounded-xl p-3 text-sm text-center transition-all ${form.billing_cycle === v ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-outline-variant/30 bg-surface-container hover:border-on-surface-variant text-on-surface-variant'}`}>
                    <p className="font-semibold text-xs uppercase tracking-wider">{l}</p>
                    <p className="text-primary font-bold mt-1">₹{pr}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-on-surface mb-2 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Account Activation</h2>
              <div className="flex gap-3">
                {[['trial','Start 14-Day Trial'],['active','Activate Immediately (Paid)']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => set('status', v)}
                    className={`flex-1 border-2 rounded-xl p-3 text-sm text-center font-semibold transition-all ${form.status === v ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-outline-variant/30 bg-surface-container hover:border-on-surface-variant text-on-surface-variant'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {form.status === 'trial' && (
              <div>
                <h2 className="text-sm font-semibold text-on-surface mb-2 border-b border-outline-variant/20 pb-2 uppercase tracking-wider">Trial Duration</h2>
                <div className="flex gap-3">
                  {[7,14,30].map(d => (
                    <button key={d} type="button" onClick={() => updateTrialDays(d)}
                      className={`flex-1 border-2 rounded-xl p-3 text-sm font-semibold text-center transition-all ${form.trial_days === d ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 bg-surface-container hover:border-on-surface-variant text-on-surface-variant'}`}>
                      {d} Days
                    </button>
                  ))}
                </div>
                <p className="text-primary mt-2 font-semibold bg-primary/10 p-2.5 rounded-lg border border-primary/20">Trial ends on: <span className="font-mono">{form.trial_end_date}</span></p>
              </div>
            )}

            <div className="bg-input-bg border border-outline-variant/20 rounded-xl p-4 text-xs">
              <p className="font-bold text-on-surface uppercase tracking-wider mb-2">Summary</p>
              <div className="space-y-1.5 text-on-surface-variant">
                <p>Plan: <b className="text-on-surface capitalize">{form.plan}</b> · <span className="capitalize">{form.billing_cycle}</span></p>
                <p>Price: <b className="text-on-surface">₹{form.plan_price}</b></p>
                <p>Status: <b className="text-on-surface capitalize">{form.status}</b></p>
                {form.status === 'trial' && <p>Trial Ends: <b className="text-on-surface">{form.trial_end_date}</b></p>}
                <p>License Key: <b className="font-mono text-primary bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-0.5 leading-relaxed">{form.license_key}</b></p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-5 border-t border-outline-variant/25">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="border border-outline-variant/30 text-on-surface px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-surface-container bg-transparent">← Back</button>
          ) : <div />}
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!form.full_name || !form.email || !form.business_name || !form.password || form.password.length < 6)}
              className="accent-gradient hover:opacity-90 disabled:opacity-40 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-primary/10 transition-all teal-glow">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="accent-gradient hover:opacity-90 disabled:opacity-40 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-primary/10 transition-all teal-glow">
              {saving ? 'Creating Account...' : '✓ Create User & Send Welcome Email'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
