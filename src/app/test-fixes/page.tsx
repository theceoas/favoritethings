'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestFixesPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testHomepageData = async () => {
      try {
        const supabase = createClient()
        
        console.log('Testing homepage data fetch...')
        
        const { data, error } = await supabase
          .from('collections')
          .select(`
            id,
            name,
            slug,
            description,
            image_url,
            is_featured,
            is_active,
            sort_order
          `)
          .eq('is_featured', true)
          .order('sort_order', { ascending: true })
          .limit(3)

        if (error) {
          console.error('Error fetching collections:', error)
          setError(error.message)
        } else {
          console.log('Collections fetched successfully:', data)
          setCollections(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    testHomepageData()
  }, [])

  const testImageUpload = async () => {
    try {
      // Create a small test file
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.fillStyle = '#6A41A1'
        ctx.fillRect(0, 0, 100, 100)
        ctx.fillStyle = 'white'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('TEST', 50, 55)
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      })

      const file = new File([blob], 'test-image.png', { type: 'image/png' })
      
      console.log('Testing image upload with file:', file.name, file.size, 'bytes')
      
      const supabase = createClient()
      const path = `test-${Date.now()}.png`
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(path, file)

      if (error) {
        console.error('Upload test failed:', error)
        alert('Upload test failed: ' + error.message)
      } else {
        console.log('Upload test successful:', data)
        alert('Upload test successful! Path: ' + data.path)
        
        // Clean up test file
        await supabase.storage
          .from('product-images')
          .remove([path])
      }
    } catch (error) {
      console.error('Upload test error:', error)
      alert('Upload test error: ' + error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Fix Testing Page</h1>
        
        {/* Homepage Data Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Homepage Data Test</h2>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading collections...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">❌ Error: {error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">✅ Successfully loaded {collections.length} featured collections</p>
              </div>
              
              {collections.map((collection, index) => (
                <div key={collection.id} className="border border-gray-200 rounded p-3">
                  <h3 className="font-medium">{collection.name}</h3>
                  <p className="text-sm text-gray-600">Slug: {collection.slug}</p>
                  <p className="text-sm text-gray-600">Featured: {collection.is_featured ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-600">Active: {collection.is_active ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Upload Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📸 Image Upload Test</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              This test creates a small test image and uploads it to Supabase storage to verify upload functionality.
            </p>
            
            <button
              onClick={testImageUpload}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🧪 Test Image Upload
            </button>
          </div>
        </div>

        {/* Navigation Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Navigation Test</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="/"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-center"
            >
              🏠 Home
            </a>
            <a
              href="/products"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center"
            >
              📦 Products
            </a>
            <a
              href="/admin/products"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-center"
            >
              ⚙️ Admin
            </a>
            <a
              href="/debug-inventory"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-center"
            >
              🔍 Debug
            </a>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Test Results Expected</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>✅ <strong>Homepage Data:</strong> Should load featured collections without errors</li>
            <li>✅ <strong>Image Upload:</strong> Should upload and delete test image successfully</li>
            <li>✅ <strong>Navigation:</strong> All links should work without blank pages</li>
            <li>✅ <strong>Console:</strong> Check browser console for any remaining errors</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 