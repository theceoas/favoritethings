'use client'

import { useState } from 'react'

export default function BasicSupabaseTest() {
  const [result, setResult] = useState<string>('')

  const checkEnvironment = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    let output = '🔍 Environment Variables Check:\n\n'
    output += `NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}\n`
    output += `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✅ Set' : '❌ Missing'}\n\n`
    
    if (url) {
      output += `URL: ${url}\n`
    }
    if (key) {
      output += `Key: ${key.substring(0, 20)}...\n`
    }
    
    if (!url || !key) {
      output += '\n❌ Missing environment variables!\n'
      output += 'Check your .env.local file in project root.\n'
    }
    
    setResult(output)
  }

  const testNetworkConnectivity = async () => {
    setResult('🌐 Testing network connectivity...\n')
    
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) {
        setResult(prev => prev + '❌ No Supabase URL found\n')
        return
      }

      // Test basic HTTP connectivity to Supabase
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        }
      })
      
      setResult(prev => prev + `Status: ${response.status}\n`)
      setResult(prev => prev + `Status Text: ${response.statusText}\n`)
      
      if (response.ok) {
        setResult(prev => prev + '✅ Network connectivity OK\n')
      } else {
        setResult(prev => prev + '❌ Network connectivity failed\n')
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Network error: ${error.message}\n`)
    }
  }

  const testSupabaseImport = async () => {
    setResult('📦 Testing Supabase client import...\n')
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      setResult(prev => prev + '✅ Supabase client imported successfully\n')
      
      const supabase = createClient()
      setResult(prev => prev + '✅ Supabase client created\n')
      
      // Test if client has expected methods
      if (typeof supabase.from === 'function') {
        setResult(prev => prev + '✅ Client methods available\n')
      } else {
        setResult(prev => prev + '❌ Client methods missing\n')
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Import error: ${error.message}\n`)
    }
  }

  const runBasicTests = async () => {
    setResult('')
    checkEnvironment()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testSupabaseImport()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testNetworkConnectivity()
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-red-800">🚨 Basic Supabase Diagnostics</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={checkEnvironment}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Check Environment
          </button>
          
          <button
            onClick={testSupabaseImport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Import
          </button>
          
          <button
            onClick={testNetworkConnectivity}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Network
          </button>
          
          <button
            onClick={runBasicTests}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Run All Basic Tests
          </button>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
            {result}
          </div>
        )}

        <div className="text-sm text-red-700">
          <p><strong>Common Issues:</strong></p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Missing .env.local file</li>
            <li>Incorrect Supabase URL or API key</li>
            <li>Network/firewall blocking requests</li>
            <li>Supabase project suspended/deleted</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 