'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { validateUserSession } from '@/lib/supabase/auth-validation'
import { clearAllAuthData, forceLogout } from '@/lib/supabase/auth-utils'

export default function AuthDebugPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkAuthState = async () => {
    setLoading(true)
    try {
      // 1. Check basic session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      setSessionData({ session, error: sessionError })

      // 2. Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      setAuthState({ user, error: userError })

      // 3. Check validation
      const validation = await validateUserSession()
      setValidationResult(validation)

      // 4. Check profile directly
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfileData({ profile, error: profileError })
      } else {
        setProfileData(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      console.log('Login result:', { data, error })
      await checkAuthState()
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testSimpleLogout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      console.log('Simple logout result:', error)
      await checkAuthState()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testForceLogout = async () => {
    setLoading(true)
    try {
      await forceLogout()
      await checkAuthState()
    } catch (error) {
      console.error('Force logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testClearAuth = async () => {
    setLoading(true)
    try {
      await clearAllAuthData()
      await checkAuthState()
    } catch (error) {
      console.error('Clear auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthState()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      checkAuthState()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="mb-6 space-x-4">
          <button
            onClick={checkAuthState}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check Auth State'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Login
          </button>
          
          <button
            onClick={testSimpleLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Simple Logout
          </button>
          
          <button
            onClick={testForceLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50"
          >
            Force Logout
          </button>
          
          <button
            onClick={testClearAuth}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear All Auth
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Data</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth State</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Validation Result</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(validationResult, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Profile Data</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Check Auth State" to see current authentication status</li>
            <li>Try "Test Login" with a test account (or create one first)</li>
            <li>Test different logout methods to see which works</li>
            <li>Check browser console for additional error messages</li>
            <li>Look for any RLS policy errors in the Profile Data section</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 