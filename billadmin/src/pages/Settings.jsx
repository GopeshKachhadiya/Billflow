import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Settings as SettingsIcon, LogOut, KeyRound, Database, ShieldAlert,
  Users, Building, Sliders, Globe, UserPlus, CheckCircle, XCircle, Shield, Edit, Trash2, RefreshCw
} from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('team') // 'team', 'org', 'system', 'automation', 'security'
  const [currentStaff, setCurrentStaff] = useState(null)
  
  // Tab 1: Staff & RBAC
  const [staffList, setStaffList] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStaff, setNewStaff] = useState({ full_name: '', email: '', phone: '', role: 'worker', password: '' })
  const [staffActionLoading, setStaffActionLoading] = useState(false)

  // Tab 2, 3, 4: Org & System Settings
  const [settingsData, setSettingsData] = useState({
    org_name: 'Satya Technologies',
    support_email: 'support@billflow.in',
    support_phone: '+91 80000 00000',
    company_address: 'Surat, Gujarat, India',
    default_trial_days: '14',
    standard_monthly_price: '700',
    standard_yearly_price: '6000',
    webhook_base_url: '',
    webhook_secret: ''
  })
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Tab 5: Security
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passSaving, setPassSaving] = useState(false)

  // Feedback Messages
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCurrentStaffAndSettings()
    fetchStaffList()
  }, [])

  const fetchCurrentStaffAndSettings = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const userEmail = authData.user.email
        // Fetch staff profile
        const { data: staffData } = await supabase.from('admin_staff').select('*').eq('email', userEmail).single()
        if (staffData) {
          setCurrentStaff(staffData)
        } else {
          // Default Super Admin profile fallback
          setCurrentStaff({ full_name: 'Gopesh Kachhadiya', email: userEmail, role: 'super_admin', status: 'active' })
        }
      }

      // Fetch system settings
      const { data: sysData } = await supabase.from('admin_system_settings').select('*')
      if (sysData && sysData.length > 0) {
        const map = {}
        sysData.forEach(item => { map[item.key] = item.value })
        setSettingsData(prev => ({ ...prev, ...map }))
      }
    } catch (err) {
      console.error('Settings load notice:', err.message)
    }
  }

  const fetchStaffList = async () => {
    setStaffLoading(true)
    try {
      const { data, error } = await supabase.from('admin_staff').select('*').order('created_at', { ascending: true })
      if (error) throw error
      setStaffList(data || [])
    } catch (err) {
      console.error('Staff fetch notice:', err.message)
    } finally {
      setStaffLoading(false)
    }
  }

  // Handle Adding New Staff Profile
  const handleAddStaff = async (e) => {
    e.preventDefault()
    setErrorMsg(''); setSuccessMsg(''); setStaffActionLoading(true)
    try {
      if (!newStaff.full_name || !newStaff.email || !newStaff.password) {
        throw new Error('Please fill in all required fields.')
      }

      // 1. Try creating user in Supabase Auth
      try {
        await supabase.auth.signUp({
          email: newStaff.email.trim(),
          password: newStaff.password,
          options: { data: { full_name: newStaff.full_name } }
        })
      } catch (authErr) {
        console.warn('Auth creation notice:', authErr.message)
      }

      // 2. Insert into admin_staff table
      const { error: dbErr } = await supabase.from('admin_staff').insert([{
        full_name: newStaff.full_name.trim(),
        email: newStaff.email.trim().toLowerCase(),
        phone: newStaff.phone.trim(),
        role: newStaff.role,
        status: 'active'
      }])

      if (dbErr) throw dbErr

      setSuccessMsg(`Staff profile for ${newStaff.full_name} (${newStaff.role.toUpperCase()}) created successfully!`)
      setNewStaff({ full_name: '', email: '', phone: '', role: 'worker', password: '' })
      setShowAddModal(false)
      fetchStaffList()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create staff member.')
    } finally {
      setStaffActionLoading(false)
    }
  }

  // Toggle Staff Status (Active / Inactive)
  const handleToggleStaffStatus = async (staff) => {
    const nextStatus = staff.status === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase.from('admin_staff').update({ status: nextStatus }).eq('id', staff.id)
      if (error) throw error
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, status: nextStatus } : s))
      setSuccessMsg(`Staff status for ${staff.full_name} updated to ${nextStatus}.`)
    } catch (err) {
      alert('Failed to update status: ' + err.message)
    }
  }

  // Change Staff Role
  const handleChangeRole = async (staff, newRole) => {
    try {
      const { error } = await supabase.from('admin_staff').update({ role: newRole }).eq('id', staff.id)
      if (error) throw error
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, role: newRole } : s))
      setSuccessMsg(`Role for ${staff.full_name} updated to ${newRole.toUpperCase()}.`)
    } catch (err) {
      alert('Failed to update role: ' + err.message)
    }
  }

  // Remove Staff Profile
  const handleDeleteStaff = async (staff) => {
    if (!window.confirm(`Are you sure you want to remove staff member ${staff.full_name}?`)) return
    try {
      const { error } = await supabase.from('admin_staff').delete().eq('id', staff.id)
      if (error) throw error
      setStaffList(prev => prev.filter(s => s.id !== staff.id))
      setSuccessMsg(`Staff member ${staff.full_name} removed.`)
    } catch (err) {
      alert('Failed to delete staff member: ' + err.message)
    }
  }

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg(''); setSuccessMsg(''); setSettingsSaving(true)
    try {
      const updates = Object.keys(settingsData).map(key => ({
        key: key,
        value: String(settingsData[key] || ''),
        updated_at: new Date().toISOString()
      }))

      for (let item of updates) {
        await supabase.from('admin_system_settings').upsert(item)
      }

      setSuccessMsg('System configurations updated successfully!')
    } catch (err) {
      setErrorMsg('Failed to save settings: ' + err.message)
    } finally {
      setSettingsSaving(false)
    }
  }

  // Update Password
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setErrorMsg(''); setSuccessMsg('')
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    setPassSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccessMsg('Security password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.')
    } finally {
      setPassSaving(false)
    }
  }

  const handleSignOut = () => {
    localStorage.setItem('manual_logout', 'true')
    supabase.auth.signOut()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2">
            <SettingsIcon className="text-primary" size={24} /> Enterprise Admin Settings
          </h1>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mt-1">
            Logged in as <span className="text-primary font-bold">{currentStaff?.full_name || 'Admin'}</span> ({currentStaff?.role?.toUpperCase() || 'SUPER_ADMIN'})
          </p>
        </div>

        {/* Global Feedback Toasts */}
        {(successMsg || errorMsg) && (
          <div className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
            errorMsg ? 'bg-error/10 text-error border border-error/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}>
            {errorMsg ? `⚠️ ${errorMsg}` : `✓ ${successMsg}`}
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/15 pb-2">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'team'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <Users size={15} /> Staff & RBAC Team
        </button>

        <button
          onClick={() => setActiveTab('org')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'org'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <Building size={15} /> Organization Profile
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'system'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <Sliders size={15} /> Subscription & Trial Rules
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'automation'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <Globe size={15} /> Webhooks & Automations
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <KeyRound size={15} /> Security & Auth
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: TEAM & STAFF MANAGEMENT (RBAC)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Admin Staff & Role-Based Access</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Manage accounts for Super Admins, Managers, and Support Workers.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchStaffList}
                className="p-2 border border-outline-variant/30 rounded-xl hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1"
              >
                <RefreshCw size={14} className={staffLoading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="accent-gradient text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                <UserPlus size={15} /> Add Staff Profile
              </button>
            </div>
          </div>

          {/* Role Explanation Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-400">
                <Shield size={14} /> Super Admin
              </div>
              <p className="text-on-surface-variant text-[11px] mt-1 leading-relaxed">
                Full unrestricted control: User onboarding, subscription pricing, billing logs, team staff management, and system API configuration.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <Shield size={14} /> Manager
              </div>
              <p className="text-on-surface-variant text-[11px] mt-1 leading-relaxed">
                Customer account management, subscription extensions, payment entries, analytics reports, and complaint resolution.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Shield size={14} /> Worker / Support Agent
              </div>
              <p className="text-on-surface-variant text-[11px] mt-1 leading-relaxed">
                Support ticket desk resolution, adding customer internal support notes, viewing customer list & contact info.
              </p>
            </div>
          </div>

          {/* Staff Roster Table */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-container-low/80 border-b border-outline-variant/15 text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                  <th className="px-4 py-3.5">Staff Member</th>
                  <th className="px-4 py-3.5">Contact Email & Phone</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {staffLoading && staffList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-on-surface-variant">Loading staff roster...</td></tr>
                ) : staffList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-on-surface-variant">No staff profiles registered yet. Click "Add Staff Profile" above.</td></tr>
                ) : staffList.map(staff => {
                  const isSuper = staff.role === 'super_admin'
                  const isManager = staff.role === 'manager'
                  const isActive = staff.status === 'active'

                  return (
                    <tr key={staff.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-on-surface">{staff.full_name}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">ID: {staff.id?.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-mono text-on-surface">{staff.email}</div>
                        {staff.phone && <div className="text-on-surface-variant text-[11px] mt-0.5">{staff.phone}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={staff.role}
                          onChange={(e) => handleChangeRole(staff, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border border-outline-variant/20 bg-input-bg focus:outline-none cursor-pointer ${
                            isSuper ? 'text-purple-400 font-bold' : isManager ? 'text-blue-400' : 'text-emerald-400'
                          }`}
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="manager">Manager</option>
                          <option value="worker">Worker / Support</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStaffStatus(staff)}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs font-semibold hover:bg-surface-container-high transition-colors"
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Add Staff Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <UserPlus size={18} className="text-primary" /> Create Staff Account
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface text-lg font-bold">×</button>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Rajesh Sharma"
                      value={newStaff.full_name}
                      onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@billflow.in"
                      value={newStaff.email}
                      onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98000 00000"
                        value={newStaff.phone}
                        onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Staff Role *</label>
                      <select
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-bold"
                      >
                        <option value="worker">Worker / Support</option>
                        <option value="manager">Manager</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newStaff.password}
                      onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface font-semibold hover:bg-surface-container-high"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={staffActionLoading}
                      className="accent-gradient text-white px-5 py-2 rounded-xl font-bold disabled:opacity-50 shadow-md shadow-primary/20"
                    >
                      {staffActionLoading ? 'Creating...' : 'Create Staff Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ORGANIZATION PROFILE
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'org' && (
        <form onSubmit={handleSaveSettings} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-2 flex items-center gap-2">
            <Building size={16} className="text-primary" /> Organization & Support Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Company / Organization Name</label>
              <input
                type="text"
                value={settingsData.org_name}
                onChange={e => setSettingsData({ ...settingsData, org_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Support Email Address</label>
              <input
                type="email"
                value={settingsData.support_email}
                onChange={e => setSettingsData({ ...settingsData, support_email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Support Helpline Phone</label>
              <input
                type="tel"
                value={settingsData.support_phone}
                onChange={e => setSettingsData({ ...settingsData, support_phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Registered Office Address</label>
              <input
                type="text"
                value={settingsData.company_address}
                onChange={e => setSettingsData({ ...settingsData, company_address: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10 flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="accent-gradient text-white px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {settingsSaving ? 'Saving...' : 'Save Organization Details'}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: SUBSCRIPTION & TRIAL RULES
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-2 flex items-center gap-2">
            <Sliders size={16} className="text-primary" /> Default Subscription & Plan Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Default Free Trial (Days)</label>
              <input
                type="number"
                value={settingsData.default_trial_days}
                onChange={e => setSettingsData({ ...settingsData, default_trial_days: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Standard Monthly Price (₹)</label>
              <input
                type="number"
                value={settingsData.standard_monthly_price}
                onChange={e => setSettingsData({ ...settingsData, standard_monthly_price: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Standard Yearly Price (₹)</label>
              <input
                type="number"
                value={settingsData.standard_yearly_price}
                onChange={e => setSettingsData({ ...settingsData, standard_yearly_price: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10 flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="accent-gradient text-white px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {settingsSaving ? 'Saving...' : 'Save Subscription Parameters'}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: WEBHOOKS & AUTOMATION
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'automation' && (
        <form onSubmit={handleSaveSettings} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-2 flex items-center gap-2">
            <Globe size={16} className="text-primary" /> Backend Automation & Webhook Endpoints
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Default Webhook Engine Base URL</label>
              <input
                type="url"
                placeholder="https://n8n.your-domain.com"
                value={settingsData.webhook_base_url}
                onChange={e => setSettingsData({ ...settingsData, webhook_base_url: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">X-BillFlow-Secret Token</label>
              <input
                type="password"
                placeholder="Optional security secret"
                value={settingsData.webhook_secret}
                onChange={e => setSettingsData({ ...settingsData, webhook_secret: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10 flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="accent-gradient text-white px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {settingsSaving ? 'Saving...' : 'Save Webhook Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: SECURITY & AUTH
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-2 flex items-center gap-2">
              <KeyRound size={16} className="text-primary" /> Update Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-input-bg border-none text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={passSaving}
                className="accent-gradient text-white px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-md shadow-primary/20"
              >
                {passSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-rose-500/20 shadow-xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-rose-500/20 pb-2 flex items-center gap-2">
              <ShieldAlert size={16} /> Danger Zone
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Terminates your active administrative session. You will be redirected to the secure login portal.
            </p>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 rounded-xl font-bold transition-all"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
