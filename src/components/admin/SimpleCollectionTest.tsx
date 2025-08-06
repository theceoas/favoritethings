'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SimpleCollectionTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const router = useRouter()

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  const testStep1_Connection = async () => {
    setIsLoading(true)
    setResult('🔍 Step 1: Testing Supabase connection...\n')
    
    try {
      const supabase = createClient()
      console.log('✅ Supabase client created')
      
      // Test basic connection with timeout
      const { data, error } = await withTimeout(
        supabase.from('collections').select('count').limit(1),
        5000
      )
      
      if (error) {
        setResult(prev => prev + `❌ Connection failed: ${error.message}\n`)
      } else {
        setResult(prev => prev + `✅ Connection successful\n`)
      }
    } catch (error: any) {
      setResult(prev => prev + `❌ Connection error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testStep2_Auth = async () => {
    setIsLoading(true)
    setResult('🔍 Step 2: Testing authentication...\n')
    
    try {
      const supabase = createClient()
      
      const { data: { user }, error } = await withTimeout(
        supabase.auth.getUser(),
        5000
      )
      
      if (error || !user) {
        setResult(prev => prev + `❌ Auth failed: ${error?.message || 'No user found'}\n`)
      } else {
        setResult(prev => prev + `✅ User authenticated: ${user.email}\n`)
      }
    } catch (error: any) {
      setResult(prev => prev + `❌ Auth error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testStep3_Profile = async () => {
    setIsLoading(true)
    setResult('🔍 Step 3: Testing profile access...\n')
    
    try {
      const supabase = createClient()
      
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        5000
      )
      
      if (!user) {
        setResult(prev => prev + `❌ No user for profile check\n`)
        setIsLoading(false)
        return
      }

      const { data: profile, error } = await withTimeout(
        supabase.from('profiles').select('role, email').eq('id', user.id).single(),
        5000
      )
      
      if (error) {
        setResult(prev => prev + `❌ Profile error: ${error.message}\n`)
      } else {
        setResult(prev => prev + `✅ Profile found: ${profile.email} (${profile.role})\n`)
        
        if (profile.role !== 'admin') {
          setResult(prev => prev + `⚠️ You need admin role to create collections\n`)
        }
      }
    } catch (error: any) {
      setResult(prev => prev + `❌ Profile error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testStep4_Create = async () => {
    setIsLoading(true)
    setResult('🔍 Step 4: Testing collection creation...\n')
    
    try {
      const supabase = createClient()
      
      const testData = {
        name: `Quick Test ${Date.now()}`,
        slug: `test-${Date.now()}`,
        description: 'Test',
        is_featured: false,
        is_active: true,
        sort_order: 0
      }

      const { data, error } = await withTimeout(
        supabase.from('collections').insert(testData).select().single(),
        10000
      )
      
      if (error) {
        setResult(prev => prev + `❌ Creation failed: ${error.message}\n`)
        
        if (error.message.includes('row-level security policy')) {
          setResult(prev => prev + `\n💡 SOLUTION: Run make-admin.sql to get admin role\n`)
        }
      } else {
        setResult(prev => prev + `✅ Collection created! ID: ${data.id}\n`)
        
        // Clean up test collection
        setTimeout(async () => {
          try {
            await supabase.from('collections').delete().eq('id', data.id)
            setResult(prev => prev + `🧹 Test collection cleaned up\n`)
          } catch (e) {
            console.log('Cleanup failed:', e)
          }
        }, 2000)
      }
    } catch (error: any) {
      setResult(prev => prev + `❌ Creation error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setResult('')
    setIsLoading(true)
    
    try {
      await testStep1_Connection()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testStep2_Auth()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testStep3_Profile()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testStep4_Create()
    } catch (error: any) {
      setResult(prev => prev + `❌ Test sequence failed: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const quickRoleCheck = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        3000
      )
      
      if (!user) {
        setResult('❌ Not authenticated')
        return
      }

      const { data: profile } = await withTimeout(
        supabase.from('profiles').select('role, email').eq('id', user.id).single(),
        3000
      )

      if (profile) {
        setResult(`User: ${profile.email}\nRole: ${profile.role}\n\n${profile.role === 'admin' ? '✅ You have admin access' : '❌ You need admin role'}`)
      } else {
        setResult('❌ Profile not found')
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-blue-800">🔧 Collection Creation Debug</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <button
            onClick={quickRoleCheck}
            disabled={isLoading}
            className="px-3 py-2 bg-gray-500 text-white rounded disabled:opacity-50 hover:bg-gray-600"
          >
            Quick Role Check
          </button>
          
          <button
            onClick={testStep1_Connection}
            disabled={isLoading}
            className="px-3 py-2 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600"
          >
            Test Connection
          </button>
          
          <button
            onClick={testStep2_Auth}
            disabled={isLoading}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            Test Auth
          </button>
          
          <button
            onClick={testStep3_Profile}
            disabled={isLoading}
            className="px-3 py-2 bg-purple-500 text-white rounded disabled:opacity-50 hover:bg-purple-600"
          >
            Test Profile
          </button>
          
          <button
            onClick={testStep4_Create}
            disabled={isLoading}
            className="px-3 py-2 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600"
          >
            Test Create
          </button>
          
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 hover:bg-indigo-700"
          >
            {isLoading ? 'Running...' : 'Run All Tests'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
            {result}
          </div>
        )}

        <div className="text-sm text-blue-700">
          <p><strong>If tests keep hanging:</strong></p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Check browser console (F12) for errors</li>
            <li>Check network tab for stuck requests</li>
            <li>Verify Supabase environment variables</li>
            <li>Try refreshing the page</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 