export default function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  return (
    <div className="obsidian-card p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">{title}</p>
          {Icon && <Icon size={14} className="text-zinc-400 dark:text-zinc-500" />}
        </div>
        
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight leading-none">{value}</h3>
          {trend && (
            <span className={`text-[10px] font-semibold flex items-center ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-2 font-medium">{subtitle}</p>
      )}
    </div>
  )
}
