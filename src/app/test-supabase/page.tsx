'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...')
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    const tests = []
    
    try {
      // Test 1: Check environment variables
      tests.push({
        test: 'Environment Variables',
        result: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ URL found' : '❌ URL missing'
      })
      
      // Test 2: Simple database test (no RLS)
      try {
        const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true })
        tests.push({
          test: 'Database Connection (categories)',
          result: error ? `❌ ${error.message}` : '✅ Connected'
        })
      } catch (err) {
        tests.push({
          test: 'Database Connection (categories)',
          result: `❌ Network error: ${err}`
        })
      }

      // Test 3: Check profiles table specifically
      try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
        tests.push({
          test: 'Profiles Table Access',
          result: error ? `❌ ${error.message}` : '✅ Connected'
        })
      } catch (err) {
        tests.push({
          test: 'Profiles Table Access',
          result: `❌ Network error: ${err}`
        })
      }
      
      // Test 4: Auth test
      const { data: authData, error: authError } = await supabase.auth.getSession()
      tests.push({
        test: 'Auth Service',
        result: authError ? `❌ ${authError.message}` : '✅ Auth available'
      })
      
      setResults(tests)
      setStatus('Tests completed')
      
    } catch (err) {
      setStatus('Test failed')
      tests.push({
        test: 'General Error',
        result: `❌ ${err}`
      })
      setResults(tests)
    }
  }

  const testSignup = async () => {
    setStatus('Testing signup...')
    
    try {
      const testEmail = `test${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })

      if (error) {
        setResults(prev => [...prev, {
          test: 'Signup Test',
          result: `❌ ${error.message}`
        }])
      } else {
        setResults(prev => [...prev, {
          test: 'Signup Test',
          result: `✅ Signup successful! User ID: ${data.user?.id || 'No ID'}`
        }])
      }
    } catch (err) {
      setResults(prev => [...prev, {
        test: 'Signup Test',
        result: `❌ Network error: ${err}`
      }])
    }
    
    setStatus('Signup test completed')
  }

  const testSimpleSignup = async () => {
    setStatus('Testing simple signup...')
    
    try {
      const testEmail = `simple${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpass123'
      })

      if (error) {
        setResults(prev => [...prev, {
          test: 'Simple Signup (no metadata)',
          result: `❌ ${error.message}`
        }])
      } else {
        setResults(prev => [...prev, {
          test: 'Simple Signup (no metadata)',
          result: `✅ Simple signup works! User: ${data.user?.email || 'No email'}`
        }])
      }
    } catch (err) {
      setResults(prev => [...prev, {
        test: 'Simple Signup (no metadata)',
        result: `❌ Network error: ${err}`
      }])
    }
    
    setStatus('Simple signup test completed')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="mb-4">
          <strong>Status: </strong>
          <span className={status.includes('failed') ? 'text-red-600' : 'text-green-600'}>
            {status}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          {results.map((test, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">{test.test}:</span>
              <span className="font-mono text-sm">{test.result}</span>
            </div>
          ))}
        </div>

        <div className="space-x-4 mb-4">
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retest Connection
          </button>
          
          <button
            onClick={testSignup}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Signup (with metadata)
          </button>

          <button
            onClick={testSimpleSignup}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Simple Signup
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">Environment Check:</h3>
          <p className="text-sm text-yellow-700 mt-1">
            URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found'}
          </p>
          <p className="text-sm text-yellow-700">
            Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found (hidden)' : 'Not found'}
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Next Steps:</h3>
          <ul className="text-sm text-blue-700 mt-1 space-y-1">
            <li>• If database connection fails: Check if you ran the SQL schema</li>
            <li>• If signup fails: Check Supabase Auth settings</li>
            <li>• If profiles error: RLS policies might be too restrictive</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 