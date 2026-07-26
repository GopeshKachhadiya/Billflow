import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Clock, FileText, Settings, MessageSquare
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const allNav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',        roles: ['super_admin', 'manager'] },
  { to: '/users',     icon: Users,           label: 'Users',            roles: ['super_admin', 'manager', 'worker'] },
  { to: '/trials',    icon: Clock,           label: 'Trials',           roles: ['super_admin', 'manager'] },
  { to: '/billing',   icon: CreditCard,      label: 'Billing',          roles: ['super_admin', 'manager'] },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics',        roles: ['super_admin', 'manager'] },
  { to: '/logs',      icon: FileText,        label: 'Activity Logs',    roles: ['super_admin', 'manager'] },
  { to: '/support',   icon: MessageSquare,   label: 'Support Tickets',  roles: ['super_admin', 'manager', 'worker'] },
  { to: '/settings',  icon: Settings,        label: 'Settings',         roles: ['super_admin'] },
]

export default function Sidebar({ isOpen }) {
  const [email, setEmail] = useState('')
  const [staffProfile, setStaffProfile] = useState({ full_name: 'Gopesh Kachhadiya', role: 'super_admin' })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setEmail(data.user.email)
        try {
          const { data: staffData } = await supabase.from('admin_staff').select('*').eq('email', data.user.email).single()
          if (staffData) {
            setStaffProfile(staffData)
          } else {
            setStaffProfile({ full_name: data.user.email.split('@')[0], role: 'super_admin' })
          }
        } catch (e) {
          setStaffProfile({ full_name: 'Super Admin', role: 'super_admin' })
        }
      }
    })
  }, [])

  const currentRole = staffProfile?.role || 'super_admin'
  const filteredNav = allNav.filter(item => item.roles.includes(currentRole))

  const getInitials = (name) => {
    if (!name) return 'AM'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const getRoleBadgeStyle = (role) => {
    if (role === 'super_admin') return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    if (role === 'manager') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }

  const getRoleLabel = (role) => {
    if (role === 'super_admin') return 'Super Admin'
    if (role === 'manager') return 'Manager'
    return 'Worker / Support'
  }

  return (
    <aside className={`bg-white dark:bg-black flex flex-col z-50 shrink-0 text-zinc-900 dark:text-white justify-between select-none transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 ${isOpen ? 'w-60 py-6 px-4' : 'w-16 py-6 px-2.5'}`}>
      <div>
        {/* Logo */}
        <div className={`mb-8 ${isOpen ? 'px-2' : 'flex justify-center'}`}>
          {isOpen ? (
            <div className="flex flex-col select-none" style={{ lineHeight: '0.95', fontFamily: "'Cinzel Decorative', 'Bodoni Moda', 'Cormorant Garamond', 'Cinzel', serif" }}>
              <span className="font-black text-[18px] text-zinc-900 dark:text-white uppercase tracking-[0.05em] leading-none block">SATYA</span>
              <span className="font-bold text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.01em] leading-none block mt-1">BILLFLOW</span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-semibold uppercase tracking-wider mt-1.5">
                {getRoleLabel(currentRole)}
              </p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 relative select-none shrink-0 shadow-sm transition-all duration-300 flex items-start justify-start pt-0.5 pl-1">
              <span className="text-[17px] font-bold text-zinc-900 dark:text-white leading-none">स</span>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              title={!isOpen ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg font-medium transition-all duration-200 ` +
                (isOpen 
                  ? `gap-3 px-3 py-2.5 text-sm `
                  : `justify-center p-2.5 gap-0 text-xs `) +
                (isActive
                  ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900 font-semibold border-r-2 border-zinc-900 dark:border-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-950')
              }
            >
              <Icon size={18} className="shrink-0" />
              {isOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Profile Card */}
      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-900">
        <div className={`flex items-center ${isOpen ? 'gap-2.5 px-2' : 'justify-center'}`}>
          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-xs border border-zinc-200 dark:border-zinc-800 shrink-0">
            {getInitials(staffProfile?.full_name)}
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{staffProfile?.full_name || 'Admin User'}</p>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 ${getRoleBadgeStyle(currentRole)}`}>
                {getRoleLabel(currentRole)}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
