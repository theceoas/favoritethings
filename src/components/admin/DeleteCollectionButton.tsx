'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'

interface DeleteCollectionButtonProps {
  collectionId: string
  collectionName: string
}

export default function DeleteCollectionButton({ collectionId, collectionName }: DeleteCollectionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Delete collection product relationships first
      await supabase
        .from('product_collections')
        .delete()
        .eq('collection_id', collectionId)

      // Delete the collection
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('Failed to delete collection. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleCancel}
          className="text-xs text-[#4F4032]/60 hover:text-[#4F4032] px-2 py-1 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded bg-red-50"
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="text-[#4F4032]/60 hover:text-red-600 transition-colors p-1"
      title={`Delete ${collectionName}`}
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  )
} 