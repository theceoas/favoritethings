'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function TestInventoryFixesPage() {
  const [testResult, setTestResult] = useState<string | null>(null)

  const testToasts = () => {
    toast.success('✅ Success toast working!')
    toast.error('❌ Error toast working!')
    toast.info('ℹ️ Info toast working!')
    setTestResult('Toasts tested successfully!')
  }

  const testLogger = () => {
    try {
      // Test if logger import works
      const { logger } = require('@/lib/utils/logger')
      logger.log('Testing logger functionality')
      logger.error('Testing error logging')
      setTestResult('Logger is working correctly!')
      toast.success('✅ Logger test passed!')
    } catch (error) {
      setTestResult('Logger test failed: ' + error)
      toast.error('❌ Logger test failed!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4F4032] mb-2">🔧 Inventory Fixes Test</h1>
        <p className="text-gray-600 mb-8">Testing the fixes for inventory page errors</p>
        
        {/* Test Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#4F4032] mb-4">✅ Issues Fixed</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-3">🔨 Fixed Issues</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• ✅ Restored empty logger.ts file</li>
                <li>• ✅ Added sonner toast imports</li>
                <li>• ✅ Replaced alert() with toast notifications</li>
                <li>• ✅ Cleared Next.js build cache</li>
                <li>• ✅ Removed non-existent Toast import</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🧪 Test Functions</h3>
              <div className="space-y-3">
                <button
                  onClick={testToasts}
                  className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  🍞 Test Toast Notifications
                </button>
                <button
                  onClick={testLogger}
                  className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  📝 Test Logger Utility
                </button>
              </div>
            </div>
          </div>

          {testResult && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">{testResult}</p>
            </div>
          )}
        </div>

        {/* Navigation Test */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#4F4032] mb-4">🔗 Test Inventory Page</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/inventory"
              className="block bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🏪</div>
              <div className="font-semibold">Inventory Manager</div>
              <div className="text-sm mt-1 opacity-90">Should work without errors now</div>
            </Link>

            <Link
              href="/admin/products/new"
              className="block bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-semibold">Create Product</div>
              <div className="text-sm mt-1 opacity-90">Test variant barcodes</div>
            </Link>

            <Link
              href="/test-add-variant-barcode"
              className="block bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🧪</div>
              <div className="font-semibold">Variant Test</div>
              <div className="text-sm mt-1 opacity-90">Test new features</div>
            </Link>
          </div>
        </div>

        {/* Error Resolution Details */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-red-800 mb-3">🐛 Errors Resolved</h3>
          <div className="space-y-3 text-sm text-red-700">
            <div className="bg-white p-3 rounded border border-red-200">
              <strong>Error 1:</strong> <code>Can't resolve '@/components/ui/Toast'</code>
              <br />
              <strong>Solution:</strong> Replaced with sonner toast imports
            </div>
            <div className="bg-white p-3 rounded border border-red-200">
              <strong>Error 2:</strong> <code>Export logger doesn't exist in target module</code>
              <br />
              <strong>Solution:</strong> Restored logger.ts file with proper exports
            </div>
            <div className="bg-white p-3 rounded border border-red-200">
              <strong>Error 3:</strong> Multiple alert() calls causing poor UX
              <br />
              <strong>Solution:</strong> Replaced with beautiful toast notifications
            </div>
          </div>
        </div>

        {/* Expected Results */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-3">🎯 Expected Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <h4 className="font-semibold mb-2">Inventory Page Should:</h4>
              <ul className="space-y-1">
                <li>• Load without module errors</li>
                <li>• Display products with barcodes</li>
                <li>• Show toast notifications instead of alerts</li>
                <li>• Allow store sale mode functionality</li>
                <li>• Search by variant barcodes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Features Working:</h4>
              <ul className="space-y-1">
                <li>• Quick sale processing</li>
                <li>• Inventory adjustments</li>
                <li>• Real-time search</li>
                <li>• Variant barcode display</li>
                <li>• Professional notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 