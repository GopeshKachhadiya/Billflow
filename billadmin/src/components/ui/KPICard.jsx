export default function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', trend, progress }) {
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

        {progress !== undefined && (
          <div className="w-full bg-zinc-150 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      {subtitle && !progress && (
        <p className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-2 font-medium">{subtitle}</p>
      )}
    </div>
  )
}
