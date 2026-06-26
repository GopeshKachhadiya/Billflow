import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Clock, FileText, Settings, LogOut
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/users',     icon: Users,           label: 'Users'       },
  { to: '/trials',    icon: Clock,           label: 'Trials'      },
  { to: '/billing',   icon: CreditCard,      label: 'Billing'     },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics'   },
  { to: '/logs',      icon: FileText,        label: 'Activity Logs'},
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-indigo-900 flex flex-col text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-800">
        <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center font-bold text-indigo-950">B</div>
        <div>
          <p className="font-bold text-sm">BillFlow Admin</p>
          <p className="text-indigo-300 text-xs">Manager Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ` +
              (isActive
                ? 'bg-indigo-700 text-white shadow-inner'
                : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white')
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-indigo-800">
        <button
          onClick={() => {
            localStorage.setItem('manual_logout', 'true')
            supabase.auth.signOut()
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-indigo-200 hover:text-white hover:bg-indigo-850 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
