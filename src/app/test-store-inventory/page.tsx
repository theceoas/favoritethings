'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestStoreInventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
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
          track_inventory,
          is_active,
          product_variants (
            id,
            title,
            sku,
            inventory_quantity,
            track_inventory,
            is_active,
            size,
            color
          )
        `)
        .order('title')
        .limit(10)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🏪 Store Inventory System Test</h1>
        
        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Features Implemented</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Product Code/Barcode field added</li>
              <li>• Enhanced search by store code</li>
              <li>• Store Sale Mode toggle</li>
              <li>• Quick sale functionality</li>
              <li>• Variant-specific sales</li>
              <li>• Real-time stock updates</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">🔧 How to Use</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>1. Add product codes when creating products</li>
              <li>2. Go to `/admin/inventory`</li>
              <li>3. Toggle "Store Sale Mode"</li>
              <li>4. Search by product code</li>
              <li>5. Set quantity and click "Quick Sale"</li>
              <li>6. Stock is reduced instantly</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/admin/products/new"
                className="block bg-orange-600 text-white text-center py-2 px-4 rounded hover:bg-orange-700"
              >
                📦 Add New Product
              </a>
              <a
                href="/admin/inventory"
                className="block bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700"
              >
                🏪 Inventory Manager
              </a>
              <a
                href="/admin/products"
                className="block bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700"
              >
                ⚙️ Product Manager
              </a>
            </div>
          </div>
        </div>

        {/* Search Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Test Search by Product Code</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products by name, SKU, or store code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <React.Fragment key={product.id}>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          {product.product_variants?.length > 0 && (
                            <div className="text-xs text-gray-500">{product.product_variants.length} variants</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.barcode ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {product.barcode}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No code set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.product_variants?.length > 0 
                            ? `Total: ${product.product_variants.reduce((sum: number, v: any) => sum + v.inventory_quantity, 0)}`
                            : product.inventory_quantity
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Show variants if any */}
                      {product.product_variants?.map((variant: any) => (
                        <tr key={variant.id} className="bg-gray-25">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="ml-8 text-sm text-gray-700">
                              └ {variant.title || `${variant.size || 'No Size'} - ${variant.color || 'No Color'}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            <span className="text-xs">Uses parent code</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {variant.inventory_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              variant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {variant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              
              {filteredProducts.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No products found matching "{searchTerm}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try searching by product name, SKU, or store code</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">For Existing Products:</h4>
              <ul className="space-y-1">
                <li>• Go to each product's edit page</li>
                <li>• Add a store code in the new "Store Code/Barcode" field</li>
                <li>• Use simple codes like "BED001", "SHEET001", etc.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For New Products:</h4>
              <ul className="space-y-1">
                <li>• Create new products with store codes</li>
                <li>• Use the inventory manager for stock control</li>
                <li>• Train staff on the quick sale feature</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 