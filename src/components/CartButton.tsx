'use client'

import { OptimizedMotionButton } from './OptimizedMotion'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'

interface CartButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'floating'
}

export default function CartButton({ className = '', size = 'md', variant = 'default' }: CartButtonProps) {
  const { items, openCart } = useCartStore()
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const badgeSizeClasses = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-xs',
    lg: 'w-5 h-5 text-sm'
  }

  const baseClasses = variant === 'floating' 
    ? 'fixed bottom-6 right-6 z-50 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 transition-colors'
    : 'relative p-1 text-amber-600 hover:text-amber-800 transition-colors'

  return (
    <OptimizedMotionButton
      onClick={openCart}
      className={`${baseClasses} ${className}`}
    >
      <ShoppingBag className={sizeClasses[size]} />
      {/* Cart Badge */}
      {totalItems > 0 && (
        <span
          className={`absolute -top-1 -right-1 bg-amber-500 text-white rounded-full ${badgeSizeClasses[size]} flex items-center justify-center font-bold animate-pulse`}
        >
          {totalItems}
        </span>
      )}
    </OptimizedMotionButton>
  )
}