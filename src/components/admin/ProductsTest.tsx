'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProductsTest() {
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testProductsQuery = async () => {
    setIsLoading(true)
    setResult('🔍 Testing products query...\n')
    
    try {
      const supabase = createClient()
      
      // Test 1: Simple count query
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        setResult(prev => prev + `❌ Count query failed: ${countError.message}\n`)
        return
      }
      
      setResult(prev => prev + `✅ Products count: ${count}\n`)
      
      // Test 2: Simple products query
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, is_active')
        .limit(5)
      
      if (productsError) {
        setResult(prev => prev + `❌ Products query failed: ${productsError.message}\n`)
        return
      }
      
      setResult(prev => prev + `✅ Simple products query worked, found ${products.length} products\n`)
      
      // Test 3: Complex products query (like the one used in the page)
      const { data: complexProducts, error: complexError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          product_filter_values (
            filter_id,
            filter_option_id,
            category_filters (
              name,
              color,
              slug
            ),
            category_filter_options (
              name,
              slug
            )
          )
        `)
        .eq('is_active', true)
        .limit(3)
      
      if (complexError) {
        setResult(prev => prev + `❌ Complex products query failed: ${complexError.message}\n`)
        
        // Check if it's RLS issue
        if (complexError.message.includes('row-level security policy')) {
          setResult(prev => prev + `💡 SOLUTION: This is an RLS permissions issue for products table\n`)
        }
      } else {
        setResult(prev => prev + `✅ Complex products query worked, found ${complexProducts.length} products\n`)
        
        // Show sample product
        if (complexProducts.length > 0) {
          const sample = complexProducts[0]
          setResult(prev => prev + `📦 Sample product: ${sample.title} - ₦${sample.price}\n`)
        }
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Unexpected error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testCategoriesQuery = async () => {
    setIsLoading(true)
    setResult('🏷️ Testing categories query...\n')
    
    try {
      const supabase = createClient()
      
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (error) {
        setResult(prev => prev + `❌ Categories query failed: ${error.message}\n`)
      } else {
        setResult(prev => prev + `✅ Categories query worked, found ${categories.length} categories\n`)
        
        if (categories.length > 0) {
          setResult(prev => prev + `📂 Sample categories: ${categories.map(c => c.name).join(', ')}\n`)
        }
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Unexpected error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const testProductsRLS = async () => {
    setIsLoading(true)
    setResult('🔒 Testing products RLS policies...\n')
    
    try {
      const supabase = createClient()
      
      // Check if user can access products table at all
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setResult(prev => prev + `❌ Not authenticated - this might be the issue\n`)
        return
      }
      
      setResult(prev => prev + `👤 User: ${user.email}\n`)
      
      // Test different permission scenarios
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('id')
        .limit(1)
      
      if (allError) {
        setResult(prev => prev + `❌ Cannot access products table: ${allError.message}\n`)
        
        if (allError.message.includes('permission denied') || allError.message.includes('row-level security')) {
          setResult(prev => prev + `💡 FIX: You need admin role to access products table\n`)
          setResult(prev => prev + `💡 Run: UPDATE profiles SET role = 'admin' WHERE email = '${user.email}'\n`)
        }
      } else {
        setResult(prev => prev + `✅ Can access products table\n`)
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ RLS test error: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllProductTests = async () => {
    setResult('')
    setIsLoading(true)
    
    try {
      await testProductsRLS()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testCategoriesQuery()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testProductsQuery()
      
      setResult(prev => prev + '\n🎯 Products diagnosis complete!\n')
    } catch (error: any) {
      setResult(prev => prev + `❌ Test sequence failed: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-blue-800">📦 Products Page Diagnostics</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-blue-700 mb-4">
          <p><strong>Testing why products page shows "Loading..." forever:</strong></p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <button
            onClick={testProductsRLS}
            disabled={isLoading}
            className="px-3 py-2 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600"
          >
            Test RLS
          </button>
          
          <button
            onClick={testCategoriesQuery}
            disabled={isLoading}
            className="px-3 py-2 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600"
          >
            Test Categories
          </button>
          
          <button
            onClick={testProductsQuery}
            disabled={isLoading}
            className="px-3 py-2 bg-purple-500 text-white rounded disabled:opacity-50 hover:bg-purple-600"
          >
            Test Products
          </button>
          
          <button
            onClick={runAllProductTests}
            disabled={isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
          >
            {isLoading ? 'Testing...' : 'Run All Tests'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
            {result}
          </div>
        )}

        <div className="text-sm text-blue-700">
          <p><strong>Most likely causes:</strong></p>
          <ul className="list-disc ml-4 space-y-1">
            <li>RLS permissions on products table</li>
            <li>Products table doesn't exist or has no data</li>
            <li>Complex query with joins failing</li>
            <li>Product filter values table issues</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 