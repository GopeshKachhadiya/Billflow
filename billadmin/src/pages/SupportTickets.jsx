import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Filter, CheckCircle, RefreshCw, MessageSquare, UserCheck } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTicketsAndStaff = async () => {
    setLoading(true)
    try {
      // 1. Fetch Staff List
      const { data: staffData } = await supabase.from('admin_staff').select('id, full_name, role').eq('status', 'active')
      setStaffList(staffData || [])

      // 2. Fetch Support Tickets
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (status !== 'all') {
        query = query.ilike('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      let list = data || []

      // Staff assignment filter
      if (assignedFilter !== 'all') {
        list = list.filter(t => (t.assigned_to || '') === assignedFilter)
      }

      // Search filter
      if (search.trim()) {
        const s = search.toLowerCase()
        list = list.filter(t => 
          (t.name && t.name.toLowerCase().includes(s)) ||
          (t.phone && t.phone.includes(s)) ||
          (t.topic && t.topic.toLowerCase().includes(s)) ||
          (t.message && t.message.toLowerCase().includes(s)) ||
          (t.assigned_to && t.assigned_to.toLowerCase().includes(s))
        )
      }
      setTickets(list)
    } catch (e) {
      console.error('Error loading tickets:', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicketsAndStaff()
  }, [status, assignedFilter, search])

  // Toggle Ticket Status (Open <-> Closed)
  const toggleStatus = async (ticket) => {
    const isCurrentlyOpen = (ticket.status || '').toLowerCase() === 'open'
    const nextStatus = isCurrentlyOpen ? 'Closed' : 'Open'
    setUpdatingId(ticket.id)
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (error) throw error
      
      setTickets(prev => prev.map(t => 
        t.id === ticket.id ? { ...t, status: nextStatus } : t
      ))
    } catch (e) {
      alert('Failed to update status: ' + e.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // Assign Ticket to Staff Member
  const handleAssignTicket = async (ticket, staffName) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: staffName, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (error) throw error

      setTickets(prev => prev.map(t => 
        t.id === ticket.id ? { ...t, assigned_to: staffName } : t
      ))
    } catch (e) {
      alert('Failed to assign ticket: ' + e.message)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Support Tickets & Complaints</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {tickets.filter(t => (t.status || '').toLowerCase() === 'open').length} open requests
          </p>
        </div>
        <button 
          onClick={fetchTicketsAndStaff} 
          disabled={loading}
          className="flex items-center gap-2 border border-outline-variant/30 text-on-surface px-4 py-2 rounded-full text-sm hover:bg-surface-container-high transition-colors bg-surface-container-low"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-4 flex flex-wrap gap-3 shadow-sm transition-colors duration-200">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, phone, topic, message or assigned staff..."
            className="w-full pl-9 pr-4 py-2 border-none rounded-xl text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
        </div>

        {/* Status Selector */}
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)}
          className="border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open Tickets</option>
          <option value="Closed">Resolved / Closed</option>
        </select>

        {/* Assigned Staff Filter */}
        <select
          value={assignedFilter}
          onChange={e => setAssignedFilter(e.target.value)}
          className="border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary bg-input-bg text-on-surface focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">All Assigned Staff</option>
          <option value="">Unassigned</option>
          {staffList.map(s => (
            <option key={s.id} value={s.full_name}>{s.full_name} ({s.role.toUpperCase()})</option>
          ))}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-outline-variant/15 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="text-left px-4 py-3.5">Date</th>
                <th className="text-left px-4 py-3.5">Customer Details</th>
                <th className="text-left px-4 py-3.5">Topic & Assigned Agent</th>
                <th className="text-left px-4 py-3.5">Complaint Message</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-left px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading && tickets.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">Loading support tickets...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">No support tickets found</td></tr>
              ) : tickets.map(t => {
                const isOpen = (t.status || '').toLowerCase() === 'open';
                return (
                  <tr key={t.id} className="hover:bg-surface-container-high/40 transition-colors align-top">
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-on-surface-variant">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-on-surface">{t.name}</div>
                      <div className="text-xs text-on-surface-variant font-mono mt-0.5">{t.phone}</div>
                      {t.email && <div className="text-xs text-on-surface-variant mt-0.5">{t.email}</div>}
                    </td>
                    <td className="px-4 py-4 space-y-1.5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 font-sans">
                        {t.topic}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={13} className="text-on-surface-variant" />
                        <select
                          value={t.assigned_to || ''}
                          onChange={(e) => handleAssignTicket(t, e.target.value)}
                          className="bg-input-bg text-on-surface text-[11px] font-semibold rounded-lg px-2 py-0.5 border border-outline-variant/20 focus:outline-none cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {staffList.map(s => (
                            <option key={s.id} value={s.full_name}>{s.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-on-surface text-xs leading-relaxed max-w-md whitespace-pre-wrap">
                      {t.message}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isOpen 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(t)}
                        disabled={updatingId === t.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          isOpen
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        }`}
                      >
                        <CheckCircle size={13} />
                        {isOpen ? 'Mark Resolved' : 'Reopen'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
