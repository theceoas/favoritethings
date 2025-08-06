'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Props {
  onSyncComplete?: () => void
}

export default function SyncCustomersButton({ onSyncComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const syncCustomers = async () => {
    setLoading(true)
    setResults([])
    
    try {
      console.log('🔄 Starting customer sync...')
      
      // Step 1: Check what we have currently
      const { data: currentProfiles, error: currentError } = await supabase
        .from('profiles')
        .select('role')
      
      if (currentError) {
        throw new Error(`Error fetching current profiles: ${currentError.message}`)
      }
      
      const customerCount = currentProfiles?.filter(p => p.role === 'customer').length || 0
      setResults(prev => [...prev, `📊 Current customers: ${customerCount}`])
      
      // Step 2: Check for auth users without profiles
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        setResults(prev => [...prev, `⚠️ Cannot access auth users: ${authError.message}`])
      } else {
        setResults(prev => [...prev, `👤 Total auth users: ${authUsers.users.length}`])
      }
      
      // Step 3: Create test customers if none exist
      if (customerCount === 0) {
        setResults(prev => [...prev, '🔨 No customers found, creating test data...'])
        
        const testCustomers = [
          {
            id: crypto.randomUUID(),
            email: 'john.doe@gmail.com',
            full_name: 'John Doe',
            role: 'customer',
            phone: '+234-801-234-5678',
            is_active: true,
            marketing_consent: true
          },
          {
            id: crypto.randomUUID(),
            email: 'jane.smith@yahoo.com',
            full_name: 'Jane Smith',
            role: 'customer',
            phone: '+234-802-345-6789',
            is_active: true,
            marketing_consent: false
          },
          {
            id: crypto.randomUUID(),
            email: 'mike.johnson@outlook.com',
            full_name: 'Mike Johnson',
            role: 'customer',
            phone: '+234-803-456-7890',
            is_active: true,
            marketing_consent: true
          }
        ]
        
        for (const customer of testCustomers) {
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert(customer)
          
          if (insertError) {
            setResults(prev => [...prev, `❌ Error creating ${customer.email}: ${insertError.message}`])
          } else {
            setResults(prev => [...prev, `✅ Created customer: ${customer.email}`])
          }
        }
      }
      
      // Step 4: Check final count
      const { data: finalProfiles } = await supabase
        .from('profiles')
        .select('role')
      
      const finalCustomerCount = finalProfiles?.filter(p => p.role === 'customer').length || 0
      setResults(prev => [...prev, `🎉 Final customer count: ${finalCustomerCount}`])
      
      // Step 5: Create some sample orders for testing
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'customer')
        .limit(2)
      
      if (customers && customers.length > 0) {
        for (const customer of customers) {
          // Create a sample order
          const orderData = {
            id: crypto.randomUUID(),
            order_number: `KI-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-001`,
            user_id: customer.id,
            email: customer.email,
            status: 'delivered',
            payment_status: 'paid',
            total: Math.floor(Math.random() * 100000 + 10000),
            subtotal: Math.floor(Math.random() * 90000 + 9000),
            tax_amount: Math.floor(Math.random() * 5000 + 500),
            shipping_amount: Math.random() > 0.5 ? 5000 : 0,
            delivery_method: Math.random() > 0.5 ? 'shipping' : 'pickup',
            shipping_address: {
              first_name: customer.email.split('@')[0],
              last_name: 'Customer',
              email: customer.email,
              phone: '+234-801-000-0000',
              address_line_1: '123 Test Street',
              city: 'Lagos',
              state: 'Lagos',
              postal_code: '10001',
              country: 'Nigeria'
            }
          }
          
          const { error: orderError } = await supabase
            .from('orders')
            .upsert(orderData)
          
          if (!orderError) {
            setResults(prev => [...prev, `📦 Created sample order for ${customer.email}`])
          }
        }
      }
      
      setResults(prev => [...prev, '✅ Customer sync completed!'])
      
      // Call the completion callback to refresh parent data
      if (onSyncComplete) {
        onSyncComplete()
      }
      
    } catch (error: any) {
      console.error('Sync error:', error)
      setResults(prev => [...prev, `❌ Sync failed: ${error.message}`])
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Customer Database Sync</h3>
          <p className="text-sm text-gray-600">
            Sync auth users to profiles and create test data if needed
          </p>
        </div>
        <button
          onClick={syncCustomers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Syncing...' : 'Sync Customers'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-3 max-h-40 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Results:</h4>
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-xs text-gray-600 font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 