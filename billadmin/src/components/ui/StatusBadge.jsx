import { getStatusColor, getPlanColor } from '../../lib/utils'

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

export function PlanBadge({ plan }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getPlanColor(plan)}`}>
      {plan}
    </span>
  )
}
