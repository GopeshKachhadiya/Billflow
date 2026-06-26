import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY  // service_role key — admin only

const isPlaceholder = !supabaseUrl || 
                      supabaseUrl.includes('your-project') || 
                      supabaseUrl.includes('placeholder')

let client

if (isPlaceholder) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY is a placeholder/missing. Falling back to LocalStorage Sandbox Mode.')
  
  // Seed initial data helper
  const getSeededData = (table) => {
    if (table === 'admin_plans') {
      return [
        { id: '1', name: 'starter', display_name: 'Starter', monthly_price: 499, quarterly_price: 1299, yearly_price: 4799, max_bills_per_month: 50, max_customers: 100 },
        { id: '2', name: 'professional', display_name: 'Professional', monthly_price: 999, quarterly_price: 2599, yearly_price: 9599, max_bills_per_month: 500, max_customers: 1000 },
        { id: '3', name: 'enterprise', display_name: 'Enterprise', monthly_price: 1999, quarterly_price: 5199, yearly_price: 19199, max_bills_per_month: 99999, max_customers: 99999 }
      ]
    }
    if (table === 'admin_users') {
      return [
        {
          id: 'user-1',
          full_name: 'Gopesh Kachhadiya',
          business_name: 'BillFlow Admin',
          email: 'gopeshkachhadiya00005@gmail.com',
          phone: '9876543210',
          status: 'active',
          plan: 'enterprise',
          total_paid: 19199,
          plan_price: 19199,
          billing_cycle: 'yearly',
          next_billing_date: new Date(Date.now() + 340 * 86400000).toISOString().split('T')[0],
          last_payment_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
          last_payment_amount: 19199,
          license_key: 'BF-ADMIN-DEMO-KEY',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString()
        },
        {
          id: 'user-2',
          full_name: 'Aarav Mehta',
          business_name: 'Aarav Retailers',
          email: 'aarav@mehta.com',
          phone: '9123456789',
          status: 'trial',
          plan: 'starter',
          total_paid: 0,
          plan_price: 499,
          billing_cycle: 'monthly',
          trial_start_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
          trial_end_date: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0],
          license_key: 'BF-TRIAL-AARAV-KEY',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'user-3',
          full_name: 'Priya Sharma',
          business_name: 'Sharma Logistics',
          email: 'priya@sharmalogistics.in',
          phone: '9812345670',
          status: 'trial',
          plan: 'professional',
          total_paid: 0,
          plan_price: 999,
          billing_cycle: 'monthly',
          trial_start_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
          trial_end_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          license_key: 'BF-TRIAL-PRIYA-KEY',
          created_at: new Date(Date.now() - 12 * 86400000).toISOString()
        },
        {
          id: 'user-4',
          full_name: 'Vikram Singh',
          business_name: 'Singh & Sons Co.',
          email: 'vikram@singhsons.com',
          phone: '9922334455',
          status: 'suspended',
          plan: 'professional',
          total_paid: 999,
          plan_price: 999,
          billing_cycle: 'monthly',
          last_payment_date: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
          last_payment_amount: 999,
          license_key: 'BF-SUSP-VIKRAM-KEY',
          created_at: new Date(Date.now() - 40 * 86400000).toISOString()
        }
      ]
    }
    if (table === 'admin_payments') {
      return [
        {
          id: 'p-1',
          user_id: 'user-1',
          amount: 19199,
          currency: 'INR',
          payment_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          reference: 'UTR9988776655',
          status: 'received',
          created_at: new Date(Date.now() - 25 * 86400000).toISOString()
        },
        {
          id: 'p-2',
          user_id: 'user-4',
          amount: 999,
          currency: 'INR',
          payment_date: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
          payment_method: 'upi',
          reference: 'UPI123987234',
          status: 'received',
          created_at: new Date(Date.now() - 40 * 86400000).toISOString()
        }
      ]
    }
    if (table === 'admin_activity_log') {
      return [
        {
          id: 'log-1',
          user_id: 'user-1',
          action: 'user_created',
          description: 'New user Gopesh Kachhadiya added to BillFlow',
          performed_by: 'admin',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString()
        },
        {
          id: 'log-2',
          user_id: 'user-1',
          action: 'payment_received',
          description: 'Payment of ₹19199 received. Ref: UTR9988776655',
          performed_by: 'admin',
          created_at: new Date(Date.now() - 25 * 86400000).toISOString()
        }
      ]
    }
    return []
  }

  // Mock Query Builder
  class MockQueryBuilder {
    constructor(table) {
      this.table = table
      this.filters = []
      this.sorting = null
      this.limitCount = null
      this.rangeOffset = null
      this.isSingle = false
    }

    select(fields, options) {
      return this
    }

    order(field, { ascending } = { ascending: true }) {
      this.sorting = { field, ascending }
      return this
    }

    eq(field, value) {
      this.filters.push(item => item[field] === value)
      return this
    }

    in(field, values) {
      this.filters.push(item => values.includes(item[field]))
      return this
    }

    or(clause) {
      // e.g. "full_name.ilike.%search%,business_name.ilike.%search%..."
      const match = clause.match(/%([^%]+)%/)
      if (match) {
        const term = match[1].toLowerCase()
        this.filters.push(item => 
          (item.full_name && item.full_name.toLowerCase().includes(term)) ||
          (item.business_name && item.business_name.toLowerCase().includes(term)) ||
          (item.email && item.email.toLowerCase().includes(term)) ||
          (item.phone && item.phone.toLowerCase().includes(term))
        )
      }
      return this
    }

    limit(num) {
      this.limitCount = num
      return this
    }

    range(from, to) {
      this.rangeOffset = { from, to }
      return this
    }

    single() {
      this.isSingle = true
      return this
    }

    getData() {
      let data = JSON.parse(localStorage.getItem(`mock_${this.table}`))
      if (!data) {
        data = getSeededData(this.table)
        localStorage.setItem(`mock_${this.table}`, JSON.stringify(data))
      }
      return data
    }

    async then(resolve) {
      let data = this.getData()

      // Apply filters
      for (const filterFn of this.filters) {
        data = data.filter(filterFn)
      }

      // Apply sorting
      if (this.sorting) {
        const { field, ascending } = this.sorting
        data.sort((a, b) => {
          let valA = a[field]
          let valB = b[field]
          if (valA == null) return 1
          if (valB == null) return -1
          if (typeof valA === 'string') {
            return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA)
          }
          return ascending ? valA - valB : valB - valA
        })
      }

      const totalCount = data.length

      // Apply range or limit
      if (this.rangeOffset) {
        data = data.slice(this.rangeOffset.from, this.rangeOffset.to + 1)
      } else if (this.limitCount) {
        data = data.slice(0, this.limitCount)
      }

      const result = {
        data: this.isSingle ? (data[0] || null) : data,
        error: null,
        count: totalCount
      }

      if (resolve) resolve(result)
      return result
    }

    async insert(rows) {
      let currentData = this.getData()
      const newRows = rows.map(r => ({
        id: crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        onboarded_at: new Date().toISOString(),
        ...r
      }))
      currentData = [...newRows, ...currentData]
      localStorage.setItem(`mock_${this.table}`, JSON.stringify(currentData))
      return { data: this.isSingle ? newRows[0] : newRows, error: null }
    }

    async update(updates) {
      let currentData = this.getData()
      
      // Get target IDs to update
      let targets = [...currentData]
      for (const filterFn of this.filters) {
        targets = targets.filter(filterFn)
      }
      const targetIds = targets.map(t => t.id)

      currentData = currentData.map(item => {
        if (targetIds.includes(item.id)) {
          return { ...item, ...updates, updated_at: new Date().toISOString() }
        }
        return item
      })

      localStorage.setItem(`mock_${this.table}`, JSON.stringify(currentData))
      const updated = currentData.filter(item => targetIds.includes(item.id))
      return { data: this.isSingle ? updated[0] : updated, error: null }
    }

    async delete() {
      let currentData = this.getData()
      let targets = [...currentData]
      for (const filterFn of this.filters) {
        targets = targets.filter(filterFn)
      }
      const targetIds = targets.map(t => t.id)
      currentData = currentData.filter(item => !targetIds.includes(item.id))
      localStorage.setItem(`mock_${this.table}`, JSON.stringify(currentData))
      return { error: null }
    }
  }

  // Mock Supabase Client Object
  client = {
    isSandbox: true,
    from: (table) => new MockQueryBuilder(table),
    auth: {
      getSession: async () => {
        const authed = localStorage.getItem('mock_admin_authed')
        if (authed === 'true') {
          return { data: { session: { user: { email: 'gopeshkachhadiya00005@gmail.com' } } } }
        }
        return { data: { session: null } }
      },
      getUser: async () => {
        const authed = localStorage.getItem('mock_admin_authed')
        if (authed === 'true') {
          return { data: { user: { email: 'gopeshkachhadiya00005@gmail.com' } }, error: null }
        }
        return { data: { user: null }, error: null }
      },
      onAuthStateChange: (callback) => {
        // Emit initial status
        const authed = localStorage.getItem('mock_admin_authed')
        const session = authed === 'true' ? { user: { email: 'gopeshkachhadiya00005@gmail.com' } } : null
        setTimeout(() => {
          callback('SIGNED_IN', session)
        }, 10)
        
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        }
      },
      signInWithPassword: async ({ email, password }) => {
        if (email === 'gopeshkachhadiya00005@gmail.com' && password === 'Gopesh@007') {
          localStorage.setItem('mock_admin_authed', 'true')
          const session = { user: { email } }
          window.location.reload()
          return { data: { session }, error: null }
        }
        return { data: { session: null }, error: { message: 'Invalid credentials. Password is case-sensitive.' } }
      },
      signOut: async () => {
        localStorage.removeItem('mock_admin_authed')
        window.location.reload()
        return { error: null }
      }
    }
  }
} else {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: true, persistSession: true }
  })
  client.isSandbox = false
}

export const supabase = client
