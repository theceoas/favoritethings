'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TestCollectionBasic() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleTest = async () => {
    setIsLoading(true)
    console.log('🧪 Starting basic collection test...')

    const supabase = createClient()

    try {
      const testData = {
        name: `Test Collection ${Date.now()}`,
        slug: `test-collection-${Date.now()}`,
        description: 'This is a test collection',
        image_url: null, // No image
        is_featured: false,
        is_active: true,
        sort_order: 0,
      }

      console.log('📊 Test data:', testData)

      const { data, error } = await supabase
        .from('collections')
        .insert(testData)
        .select()

      if (error) {
        console.error('❌ Test failed:', error)
        alert(`Test failed: ${error.message}`)
      } else {
        console.log('✅ Test success:', data)
        alert('Test collection created successfully!')
        router.push('/admin/collections')
        router.refresh()
      }
    } catch (error: any) {
      console.error('❌ Test error:', error)
      alert(`Test error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <h2 className="text-lg font-semibold mb-4 text-yellow-800">🧪 Debug Test</h2>
      <button
        onClick={handleTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
      >
        {isLoading ? 'Testing...' : 'Create Test Collection (No Image)'}
      </button>
      <p className="text-sm text-yellow-700 mt-2">
        This will create a simple collection without any images to test if basic database operations work.
        Check the browser console for detailed logs.
      </p>
    </div>
  )
} 