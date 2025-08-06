'use client'

import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DeleteCategoryButtonProps {
  categoryId: string
  categoryName: string
}

export default function DeleteCategoryButton({ categoryId, categoryName }: DeleteCategoryButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      // Check if category has products
      const { data: productCategories } = await supabase
        .from('product_categories')
        .select('*')
        .eq('category_id', categoryId)

      if (productCategories && productCategories.length > 0) {
        alert('Cannot delete category with products. Please remove all products from this category first.')
        setIsDeleting(false)
        return
      }

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      router.refresh()
      setShowConfirm(false)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-400 hover:text-red-600 transition-colors p-1"
        title="Delete Category"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[#4F4032] mb-2">Delete Category</h3>
            <p className="text-[#4F4032]/80 mb-6">
              Are you sure you want to delete "{categoryName}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 text-[#4F4032] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 