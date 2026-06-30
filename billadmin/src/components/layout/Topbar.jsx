import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Bell, Sun, Moon, PanelLeft, Send } from 'lucide-react'
import { format } from 'date-fns'
import { useLocation } from 'react-router-dom'

export default function Topbar({ toggleSidebar, isSidebarOpen }) {
  const [email, setEmail] = useState('')
  const [isDark, setIsDark] = useState(false)
  const location = useLocation()

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  // Get current section/page title based on route
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/users')) return 'Users'
    if (path === '/trials') return 'Trials'
    if (path === '/billing') return 'Billing'
    if (path === '/analytics') return 'Analytics'
    if (path === '/logs') return 'Activity Logs'
    if (path === '/settings') return 'Settings'
    return 'Admin Board'
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email)
      }
    })

    // Check existing theme preference (default to dark)
    const isDarkTheme = localStorage.getItem('theme') !== 'light';
    setIsDark(isDarkTheme);
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Fetch recent events
    const fetchLogs = async () => {
      try {
        const { data } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        if (data) {
          setNotifications(data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchLogs()
    const interval = setInterval(fetchLogs, 20000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!showNotifications) return
    const close = () => setShowNotifications(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [showNotifications])

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  return (
    <header className="h-14 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-200 select-none">
      {/* Left side: Panel collapse and Breadcrumb title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded transition-colors duration-200"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <PanelLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          {/* Dashboard Icon */}
          <span className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-500 flex items-center justify-center text-[0.55rem] text-zinc-500 font-bold">
            田
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{getPageTitle()}</span>
        </div>

        {supabase.isSandbox && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 shadow-sm ml-2">
            Sandbox Mode (Mock DB)
          </span>
        )}
      </div>
      
      {/* Right side icons */}
      <div className="flex items-center gap-3">
        {/* Send feedback */}
        <button className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-all duration-200" title="Send Feedback">
          <Send size={15} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setShowNotifications(!showNotifications)
              setHasUnread(false)
            }}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors relative"
            title="View Notifications"
          >
            <Bell size={15} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-300 rounded-full" />
            )}
          </button>
          
          {showNotifications && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl p-4 z-[99] animate-in fade-in slide-in-from-top-2 duration-200 text-zinc-900 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-2 mb-2">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">System Alerts</h4>
                <span className="text-[0.7rem] text-zinc-400 dark:text-zinc-500 font-semibold">Live Feed</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-[0.75rem] text-zinc-450 dark:text-zinc-500 text-center py-4">No recent alerts.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="text-[0.75rem] border-b border-zinc-100 dark:border-zinc-900 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-300 capitalize truncate">{n.action_type.replace('_', ' ')}</span>
                        <span className="text-[0.65rem] text-zinc-400 dark:text-zinc-500 shrink-0">
                          {format(new Date(n.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{n.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button onClick={toggleDarkMode} 
          className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-all duration-200"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        
        {/* Admin profile */}
        <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-3">
          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-xs border border-zinc-200 dark:border-zinc-700 shrink-0 select-none">
            {email ? email.substring(0, 2).toUpperCase() : 'AD'}
          </div>
        </div>
      </div>
    </header>
  )
}
