'use client'

import { useState } from 'react'

export default function TestInventoryPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')

  const testAction = async (action: string, extraData: any = {}) => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          product_id: productId || undefined,
          variant_id: variantId || undefined,
          quantity: 1,
          ...extraData
        })
      })
      
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error: 'Test failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Inventory Testing Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID (optional)
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter product ID to test"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant ID (optional)
              </label>
              <input
                type="text"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter variant ID to test"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => testAction('check_schema')}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Check Schema
            </button>
            
            <button
              onClick={() => testAction('check_current_inventory')}
              disabled={loading || (!productId && !variantId)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Check Inventory
            </button>
            
            <button
              onClick={() => testAction('reduce_inventory')}
              disabled={loading || (!productId && !variantId)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Reduce by 1
            </button>
            
            <button
              onClick={() => testAction('simulate_order')}
              disabled={loading || (!productId && !variantId)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Simulate Order
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Running test...</p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
              
              {results.results && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Summary:</h3>
                  {results.results.map((result: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg ${result.updateError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <p className="font-medium">
                        {result.type === 'variant' ? '🔗 Variant' : '📦 Product'}: {result.title}
                      </p>
                      <p className="text-sm">
                        Inventory: {result.before} → {result.after}
                      </p>
                      {result.updateError && (
                        <p className="text-red-600 text-sm">Error: {result.updateError.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No test results yet. Click a test button above.</p>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 How to Use</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• <strong>Check Schema:</strong> See what database columns exist</li>
            <li>• <strong>Check Inventory:</strong> View current inventory for a product/variant</li>
            <li>• <strong>Reduce by 1:</strong> Test reducing inventory by 1 unit</li>
            <li>• <strong>Simulate Order:</strong> Test the complete order flow</li>
          </ul>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> To test specific products, go to your products page, open browser dev tools, 
              and look for product/variant IDs in the console logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 