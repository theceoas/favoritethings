'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
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
  isLoading: boolean
  cartId: string | null
  sessionId: string | null
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
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
  getTaxAmount: () => number
  refreshInventory: () => Promise<{ removedItems: any[], quantityChanges: any[], totalItems: number } | undefined>
  loadCart: () => Promise<void>
  syncCart: () => Promise<void>
}

// Generate session ID for anonymous users with Safari compatibility
const generateSessionId = () => {
  if (typeof window === 'undefined') return null
  
  let sessionId = null
  
  // Try sessionStorage first (may fail in Safari private browsing)
  try {
    sessionId = sessionStorage.getItem('cart-session-id')
    if (!sessionId) {
      sessionId = 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('cart-session-id', sessionId)
    }
  } catch (error) {
    // Safari private browsing or storage disabled - use memory-based fallback
    console.warn('SessionStorage not available, using memory-based session ID')
    if (!(window as any).__cartSessionId) {
      (window as any).__cartSessionId = 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    sessionId = (window as any).__cartSessionId
  }
  
  return sessionId
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,
  cartId: null,
  sessionId: null,

  loadCart: async () => {
    try {
      set({ isLoading: true })
      
      // Check if we're in Safari and storage is available
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      if (isSafari) {
        try {
          // Test storage availability in Safari
          sessionStorage.setItem('__storage_test__', 'test')
          sessionStorage.removeItem('__storage_test__')
        } catch (error) {
          console.warn('Safari storage blocked, cart may not persist across sessions')
        }
      }
      
      const supabase = createClient()
      if (!supabase) {
        logger.error('❌ Cart - Supabase client not available')
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Generate session ID for anonymous users
      const sessionId = user ? null : generateSessionId()
      
      set({ sessionId })

      // Get or create cart
      const { data: cart, error } = await supabase
        .rpc('get_or_create_cart', {
          p_user_id: user?.id || null,
          p_session_id: sessionId
        })

      if (error) {
        logger.error('❌ Cart - Error getting cart:', error)
        return
      }

      if (cart) {
        // Get cart details
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('*')
          .eq('id', cart)
          .single()

        if (cartError) {
          logger.error('❌ Cart - Error fetching cart data:', cartError)
          return
        }

        set({
          cartId: cartData.id,
          items: cartData.items || [],
          isLoading: false
        })
      }
    } catch (error) {
      logger.error('❌ Cart - Error loading cart:', error)
      set({ isLoading: false })
    }
  },

  syncCart: async () => {
    try {
      const { cartId, items, sessionId } = get()
      if (!cartId) return

      const supabase = createClient()
      if (!supabase) return

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxAmount = subtotal * 0.075 // 7.5% VAT
      const total = subtotal + taxAmount

      const { error } = await supabase
        .from('carts')
        .update({
          items,
          subtotal,
          tax_amount: taxAmount,
          total,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', cartId)

      if (error) {
        logger.error('❌ Cart - Error syncing cart:', error)
      }
    } catch (error) {
      logger.error('❌ Cart - Error syncing cart:', error)
    }
  },

  addItem: async (product, variant, quantity = 1) => {
    try {
      set({ isLoading: true })
      
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
        // Update existing item
        if (stockData.track_inventory && (existingItem.quantity + quantity) > stockData.inventory_quantity) {
          throw new Error(`Only ${stockData.inventory_quantity} of ${stockData.title || 'product'} available in stock`)
        }
        
        const updatedItems = currentItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        
        set({ items: updatedItems })
        await get().syncCart()
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
      
        set({ items: [...currentItems, newItem] })
        await get().syncCart()
      }
    } catch (error) {
      logger.error('❌ Cart - Error adding item:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        await get().removeItem(itemId)
        return
      }

      const currentItems = get().items
      const updatedItems = currentItems.map(item =>
        item.id === itemId
          ? { ...item, quantity }
          : item
      )

      set({ items: updatedItems })
      await get().syncCart()
    } catch (error) {
      logger.error('❌ Cart - Error updating quantity:', error)
    }
  },

  removeItem: async (itemId) => {
    try {
      const currentItems = get().items
      const updatedItems = currentItems.filter(item => item.id !== itemId)
      
      set({ items: updatedItems })
      await get().syncCart()
    } catch (error) {
      logger.error('❌ Cart - Error removing item:', error)
    }
  },

  clearCart: async () => {
    try {
      set({ items: [] })
      await get().syncCart()
    } catch (error) {
      logger.error('❌ Cart - Error clearing cart:', error)
    }
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  },

  getTaxAmount: () => {
    return get().getSubtotal() * 0.075 // 7.5% VAT
  },

  refreshInventory: async () => {
    try {
      const currentItems = get().items
      const removedItems: any[] = []
      const quantityChanges: any[] = []
      
      const updatedItems = await Promise.all(
        currentItems.map(async (item) => {
          try {
            const response = await fetch('/api/products/inventory/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: item.product_id,
                variant_id: item.variant_id || null
              })
            })

            if (!response.ok) {
              logger.warn(`⚠️ Cart - Could not check inventory for ${item.title}`)
              return item
            }

            const stockData = await response.json()
            
            // Remove inactive items
            if (!stockData.is_active) {
              removedItems.push(item)
              return null
            }

            // Update quantity if needed
            if (stockData.track_inventory && item.quantity > stockData.inventory_quantity) {
              const newQuantity = Math.max(0, stockData.inventory_quantity)
              if (newQuantity !== item.quantity) {
                quantityChanges.push({
                  item,
                  oldQuantity: item.quantity,
                  newQuantity
                })
              }
              return { ...item, quantity: newQuantity }
            }

            return item
          } catch (error) {
            logger.warn(`⚠️ Cart - Error checking inventory for ${item.title}:`, error)
            return item
          }
        })
      )

      const validItems = updatedItems.filter(item => item !== null) as CartItem[]
      
      set({ items: validItems })
      await get().syncCart()

      return {
        removedItems,
        quantityChanges,
        totalItems: validItems.length
      }
      
    } catch (error) {
      logger.error('❌ Cart - Error refreshing inventory:', error)
      throw new Error('Failed to refresh cart inventory')
    }
  }
}))
