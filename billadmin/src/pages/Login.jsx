import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HeroSection } from '../components/ui/hero-section-dark'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError]       = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading]   = useState(false)

  // Forgot Password Mode & Steps
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetStep, setResetStep]       = useState(1)
  const [otpCode, setOtpCode]           = useState('')
  const [newPassword, setNewPassword]   = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email')
    const savedRemember = localStorage.getItem('admin_remember') === 'true'

    if (savedRemember && savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)
    
    const emailClean = email.trim().toLowerCase()

    try {
      if (!emailClean) throw new Error('Please enter your email address.')
      if (!password) throw new Error('Please enter your password.')

      // 1. Try native Supabase Auth login
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ 
        email: emailClean, 
        password 
      })

      if (!authErr && authData?.session) {
        localStorage.removeItem('staff_custom_user')
        if (rememberMe) {
          localStorage.setItem('admin_email', emailClean)
          localStorage.setItem('admin_remember', 'true')
        }
        setSuccessMsg('Sign in successful! Loading panel...')
        setTimeout(() => { window.location.href = '/' }, 400)
        return
      }

      // 2. Query Supabase admin_staff DB table directly
      const { data: staffMatch, error: staffDbErr } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('email', emailClean)
        .maybeSingle()

      if (staffMatch) {
        if (staffMatch.status === 'inactive') {
          throw new Error('This staff account has been deactivated by Super Admin.')
        }

        if (staffMatch.password_hash && staffMatch.password_hash !== password.trim()) {
          throw new Error('Invalid login credentials. Please check password.')
        }

        // Successfully authenticated against Supabase admin_staff table!
        const customUser = {
          email: staffMatch.email,
          full_name: staffMatch.full_name,
          role: staffMatch.role || 'worker',
          id: staffMatch.id || 'staff-' + Date.now()
        }

        localStorage.setItem('staff_custom_user', JSON.stringify(customUser))
        if (rememberMe) {
          localStorage.setItem('admin_email', emailClean)
          localStorage.setItem('admin_remember', 'true')
        }

        window.dispatchEvent(new Event('staff-auth-change'))
        setSuccessMsg(`Welcome back, ${staffMatch.full_name}! Redirecting...`)
        
        setTimeout(() => {
          window.location.href = staffMatch.role === 'worker' ? '/support' : '/'
        }, 400)
        return
      }

      throw new Error(authErr?.message || 'Invalid login credentials. Check email and password.')
    } catch (err) {
      setError(err.message || 'Invalid login credentials.')
      setLoading(false)
    }
  }

  // STEP 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)
    try {
      if (!email.trim()) throw new Error('Please enter your email address.')
      
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (resetErr) throw resetErr

      setSuccessMsg('Security OTP code sent to your email address!')
      setResetStep(2)
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.')
    } finally {
      setLoading(false)
    }
  }

  // STEP 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)
    try {
      if (!otpCode.trim()) throw new Error('Please enter the 6-digit OTP code.')

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'recovery'
      })
      if (verifyErr) throw verifyErr

      setSuccessMsg('OTP verified successfully! Set your new password.')
      setResetStep(3)
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.')
    } finally {
      setLoading(false)
    }
  }

  // STEP 3: Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match.')
      }
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) throw updateErr

      setSuccessMsg('Password updated successfully! You can now log in.')
      setTimeout(() => {
        setIsForgotMode(false)
        setResetStep(1)
        setPassword(newPassword)
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-surface text-on-surface">
      {/* LEFT COLUMN: Hero & Branding */}
      <HeroSection 
        title="Satya BillFlow SaaS Management" 
        subtitle="Centralized Operations Panel for User Accounts, Multi-Role Staff RBAC, Subscriptions & Support Tickets" 
      />

      {/* RIGHT COLUMN: Clean Login & Auth Portal */}
      <div className="flex flex-col justify-center px-8 lg:px-16 py-12 bg-surface-container-low border-l border-outline-variant/10">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Logo / Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">
                स
              </div>
              <span className="font-extrabold text-xl tracking-tight text-on-surface">SATYA BILLFLOW</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">
              {isForgotMode ? 'Account Recovery' : 'Admin Staff Sign In'}
            </h1>
            <p className="text-xs text-on-surface-variant font-semibold mt-1 uppercase tracking-wider">
              {isForgotMode ? 'Reset password with email verification' : 'Enter credentials to access manager panel'}
            </p>
          </div>

          {/* Toast Error / Success */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              ✓ {successMsg}
            </div>
          )}

          {/* NORMAL LOGIN FORM */}
          {!isForgotMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@billflow.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-input-bg border-none text-on-surface text-sm focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(true); setError(''); setSuccessMsg('') }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-input-bg border-none text-on-surface text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded text-primary focus:ring-primary bg-input-bg"
                  />
                  <span>Remember my email</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 accent-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Panel'}
              </button>
            </form>
          ) : (
            /* FORGOT PASSWORD MULTI-STEP FORM */
            <div className="space-y-4">
              {resetStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Account Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@billflow.in"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-input-bg border-none text-on-surface text-sm focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 accent-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Sending Code...' : 'Send Recovery OTP'}
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      6-Digit Security OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-input-bg border-none text-on-surface text-sm focus:ring-1 focus:ring-primary focus:outline-none font-mono text-center tracking-widest text-lg font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 accent-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP Code'}
                  </button>
                </form>
              )}

              {resetStep === 3 && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-input-bg border-none text-on-surface text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-input-bg border-none text-on-surface text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 accent-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setResetStep(1); setError(''); setSuccessMsg('') }}
                className="w-full text-center text-xs font-bold text-on-surface-variant hover:text-on-surface pt-2"
              >
                ← Back to Admin Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
