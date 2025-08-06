'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestVariantBarcodesPage() {
  const [testProduct, setTestProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  const createTestProduct = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Create test product with barcode
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: 'Test Bedding Set with Variants',
          slug: 'test-bedding-variants',
          sku: 'TEST-BED-001',
          barcode: 'MAIN001',
          price: 50000,
          inventory_quantity: 0, // Will use variants
          track_inventory: false, // Use variant tracking
          is_active: true,
          description: 'Test product with multiple size variants and individual barcodes'
        })
        .select()
        .single()

      if (productError) throw productError

      // Create variants with individual barcodes
      const variants = [
        {
          product_id: product.id,
          title: 'King Size - White',
          sku: 'TEST-BED-001-K-W',
          barcode: 'BED001-KING',
          price: 60000,
          size: 'King',
          color: 'White',
          inventory_quantity: 5,
          track_inventory: true,
          is_active: true,
          sort_order: 1
        },
        {
          product_id: product.id,
          title: 'Queen Size - White',
          sku: 'TEST-BED-001-Q-W',
          barcode: 'BED001-QUEEN',
          price: 55000,
          size: 'Queen',
          color: 'White',
          inventory_quantity: 3,
          track_inventory: true,
          is_active: true,
          sort_order: 2
        },
        {
          product_id: product.id,
          title: 'Double Size - White',
          sku: 'TEST-BED-001-D-W',
          barcode: 'BED001-DOUBLE',
          price: 50000,
          size: 'Double',
          color: 'White',
          inventory_quantity: 7,
          track_inventory: true,
          is_active: true,
          sort_order: 3
        }
      ]

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variants)

      if (variantsError) throw variantsError

      // Fetch the complete product with variants
      const { data: completeProduct } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('id', product.id)
        .single()

      setTestProduct(completeProduct)
      alert('✅ Test product created successfully!')
      
    } catch (error) {
      console.error('Error creating test product:', error)
      alert('❌ Error creating test product: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          sku,
          barcode,
          inventory_quantity,
          product_variants (
            id,
            title,
            sku,
            barcode,
            inventory_quantity,
            size,
            color
          )
        `)
        .or(`title.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)

      if (error) throw error
      
      // Also search for products with matching variants
      const { data: variantMatches } = await supabase
        .from('product_variants')
        .select(`
          id,
          title,
          sku,
          barcode,
          product_id,
          products (
            id,
            title,
            sku,
            barcode,
            inventory_quantity
          )
        `)
        .or(`title.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)

      // Combine results
      const allResults = [...(data || [])]
      
      if (variantMatches) {
        for (const variant of variantMatches) {
          const productExists = allResults.find(p => p.id === variant.product_id)
          if (!productExists && variant.products) {
            // Fetch full product data
            const { data: fullProduct } = await supabase
              .from('products')
              .select(`
                id,
                title,
                sku,
                barcode,
                inventory_quantity,
                product_variants (
                  id,
                  title,
                  sku,
                  barcode,
                  inventory_quantity,
                  size,
                  color
                )
              `)
              .eq('id', variant.product_id)
              .single()
            
            if (fullProduct) {
              allResults.push(fullProduct)
            }
          }
        }
      }

      setSearchResults(allResults)
      
    } catch (error) {
      console.error('Error searching:', error)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchProducts()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const deleteTestData = async () => {
    if (!testProduct) return
    
    try {
      const supabase = createClient()
      
      // Delete variants first
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', testProduct.id)
      
      // Delete product
      await supabase
        .from('products')
        .delete()
        .eq('id', testProduct.id)
      
      setTestProduct(null)
      setSearchResults([])
      alert('🗑️ Test data cleaned up!')
      
    } catch (error) {
      console.error('Error deleting test data:', error)
      alert('❌ Error deleting test data')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4F4032] mb-2">🏷️ Variant Barcode System Test</h1>
        <p className="text-gray-600 mb-8">Test the new individual variant barcode functionality</p>
        
        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4">✅ Features Added</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Individual variant barcodes</li>
              <li>• Enhanced variant form UI</li>
              <li>• Variant barcode search</li>
              <li>• Improved inventory styling</li>
              <li>• Store sale mode integration</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4">🛠️ Setup Required</h3>
            <div className="space-y-3">
              <div className="text-sm text-blue-700 mb-3">
                1. Run SQL migration in Supabase
              </div>
              <button
                onClick={createTestProduct}
                disabled={loading || testProduct}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                  testProduct 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? '⏳ Creating...' : testProduct ? '✅ Test Data Ready' : '🧪 Create Test Product'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-orange-800 mb-4">🔗 Quick Links</h3>
            <div className="space-y-2">
              <a
                href="/admin/products/new"
                className="block bg-orange-600 text-white text-center py-2 px-3 rounded hover:bg-orange-700 text-sm"
              >
                📦 Create Product
              </a>
              <a
                href="/admin/inventory"
                className="block bg-purple-600 text-white text-center py-2 px-3 rounded hover:bg-purple-700 text-sm"
              >
                🏪 Inventory Manager
              </a>
              <a
                href="/supabase-migration.sql"
                className="block bg-gray-600 text-white text-center py-2 px-3 rounded hover:bg-gray-700 text-sm"
                download
              >
                📄 Download SQL
              </a>
            </div>
          </div>
        </div>

        {/* Search Test */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#4F4032] mb-4">🔍 Live Search Test</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by product name, SKU, or variant barcode (try: BED001-KING, BED001-QUEEN)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Search Results ({searchResults.length})</h3>
              {searchResults.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{product.title}</h4>
                    <div className="flex gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        SKU: {product.sku}
                      </span>
                      {product.barcode && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Code: {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {product.product_variants && product.product_variants.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Variants:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {product.product_variants.map((variant: any) => (
                          <div key={variant.id} className="bg-gray-50 p-3 rounded border">
                            <div className="font-medium text-sm">{variant.title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              SKU: {variant.sku}
                            </div>
                            {variant.barcode && (
                              <div className="text-xs mt-1">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  {variant.barcode}
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              Stock: {variant.inventory_quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found for "{searchTerm}"
            </div>
          )}
        </div>

        {/* Test Product Display */}
        {testProduct && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#4F4032]">🧪 Test Product Created</h2>
              <button
                onClick={deleteTestData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                🗑️ Clean Up Test Data
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">{testProduct.title}</h3>
              <p className="text-sm text-gray-600 mb-3">Main Product Code: {testProduct.barcode}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testProduct.product_variants?.map((variant: any) => (
                  <div key={variant.id} className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm text-green-800">{variant.title}</div>
                    <div className="text-xs text-gray-600 mt-1">SKU: {variant.sku}</div>
                    <div className="text-xs mt-1">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                        📷 {variant.barcode}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Stock: {variant.inventory_quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">📋 Testing Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-bold mb-2">1. Database Setup:</h4>
              <ul className="space-y-1">
                <li>• Copy content from `supabase-migration.sql`</li>
                <li>• Run in your Supabase SQL Editor</li>
                <li>• This adds barcode columns to tables</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">2. Test the Features:</h4>
              <ul className="space-y-1">
                <li>• Create test product above</li>
                <li>• Search using variant barcodes (e.g., "BED001-KING")</li>
                <li>• Visit inventory manager and test store mode</li>
                <li>• Try editing products with variants</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 