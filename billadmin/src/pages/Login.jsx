import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HeroSection } from '../components/ui/hero-section-dark'

export default function Login() {
  const [email, setEmail]       = useState('gopeshkachhadiya00005@gmail.com')
  const [password, setPassword] = useState('Gopesh@007')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError]       = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading]   = useState(false)

  // Forgot Password Mode & Steps (1: Send OTP, 2: Verify OTP, 3: Update Password)
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetStep, setResetStep]       = useState(1)
  const [otpCode, setOtpCode]           = useState('')
  const [newPassword, setNewPassword]   = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email')
    const savedPassword = localStorage.getItem('admin_password')
    const savedRemember = localStorage.getItem('admin_remember') !== 'false'

    if (savedEmail) setEmail(savedEmail)
    if (savedPassword) setPassword(savedPassword)
    setRememberMe(savedRemember)

    const manualLogout = localStorage.getItem('manual_logout')
    if (manualLogout === 'true') {
      localStorage.removeItem('manual_logout')
    } else {
      // Auto-submit login on startup if credentials exist
      const activeEmail = savedEmail || 'gopeshkachhadiya00005@gmail.com'
      const activePassword = savedPassword || 'Gopesh@007'
      if (activeEmail && activePassword) {
        const timer = setTimeout(() => {
          setLoading(true)
          supabase.auth.signInWithPassword({ email: activeEmail, password: activePassword }).then(({ error: err }) => {
            if (err) {
              setError(err.message)
              setLoading(false)
            }
          })
        }, 400)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)
    
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      if (rememberMe) {
        localStorage.setItem('admin_email', email)
        localStorage.setItem('admin_password', password)
        localStorage.setItem('admin_remember', 'true')
      } else {
        localStorage.removeItem('admin_email')
        localStorage.removeItem('admin_password')
        localStorage.setItem('admin_remember', 'false')
      }
    }
  }

  // STEP 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)

    if (!email) {
      setError('Please enter your admin email address.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccessMsg('6-digit OTP code sent! Please check your email inbox.')
      setResetStep(2)
    }
  }

  // STEP 2: Verify OTP Code
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)

    const cleanCode = otpCode.trim()
    if (!cleanCode) {
      setError('Please enter the 6-digit OTP code.')
      setLoading(false)
      return
    }

    // 1. Check custom OTP table first
    const { data: dbRes } = await supabase
      .from('password_otp_resets')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('otp_code', cleanCode)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (dbRes && dbRes.length > 0) {
      await supabase.from('password_otp_resets').update({ verified: true }).eq('id', dbRes[0].id)
      setLoading(false)
      setSuccessMsg('OTP verified! Enter your new password below.')
      setResetStep(3)
      return
    }

    // 2. Fallback to Supabase Auth OTP verification
    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token: cleanCode,
      type: 'recovery'
    })
    setLoading(false)

    if (err || !data.session) {
      setError(err ? err.message : 'Invalid or expired OTP code.')
    } else {
      setSuccessMsg('OTP verified! Enter your new password below.')
      setResetStep(3)
    }
  }

  // STEP 3: Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg(''); setLoading(true)

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setPassword(newPassword)
      setSuccessMsg('Password reset successful! Signing in with your new credentials...')
      setTimeout(() => {
        setIsForgotMode(false)
        setResetStep(1)
        supabase.auth.signInWithPassword({ email, password: newPassword })
      }, 1200)
    }
  }

  return (
    <HeroSection
      title="Satya BillFlow Manager Dashboard"
      subtitle={{
        regular: "Secure access to ",
        gradient: "SaaS admin control center"
      }}
      description="Monitor MRR/ARR, manage billing subscriptions, review trials, track collections, and audit n8n workflows in real-time."
      bottomImage={null}
      gridOptions={{
        angle: 65,
        opacity: 0.5,
        cellSize: 55,
        lightLineColor: "#8b5cf6",
        darkLineColor: "#2e1065"
      }}
    >
      <div className="bg-surface-container-low/60 backdrop-blur-xl rounded-2xl shadow-2xl w-full p-8 border border-outline-variant/20 relative z-20 text-left">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-[#5046e6] rounded-xl mb-3 shadow-lg shadow-indigo-500/20 relative select-none">
            <span className="absolute text-[20px] font-black text-white top-2 left-3">B</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            {isForgotMode ? 'Admin Password Recovery' : 'Manager Authentication'}
          </h2>
        </div>

        {error && <p className="text-error text-xs font-medium bg-error/10 border border-error/20 p-3 rounded-lg mb-4">{error}</p>}
        {successMsg && <p className="text-emerald-400 text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg mb-4">{successMsg}</p>}

        {!isForgotMode ? (
          /* ── LOGIN FORM ── */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                placeholder="admin@yourdomain.com" required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                placeholder="••••••••" required
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary bg-transparent cursor-pointer"
                />
                <span className="text-xs font-semibold text-on-surface-variant">Remember Me / Auto-Login</span>
              </label>

              <button
                type="button"
                onClick={() => { setIsForgotMode(true); setError(''); setSuccessMsg(''); }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full accent-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all shadow-lg shadow-primary/10 active:scale-[0.98] teal-glow flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* ── FORGOT PASSWORD 3-STEP OTP FLOW ── */
          <div className="space-y-4">
            {resetStep === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter your registered Admin email address to receive a secure 6-digit OTP code.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Admin Email Address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                    placeholder="admin@yourdomain.com" required
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full accent-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all shadow-lg shadow-primary/10 active:scale-[0.98]"
                >
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter the 6-digit OTP verification code sent to <strong className="text-on-surface">{email}</strong>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">6-Digit OTP Code</label>
                  <input
                    type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={8}
                    className="w-full border-none rounded-xl px-4 py-2.5 text-base font-mono text-center tracking-[4px] focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none"
                    placeholder="123456" required
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full accent-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all shadow-lg shadow-primary/10 active:scale-[0.98]"
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  OTP verified! Set your new admin password below.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                    placeholder="••••••••" required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                    placeholder="••••••••" required
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full accent-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all shadow-lg shadow-primary/10 active:scale-[0.98]"
                >
                  {loading ? 'Updating Password...' : 'Update Password & Sign In'}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setResetStep(1); setError(''); setSuccessMsg(''); }}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface underline"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </HeroSection>
  )
}
