import { motion } from "framer-motion"
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  email: string
  status: string
  total: number
  created_at: string
}

interface RecentOrdersProps {
  orders: Order[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'processing':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'shipped':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden border border-gray-200/50"
    >
      <div className="px-8 py-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
            <p className="text-sm text-gray-600">Latest customer orders</p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No orders yet</p>
            <p className="text-gray-500 text-sm mt-1">Orders will appear here once customers start shopping</p>
          </motion.div>
        ) : (
          <ul className="divide-y divide-gray-200/50">
            {orders.map((order, index) => (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                className="p-6 transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
                      >
                        <span className="text-sm font-bold text-white">
                          #{order.order_number.slice(-4)}
                        </span>
                      </motion.div>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-bold text-gray-800">
                        {order.order_number}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-xl border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        ₦{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="px-8 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
          >
            <Link
              href="/admin/orders"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
            >
              View all orders
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 