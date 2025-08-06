import { motion } from "framer-motion"
import Link from 'next/link'

interface Product {
  id: string
  title: string
  sku: string
  barcode?: string
  inventory_quantity: number
  low_stock_threshold: number
}

interface LowStockProductsProps {
  products: Product[]
}

export default function LowStockProducts({ products }: LowStockProductsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden border border-gray-200/50"
    >
      <div className="px-8 py-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Low Stock Alert</h3>
            <p className="text-sm text-gray-600">
              {products.length > 0 ? `${products.length} products need attention` : 'All products well-stocked'}
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">All products are well-stocked!</p>
            <p className="text-gray-500 text-sm mt-1">Your inventory levels look great</p>
          </motion.div>
        ) : (
          <ul className="divide-y divide-gray-200/50">
            {products.map((product, index) => {
              const isOutOfStock = product.inventory_quantity === 0
              const threshold = product.low_stock_threshold || 5
              
              return (
                <motion.li
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ backgroundColor: 'rgba(251, 146, 60, 0.05)' }}
                  className="p-6 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-sm font-bold text-gray-800 truncate">
                        {product.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        <div>SKU: {product.sku}</div>
                        {product.barcode && (
                          <div>Barcode: {product.barcode}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          isOutOfStock ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {product.inventory_quantity} left
                        </div>
                        <div className="text-xs text-gray-500">
                          Alert at {threshold}
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-xl border ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                      </motion.div>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="px-8 py-4 bg-gradient-to-r from-orange-50/50 to-red-50/50"
          >
            <div className="flex items-center justify-between">
              <Link
                href="/admin/inventory"
                className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors duration-300"
              >
                Manage inventory
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/admin/products"
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-300"
              >
                View all products
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 