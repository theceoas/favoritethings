'use client'

import { create } from 'zustand'

interface CartItem {
  id: string
  product_id: string
  title: string
  slug: string
  price: number
  quantity: number
  featured_image?: string
  sku: string
  size?: string
  color?: string
}

interface SimpleCartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: {
    id: string
    title: string
    slug: string
    price: number
    featured_image?: string
    sku: string
  }, size?: string, color?: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
  saveToStorage: () => void
  loadFromStorage: () => void
}

// Simple storage helper
const STORAGE_KEY = 'simple-cart'

const saveToSessionStorage = (items: CartItem[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Silently fail if storage is not available
  }
}

const loadFromSessionStorage = (): CartItem[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const useSimpleCartStore = create<SimpleCartStore>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (product, size, color) => {
    const { items } = get()
    const cartItemId = `${product.id}${size ? `-${size}` : ''}${color ? `-${color}` : ''}`
    
    const existingItem = items.find(item => item.id === cartItemId)
    
    let newItems: CartItem[]
    
    if (existingItem) {
      // Update existing item quantity
      newItems = items.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      // Add new item
      const newItem: CartItem = {
        id: cartItemId,
        product_id: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        quantity: 1,
        featured_image: product.featured_image,
        sku: product.sku,
        size,
        color
      }
      
      newItems = [...items, newItem]
    }
    
    set({ items: newItems })
    saveToSessionStorage(newItems)
  },

  updateQuantity: (itemId, quantity) => {
    const { items } = get()
    let newItems: CartItem[]
    
    if (quantity <= 0) {
      newItems = items.filter(item => item.id !== itemId)
    } else {
      newItems = items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }
    
    set({ items: newItems })
    saveToSessionStorage(newItems)
  },

  removeItem: (itemId) => {
    const { items } = get()
    const newItems = items.filter(item => item.id !== itemId)
    set({ items: newItems })
    saveToSessionStorage(newItems)
  },

  clearCart: () => {
    set({ items: [] })
    saveToSessionStorage([])
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  getTotalItems: () => {
    const { items } = get()
    return items.reduce((total, item) => total + item.quantity, 0)
  },

  getSubtotal: () => {
    const { items } = get()
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  saveToStorage: () => {
    const { items } = get()
    saveToSessionStorage(items)
  },

  loadFromStorage: () => {
    const items = loadFromSessionStorage()
    set({ items })
  }
}))