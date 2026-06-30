import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

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
    trial:     'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40',
    active:    'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40',
    suspended: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40',
    cancelled: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40',
    expired:   'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-350 border border-gray-200 dark:border-slate-700'
  }
  return map[status] || 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
}

export const getPlanColor = (plan) => {
  const map = {
    starter:      'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-700',
    professional: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40',
    enterprise:   'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40'
  }
  return map[plan] || 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
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
