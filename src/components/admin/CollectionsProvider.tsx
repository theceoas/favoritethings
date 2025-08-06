'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Collection } from '@/types/product'
import { createClient } from '@/lib/supabase/client'

interface CollectionsContextType {
  collections: Collection[]
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<boolean>
  refreshCollections: () => Promise<void>
  isLoading: boolean
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

export function useCollections() {
  const context = useContext(CollectionsContext)
  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider')
  }
  return context
}

interface CollectionsProviderProps {
  children: React.ReactNode
  initialCollections: Collection[]
}

export default function CollectionsProvider({ 
  children, 
  initialCollections 
}: CollectionsProviderProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [isLoading, setIsLoading] = useState(false)

  console.log('🔥 CollectionsProvider initialized with:', initialCollections?.length, 'collections')
  console.log('🔥 Collections data:', initialCollections)

  const refreshCollections = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          name,
          slug,
          description,
          image_url,
          is_active,
          is_featured,
          sort_order,
          product_collections (count)
        `)
        .order('sort_order', { ascending: true })

      if (error) throw error
      
      setCollections(data || [])
    } catch (error) {
      console.error('Error refreshing collections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCollection = async (id: string, updates: Partial<Collection>): Promise<boolean> => {
    const supabase = createClient()
    
    try {
      // Optimistically update the UI first
      setCollections(prev => prev.map(collection => 
        collection.id === id 
          ? { ...collection, ...updates }
          : collection
      ))

      // Then update the database
      const { error } = await supabase
        .from('collections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        // Revert optimistic update on error
        await refreshCollections()
        throw error
      }

      return true
    } catch (error) {
      console.error('Error updating collection:', error)
      return false
    }
  }

  // Update collections when initialCollections prop changes
  useEffect(() => {
    setCollections(initialCollections)
  }, [initialCollections])

  const value: CollectionsContextType = {
    collections,
    updateCollection,
    refreshCollections,
    isLoading
  }

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  )
} 