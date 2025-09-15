'use client'

import { useState } from 'react'
import { validateUserSession } from '@/lib/supabase/auth-validation'
import { clearAllAuthData, forceLogout } from '@/lib/supabase/auth-utils'
import { useRequireAuth } from '@/hooks/useAuthValidation'

export default function TestAuthValidation() {
  const [validationResult, setValidationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Use the hook to automatically validate
  const { user, profile, loading: authLoading, isValid } = useRequireAuth()

  const testValidation = async () => {
    setLoading(true)
    try {
      const result = await validateUserSession()
      setValidationResult(result)
    } catch (error) {
      setValidationResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const clearAuth = async () => {
    await clearAllAuthData()
    setValidationResult(null)
  }

  const forceLogoutTest = async () => {
    await forceLogout()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Validating authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Validation Test</h1>
        
        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Authentication State</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">User:</span>
              <span className="text-gray-900">{user?.email || 'Not authenticated'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Profile:</span>
              <span className="text-gray-900">{profile?.full_name || 'No profile'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Role:</span>
              <span className="text-gray-900">{profile?.role || 'No role'}</span>
            </div>
            {validationResult && !validationResult.isValid && (
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-24">Error Type:</span>
                <span className="text-red-600">{validationResult.errorType || 'Unknown'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testValidation}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Testing...' : 'Test Manual Validation'}
            </button>
            
            <button
              onClick={clearAuth}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Clear Auth Data
            </button>
            
            <button
              onClick={forceLogoutTest}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Force Logout
            </button>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Validation Result</h2>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(validationResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test Deleted User Issue</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 mb-4">
            <li>Login with a user account</li>
            <li>Delete that user from the Supabase dashboard (Auth &gt; Users)</li>
            <li>Come back to this page</li>
            <li>The hook should automatically detect the invalid session and redirect to login</li>
            <li>If you click "Test Manual Validation", it should return isValid: false</li>
            <li>The middleware will also catch this on protected routes and clear the session</li>
          </ol>
          
          <h4 className="font-semibold text-blue-900 mb-2">Error Types Explained:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>PROFILE_DELETED:</strong> User deleted from profiles table (our main scenario)</li>
            <li><strong>AUTH_ERROR:</strong> User deleted from Supabase Auth entirely</li>
            <li><strong>NO_SESSION:</strong> No authentication session found</li>
            <li><strong>DATABASE_ERROR:</strong> Database connection or permission issue</li>
          </ul>
        </div>

        {/* Protected Routes Test */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Protected Routes to Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/account"
              className="block p-3 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-green-900">/account</div>
              <div className="text-sm text-green-700">User account page</div>
            </a>
            <a
              href="/admin"
              className="block p-3 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-green-900">/admin</div>
              <div className="text-sm text-green-700">Admin dashboard</div>
            </a>
            <a
              href="/checkout"
              className="block p-3 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-green-900">/checkout</div>
              <div className="text-sm text-green-700">Checkout page</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}