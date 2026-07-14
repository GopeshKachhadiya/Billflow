import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Clock, FileText, Settings, MessageSquare
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/users',     icon: Users,           label: 'Users'       },
  { to: '/trials',    icon: Clock,           label: 'Trials'      },
  { to: '/billing',   icon: CreditCard,      label: 'Billing'     },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics'   },
  { to: '/logs',      icon: FileText,        label: 'Activity Logs'},
  { to: '/support',   icon: MessageSquare,   label: 'Support Tickets'},
  { to: '/settings',  icon: Settings,        label: 'Settings'     },
]

export default function Sidebar({ isOpen }) {
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email)
      }
    })
  }, [])

  return (
    <aside className={`bg-white dark:bg-black flex flex-col z-50 shrink-0 text-zinc-900 dark:text-white justify-between select-none transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 ${isOpen ? 'w-60 py-6 px-4' : 'w-16 py-6 px-2.5'}`}>
      <div>
        {/* Logo */}
        <div className={`mb-8 ${isOpen ? 'px-2' : 'flex justify-center'}`}>
          {isOpen ? (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">BillFlow</h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Manager Panel</p>
            </>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 relative select-none shrink-0 shadow-sm transition-all duration-300">
              <span className="absolute text-[19px] font-black text-zinc-900 dark:text-white top-[1px] left-[5px]">B</span>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {nav.map(({ to, icon: Icon, label }) => (
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
            AM
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">Admin Manager</p>
              <p className="text-[0.7rem] text-zinc-400 dark:text-zinc-500 truncate font-mono mt-0.5">{email || 'admin@billflow.com'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
