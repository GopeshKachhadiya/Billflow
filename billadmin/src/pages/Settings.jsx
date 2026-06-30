import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Settings as SettingsIcon, LogOut, KeyRound, Database, ShieldAlert } from 'lucide-react'

export default function Settings() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email)
      }
    })
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess('Password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    localStorage.setItem('manual_logout', 'true')
    supabase.auth.signOut()
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Admin Settings</h1>
        <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mt-1">Configure profile and system integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column - Profile & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="obsidian-card p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2 flex items-center gap-2">
              <SettingsIcon size={16} className="text-primary" /> Profile Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Role</p>
                <p className="text-sm text-on-surface font-semibold mt-1">System Administrator</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Email Address</p>
                <p className="text-sm text-on-surface font-semibold mt-1 font-mono">{email || 'admin@billflow.com'}</p>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="obsidian-card p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2 flex items-center gap-2">
              <KeyRound size={16} className="text-primary" /> Update Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              {error && (
                <div className="text-xs text-error bg-error/10 border border-error/20 p-3 rounded-xl font-semibold">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="text-xs text-primary bg-primary/10 border border-primary/20 p-3 rounded-xl font-semibold">
                  ✓ {success}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto accent-gradient text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-md shadow-primary/10"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Diagnostics & Danger Zone */}
        <div className="space-y-6">
          {/* Diagnostics Card */}
          <div className="obsidian-card p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider border-b border-outline-variant/20 pb-2 flex items-center gap-2">
              <Database size={16} className="text-primary" /> System Diagnostics
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-on-surface-variant uppercase tracking-wider">Database Mode</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold mt-1.5 ${supabase.isSandbox ? 'bg-amber-500/10 text-tertiary border border-tertiary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                  {supabase.isSandbox ? 'Sandbox Mode (Mock DB)' : 'Production Supabase'}
                </span>
              </div>
              <hr className="border-outline-variant/10" />
              <div>
                <p className="font-bold text-on-surface-variant uppercase tracking-wider">n8n Automation Engine</p>
                <p className="text-on-surface font-semibold font-mono mt-1 select-all truncate">{supabase.n8nUrl || 'https://n8n.billflow.internal'}</p>
                <p className="text-[10px] text-on-surface-variant/70 mt-1">Webhook delivery active</p>
              </div>
            </div>
          </div>

          {/* Danger Zone / Log Out Card */}
          <div className="obsidian-card p-6 rounded-xl space-y-4 border border-error/20">
            <h2 className="text-sm font-semibold text-error uppercase tracking-wider border-b border-error/20 pb-2 flex items-center gap-2">
              <ShieldAlert size={16} /> Danger Zone
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Terminates your manager panel active administrative session. You will be redirected to the secure login portal.
            </p>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-error/30 hover:bg-error/10 text-error rounded-xl text-sm font-bold transition-all"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
