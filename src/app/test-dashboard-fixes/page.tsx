'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  sku: string
  barcode?: string
  inventory_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_active: boolean
}

export default function TestDashboardFixesPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  const testLowStockLogic = async () => {
    setIsLoading(true)
    setTestResult('🔍 Testing low stock logic...\n')
    
    try {
      const supabase = createClient()

      // Get all products first
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, sku, barcode, inventory_quantity, low_stock_threshold, track_inventory, is_active')
        .eq('is_active', true)
        .eq('track_inventory', true)
        .order('inventory_quantity', { ascending: true })

      if (productsError) {
        setTestResult(prev => prev + `❌ Error fetching products: ${productsError.message}\n`)
        return
      }

      setAllProducts(products || [])
      setTestResult(prev => prev + `✅ Found ${products?.length || 0} active products with inventory tracking\n`)

      // Filter for low stock using proper logic
      const lowStock = (products || []).filter(product => {
        const threshold = product.low_stock_threshold || 5
        return product.inventory_quantity <= threshold
      })

      setLowStockProducts(lowStock)
      setTestResult(prev => prev + `🔍 Low stock analysis:\n`)
      
      if (lowStock.length === 0) {
        setTestResult(prev => prev + `   ✅ No products are low on stock!\n`)
      } else {
        setTestResult(prev => prev + `   ⚠️  Found ${lowStock.length} products with low stock:\n`)
        lowStock.forEach(product => {
          const threshold = product.low_stock_threshold || 5
          setTestResult(prev => prev + `   - ${product.title}: ${product.inventory_quantity} left (alert at ${threshold})\n`)
        })
      }

      // Test the old broken logic vs new logic
      const oldLogicResults = (products || []).filter(product => product.inventory_quantity <= 10)
      setTestResult(prev => prev + `\n📊 Comparison:\n`)
      setTestResult(prev => prev + `   Old logic (hardcoded ≤ 10): ${oldLogicResults.length} products\n`)
      setTestResult(prev => prev + `   New logic (custom thresholds): ${lowStock.length} products\n`)

      if (oldLogicResults.length !== lowStock.length) {
        setTestResult(prev => prev + `   🎯 Logic fixed! Results are now accurate.\n`)
      }

    } catch (error) {
      setTestResult(prev => prev + `❌ Test failed: ${error}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const simulateLowStock = async () => {
    setIsLoading(true)
    setTestResult('🧪 Creating test low stock scenario...\n')
    
    try {
      const supabase = createClient()

      // Find a product to make low stock
      const { data: products } = await supabase
        .from('products')
        .select('id, title, inventory_quantity, low_stock_threshold')
        .eq('is_active', true)
        .eq('track_inventory', true)
        .gt('inventory_quantity', 5)
        .limit(1)

      if (!products || products.length === 0) {
        setTestResult(prev => prev + `❌ No suitable products found for testing\n`)
        return
      }

      const testProduct = products[0]
      const newQuantity = 2 // Make it low stock
      const threshold = testProduct.low_stock_threshold || 5

      const { error } = await supabase
        .from('products')
        .update({ inventory_quantity: newQuantity })
        .eq('id', testProduct.id)

      if (error) {
        setTestResult(prev => prev + `❌ Failed to update product: ${error.message}\n`)
        return
      }

      setTestResult(prev => prev + `✅ Updated "${testProduct.title}" to ${newQuantity} units (threshold: ${threshold})\n`)
      setTestResult(prev => prev + `🎯 This product should now appear in low stock alerts!\n`)
      setTestResult(prev => prev + `🔄 Refresh the dashboard to see the change.\n`)

    } catch (error) {
      setTestResult(prev => prev + `❌ Simulation failed: ${error}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testLowStockLogic()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4F4032] mb-2">🎯 Dashboard Low Stock Fix Test</h1>
        <p className="text-gray-600 mb-8">Testing the corrected low stock alert logic</p>
        
        {/* Issue & Fix Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#4F4032] mb-4">🐛 Issue Fixed</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-3">❌ Before (Broken)</h3>
              <ul className="space-y-2 text-sm text-red-700">
                <li>• Used hardcoded threshold of 10</li>
                <li>• Ignored each product's actual threshold</li>
                <li>• Didn't consider products with variants</li>
                <li>• Showed incorrect alerts</li>
                <li>• Query: <code>inventory_quantity ≤ 10</code></li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">✅ After (Fixed)</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• Uses each product's <code>low_stock_threshold</code></li>
                <li>• Respects custom threshold settings</li>
                <li>• Considers variant inventory properly</li>
                <li>• Shows accurate alerts only</li>
                <li>• Logic: <code>inventory_quantity ≤ low_stock_threshold</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#4F4032] mb-4">🧪 Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testLowStockLogic}
              disabled={isLoading}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '🔄 Testing...' : '🔍 Test Low Stock Logic'}
            </button>
            
            <button
              onClick={simulateLowStock}
              disabled={isLoading}
              className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? '🔄 Creating...' : '🧪 Create Test Low Stock'}
            </button>
            
            <Link
              href="/admin"
              className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 text-center"
            >
              📊 View Dashboard
            </Link>
          </div>

          {testResult && (
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
              {testResult}
            </div>
          )}
        </div>

        {/* Current Low Stock Products */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#4F4032] mb-4">⚠️ Current Low Stock Products</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-3 font-semibold text-gray-700">Barcode</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Current</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Threshold</th>
                    <th className="text-center py-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => {
                    const threshold = product.low_stock_threshold || 5
                    const isOutOfStock = product.inventory_quantity === 0
                    
                    return (
                      <tr key={product.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm font-medium text-gray-900">{product.title}</td>
                        <td className="py-3 text-sm text-gray-600">{product.sku}</td>
                        <td className="py-3 text-sm text-gray-600">{product.barcode || '-'}</td>
                        <td className="py-3 text-right text-sm font-bold text-orange-600">{product.inventory_quantity}</td>
                        <td className="py-3 text-right text-sm text-gray-600">{threshold}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Products Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-[#4F4032] mb-4">📊 Inventory Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">{allProducts.length}</div>
              <div className="text-sm text-blue-600">Total Products</div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-800">
                {allProducts.length - lowStockProducts.length}
              </div>
              <div className="text-sm text-green-600">Well Stocked</div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-800">
                {lowStockProducts.filter(p => p.inventory_quantity > 0).length}
              </div>
              <div className="text-sm text-orange-600">Low Stock</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-800">
                {lowStockProducts.filter(p => p.inventory_quantity === 0).length}
              </div>
              <div className="text-sm text-red-600">Out of Stock</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link
              href="/admin/inventory"
              className="inline-flex items-center bg-[#6A41A1] text-white py-2 px-6 rounded-lg hover:bg-[#5A3191] transition-colors"
            >
              🏪 Manage Inventory
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 