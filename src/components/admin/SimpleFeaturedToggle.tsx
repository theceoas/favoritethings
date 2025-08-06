'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { createClient } from '@/lib/supabase/client'

interface SimpleFeaturedToggleProps {
  collectionId: string
  collectionName: string
  isFeatured: boolean
}

export default function SimpleFeaturedToggle({ 
  collectionId, 
  collectionName, 
  isFeatured 
}: SimpleFeaturedToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentFeatured, setCurrentFeatured] = useState(isFeatured)
  const router = useRouter()

  console.log('🔧 SimpleFeaturedToggle rendering for:', collectionName, 'featured:', currentFeatured)

  const handleToggle = async () => {
    if (isUpdating) return
    
    console.log('🔧 SimpleFeaturedToggle - Starting toggle for:', collectionName)
    setIsUpdating(true)
    
    const supabase = createClient()
    const newFeaturedState = !currentFeatured

    try {
      const { data, error } = await supabase
        .from('collections')
        .update({ 
          is_featured: newFeaturedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
        .select('id, name, is_featured')

      console.log('🔧 SimpleFeaturedToggle - Update result:', { data, error })

      if (error) throw error

      if (data && data.length > 0) {
        setCurrentFeatured(data[0].is_featured)
        console.log('🔧 SimpleFeaturedToggle - Updated to:', data[0].is_featured)
      }
      
    } catch (error) {
      console.error('🔧 SimpleFeaturedToggle - Error:', error)
      alert(`Failed to update ${collectionName}: ${error.message}`)
    } finally {
      setIsUpdating(false)
      // Simple page refresh after 1 second
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

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
} 