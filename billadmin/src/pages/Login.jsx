import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HeroSection } from '../components/ui/hero-section-dark'

export default function Login() {
  const [email, setEmail]       = useState('gopeshkachhadiya00005@gmail.com')
  const [password, setPassword] = useState('Gopesh@007')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

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
    setError(''); setLoading(true)
    
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

  return (
    <HeroSection
      title="BillFlow Manager Dashboard"
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
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Manager Authentication</h2>
        </div>

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
          </div>
          {error && <p className="text-error text-xs font-medium bg-error/10 border border-error/20 p-3 rounded-lg">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full accent-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-full transition-all shadow-lg shadow-primary/10 active:scale-[0.98] teal-glow flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </HeroSection>
  )
}
