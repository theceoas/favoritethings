'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { validateUserSession } from '@/lib/supabase/auth-validation'

export default function TestLoginDebug() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (step: string, success: boolean, data?: any, error?: any) => {
    const result = {
      step,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    }
    setResults(prev => [...prev, result])
    return result
  }

  const testLoginFlow = async () => {
    setResults([])
    setLoading(true)

    try {
      // Step 1: Check current session
      addResult('1. Check Current Session', true, 'Starting test...')
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      addResult('2. Get Session', !sessionError, sessionData?.session?.user?.email, sessionError)

      if (sessionData?.session?.user) {
        // Step 3: Test profile query directly
        const userId = sessionData.session.user.id
        addResult('3. User ID Found', true, userId)

        // Test the exact profile query that's used in validateUserSession
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, email, full_name')
            .eq('id', userId)
            .single()

          addResult('4. Profile Query', !profileError, profile, profileError)
        } catch (profileErr) {
          addResult('4. Profile Query', false, null, profileErr)
        }

        // Step 5: Test validateUserSession function
        try {
          const validation = await validateUserSession()
          addResult('5. Validate User Session', validation.isValid, validation, validation.error)
        } catch (validationErr) {
          addResult('5. Validate User Session', false, null, validationErr)
        }

        // Step 6: Test auth.getUser()
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          addResult('6. Get User', !userError, userData?.user?.email, userError)
        } catch (userErr) {
          addResult('6. Get User', false, null, userErr)
        }
      } else {
        addResult('3. No Current Session', true, 'Not logged in')
      }

    } catch (error) {
      addResult('Error', false, null, error)
    } finally {
      setLoading(false)
    }
  }

  const testBasicAuth = async () => {
    setResults([])
    setLoading(true)

    try {
      // Just test the basic auth parts without profile validation
      addResult('Testing Basic Auth Flow', true, 'Starting...')

      const { data: sessionData } = await supabase.auth.getSession()
      addResult('Current Session', true, sessionData?.session ? 'Has session' : 'No session')

      const { data: userData } = await supabase.auth.getUser()
      addResult('Get User', true, userData?.user ? userData.user.email : 'No user')

    } catch (error) {
      addResult('Basic Auth Test', false, null, error)
    } finally {
      setLoading(false)
    }
  }

  const clearSession = async () => {
    await supabase.auth.signOut()
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Login Flow Debug</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testLoginFlow}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Testing...' : 'Test Full Login Flow'}
            </button>
            
            <button
              onClick={testBasicAuth}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Test Basic Auth Only
            </button>
            
            <button
              onClick={clearSession}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Session
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No tests run yet</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{result.step}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {result.data && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Data: </span>
                      <span className="text-sm text-gray-600">
                        {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                      </span>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-red-700">Error: </span>
                      <span className="text-sm text-red-600">{result.error}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 