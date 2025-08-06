'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch all products with brand info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Fetch all brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true })

      if (brandsError) throw brandsError
      setBrands(brandsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Debug Products & Brands</h1>
        
        {/* Brands Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Brands ({brands.length})</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{brand.name}</h3>
                  <p className="text-gray-600">Slug: {brand.slug}</p>
                  <p className="text-gray-600">ID: {brand.id}</p>
                  <p className="text-gray-600">Active: {brand.is_active ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Products ({products.length})</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Title</th>
                    <th className="text-left py-2">Brand</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">Active</th>
                    <th className="text-left py-2">Featured</th>
                    <th className="text-left py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{product.title}</td>
                      <td className="py-2">
                        {product.brand ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {product.brand.name}
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs">No brand</span>
                        )}
                      </td>
                      <td className="py-2">${product.price}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          product.is_featured 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_featured ? 'Featured' : 'Regular'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Total Products:</p>
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            </div>
            <div>
              <p className="font-medium">Active Products:</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.is_active).length}
              </p>
            </div>
            <div>
              <p className="font-medium">Featured Products:</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.is_featured).length}
              </p>
            </div>
            <div>
              <p className="font-medium">Products with Brands:</p>
              <p className="text-2xl font-bold text-purple-600">
                {products.filter(p => p.brand).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 