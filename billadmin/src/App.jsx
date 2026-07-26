import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import SupportTickets from './pages/SupportTickets'
import { ShieldAlert } from 'lucide-react'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RoleGuard({ allowedRoles, userRole, children }) {
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'worker') {
      return <Navigate to="/support" replace />
    }
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-on-surface">Access Restricted</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Your active staff role (<span className="font-bold text-primary">{userRole?.toUpperCase()}</span>) does not have authorization to view this page. Contact your Super Admin for permission access.
        </p>
      </div>
    )
  }
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState('super_admin')
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        fetchStaffRole(data.session.user.email)
      } else {
        setRoleLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) {
        fetchStaffRole(s.user.email)
      } else {
        setRoleLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchStaffRole = async (email) => {
    try {
      const { data } = await supabase.from('admin_staff').select('role').eq('email', email).single()
      if (data?.role) {
        setUserRole(data.role)
      } else {
        setUserRole('super_admin')
      }
    } catch (e) {
      setUserRole('super_admin')
    } finally {
      setRoleLoading(false)
    }
  }

  if (session === undefined || roleLoading) return (
    <div className="h-screen flex items-center justify-center bg-indigo-950">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-400" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to={userRole === 'worker' ? "/support" : "/"} /> : <Login />} />
        <Route path="/" element={<ProtectedRoute session={session}><AppLayout /></ProtectedRoute>}>
          {/* Dashboard */}
          <Route index element={
            <RoleGuard allowedRoles={['super_admin', 'manager']} userRole={userRole}>
              <Dashboard />
            </RoleGuard>
          } />

          {/* Users */}
          <Route path="users" element={
            <RoleGuard allowedRoles={['super_admin', 'manager', 'worker']} userRole={userRole}>
              <Users userRole={userRole} />
            </RoleGuard>
          } />
          <Route path="users/:id" element={
            <RoleGuard allowedRoles={['super_admin', 'manager', 'worker']} userRole={userRole}>
              <UserDetail userRole={userRole} />
            </RoleGuard>
          } />
          <Route path="users/add" element={
            <RoleGuard allowedRoles={['super_admin', 'manager']} userRole={userRole}>
              <AddUser userRole={userRole} />
            </RoleGuard>
          } />

          {/* Billing & Financials */}
          <Route path="billing" element={
            <RoleGuard allowedRoles={['super_admin', 'manager']} userRole={userRole}>
              <Billing userRole={userRole} />
            </RoleGuard>
          } />

          {/* Analytics */}
          <Route path="analytics" element={
            <RoleGuard allowedRoles={['super_admin', 'manager']} userRole={userRole}>
              <Analytics userRole={userRole} />
            </RoleGuard>
          } />

          {/* Trials */}
          <Route path="trials" element={
            <RoleGuard allowedRoles={['super_admin', 'manager']} userRole={userRole}>
              <Trials userRole={userRole} />
            </RoleGuard>
          } />

          {/* Activity Logs */}
          <Route path="logs" element={
            <RoleGuard allowedRoles={['super_admin']} userRole={userRole}>
              <ActivityLogs userRole={userRole} />
            </RoleGuard>
          } />

          {/* Support Tickets */}
          <Route path="support" element={
            <RoleGuard allowedRoles={['super_admin', 'manager', 'worker']} userRole={userRole}>
              <SupportTickets userRole={userRole} />
            </RoleGuard>
          } />

          {/* System Settings & Staff RBAC */}
          <Route path="settings" element={
            <RoleGuard allowedRoles={['super_admin']} userRole={userRole}>
              <Settings userRole={userRole} />
            </RoleGuard>
          } />

          <Route path="*" element={<Navigate to={userRole === 'worker' ? "/support" : "/"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}