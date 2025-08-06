'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logger } from '../utils/logger'

interface ProductVariant {
  id: string
  title: string
  sku: string
  price: number
  compare_at_price?: number
  size?: string
  color?: string
  material?: string
  inventory_quantity: number
  is_default?: boolean
  featured_image?: string
  image_url?: string
  images?: string[]
}

interface CartItem {
  id: string
  product_id: string
  variant_id?: string
  title: string
  slug: string
  price: number
  quantity: number
  featured_image?: string
  sku: string
  inventory_quantity: number
  // Variant-specific fields
  variant_title?: string
  size?: string
  color?: string
  material?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: {
    id: string
    title: string
    slug: string
    price: number
    featured_image?: string
    sku: string
    inventory_quantity: number
    track_inventory: boolean
  }, variant?: ProductVariant, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
  getTaxAmount: () => number
  refreshInventory: () => Promise<{ removedItems: any[], quantityChanges: any[], totalItems: number } | undefined>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: async (product, variant, quantity = 1) => {
        try {
          const currentItems = get().items
          const cartItemId = variant ? `${product.id}-${variant.id}` : product.id
          
          // Check inventory before adding
          const response = await fetch('/api/products/inventory/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: product.id,
              variant_id: variant?.id || null
            })
          })

          if (!response.ok) {
            let errorMessage = `Failed to check inventory (${response.status})`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorData.details || errorMessage
              console.error('API Error Details:', errorData)
            } catch (jsonError) {
              // If JSON parsing fails, get text response
              try {
                const errorText = await response.text()
                console.error('API Error Text:', errorText)
                errorMessage = errorText || errorMessage
              } catch (textError) {
                console.error('Could not parse error response:', textError)
              }
            }
            throw new Error(errorMessage)
          }

          const stockData = await response.json()
          
          if (!stockData.is_active) {
            throw new Error(`${stockData.title || 'Product'} is no longer available`)
          }

          if (stockData.track_inventory && stockData.inventory_quantity === 0) {
            throw new Error(`${stockData.title || 'Product'} is out of stock`)
          }
        
          const existingItem = currentItems.find(item => item.id === cartItemId)
        
          if (existingItem) {
            // Update quantity if item already exists
            const newQuantity = existingItem.quantity + quantity
            if (stockData.track_inventory && newQuantity > stockData.inventory_quantity) {
              throw new Error(`Only ${stockData.inventory_quantity} of ${stockData.title || 'product'} available in stock`)
            }
          
            set({
              items: currentItems.map(item =>
                item.id === cartItemId
                  ? { 
                      ...item, 
                      quantity: newQuantity, 
                      inventory_quantity: stockData.inventory_quantity,
                      price: stockData.price || item.price,
                      sku: stockData.sku || item.sku,
                      variant_title: variant?.title || item.variant_title,
                      size: variant?.size || item.size,
                      color: variant?.color || item.color,
                      material: variant?.material || item.material
                    }
                  : item
              )
            })
          } else {
            // Add new item
            if (stockData.track_inventory && quantity > stockData.inventory_quantity) {
              throw new Error(`Only ${stockData.inventory_quantity} of ${stockData.title || 'product'} available in stock`)
            }
          
            const newItem: CartItem = {
              id: cartItemId,
              product_id: product.id,
              variant_id: variant?.id,
              title: stockData.title || product.title,
              slug: product.slug,
              price: stockData.price || product.price,
              quantity,
              featured_image: variant?.featured_image || variant?.image_url || product.featured_image,
              sku: stockData.sku || product.sku,
              inventory_quantity: stockData.inventory_quantity,
              variant_title: variant?.title,
              size: variant?.size,
              color: variant?.color,
              material: variant?.material
            }
          
            set({
              items: [...currentItems, newItem]
            })
          }
        } catch (error) {
          console.error('Error adding item to cart:', error)
          throw error // Re-throw the error to be handled by the component
        }
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set({
          items: get().items.map(item =>
            item.id === itemId
              ? { ...item, quantity }
              : item
          )
        })
      },

      removeItem: (itemId) => {
        set({
          items: get().items.filter(item => item.id !== itemId)
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      // Clean up invalid items from cart
      cleanupCart: async () => {
        const currentItems = get().items
        logger.log('🧹 Cart - Cleaning up invalid items...')
        
        const validItems = []
        const removedItems = []
        
        for (const item of currentItems) {
          try {
            const response = await fetch('/api/products/inventory/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: item.product_id,
                variant_id: item.variant_id || null
              })
            })
            
            if (response.ok) {
              validItems.push(item)
            } else {
              removedItems.push(item)
              logger.log(`🗑️ Removed invalid item: ${item.title}`)
            }
          } catch (error) {
            removedItems.push(item)
            logger.log(`🗑️ Removed item due to error: ${item.title}`)
          }
        }
        
        set({ items: validItems })
        logger.log(`✅ Cart cleanup complete. Removed ${removedItems.length} invalid items.`)
        return { validItems, removedItems }
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal()
        return subtotal * 0.075 // 7.5% VAT
      },

      refreshInventory: async () => {
        const currentItems = get().items
        if (currentItems.length === 0) return

        logger.log('🔄 Cart - Refreshing inventory for cart items...')
        
        try {
          const updatedItems = []
          const removedItems = []
          
          for (const item of currentItems) {
            // Use the unified inventory check endpoint
            const response = await fetch('/api/products/inventory/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: item.product_id,
                variant_id: item.variant_id || null
              })
            })
            
            if (response.ok) {
              const stockData = await response.json()
              
              if (!stockData.is_active) {
                removedItems.push({ 
                  ...item, 
                  reason: item.variant_id ? 'Product variant is no longer available' : 'Product is no longer available'
                })
              } else if (stockData.track_inventory && stockData.inventory_quantity === 0) {
                removedItems.push({ 
                  ...item, 
                  reason: item.variant_id ? 'Product variant is out of stock' : 'Product is out of stock'
                })
              } else if (stockData.track_inventory && item.quantity > stockData.inventory_quantity) {
                // Reduce quantity to available stock
                updatedItems.push({
                  ...item,
                  quantity: stockData.inventory_quantity,
                  inventory_quantity: stockData.inventory_quantity
                })
              } else {
                // Update inventory quantity for display purposes
                updatedItems.push({
                  ...item,
                  inventory_quantity: stockData.inventory_quantity
                })
              }
            } else if (response.status === 404) {
              // Item no longer exists in database - remove it
              removedItems.push({ 
                ...item, 
                reason: item.variant_id ? 'Product variant no longer exists' : 'Product no longer exists'
              })
            } else {
              logger.error('Failed to check inventory for item:', item.id, response.status)
              // For other errors, keep the item but log the issue
              updatedItems.push(item)
            }
          }

          // Update the cart with refreshed items
          set({ items: updatedItems })

          // Log changes for user feedback
          if (removedItems.length > 0) {
            logger.log('🚫 Cart - Items removed due to availability:', removedItems.map(item => item.title))
          }
          
          const quantityChanges = updatedItems.filter((item, index) => {
            const originalItem = currentItems.find(orig => orig.id === item.id)
            return originalItem && originalItem.quantity !== item.quantity
          })
          
          if (quantityChanges.length > 0) {
            logger.log('🔄 Cart - Item quantities adjusted:', quantityChanges.map(item => 
              `${item.title}: adjusted to ${item.quantity}`
            ))
          }

          logger.log('✅ Cart - Inventory refresh completed')
          
          // Return summary for UI feedback
          return {
            removedItems,
            quantityChanges,
            totalItems: updatedItems.length
          }
          
        } catch (error) {
          logger.error('❌ Cart - Error refreshing inventory:', error)
          throw new Error('Failed to refresh cart inventory')
        }
      }
    }),
    {
      name: 'cart-storage'
    }
  )
) 