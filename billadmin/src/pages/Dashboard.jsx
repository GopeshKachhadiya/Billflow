import { Users, TrendingUp, IndianRupee, AlertTriangle, Clock, UserCheck } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import KPICard from '../components/ui/KPICard'
import { formatCurrency, formatDate, daysUntil } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { stats, loading, error } = useStats()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">BillFlow SaaS Overview</p>
        </div>
        <Link to="/users/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]">
          + Add New User
        </Link>
      </div>

      {/* Alerts */}
      {stats.expiringTrials.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {stats.expiringTrials.length} trial{stats.expiringTrials.length > 1 ? 's' : ''} expiring within 7 days
            </p>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              {stats.expiringTrials.map(u => `${u.full_name} (${u.business_name})`).join(', ')}
            </p>
          </div>
          <Link to="/trials" className="text-xs bg-amber-100 hover:bg-amber-250 text-amber-850 px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap">
            Manage Trials
          </Link>
        </div>
      )}

      {/* KPI Cards — Revenue */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Revenue Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="MRR"           value={formatCurrency(stats.mrr)}          color="green"  icon={IndianRupee}  subtitle="Monthly Recurring Revenue" />
          <KPICard title="ARR"           value={formatCurrency(stats.arr)}          color="purple" icon={TrendingUp}   subtitle="Annual Recurring Revenue" />
          <KPICard title="This Month"    value={formatCurrency(stats.monthRevenue)} color="indigo" icon={IndianRupee}  subtitle="Payments received" />
          <KPICard title="All-Time"      value={formatCurrency(stats.totalRevenue)} color="blue"   icon={IndianRupee}  subtitle="Total revenue collected" />
        </div>
      </div>

      {/* KPI Cards — Users */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">User Acquisition & Retention</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Users"   value={stats.total}           color="indigo" icon={Users}     />
          <KPICard title="Active"        value={stats.active}          color="green"  icon={UserCheck} />
          <KPICard title="On Trial"      value={stats.trial}           color="blue"   icon={Clock}     />
          <KPICard title="Suspended"     value={stats.suspended}       color="yellow" icon={AlertTriangle} />
          <KPICard title="Conversion"    value={stats.conversionRate + '%'} color="purple" icon={TrendingUp} subtitle="Trial to paid" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue Trend (Last 12 Months)</h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthlyRevenue}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v)} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => ['₹' + v.toLocaleString('en-IN'), 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Customer Growth Trend (Last 12 Months)</h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.userGrowth}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
