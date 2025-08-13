'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bell,
  ShoppingBag,
  CreditCard,
  Truck,
  Package,
  AlertTriangle,
  Settings,
  Check,
  X,
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: 'new_order' | 'payment_received' | 'order_shipped' | 'order_delivered' | 'low_stock' | 'system_alert'
  is_read: boolean
  data: any
  created_at: string
  read_at: string | null
}

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange: (count: number) => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_order':
      return <ShoppingBag className="w-5 h-5" />
    case 'payment_received':
      return <CreditCard className="w-5 h-5" />
    case 'order_shipped':
      return <Truck className="w-5 h-5" />
    case 'order_delivered':
      return <Package className="w-5 h-5" />
    case 'low_stock':
      return <AlertTriangle className="w-5 h-5" />
    case 'system_alert':
      return <Settings className="w-5 h-5" />
    default:
      return <Bell className="w-5 h-5" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'new_order':
      return 'bg-green-100 text-green-600'
    case 'payment_received':
      return 'bg-blue-100 text-blue-600'
    case 'order_shipped':
      return 'bg-yellow-100 text-yellow-600'
    case 'order_delivered':
      return 'bg-green-100 text-green-600'
    case 'low_stock':
      return 'bg-red-100 text-red-600'
    case 'system_alert':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

export default function NotificationDialog({ isOpen, onClose, onUnreadCountChange }: NotificationDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('admin_notifications_dialog')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('Notification change:', payload)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching notifications...')
      
      // Fetch all notifications
      const { data: allNotifications, error: allError } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (allError) throw allError

      // Calculate unread count
      const unreadCount = allNotifications?.filter(n => !n.is_read).length || 0

      console.log('📊 Notifications fetched:', allNotifications?.length, 'Unread:', unreadCount)
      setNotifications(allNotifications || [])
      setUnreadCount(unreadCount)
      onUnreadCountChange(unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      )
      
      const newUnreadCount = Math.max(0, unreadCount - 1)
      setUnreadCount(newUnreadCount)
      onUnreadCountChange(newUnreadCount)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
      onUnreadCountChange(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.data?.order_id) {
      router.push(`/admin/orders/${notification.data.order_id}`)
    } else if (notification.data?.product_id) {
      router.push(`/admin/products/${notification.data.product_id}`)
    }

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchNotifications}
                disabled={loading}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No notifications</p>
              <p className="text-gray-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.data?.order_number && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">
                            Order: {notification.data.order_number}
                          </span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-gray-200/50 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/admin/notifications')
                onClose()
              }}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              View all notifications
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 