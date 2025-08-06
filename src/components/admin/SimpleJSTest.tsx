'use client'

import { useState } from 'react'

export default function SimpleJSTest() {
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const testBasicJS = () => {
    console.log('🧪 Testing basic JavaScript...')
    setResult('✅ JavaScript execution works\n')
    setResult(prev => prev + '✅ React state update works\n')
    setResult(prev => prev + '✅ Event handlers work\n')
    setClickCount(prev => prev + 1)
  }

  const testAsyncJS = async () => {
    setIsLoading(true)
    setResult('🔄 Testing async JavaScript...\n')
    
    try {
      // Test basic async/await
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResult(prev => prev + '✅ Async/await works\n')
      
      // Test Promise handling
      const testPromise = new Promise(resolve => {
        setTimeout(() => resolve('Promise resolved!'), 500)
      })
      
      const promiseResult = await testPromise
      setResult(prev => prev + `✅ Promise handling works: ${promiseResult}\n`)
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Async error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult('🔄 Testing form submission...\n')
    
    try {
      // Simulate form processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResult(prev => prev + '✅ Form submission works\n')
      setResult(prev => prev + '✅ preventDefault works\n')
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Form error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFetch = async () => {
    setIsLoading(true)
    setResult('🌐 Testing fetch API...\n')
    
    try {
      // Test basic fetch to a known working endpoint
      const response = await fetch('https://httpbin.org/json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setResult(prev => prev + '✅ Fetch API works\n')
        setResult(prev => prev + '✅ JSON parsing works\n')
      } else {
        setResult(prev => prev + `❌ Fetch failed: ${response.status}\n`)
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Fetch error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testConsoleAndErrors = () => {
    setResult('🔍 Testing console and error handling...\n')
    
    // Test console
    console.log('✅ Console.log works')
    console.error('✅ Console.error works (this is intentional)')
    
    setResult(prev => prev + '✅ Console methods work\n')
    
    // Test error handling
    try {
      // Intentionally cause an error
      const test: any = null
      test.nonExistentMethod()
    } catch (error: any) {
      setResult(prev => prev + '✅ Error handling works\n')
      setResult(prev => prev + `Caught error: ${error.message}\n`)
    }
  }

  const runAllJSTests = async () => {
    setResult('')
    setIsLoading(true)
    
    try {
      testBasicJS()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testAsyncJS()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testFetch()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      testConsoleAndErrors()
      
      setResult(prev => prev + '\n🎉 All JavaScript tests completed!\n')
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Test sequence failed: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-yellow-800">🔧 Basic JavaScript & React Test</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-yellow-700 mb-4">
          <p><strong>If Supabase is fine, let's test basic functionality:</strong></p>
          <p>Click count: <span className="font-mono font-bold">{clickCount}</span></p>
          <p>Loading state: <span className="font-mono font-bold">{isLoading ? 'TRUE' : 'FALSE'}</span></p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <button
            onClick={testBasicJS}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Basic JS
          </button>
          
          <button
            onClick={testAsyncJS}
            disabled={isLoading}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            Test Async
          </button>
          
          <button
            onClick={testFetch}
            disabled={isLoading}
            className="px-3 py-2 bg-purple-500 text-white rounded disabled:opacity-50 hover:bg-purple-600"
          >
            Test Fetch
          </button>
          
          <button
            onClick={testConsoleAndErrors}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Test Console
          </button>
          
          <button
            onClick={runAllJSTests}
            disabled={isLoading}
            className="px-3 py-2 bg-orange-600 text-white rounded disabled:opacity-50 hover:bg-orange-700"
          >
            {isLoading ? 'Testing...' : 'Run All JS Tests'}
          </button>
        </div>

        {/* Test Form */}
        <form onSubmit={testFormSubmission} className="border border-yellow-300 p-4 rounded">
          <p className="text-sm text-yellow-700 mb-2">Test Form Submission:</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type anything..." 
              className="px-3 py-2 border rounded flex-1"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded disabled:opacity-50 hover:bg-yellow-700"
            >
              {isLoading ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>

        {result && (
          <div className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
            {result}
          </div>
        )}

        <div className="text-sm text-yellow-700">
          <p><strong>Browser Console Check:</strong></p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Press F12 to open DevTools</li>
            <li>Go to Console tab</li>
            <li>Look for any red errors</li>
            <li>Try running: <code>console.log('test')</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
} 