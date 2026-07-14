import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Filter, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      // Local search filtering
      if (search.trim()) {
        const s = search.toLowerCase()
        setTickets(data.filter(t => 
          (t.name && t.name.toLowerCase().includes(s)) ||
          (t.phone && t.phone.includes(s)) ||
          (t.topic && t.topic.toLowerCase().includes(s)) ||
          (t.message && t.message.toLowerCase().includes(s))
        ))
      } else {
        setTickets(data || [])
      }
    } catch (e) {
      console.error('Error loading tickets:', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [status, search])

  const toggleStatus = async (ticket) => {
    const nextStatus = ticket.status === 'Open' ? 'Closed' : 'Open'
    setUpdatingId(ticket.id)
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (error) throw error
      
      // Update local state
      setTickets(prev => prev.map(t => 
        t.id === ticket.id ? { ...t, status: nextStatus } : t
      ))
    } catch (e) {
      alert('Failed to update status: ' + e.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Support Tickets & Complaints</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {tickets.filter(t => t.status === 'Open').length} open requests
          </p>
        </div>
        <button 
          onClick={fetchTickets} 
          disabled={loading}
          className="flex items-center gap-2 border border-outline-variant/30 text-on-surface px-4 py-2 rounded-full text-sm hover:bg-surface-container-high transition-colors bg-surface-container-low"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-4 flex flex-wrap gap-3 shadow-sm transition-colors duration-200">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, topic or message..."
            className="w-full pl-9 pr-4 py-2 border-none rounded-xl text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
        </div>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)}
          className="border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Tickets List */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-outline-variant/15">
                {['Date', 'Customer Details', 'Topic', 'Complaint Message', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading && tickets.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">Loading support tickets...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">No support tickets found</td></tr>
              ) : tickets.map(t => (
                <tr key={t.id} className="hover:bg-surface-container-high/40 transition-colors align-top">
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-on-surface-variant">
                    {formatDate(t.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-on-surface">{t.name}</div>
                    <div className="text-xs text-on-surface-variant font-mono mt-0.5">{t.phone}</div>
                    {t.email && <div className="text-xs text-on-surface-variant mt-0.5">{t.email}</div>}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 font-sans">
                      {t.topic}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-on-surface text-xs leading-relaxed max-w-md whitespace-pre-wrap">
                    {t.message}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      t.status === 'Open' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(t)}
                      disabled={updatingId === t.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        t.status === 'Open'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle size={13} />
                      {t.status === 'Open' ? 'Mark Resolved' : 'Reopen'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
