import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePayments(filter = {}) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingPayments: 0,
    upcomingDues: [],
    planBreakdown: {}
  })

  const load = useCallback(async () => {
    setLoading(true)
    
    // Fetch all payments with user details
    const [pRes, uRes] = await Promise.all([
      supabase.from('admin_payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('admin_users').select('id, full_name, business_name, email, plan, status, next_billing_date, plan_price')
    ])

    if (pRes.error || uRes.error) {
      setLoading(false)
      return
    }

    const allPayments = pRes.data || []
    const allUsers = uRes.data || []

    // Attach user information to payments
    const paymentsWithUser = allPayments.map(p => {
      const user = allUsers.find(u => u.id === p.user_id)
      return {
        ...p,
        user_name: user ? user.full_name : 'Unknown',
        business_name: user ? user.business_name : 'Unknown',
        user_email: user ? user.email : ''
      }
    })

    // Calculate billing stats
    const totalCollected = allPayments
      .filter(p => p.status === 'received')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const pendingPayments = allPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    // Calculate upcoming dues in the next 30, 60, 90 days
    const today = new Date()
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000)
    const ninetyDaysLater = new Date(Date.now() + 90 * 86400000)

    const upcomingDues = allUsers
      .filter(u => u.status === 'active' && u.next_billing_date)
      .map(u => {
        const dueDate = new Date(u.next_billing_date)
        const daysLeft = Math.ceil((dueDate - today) / (86400000))
        return {
          user_id: u.id,
          user_name: u.full_name,
          business_name: u.business_name,
          plan: u.plan,
          amount: parseFloat(u.plan_price) || 0,
          due_date: u.next_billing_date,
          days_left: daysLeft
        }
      })
      .filter(u => u.days_left >= 0 && u.days_left <= 90)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

    const planBreakdown = allUsers.reduce((acc, u) => {
      if (u.status === 'active') {
        acc[u.plan] = (acc[u.plan] || 0) + (parseFloat(u.plan_price) || 0)
      }
      return acc
    }, { standard: 0 })

    setPayments(paymentsWithUser)
    setStats({
      totalCollected,
      pendingPayments,
      upcomingDues,
      planBreakdown
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { payments, stats, loading, refetch: load }
}
