import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { User, Bell, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function Topbar() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email)
      }
    })
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4 text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-indigo-500" />
          <span className="font-medium text-gray-600">{format(new Date(), 'eeee, dd MMMM yyyy')}</span>
        </div>
        {supabase.isSandbox && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Sandbox Mode (Mock DB)
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-full" />
        </button>
        
        {/* Admin profile */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">Administrator</p>
            <p className="text-[10px] text-gray-400 font-mono leading-none mt-0.5">{email || 'admin@billflow.com'}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  )
}
