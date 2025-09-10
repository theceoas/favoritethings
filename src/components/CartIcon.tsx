'use client'

import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'

interface CartIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CartIcon({ className = '', size = 'md' }: CartIconProps) {
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

  return (
    <motion.button
      onClick={openCart}
      className={`relative p-1 text-gray-600 hover:text-yellow-500 transition-colors ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <ShoppingBag className={sizeClasses[size]} />
      {/* Cart Badge */}
      {totalItems > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full ${badgeSizeClasses[size]} flex items-center justify-center font-bold`}
        >
          {totalItems}
        </motion.span>
      )}
    </motion.button>
  )
}