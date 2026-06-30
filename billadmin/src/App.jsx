import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import { Dashboard } from './components/Dashboard'
import Users from './pages/Users'
import UserDetail from './pages/UserDetail'
import AddUser from './pages/AddUser'
import Billing from './pages/Billing'
import Analytics from './pages/Analytics'
import Trials from './pages/Trials'
import ActivityLogs from './pages/ActivityLogs'
import Settings from './pages/Settings'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div className="h-screen flex items-center justify-center bg-indigo-950">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-400" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={<ProtectedRoute session={session}><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="users/add" element={<AddUser />} />
          <Route path="billing" element={<Billing />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="trials" element={<Trials />} />
          <Route path="logs" element={<ActivityLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}