import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-indigo-100 dark:border-slate-850">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20">
            <span className="text-white text-2xl font-bold font-sans">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">BillFlow Admin</h1>
          <p className="text-gray-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">Manager Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
              placeholder="admin@yourdomain.com" required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
              placeholder="••••••••" required
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-450">Remember Me / Auto-Login</span>
            </label>
          </div>
          {error && <p className="text-rose-600 text-xs font-medium bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-3 rounded-lg">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
