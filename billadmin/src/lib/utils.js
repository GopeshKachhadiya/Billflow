import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0'
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0, maximumFractionDigits: 2
  })
}

export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export const formatDatetime = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export const timeAgo = (date) => {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const daysUntil = (date) => {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export const generateLicenseKey = () => {
  const segments = () => Math.random().toString(36).toUpperCase().substring(2, 7)
  return `BF-${segments()}-${segments()}-${segments()}`
}

export const getStatusColor = (status) => {
  const map = {
    trial:     'bg-blue-50 text-blue-700 border border-blue-200',
    active:    'bg-green-50 text-green-700 border border-green-200',
    suspended: 'bg-amber-50 text-amber-700 border border-amber-200',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
    expired:   'bg-gray-50 text-gray-700 border border-gray-200'
  }
  return map[status] || 'bg-gray-50 text-gray-600 border border-gray-200'
}

export const getPlanColor = (plan) => {
  const map = {
    starter:      'bg-slate-50 text-slate-700 border border-slate-200',
    professional: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    enterprise:   'bg-purple-50 text-purple-700 border border-purple-200'
  }
  return map[plan] || 'bg-gray-50 text-gray-600 border border-gray-200'
}

export const callAdminWebhook = async (path, payload) => {
  const base   = import.meta.env.VITE_N8N_BASE_URL
  const secret = import.meta.env.VITE_N8N_SECRET
  if (!base) return
  try {
    await fetch(base + path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-BillFlow-Secret': secret },
      body:    JSON.stringify(payload)
    })
  } catch (e) {
    console.error('Admin webhook failed:', path, e.message)
  }
}
