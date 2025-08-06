'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SimpleTest() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      // Test 1: Check if supabase client is created
      setResult('Supabase client created: ' + (supabase ? 'YES' : 'NO'))
      
      // Test 2: Try to get session (doesn't require database)
      const { data, error } = await supabase.auth.getSession()
      setResult(prev => prev + '\nAuth session check: ' + (error ? `ERROR: ${error.message}` : 'SUCCESS'))
      
      // Test 3: Try simple signup (this will tell us if auth is working)
      const testEmail = `simpletest${Date.now()}@example.com`
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpass123'
      })
      
      setResult(prev => prev + '\nSimple signup test: ' + (signupError ? `ERROR: ${signupError.message}` : `SUCCESS - User ID: ${signupData.user?.id}`))
      
    } catch (err) {
      setResult(prev => prev + '\nUnexpected error: ' + err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Auth Only'}
        </button>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Results:</h3>
          <pre className="text-sm whitespace-pre-wrap">{result || 'Click button to test'}</pre>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            This test only checks authentication, no database access. If this works, 
            the issue is with the database setup, not the Supabase connection.
          </p>
        </div>
      </div>
    </div>
  )
} 