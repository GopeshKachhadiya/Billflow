export default function KPICard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40',
    green:  'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/40',
    blue:   'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/40',
    red:    'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40',
  }
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all hover-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1 font-sans">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">{subtitle}</p>}
          {trend != null && (
            <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-rose-500 dark:text-rose-400'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% vs last month</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color] || colors.indigo}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
