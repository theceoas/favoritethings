'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { createClient } from '@/lib/supabase/client'
import { Collection } from '@/types/product'

interface FeaturedCollectionsManagerProps {
  collections: Collection[]
}

export default function FeaturedCollectionsManager({ collections }: FeaturedCollectionsManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleUnfeaturedAll = async () => {
    if (!confirm('Are you sure you want to remove all featured collections from the homepage?')) {
      return
    }

    setIsUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('collections')
        .update({ 
          is_featured: false,
          updated_at: new Date().toISOString()
        })
        .eq('is_featured', true)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error removing featured collections:', error)
      alert('Failed to remove featured collections. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQuickFeatured = async (collectionIds: string[]) => {
    setIsUpdating(true)
    const supabase = createClient()

    try {
      // First, unfeatured all collections
      await supabase
        .from('collections')
        .update({ is_featured: false, updated_at: new Date().toISOString() })
        .eq('is_featured', true)

      // Then feature the selected ones
      if (collectionIds.length > 0) {
        const { error } = await supabase
          .from('collections')
          .update({ 
            is_featured: true,
            updated_at: new Date().toISOString()
          })
          .in('id', collectionIds)

        if (error) throw error
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating featured collections:', error)
      alert('Failed to update featured collections. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const featuredCollections = collections?.filter(c => c.is_featured) || []
  const nonFeaturedCollections = collections?.filter(c => !c.is_featured) || []

  if (!collections || collections.length === 0) {
    return null
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-[#6A41A1] mb-4 flex items-center">
        <StarIconSolid className="h-5 w-5 mr-2 text-[#FFD84D]" />
        Quick Featured Setup
      </h3>
      
      <div className="space-y-4">
        <p className="text-sm text-[#4F4032]/70">
          Choose a preset configuration for your featured collections:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick presets */}
          <button
            onClick={() => handleQuickFeatured(collections.slice(0, 3).map(c => c.id))}
            disabled={isUpdating}
            className="p-4 text-left border border-[#6A41A1]/20 rounded-xl hover:bg-[#6A41A1]/5 transition-colors disabled:opacity-50"
          >
            <div className="font-medium text-[#6A41A1] mb-1">First 3 Collections</div>
            <div className="text-sm text-[#4F4032]/60">
              {collections.slice(0, 3).map(c => c.name).join(', ')}
            </div>
          </button>

          <button
            onClick={() => handleQuickFeatured(collections.slice(-3).map(c => c.id))}
            disabled={isUpdating}
            className="p-4 text-left border border-[#6A41A1]/20 rounded-xl hover:bg-[#6A41A1]/5 transition-colors disabled:opacity-50"
          >
            <div className="font-medium text-[#6A41A1] mb-1">Latest 3 Collections</div>
            <div className="text-sm text-[#4F4032]/60">
              {collections.slice(-3).map(c => c.name).join(', ')}
            </div>
          </button>
        </div>

        {featuredCollections.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#6A41A1]/10">
            <span className="text-sm text-[#4F4032]/70">
              Current: {featuredCollections.length} featured collections
            </span>
            <button
              onClick={handleUnfeaturedAll}
              disabled={isUpdating}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Remove All Featured
            </button>
          </div>
        )}

        {isUpdating && (
          <div className="flex items-center justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#6A41A1] border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-[#6A41A1]">Updating featured collections...</span>
          </div>
        )}
      </div>
    </div>
  )
} 