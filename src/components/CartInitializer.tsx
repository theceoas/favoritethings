'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store/cartStore'

export default function CartInitializer() {
  const { loadCart } = useCartStore()

  useEffect(() => {
    // Initialize cart on app startup
    loadCart()
  }, [loadCart])

  // This component doesn't render anything
  return null
}
