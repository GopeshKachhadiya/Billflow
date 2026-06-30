import { Users, TrendingUp, IndianRupee, AlertTriangle, Clock, UserCheck, CreditCard, Wallet } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import KPICard from '../components/ui/KPICard'
import { formatCurrency, formatDate, daysUntil } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { stats, loading, error } = useStats()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
  
  if (error) return (
    <div className="bg-error-container/10 border border-error-container/20 rounded-xl p-4 text-error">
      <p className="font-semibold">Failed to load statistics</p>
      <p className="text-xs">{error.message || 'Please check your connection and configuration.'}</p>
    </div>
  )

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">BillFlow SaaS Overview</p>
        </div>
        <Link to="/users/add"
          className="accent-gradient text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md shadow-primary/10 hover:opacity-90 active:scale-95 transition-all teal-glow flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm font-bold">person_add</span> Add New User
        </Link>
      </div>

      {/* Alerts */}
      {stats.expiringTrials.length > 0 && (
        <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4 flex items-center justify-between animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-tertiary">
                Attention Required: {stats.expiringTrials.length} trial{stats.expiringTrials.length > 1 ? 's' : ''} expiring within 7 days
              </p>
              <p className="text-xs text-on-surface-variant/80 mt-0.5 leading-relaxed truncate max-w-xl">
                {stats.expiringTrials.map(u => `${u.full_name} (${u.business_name})`).join(', ')}
              </p>
            </div>
          </div>
          <Link to="/trials" className="text-tertiary font-bold px-4 py-2 rounded-lg hover:bg-tertiary/15 transition-colors text-sm">
            Manage Trials
          </Link>
        </div>
      )}

      {/* KPI Cards — Revenue */}
      <div>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Revenue Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="MRR"           value={formatCurrency(stats.mrr)}          color="primary"   icon={CreditCard} progress={72}  trend="+12%" />
          <KPICard title="ARR"           value={formatCurrency(stats.arr)}          color="secondary" icon={TrendingUp}  progress={85}  trend="+8%" />
          <KPICard title="Collections"   value={formatCurrency(stats.monthRevenue)} color="tertiary"  icon={Wallet}      progress={60}  subtitle="This Month" />
          <KPICard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="primary"   icon={TrendingUp}  progress={100} subtitle="All-Time" />
        </div>
      </div>

      {/* KPI Cards — Users */}
      <div>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">User Acquisition & Retention</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Users"   value={stats.total}           color="secondary" icon={Users}          subtitle="Total accounts" />
          <KPICard title="Active"        value={stats.active}          color="primary"   icon={UserCheck}      subtitle="Subscribers" />
          <KPICard title="On Trial"      value={stats.trial}           color="tertiary"  icon={Clock}          subtitle="Trials" />
          <KPICard title="Suspended"     value={stats.suspended}       color="error"     icon={AlertTriangle}  subtitle="Flagged" />
          <KPICard title="Conv. Rate"    value={stats.conversionRate + '%'} color="primary" icon={TrendingUp}  subtitle="Trial to paid" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="obsidian-card p-6 rounded-xl flex flex-col gap-4 h-[350px]">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Monthly Revenue Trend</h4>
            <select className="bg-surface-container-high border-none rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary px-3 py-1.5 focus:outline-none cursor-pointer">
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6bd8cb" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v)} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => ['₹' + v.toLocaleString('en-IN'), 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#dfe2f1' }} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4,4,0,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="obsidian-card p-6 rounded-xl flex flex-col gap-4 h-[350px]">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Customer Growth Trend</h4>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Paid Users
              </span>
            </div>
          </div>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b4c5ff" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#b4c5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#dfe2f1' }} />
                <Area type="monotone" dataKey="users" stroke="#b4c5ff" strokeWidth={3} fill="url(#areaGrad)" dot={{ r: 4, strokeWidth: 2, fill: '#b4c5ff', stroke: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
