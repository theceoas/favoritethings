'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { useCollections } from './CollectionsProvider'

interface FeaturedToggleButtonProps {
  collectionId: string
  collectionName: string
  isFeatured: boolean
}

export default function FeaturedToggleButton({ 
  collectionId, 
  collectionName, 
  isFeatured 
}: FeaturedToggleButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  console.log('🔥 FeaturedToggleButton rendering for:', collectionName)
  
  try {
    const { updateCollection, collections } = useCollections()
    console.log('🔥 Collections context:', collections?.length, 'collections')
    
    // Get current state from context
    const currentCollection = collections.find(c => c.id === collectionId)
    const currentFeatured = currentCollection?.is_featured ?? isFeatured
    
    console.log('🔥 Current featured state:', currentFeatured, 'for', collectionName)

    const handleToggle = async () => {
      if (isUpdating) return // Prevent double clicks
      
      console.log(`⭐ Starting toggle for ${collectionName} (${collectionId})`)
      console.log(`📊 Current state: featured=${currentFeatured}, will change to=${!currentFeatured}`)
      
      setIsUpdating(true)
      
      try {
        const success = await updateCollection(collectionId, {
          is_featured: !currentFeatured
        })

        if (success) {
          console.log(`✅ Successfully updated ${collectionName} featured status`)
        } else {
          throw new Error('Update failed')
        }
        
      } catch (error) {
        console.error('❌ Error updating featured status:', error)
        alert(`Failed to update featured status for ${collectionName}`)
      } finally {
        setIsUpdating(false)
      }
    }

    console.log(`🎯 Rendering FeaturedToggleButton for ${collectionName}: featured=${currentFeatured}, updating=${isUpdating}`)

    return (
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={`p-2 rounded-lg transition-all duration-300 disabled:opacity-50 ${
          currentFeatured
            ? 'text-[#FFD84D] hover:text-[#6A41A1] hover:bg-[#FFD84D]/10'
            : 'text-[#4F4032]/40 hover:text-[#FFD84D] hover:bg-[#FFD84D]/10'
        }`}
        title={`${currentFeatured ? 'Remove from' : 'Add to'} featured collections`}
      >
        {isUpdating ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : currentFeatured ? (
          <StarIconSolid className="w-5 h-5" />
        ) : (
          <StarIcon className="w-5 h-5" />
        )}
      </button>
    )
  } catch (error) {
    console.error('❌ FeaturedToggleButton error:', error)
    return (
      <div className="p-2 text-red-500 text-xs">
        Context Error
      </div>
    )
  }
} 