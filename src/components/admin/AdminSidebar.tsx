'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from "framer-motion"
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  ReceiptPercentIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

export default function AdminSidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Brands', href: '/admin/brands', icon: ShoppingBagIcon },
    { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Others', href: '/admin/others', icon: ShoppingBagIcon },
    { name: 'Filters', href: '/admin/filters', icon: FunnelIcon },
    { name: 'Inventory', href: '/admin/inventory', icon: ArchiveBoxIcon },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Promotions', href: '/admin/promotions', icon: ReceiptPercentIcon },
    { name: 'Customers', href: '/admin/customers', icon: UserGroupIcon },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-md shadow-2xl border-r border-gray-200/50"
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center h-20 border-b border-gray-200/50 bg-gradient-to-r from-yellow-400/10 to-orange-400/10">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center shadow-lg">
            {/* Favorite Things Logo */}
            <img 
              src="/favorite-things-logo.svg" 
              alt="Favorite Things Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Favorite Things</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
            
            return (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-yellow-400/10 hover:text-gray-800'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-yellow-500'
                    }`}
                  >
                    <item.icon />
                  </motion.div>
                  {item.name}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronRightIcon className="ml-auto h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </nav>



      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-500">Multi-Brand Admin v1.0</p>
        </div>
      </div>
    </motion.div>
  )
} 