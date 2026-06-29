import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { User, Bell, Calendar, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'

export default function Topbar() {
  const [email, setEmail] = useState('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email)
      }
    })

    // Check existing theme preference
    const isDarkTheme = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkTheme);
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [])

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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-4 text-gray-500 dark:text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-indigo-500" />
          <span className="font-medium text-gray-600 dark:text-slate-350">{format(new Date(), 'eeee, dd MMMM yyyy')}</span>
        </div>
        {supabase.isSandbox && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Sandbox Mode (Mock DB)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button onClick={toggleDarkMode} 
          className="p-2 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="p-2 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 border-2 border-white dark:border-slate-900 rounded-full" />
        </button>
        
        {/* Admin profile */}
        <div className="flex items-center gap-3 border-l border-gray-100 dark:border-slate-800 pl-4">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Administrator</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-mono leading-none mt-0.5">{email || 'admin@billflow.com'}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  )
}
