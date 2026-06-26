export default function KPICard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    green:  'bg-green-50  text-green-600 border border-green-100',
    blue:   'bg-blue-50   text-blue-600 border border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
    red:    'bg-red-50    text-red-600 border border-red-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all hover-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 font-sans">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend != null && (
            <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-rose-500'}`}>
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
