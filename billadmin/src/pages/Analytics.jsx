import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { 
  TrendingUp, Users, DollarSign, Activity, Percent, IndianRupee, 
  Calendar, CreditCard, MapPin, MessageSquare, ShieldCheck, Cpu, RefreshCw, Inbox
} from 'lucide-react'
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, AreaChart, Area, CartesianGrid 
} from 'recharts'

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month') // 'week', 'month', 'quarter', 'year', 'all', 'custom'
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [loading, setLoading] = useState(true)
  const [rawUsers, setRawUsers] = useState([])
  const [rawPayments, setRawPayments] = useState([])
  const [rawTickets, setRawTickets] = useState([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const [uRes, pRes, tRes] = await Promise.all([
        supabase.from('admin_users').select('*').order('created_at', { ascending: true }),
        supabase.from('admin_payments').select('*').order('payment_date', { ascending: true }),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: true })
      ])

      setRawUsers(uRes.data || [])
      setRawPayments(pRes.data || [])
      setRawTickets(tRes.data || [])
    } catch (e) {
      console.error('Analytics load error:', e.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate Date Threshold based on selected timeRange (Month starts strictly on 1st of month)
  const dateCutoff = useMemo(() => {
    const now = new Date()
    if (timeRange === 'week') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      d.setHours(0, 0, 0, 0)
      return { start: d, end: new Date() }
    }
    if (timeRange === 'month') {
      // Strictly 1st day of the current calendar month
      return { start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0), end: new Date() }
    }
    if (timeRange === 'quarter') {
      // 1st day of current quarter
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      return { start: new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0), end: new Date() }
    }
    if (timeRange === 'year') {
      // 1st day of current year (Jan 1st)
      return { start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0), end: new Date() }
    }
    if (timeRange === 'custom') {
      const s = new Date(customStartDate)
      s.setHours(0, 0, 0, 0)
      const e = new Date(customEndDate)
      e.setHours(23, 59, 59, 999)
      return { start: s, end: e }
    }
    return { start: new Date(0), end: new Date(2099, 11, 31) } // All time
  }, [timeRange, customStartDate, customEndDate])

  // Real Filtered Payments, Users & Support Tickets
  const filteredPayments = useMemo(() => {
    return rawPayments.filter(p => {
      const pDate = new Date(p.payment_date)
      return pDate >= dateCutoff.start && pDate <= dateCutoff.end && (p.status || 'received') === 'received'
    })
  }, [rawPayments, dateCutoff])

  const filteredUsers = useMemo(() => {
    return rawUsers.filter(u => {
      const uDate = new Date(u.created_at)
      return uDate >= dateCutoff.start && uDate <= dateCutoff.end
    })
  }, [rawUsers, dateCutoff])

  const filteredTickets = useMemo(() => {
    return rawTickets.filter(t => {
      const tDate = new Date(t.created_at)
      return tDate >= dateCutoff.start && tDate <= dateCutoff.end
    })
  }, [rawTickets, dateCutoff])

  // 💰 Real Core Metrics (100% computed from database)
  const periodRevenue = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }, [filteredPayments])

  const totalAllTimeRevenue = useMemo(() => {
    return rawPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }, [rawPayments])

  const activeSubscribers = useMemo(() => {
    return rawUsers.filter(u => u.status === 'active')
  }, [rawUsers])

  const currentMRR = useMemo(() => {
    return activeSubscribers.reduce((sum, u) => {
      const price = parseFloat(u.plan_price) || 0
      if (u.billing_cycle === 'monthly') return sum + price
      if (u.billing_cycle === 'half_yearly') return sum + (price / 6)
      if (u.billing_cycle === 'yearly') return sum + (price / 12)
      return sum + price
    }, 0)
  }, [activeSubscribers])

  const currentARR = currentMRR * 12

  const arpu = activeSubscribers.length > 0 ? Math.round(currentMRR / activeSubscribers.length) : 0

  const conversionRate = useMemo(() => {
    const converted = rawUsers.filter(u => u.converted_from_trial || u.status === 'active').length
    return rawUsers.length > 0 ? Math.round((converted / rawUsers.length) * 100) : 0
  }, [rawUsers])

  const ticketResolutionRate = useMemo(() => {
    if (filteredTickets.length === 0) return 0
    const closed = filteredTickets.filter(t => (t.status || '').toLowerCase() === 'closed').length
    return Math.round((closed / filteredTickets.length) * 100)
  }, [filteredTickets])

  // 📈 Real Revenue Timeline Data (Strictly from admin_payments)
  const revenueTimelineData = useMemo(() => {
    const now = new Date()
    
    // Day-by-day trajectory if viewing 'month' (from 1st of month to today)
    if (timeRange === 'month') {
      const currentMonthName = now.toLocaleString('en-IN', { month: 'short' })
      const daysInMonthToCurrent = now.getDate()
      const dayMap = {}

      for (let d = 1; d <= daysInMonthToCurrent; d++) {
        const label = `${String(d).padStart(2, '0')} ${currentMonthName}`
        dayMap[label] = { month: label, revenue: 0 }
      }

      filteredPayments.forEach(p => {
        const pDate = new Date(p.payment_date)
        if (pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth()) {
          const dNum = pDate.getDate()
          const label = `${String(dNum).padStart(2, '0')} ${currentMonthName}`
          if (dayMap[label]) {
            dayMap[label].revenue += parseFloat(p.amount) || 0
          }
        }
      })

      return Object.values(dayMap)
    }

    // Month-by-month trajectory for quarter, year, all time
    const monthMap = {}
    const monthsBack = timeRange === 'week' ? 1 : timeRange === 'quarter' ? 3 : 12

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      monthMap[label] = { month: label, revenue: 0 }
    }

    filteredPayments.forEach(p => {
      const d = new Date(p.payment_date)
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      if (monthMap[label]) {
        monthMap[label].revenue += parseFloat(p.amount) || 0
      }
    })

    return Object.values(monthMap)
  }, [filteredPayments, timeRange])

  // 💳 Real Payment Methods Breakdown (Strictly from admin_payments)
  const paymentMethodData = useMemo(() => {
    const map = {}
    filteredPayments.forEach(p => {
      let method = (p.payment_method || 'other').toUpperCase()
      if (method.includes('BANK')) method = 'BANK TRANSFER'
      if (method.includes('UPI')) method = 'UPI PAYMENT'
      map[method] = (map[method] || 0) + (parseFloat(p.amount) || 0)
    })

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
    return Object.entries(map).map(([name, value], idx) => ({
      name, value: Math.round(value), color: COLORS[idx % COLORS.length]
    })).filter(item => item.value > 0)
  }, [filteredPayments])

  // 🗺 Real Indian States Breakdown (Strictly from admin_users)
  const stateData = useMemo(() => {
    const map = {}
    filteredUsers.forEach(u => {
      if (u.state && u.state.trim()) {
        const state = u.state.trim()
        const rev = parseFloat(u.total_paid) || 0
        if (!map[state]) map[state] = { state, revenue: 0, users: 0 }
        map[state].revenue += rev
        map[state].users += 1
      }
    })

    return Object.values(map).sort((a, b) => b.users - a.users).slice(0, 6)
  }, [filteredUsers])

  // 🎫 Real Support Topics Breakdown (Strictly from support_tickets)
  const ticketTopicData = useMemo(() => {
    const map = {}
    filteredTickets.forEach(t => {
      if (t.topic && t.topic.trim()) {
        const topic = t.topic.trim()
        map[topic] = (map[topic] || 0) + 1
      }
    })

    return Object.entries(map).map(([topic, count]) => ({ topic, count }))
  }, [filteredTickets])

  // 💻 Real Desktop App Client Versions (Strictly from admin_users)
  const versionData = useMemo(() => {
    const map = {}
    filteredUsers.forEach(u => {
      if (u.app_version) {
        const ver = `v${u.app_version}`
        map[ver] = (map[ver] || 0) + 1
      }
    })

    const COLORS = ['#6bd8cb', '#b4c5ff', '#ffb77d', '#c084fc']
    return Object.entries(map).map(([name, value], idx) => ({
      name: `BillFlow ${name}`, value, color: COLORS[idx % COLORS.length]
    }))
  }, [filteredUsers])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <div className="space-y-6 text-on-surface">
      {/* Header & Time Duration Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2">
            <Activity className="text-primary" size={24} /> Real-Time SaaS Analytics
          </h1>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mt-1">
            Live database telemetry — 100% real records synced with Supabase
          </p>
        </div>

        {/* Time Duration Range Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/15 shadow-sm">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-on-surface-variant ml-2 mr-1" />
            {[
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month (1st-Now)' },
              { id: 'quarter', label: 'This Quarter' },
              { id: 'year', label: 'This Year (YTD)' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === r.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 px-2 py-1 bg-input-bg rounded-xl text-xs font-mono border border-outline-variant/20">
              <span className="text-on-surface-variant font-bold font-sans text-[11px]">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent text-on-surface focus:outline-none cursor-pointer"
              />
              <span className="text-on-surface-variant font-bold font-sans text-[11px]">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent text-on-surface focus:outline-none cursor-pointer"
              />
            </div>
          )}

          <button 
            onClick={fetchAnalyticsData}
            title="Refresh Data"
            className="p-1.5 text-on-surface-variant hover:text-on-surface ml-1 rounded-lg hover:bg-surface-container-high"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 📊 Top 6 Key Real System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Period Revenue</span>
            <IndianRupee size={15} className="text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(periodRevenue)}</p>
          <p className="text-[10px] text-on-surface-variant">Real payments in period</p>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Monthly (MRR)</span>
            <TrendingUp size={15} className="text-primary" />
          </div>
          <p className="text-xl font-black text-primary font-mono">{formatCurrency(currentMRR)}</p>
          <p className="text-[10px] text-on-surface-variant">Active subscription run rate</p>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Annual (ARR)</span>
            <DollarSign size={15} className="text-indigo-400" />
          </div>
          <p className="text-xl font-black text-indigo-400 font-mono">{formatCurrency(currentARR)}</p>
          <p className="text-[10px] text-on-surface-variant">Annualized SaaS projection</p>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>ARPU (Active)</span>
            <Users size={15} className="text-blue-400" />
          </div>
          <p className="text-xl font-black text-blue-400 font-mono">{formatCurrency(arpu)}</p>
          <p className="text-[10px] text-on-surface-variant">Avg revenue per active user</p>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Trial Conversion</span>
            <Percent size={15} className="text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-400 font-mono">{conversionRate}%</p>
          <p className="text-[10px] text-on-surface-variant">Trial-to-paid conversion</p>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Ticket Resolution</span>
            <ShieldCheck size={15} className="text-teal-400" />
          </div>
          <p className="text-xl font-black text-teal-400 font-mono">{ticketResolutionRate}%</p>
          <p className="text-[10px] text-on-surface-variant">Support tickets resolved</p>
        </div>
      </div>

      {/* 📈 MAIN CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real Revenue Collection Timeline */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Revenue Collection Trajectory (₹)
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              All-Time Collected: {formatCurrency(totalAllTimeRevenue)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => '₹' + v} />
                <Tooltip 
                  formatter={v => ['₹' + v.toLocaleString('en-IN'), 'Revenue Collected']} 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '12px' }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Payment Methods Breakdown */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-primary" /> Real Payment Channels
          </h3>
          {paymentMethodData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 border border-dashed border-outline-variant/20 rounded-xl">
              <Inbox size={32} className="text-on-surface-variant/40 mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">No Payment Records Yet</p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1 max-w-xs">
                As real customers make subscription payments, payment channel analytics will appear here live.
              </p>
            </div>
          ) : (
            <div className="h-64 flex flex-col justify-between">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => ['₹' + v, 'Total Paid']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                {paymentMethodData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 text-on-surface-variant font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 🗺 SECONDARY REAL METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Real Indian States Breakdown */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-3 flex items-center gap-2">
            <MapPin size={16} className="text-primary" /> Active SMB Shops by State
          </h3>
          {stateData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-outline-variant/20 rounded-xl">
              <Inbox size={28} className="text-on-surface-variant/40 mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">No State Location Data</p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1">
                State location analytics will populate automatically as users specify their state in profile setup.
              </p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="state" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, name) => [v, name === 'users' ? 'Shops Count' : 'Total Revenue (₹)']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#f8fafc' }} />
                  <Bar dataKey="users" fill="#6bd8cb" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Real Support Ticket Topics Breakdown */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" /> Support Desk Ticket Categories
          </h3>
          {ticketTopicData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-outline-variant/20 rounded-xl">
              <Inbox size={28} className="text-on-surface-variant/40 mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">No Support Tickets Logged</p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1">
                Support topic categories will render as tickets are raised from website or desktop chatbot.
              </p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketTopicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="topic" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#b4c5ff" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Real Desktop App Client Versions */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/15 pb-3 flex items-center gap-2">
            <Cpu size={16} className="text-primary" /> Desktop Client Versions
          </h3>
          {versionData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-outline-variant/20 rounded-xl">
              <Inbox size={28} className="text-on-surface-variant/40 mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">No App Version Data</p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1">
                App versions will display live as desktop clients check in with the server.
              </p>
            </div>
          ) : (
            <div className="h-56 flex flex-col justify-between">
              <ResponsiveContainer width="100%" height="75%">
                <PieChart>
                  <Pie data={versionData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                    {versionData.map((entry, index) => (
                      <Cell key={`cell-v-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 text-xs pt-2">
                {versionData.map(v => (
                  <div key={v.name} className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                      {v.name}
                    </span>
                    <span className="font-mono text-on-surface font-bold">{v.value} shops</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
