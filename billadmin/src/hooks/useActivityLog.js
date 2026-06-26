import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useActivityLog(filter = {}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)

    // First fetch logs
    let q = supabase
      .from('admin_activity_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filter.action && filter.action !== 'all') {
      q = q.eq('action', filter.action)
    }

    if (filter.performed_by && filter.performed_by !== 'all') {
      q = q.eq('performed_by', filter.performed_by)
    }

    if (filter.limit) {
      q = q.limit(filter.limit)
    }
    if (filter.offset) {
      q = q.range(filter.offset, filter.offset + (filter.limit || 50) - 1)
    }

    const { data, count, error } = await q
    if (error) {
      console.error('Error loading activity logs:', error)
      setLoading(false)
      return
    }

    const logsData = data || []

    // Fetch user context info
    const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean))]
    
    let usersMap = {}
    if (userIds.length > 0) {
      const { data: usersData, error: usersErr } = await supabase
        .from('admin_users')
        .select('id, full_name, business_name, email')
        .in('id', userIds)
      
      if (!usersErr && usersData) {
        usersMap = usersData.reduce((acc, u) => {
          acc[u.id] = u
          return acc
        }, {})
      }
    }

    const decoratedLogs = logsData.map(log => ({
      ...log,
      user: log.user_id ? usersMap[log.user_id] : null
    }))

    // Apply client-side search filter on user name or email or description if search keyword is provided
    let finalLogs = decoratedLogs
    if (filter.search) {
      const term = filter.search.toLowerCase()
      finalLogs = decoratedLogs.filter(l => 
        l.description.toLowerCase().includes(term) ||
        (l.user && l.user.full_name.toLowerCase().includes(term)) ||
        (l.user && l.user.business_name.toLowerCase().includes(term)) ||
        (l.user && l.user.email.toLowerCase().includes(term))
      )
    }

    setLogs(finalLogs)
    setTotal(count || 0)
    setLoading(false)
  }, [JSON.stringify(filter)])

  useEffect(() => {
    load()
  }, [load])

  return { logs, total, loading, refetch: load }
}
