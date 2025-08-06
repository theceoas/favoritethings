import { motion } from "framer-motion"
import { ShoppingBagIcon, UsersIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

interface DashboardStatsProps {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
}

export default function DashboardStats({
  totalProducts,
  totalOrders,
  totalCustomers,
}: DashboardStatsProps) {
  const stats = [
    {
      name: 'Total Products',
      value: totalProducts,
      icon: ShoppingBagIcon,
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500',
      description: 'Active products in catalog'
    },
    {
      name: 'Total Orders',
      value: totalOrders,
      icon: ClipboardDocumentListIcon,
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500',
      description: 'Orders processed'
    },
    {
      name: 'Total Customers',
      value: totalCustomers,
      icon: UsersIcon,
      gradient: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500',
      description: 'Registered customers'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="group cursor-pointer"
        >
          <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-3xl transition-all duration-300 hover:shadow-2xl border border-gray-200/50">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`${stat.bgColor} rounded-2xl p-4 shadow-lg`}
                >
                  <stat.icon className="h-8 w-8 text-white" aria-hidden="true" />
                </motion.div>
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} opacity-10 rounded-full`} />
              </div>
              <div className="space-y-2">
                <dt className="text-sm font-medium text-gray-600 truncate">
                  {stat.name}
                </dt>
                <dd className="text-4xl font-bold text-gray-800">
                  {stat.value.toLocaleString()}
                </dd>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
              {/* Animated gradient background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-5 rounded-3xl`}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 