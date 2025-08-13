'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestAddressPage() {
  const [user, setUser] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState('')

  useEffect(() => {
    testAddressFunctionality()
  }, [])

  const testAddressFunctionality = async () => {
    setResult('Starting address functionality test...\n')
    
    try {
      // 1. Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ User auth error:', userError)
        setResult(prev => prev + `❌ User auth error: ${userError.message}\n`)
        setLoading(false)
        return
      }
      
      if (!user) {
        console.log('⚠️ No user found')
        setResult(prev => prev + '⚠️ No user found - please log in\n')
        setLoading(false)
        return
      }
      
      setUser(user)
      console.log('✅ User authenticated:', user.email)
      setResult(prev => prev + `✅ User authenticated: ${user.email}\n`)
      
      // 2. Test if addresses table exists and is accessible
      const { data: tableTest, error: tableError } = await supabase
        .from('addresses')
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error('❌ Table access error:', tableError)
        setResult(prev => prev + `❌ Table access error: ${tableError.message}\n`)
        setLoading(false)
        return
      }
      
      console.log('✅ Addresses table accessible')
      setResult(prev => prev + '✅ Addresses table accessible\n')
      
      // 3. Check total addresses in database
      const { data: allAddresses, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
      
      if (fetchError) {
        console.error('⚠️ Cannot fetch addresses:', fetchError.message)
        setResult(prev => prev + `⚠️ Cannot fetch addresses: ${fetchError.message}\n`)
      } else {
        console.log(`📍 Total addresses in database: ${allAddresses.length}`)
        setResult(prev => prev + `📍 Total addresses in database: ${allAddresses.length}\n`)
      }
      
      // 4. Fetch user's addresses
      const { data: userAddresses, error: userAddressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (userAddressError) {
        console.error('❌ Error fetching user addresses:', userAddressError)
        setResult(prev => prev + `❌ Error fetching user addresses: ${userAddressError.message}\n`)
      } else {
        console.log(`📍 User has ${userAddresses?.length || 0} addresses`)
        setResult(prev => prev + `📍 User has ${userAddresses?.length || 0} addresses\n`)
        setAddresses(userAddresses || [])
        
        if (userAddresses && userAddresses.length > 0) {
          userAddresses.forEach((addr, index) => {
            console.log(`📍 Address ${index + 1}:`, addr)
            setResult(prev => prev + `📍 Address ${index + 1}: ${addr.first_name} ${addr.last_name} - ${addr.address_line_1}\n`)
          })
        }
      }
      
      // 5. Test inserting a new address
      const testAddress = {
        user_id: user.id,
        type: 'shipping',
        first_name: 'Test',
        last_name: 'User',
        address_line_1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'Nigeria',
        is_default: false
      }
      
      const { data: insertResult, error: insertError } = await supabase
        .from('addresses')
        .insert(testAddress)
        .select()
      
      if (insertError) {
        console.error('❌ Error inserting test address:', insertError)
        setResult(prev => prev + `❌ Error inserting test address: ${insertError.message}\n`)
      } else {
        console.log('✅ Test address inserted successfully:', insertResult)
        setResult(prev => prev + '✅ Test address inserted successfully\n')
        
        // Clean up - delete the test address
        if (insertResult && insertResult[0]) {
          const { error: deleteError } = await supabase
            .from('addresses')
            .delete()
            .eq('id', insertResult[0].id)
          
          if (deleteError) {
            console.error('⚠️ Error deleting test address:', deleteError)
            setResult(prev => prev + `⚠️ Error deleting test address: ${deleteError.message}\n`)
          } else {
            console.log('✅ Test address cleaned up')
            setResult(prev => prev + '✅ Test address cleaned up\n')
          }
        }
      }
      
      // 6. Check RLS policies
      const { data: policies, error: policyError } = await supabase
        .rpc('check_table_policies', { table_name: 'addresses' })
      
      if (policyError) {
        console.error('⚠️ Cannot check policies:', policyError.message)
        setResult(prev => prev + `⚠️ Cannot check policies: ${policyError.message}\n`)
      } else {
        console.log('📍 RLS policies:', policies)
        setResult(prev => prev + `📍 RLS policies: ${JSON.stringify(policies)}\n`)
      }
      
    } catch (error) {
      console.error('💥 Unexpected error:', error)
      setResult(prev => prev + `💥 Unexpected error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Address Functionality Test</h1>
        
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Testing address functionality...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {result}
              </pre>
            </div>
            
            {addresses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">User Addresses</h2>
                <div className="space-y-4">
                  {addresses.map((address, index) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {address.first_name} {address.last_name}
                        </h3>
                        <span className="text-sm text-gray-500">{address.type}</span>
                      </div>
                      <p className="text-gray-600">{address.address_line_1}</p>
                      <p className="text-gray-600">{address.city}, {address.state} {address.postal_code}</p>
                      <p className="text-gray-600">{address.country}</p>
                      {address.is_default && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={testAddressFunctionality}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Test Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 