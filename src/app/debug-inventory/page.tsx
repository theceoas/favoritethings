'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface SchemaColumn {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface ProductDebugInfo {
  id: string
  title: string
  sku: string
  price: number
  inventory_quantity: number
  track_inventory: boolean
  total_inventory?: number
  variants?: any[]
  has_variants?: boolean
  calculated_stock?: number
  variant_details?: any[]
}

export default function DebugInventoryPage() {
  const [schemaInfo, setSchemaInfo] = useState<{
    products: SchemaColumn[]
    product_variants: SchemaColumn[]
  } | null>(null)
  const [products, setProducts] = useState<ProductDebugInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDiagnosticData()
  }, [])

  const fetchDiagnosticData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      logger.log('🔍 Starting inventory diagnostics...')

      // 1. Check database schema
      const { data: productColumns, error: productSchemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'products')
        .order('ordinal_position')

      const { data: variantColumns, error: variantSchemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'product_variants')
        .order('ordinal_position')

      if (productSchemaError || variantSchemaError) {
        logger.error('Schema check error:', productSchemaError || variantSchemaError)
      }

      setSchemaInfo({
        products: productColumns || [],
        product_variants: variantColumns || []
      })

      // 2. Test different query approaches
      logger.log('🧪 Testing query approaches...')

      // Approach 1: Direct products query
      const { data: directProducts, error: directError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          sku,
          price,
          inventory_quantity,
          track_inventory,
          is_active
        `)
        .eq('is_active', true)
        .limit(5)

      // Approach 2: Products with variants using left join
      const { data: productsWithVariants, error: variantsError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          sku,
          price,
          inventory_quantity,
          track_inventory,
          is_active,
          product_variants (
            id,
            title,
            sku,
            price,
            inventory_quantity,
            track_inventory,
            is_active,
            size,
            color
          )
        `)
        .eq('is_active', true)
        .limit(5)

      // Approach 3: Try the products_with_variants view if it exists
      let viewProducts = null
      try {
        const { data: viewData, error: viewError } = await supabase
          .from('products_with_variants')
          .select('*')
          .eq('is_active', true)
          .limit(5)
        
        if (!viewError) {
          viewProducts = viewData
        }
      } catch (viewErr) {
        logger.log('products_with_variants view not available:', viewErr)
      }

      // 3. Calculate correct stock for each product
      const debugProducts: ProductDebugInfo[] = (productsWithVariants || directProducts || []).map(product => {
        const hasVariants = product.product_variants && product.product_variants.length > 0
        
        let calculatedStock = 0
        let variantDetails: any[] = []
        
        if (hasVariants) {
          // Analyze each variant in detail
          variantDetails = product.product_variants.map((v: any) => {
            const variantStock = v.track_inventory !== false ? (v.inventory_quantity || 0) : 999
            const isAvailable = v.is_active && (v.track_inventory === false || (v.inventory_quantity || 0) > 0)
            
            return {
              id: v.id,
              title: v.title,
              size: v.size,
              color: v.color,
              inventory_quantity: v.inventory_quantity,
              track_inventory: v.track_inventory,
              is_active: v.is_active,
              calculated_stock: variantStock,
              is_available: isAvailable,
              issues: [
                !v.is_active ? 'INACTIVE' : null,
                v.track_inventory !== false && (v.inventory_quantity === null || v.inventory_quantity === undefined) ? 'NULL_INVENTORY' : null,
                v.track_inventory !== false && v.inventory_quantity === 0 ? 'ZERO_STOCK' : null,
                v.track_inventory === null || v.track_inventory === undefined ? 'NULL_TRACK_INVENTORY' : null
              ].filter(Boolean)
            }
          })
          
          // Sum up inventory from active variants that track inventory
          calculatedStock = product.product_variants
            .filter((v: any) => v.is_active && v.track_inventory !== false)
            .reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0)
        } else {
          // Use product's own inventory
          calculatedStock = product.inventory_quantity || 0
        }

        return {
          ...product,
          has_variants: hasVariants,
          total_inventory: hasVariants ? calculatedStock : product.inventory_quantity,
          calculated_stock: calculatedStock,
          variant_details: variantDetails
        }
      })

      setProducts(debugProducts)

      logger.log('✅ Diagnostics completed')
      logger.log('Direct products:', directProducts?.length || 0)
      logger.log('Products with variants:', productsWithVariants?.length || 0)
      logger.log('View products:', viewProducts?.length || 0)

    } catch (err: any) {
      logger.error('❌ Diagnostic error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fixInventorySystem = async () => {
    try {
      logger.log('🔧 Starting inventory system fix...')

      // 1. Fix common variant issues
      const fixResults = []
      
      // Fix NULL track_inventory values
      const { error: trackInventoryError } = await supabase
        .from('product_variants')
        .update({ track_inventory: true })
        .is('track_inventory', null)
      
      if (!trackInventoryError) {
        fixResults.push('✅ Fixed NULL track_inventory values')
      } else {
        fixResults.push('❌ Failed to fix track_inventory values: ' + trackInventoryError.message)
      }

      // Fix NULL inventory_quantity values
      const { error: inventoryError } = await supabase
        .from('product_variants')
        .update({ inventory_quantity: 0 })
        .is('inventory_quantity', null)
      
      if (!inventoryError) {
        fixResults.push('✅ Fixed NULL inventory_quantity values')
      } else {
        fixResults.push('❌ Failed to fix inventory_quantity values: ' + inventoryError.message)
      }

      // Ensure all variants have proper is_active status
      const { error: activeError } = await supabase
        .from('product_variants')
        .update({ is_active: true })
        .is('is_active', null)
      
      if (!activeError) {
        fixResults.push('✅ Fixed NULL is_active values')
      } else {
        fixResults.push('❌ Failed to fix is_active values: ' + activeError.message)
      }

      logger.log('🔧 Fix results:', fixResults)

      // 2. Try to run the schema migration (if the function exists)
      try {
        const { error: migrationError } = await supabase.rpc('fix_product_variants_schema', {})
        
        if (migrationError) {
          logger.log('Schema migration not available (this is okay):', migrationError.message)
        } else {
          logger.log('✅ Schema migration completed')
        }
      } catch (migrationErr) {
        logger.log('Schema migration function not found (this is okay)')
      }

      // 3. Refresh the diagnostic data
      await fetchDiagnosticData()

      alert('Fix completed! Check the results in the diagnostic table below.')

    } catch (err: any) {
      logger.error('❌ Fix error:', err)
      setError(err.message)
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' }
    if (quantity <= 3) return { text: 'Very Low', color: 'text-red-600 bg-red-50' }
    if (quantity <= 10) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-50' }
    if (quantity <= 20) return { text: 'Limited', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Inventory System Diagnostics</h1>
                     <div className="flex gap-4">
            <button
              onClick={fetchDiagnosticData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh Diagnostics
            </button>
            <button
              onClick={fixInventorySystem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔧 Fix Common Issues
            </button>
            <button
              onClick={async () => {
                try {
                  // Quick fix for variants that are always showing out of stock
                  const { error } = await supabase
                    .from('product_variants')
                    .update({ 
                      track_inventory: true,
                      is_active: true
                    })
                    .or('track_inventory.is.null,inventory_quantity.is.null,is_active.is.null')
                  
                  if (error) {
                    setError('Fix failed: ' + error.message)
                  } else {
                    await fetchDiagnosticData()
                    alert('Quick fix applied! Null values have been fixed.')
                  }
                } catch (err: any) {
                  setError('Fix failed: ' + err.message)
                }
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              ⚡ Quick Fix Variants
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">❌ Error: {error}</p>
            </div>
          )}
        </div>

        {/* Schema Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Products Table Schema</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Column</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaInfo?.products.map((col, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-1 font-mono">{col.column_name}</td>
                      <td className="py-1 text-gray-600">{col.data_type}</td>
                      <td className="py-1">{col.is_nullable === 'YES' ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Product Variants Table Schema</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Column</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaInfo?.product_variants.map((col, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-1 font-mono">{col.column_name}</td>
                      <td className="py-1 text-gray-600">{col.data_type}</td>
                      <td className="py-1">{col.is_nullable === 'YES' ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product Inventory Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">📦 Product Inventory Analysis</h2>
            <p className="text-gray-600 mt-2">Analysis of {products.length} products and their stock calculations</p>
                </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">SKU</th>
                  <th className="text-left p-4">Has Variants</th>
                  <th className="text-left p-4">Product Stock</th>
                  <th className="text-left p-4">Calculated Stock</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Variants</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product.calculated_stock || 0)
                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">{product.title}</div>
                        <div className="text-sm text-gray-500">₦{product.price.toLocaleString()}</div>
                      </td>
                      <td className="p-4 font-mono text-sm">{product.sku}</td>
                      <td className="p-4">
                        {product.has_variants ? '✅ Yes' : '❌ No'}
                      </td>
                      <td className="p-4">
                        <span className="font-mono">{product.inventory_quantity || 0}</span>
                        {product.track_inventory ? ' (tracked)' : ' (not tracked)'}
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold">{product.calculated_stock || 0}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="p-4">
                        {product.has_variants ? (
                          <div className="space-y-1">
                            {product.variant_details?.map((variant: any, index: number) => (
                              <div key={index} className={`text-xs p-2 rounded border ${
                                variant.issues.length > 0 ? 'bg-red-50 border-red-200' : 
                                variant.is_available ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                              }`}>
                                <div className="font-medium">
                                  {variant.title || `${variant.size || 'No Size'} - ${variant.color || 'No Color'}`}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Stock: {variant.inventory_quantity ?? 'null'} | 
                                  Track: {variant.track_inventory?.toString() ?? 'null'} | 
                                  Active: {variant.is_active?.toString() ?? 'null'}
                                </div>
                                <div className="text-xs mt-1">
                                  Available: {variant.is_available ? '✅ Yes' : '❌ No'}
                      </div>
                                {variant.issues.length > 0 && (
                                  <div className="text-xs text-red-600 mt-1">
                                    Issues: {variant.issues.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Recommendations</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• If variants exist, use the sum of all active variant inventories</li>
            <li>• If no variants, use the product's main inventory_quantity</li>
            <li>• Always check if inventory tracking is enabled before showing stock status</li>
            <li>• Consider adding low stock threshold alerts</li>
            <li>• Implement real-time inventory updates when orders are placed</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 