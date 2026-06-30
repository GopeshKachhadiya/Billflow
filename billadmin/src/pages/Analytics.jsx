import { useStats } from '../hooks/useStats'
import { formatCurrency } from '../lib/utils'
import KPICard from '../components/ui/KPICard'
import { TrendingUp, Users, DollarSign, Activity, Percent, IndianRupee } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function Analytics() {
  const { stats, loading, error } = useStats()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      <p className="font-semibold">Failed to load analytics data</p>
      <p className="text-xs">{error.message}</p>
    </div>
  )

  if (!stats) return null

  const rawUsers = stats.rawUsers || []

  // 1. Plan Breakdown
  const activeUsers = rawUsers.filter(u => u.status === 'active')
  const planData = Object.entries(
    activeUsers.reduce((acc, u) => {
      acc[u.plan] = (acc[u.plan] || 0) + 1
      return acc
    }, { starter: 0, professional: 0, enterprise: 0 })
  ).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }))

  const COLORS = ['#6bd8cb', '#b4c5ff', '#ffb77d']

  // 2. Revenue By State
  const stateRevenueMap = rawUsers.reduce((acc, u) => {
    const stateName = u.state || 'Other'
    const paid = parseFloat(u.total_paid) || 0
    acc[stateName] = (acc[stateName] || 0) + paid
    return acc
  }, {})

  const stateRevenueData = Object.entries(stateRevenueMap)
    .map(([state, value]) => ({ state, revenue: Math.round(value) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8) // Top 8 states

  // 3. User status count
  const statusSummary = [
    { name: 'Active', value: stats.active, color: '#10b981' },
    { name: 'Trial', value: stats.trial, color: '#3b82f6' },
    { name: 'Suspended', value: stats.suspended, color: '#f59e0b' },
    { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
    { name: 'Expired', value: stats.expired, color: '#6b7280' },
  ]

  // 4. Calculate approximate Churn rate (cancelled users vs active + cancelled)
  const totalSubscribers = stats.active + stats.cancelled
  const churnRate = totalSubscribers > 0
    ? Math.round((stats.cancelled / totalSubscribers) * 100)
    : 0

  return (
    <div className="space-y-6 text-on-surface">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Revenue & SaaS Analytics</h1>
        <p className="text-on-surface-variant text-sm mt-0.5">Deep-dive customer analytics and KPI breakdowns</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="MRR" value={formatCurrency(stats.mrr)} color="primary" icon={IndianRupee} subtitle="Recurring revenue/mo" />
        <KPICard title="ARR Run Rate" value={formatCurrency(stats.arr)} color="primary" icon={TrendingUp} subtitle="Annual projections" />
        <KPICard title="ARPU (Active)" value={formatCurrency(stats.arpu)} color="secondary" icon={Users} subtitle="Avg revenue per user" />
        <KPICard title="Trial-to-Paid" value={stats.conversionRate + '%'} color="tertiary" icon={Percent} subtitle="Conversion efficiency" />
        <KPICard title="Churn Rate" value={churnRate + '%'} color="error" icon={Activity} subtitle="All-time churn ratio" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Breakdown */}
        <div className="obsidian-card p-6 rounded-xl lg:col-span-1">
          <h3 className="text-sm font-semibold text-on-surface mb-4 border-b border-outline-variant/15 pb-2 uppercase tracking-wider">Active Subscribers By Plan</h3>
          <div className="flex justify-center items-center h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#dfe2f1' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by State */}
        <div className="obsidian-card p-6 rounded-xl lg:col-span-2">
          <h3 className="text-sm font-semibold text-on-surface mb-4 border-b border-outline-variant/15 pb-2 uppercase tracking-wider">Top States by Total Revenue (₹)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateRevenueData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => ['₹' + v.toLocaleString('en-IN'), 'Total Collected']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#dfe2f1' }} />
                <Bar dataKey="revenue" fill="#b4c5ff" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status & Cohorts Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Status Cohorts */}
        <div className="obsidian-card p-6 rounded-xl lg:col-span-1">
          <h3 className="text-sm font-semibold text-on-surface mb-4 border-b border-outline-variant/15 pb-2 uppercase tracking-wider">SaaS Accounts Cohort</h3>
          <div className="space-y-4">
            {statusSummary.map(status => {
              const percent = stats.total > 0 ? Math.round((status.value / stats.total) * 100) : 0
              return (
                <div key={status.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.name}
                    </span>
                    <span className="text-on-surface">{status.value} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-input-bg rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Business Insights */}
        <div className="obsidian-card p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-4 border-b border-outline-variant/15 pb-2 uppercase tracking-wider">Business Health Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-secondary/10 p-4 border border-secondary/20 rounded-xl leading-relaxed">
                <h4 className="font-bold text-secondary mb-1">Conversion Optimization</h4>
                <p className="text-on-surface-variant">
                  Your trial-to-paid conversion is currently at <b>{stats.conversionRate}%</b>. Extending trial limits (+7d, +14d) selectively for engaged users often yields up to 15% growth in conversions. Ensure SMTP setup in n8n works seamlessly to prevent churn during trial dropoffs.
                </p>
              </div>
              <div className="bg-primary/10 p-4 border border-primary/20 rounded-xl leading-relaxed">
                <h4 className="font-bold text-primary mb-1">ARPU Optimization</h4>
                <p className="text-on-surface-variant">
                  With average revenue per user at <b>{formatCurrency(stats.arpu)}</b>, encouraging customers to migrate to professional and enterprise plans via customized configurations (e.g. multi-user licensing) can scale MRR quickly.
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant/50 font-mono mt-4">
            Insights calculated dynamically using the active database snapshot. Updates in real-time.
          </p>
        </div>
      </div>
    </div>
  )
}
