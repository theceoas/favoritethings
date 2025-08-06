'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestAddressPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testAddressSave = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 Testing address save...')
      setResult('🧪 Testing address save...\n')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 Current user:', user?.email)
      setResult(prev => prev + `👤 Current user: ${user?.email || 'Not logged in'}\n`)
      
      if (!user) {
        // Create a test profile first
        console.log('👤 Creating test profile...')
        setResult(prev => prev + '👤 Creating test profile...\n')
        
        const testProfileId = crypto.randomUUID()
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: testProfileId,
            email: 'test-address@example.com',
            full_name: 'Test Address User',
            role: 'customer',
            is_active: true,
            marketing_consent: false
          })
          .select()
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError)
          setResult(prev => prev + `❌ Profile creation error: ${profileError.message}\n`)
          return
        }
        
        console.log('✅ Test profile created:', newProfile)
        setResult(prev => prev + `✅ Test profile created: ${testProfileId}\n`)
        
        // Now try to save address for this profile
        const testAddress = {
          user_id: testProfileId,
          type: 'shipping',
          is_default: false,
          first_name: 'Test',
          last_name: 'User',
          address_line_1: '123 Test Street',
          city: 'Lagos',
          state: 'Lagos',
          postal_code: '100001',
          country: 'Nigeria',
          phone: '+234-801-234-5678'
        }
        
        console.log('💾 Saving test address:', testAddress)
        setResult(prev => prev + '💾 Saving test address...\n')
        
        const { data: addressResult, error: addressError } = await supabase
          .from('addresses')
          .insert(testAddress)
          .select()
        
        if (addressError) {
          console.error('❌ Address save error:', addressError)
          setResult(prev => prev + `❌ Address save error: ${addressError.message}\n`)
          setResult(prev => prev + `❌ Error code: ${addressError.code}\n`)
          setResult(prev => prev + `❌ Error details: ${JSON.stringify(addressError.details)}\n`)
        } else {
          console.log('✅ Address saved:', addressResult)
          setResult(prev => prev + `✅ Address saved successfully!\n`)
          setResult(prev => prev + `📍 Address ID: ${addressResult[0]?.id}\n`)
        }
        
      } else {
        // User is logged in, try saving address directly
        const testAddress = {
          user_id: user.id,
          type: 'shipping',
          is_default: false,
          first_name: 'Logged In',
          last_name: 'User',
          address_line_1: '456 Logged In Street',
          city: 'Lagos',
          state: 'Lagos',
          postal_code: '100001',
          country: 'Nigeria',
          phone: '+234-802-234-5678'
        }
        
        console.log('💾 Saving address for logged in user:', testAddress)
        setResult(prev => prev + '💾 Saving address for logged in user...\n')
        
        const { data: addressResult, error: addressError } = await supabase
          .from('addresses')
          .insert(testAddress)
          .select()
        
        if (addressError) {
          console.error('❌ Address save error:', addressError)
          setResult(prev => prev + `❌ Address save error: ${addressError.message}\n`)
        } else {
          console.log('✅ Address saved:', addressResult)
          setResult(prev => prev + `✅ Address saved successfully!\n`)
        }
      }
      
      // Check total addresses in database
      const { data: allAddresses, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
      
      if (fetchError) {
        console.log('⚠️ Cannot fetch addresses:', fetchError.message)
        setResult(prev => prev + `⚠️ Cannot fetch addresses: ${fetchError.message}\n`)
      } else {
        console.log(`📍 Total addresses in database: ${allAddresses.length}`)
        setResult(prev => prev + `📍 Total addresses in database: ${allAddresses.length}\n`)
      }
      
    } catch (error: any) {
      console.error('💥 Test error:', error)
      setResult(prev => prev + `💥 Test error: ${error.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  const checkPolicies = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🔒 Checking RLS policies...')
      setResult('🔒 Checking RLS policies...\n')
      
      // Try to query the policies (this might not work from client)
      const { data, error } = await supabase
        .rpc('check_table_policies', { table_name: 'addresses' })
      
      if (error) {
        console.log('⚠️ Cannot check policies from client:', error.message)
        setResult(prev => prev + `⚠️ Cannot check policies from client: ${error.message}\n`)
      } else {
        console.log('📋 Policies:', data)
        setResult(prev => prev + `📋 Policies: ${JSON.stringify(data)}\n`)
      }
      
    } catch (error: any) {
      console.error('💥 Policy check error:', error)
      setResult(prev => prev + `💥 Policy check error: ${error.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Address Saving</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Address Save Test</h2>
          <p className="text-gray-600 mb-6">
            This page tests the address saving functionality to debug issues.
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testAddressSave}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Address Save'}
            </button>
            
            <button
              onClick={checkPolicies}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Policies'}
            </button>
          </div>
          
          {result && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Test Results:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 