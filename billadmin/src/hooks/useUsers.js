import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUsers(filter = {}) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal]     = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filter.status && filter.status !== 'all') q = q.eq('status', filter.status)
    if (filter.plan   && filter.plan   !== 'all') q = q.eq('plan',   filter.plan)
    if (filter.search) {
      q = q.or(
        `full_name.ilike.%${filter.search}%,` +
        `business_name.ilike.%${filter.search}%,` +
        `email.ilike.%${filter.search}%,` +
        `phone.ilike.%${filter.search}%`
      )
    }
    if (filter.limit)  q = q.limit(filter.limit)
    if (filter.offset) q = q.range(filter.offset, filter.offset + (filter.limit || 50) - 1)

    const { data, count, error } = await q
    if (!error) { setUsers(data || []); setTotal(count || 0) }
    setLoading(false)
  }, [JSON.stringify(filter)])

  useEffect(() => { load() }, [load])

  return { users, loading, total, refetch: load }
}

export function useUser(id) {
  const [user, setUser]       = useState(null)
  const [payments, setPayments] = useState([])
  const [notes, setNotes]     = useState([])
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [uRes, pRes, nRes, lRes] = await Promise.all([
      supabase.from('admin_users').select('*').eq('id', id).single(),
      supabase.from('admin_payments').select('*').eq('user_id', id).order('payment_date', { ascending: false }),
      supabase.from('admin_support_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('admin_activity_log').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50)
    ])
    if (!uRes.error) setUser(uRes.data)
    if (!pRes.error) setPayments(pRes.data || [])
    if (!nRes.error) setNotes(nRes.data || [])
    if (!lRes.error) setLogs(lRes.data || [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return { user, payments, notes, logs, loading, refetch: load }
}

export async function createUser(data) {
  const { data: u, error } = await supabase
    .from('admin_users')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  await logActivity(u.id, 'user_created', `New user ${u.full_name} added to BillFlow`, 'admin')
  return u
}

export async function updateUser(id, data) {
  const { data: u, error } = await supabase
    .from('admin_users')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await logActivity(id, 'user_updated', `Account updated`, 'admin')
  return u
}

export async function addPayment(userId, payment) {
  const { data: p, error } = await supabase
    .from('admin_payments')
    .insert([{ ...payment, user_id: userId }])
    .select()
    .single()
  if (error) throw error
  
  // Update user's totals and next billing date
  const { data: u } = await supabase.from('admin_users').select('total_paid, billing_cycle').eq('id', userId).single()
  const newTotal    = (parseFloat(u?.total_paid) || 0) + parseFloat(payment.amount)
  const nextDate    = calcNextBillingDate(payment.payment_date, u?.billing_cycle)
  
  await supabase.from('admin_users').update({
    total_paid:         newTotal,
    last_payment_date:  payment.payment_date,
    last_payment_amount: payment.amount,
    next_billing_date:  nextDate
  }).eq('id', userId)
  
  await logActivity(userId, 'payment_received', `Payment of ₹${payment.amount} received. Ref: ${payment.reference}`, 'admin')
  return p
}

function calcNextBillingDate(fromDate, cycle) {
  const d = new Date(fromDate)
  if (cycle === 'monthly')   d.setMonth(d.getMonth() + 1)
  if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3)
  if (cycle === 'yearly')    d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export async function logActivity(userId, action, description, performedBy = 'system') {
  await supabase.from('admin_activity_log').insert([{
    user_id: userId, action, description, performed_by: performedBy
  }])
}

export async function deleteUser(id) {
  const { error: dbError } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id)
  if (dbError) throw dbError

  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError) {
    console.error('Failed to delete auth user:', authError.message)
  }
}
