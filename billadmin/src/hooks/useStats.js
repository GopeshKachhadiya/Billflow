import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        
        // Users by status
        const { data: users, error: usersErr } = await supabase
          .from('admin_users')
          .select('id, status, plan, plan_price, gstin, state, billing_cycle, total_paid, trial_end_date, created_at')

        if (usersErr) throw usersErr
        if (!users) { setLoading(false); return }

        const byStatus = users.reduce((a, u) => {
          a[u.status] = (a[u.status] || 0) + 1
          return a
        }, {})

        // MRR calculation
        const active = users.filter(u => u.status === 'active')
        const mrr = active.reduce((sum, u) => {
          const price = parseFloat(u.plan_price) || 0
          if (u.billing_cycle === 'monthly')     return sum + price
          if (u.billing_cycle === 'half_yearly') return sum + price / 6
          if (u.billing_cycle === 'yearly')      return sum + price / 12
          return sum
        }, 0)

        // Payments
        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)

        const { data: payments, error: paymentsErr } = await supabase
          .from('admin_payments')
          .select('amount, payment_date, status')
          .eq('status', 'received')

        if (paymentsErr) throw paymentsErr

        const allPayments  = payments || []
        const monthPayments = allPayments.filter(p => new Date(p.payment_date) >= monthStart)
        const monthRevenue  = monthPayments.reduce((s, p) => s + parseFloat(p.amount), 0)
        const totalRevenue  = allPayments.reduce((s, p) => s + parseFloat(p.amount), 0)

        // Trials expiring in 7 days
        const today   = new Date().toISOString().split('T')[0]
        const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        const expiringTrials = users.filter(u =>
          u.status === 'trial' && u.trial_end_date >= today && u.trial_end_date <= in7days
        )

        // Conversion rate
        const converted = users.filter(u => u.converted_from_trial).length
        const totalTrials = users.filter(u => u.status !== 'active' || u.converted_from_trial).length
        const conversionRate = totalTrials > 0
          ? Math.round((converted / totalTrials) * 100)
          : 0

        // Monthly revenue for chart (last 12 months)
        const monthlyRevenue = []
        for (let i = 11; i >= 0; i--) {
          const d     = new Date()
          d.setDate(1)
          d.setMonth(d.getMonth() - i)
          const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
          const start = d.toISOString().split('T')[0]
          const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
          const rev   = allPayments
            .filter(p => p.payment_date >= start && p.payment_date <= end)
            .reduce((s, p) => s + parseFloat(p.amount), 0)
          monthlyRevenue.push({ month: label, revenue: Math.round(rev) })
        }

        // User growth (last 12 months)
        const userGrowth = []
        for (let i = 11; i >= 0; i--) {
          const d     = new Date()
          d.setDate(1)
          d.setMonth(d.getMonth() - i)
          const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
          const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
          const count = users.filter(u => u.created_at.split('T')[0] <= end).length
          userGrowth.push({ month: label, users: count })
        }

        setStats({
          total:           users.length,
          active:          byStatus.active    || 0,
          trial:           byStatus.trial     || 0,
          suspended:       byStatus.suspended || 0,
          cancelled:       byStatus.cancelled || 0,
          expired:         byStatus.expired   || 0,
          mrr:             Math.round(mrr),
          arr:             Math.round(mrr * 12),
          monthRevenue:    Math.round(monthRevenue),
          totalRevenue:    Math.round(totalRevenue),
          arpu:            active.length > 0 ? Math.round(mrr / active.length) : 0,
          conversionRate,
          expiringTrials,
          monthlyRevenue,
          userGrowth,
          rawUsers:        users
        })
      } catch (err) {
        console.error('Failed to load stats:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { stats, loading, error }
}
