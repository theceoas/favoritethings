import { createClient } from '@/lib/supabase/server'

export interface NotificationData {
  order_id?: string
  order_number?: string
  amount?: number
  product_id?: string
  product_name?: string
  current_stock?: number
  [key: string]: any
}

export type NotificationType = 'new_order' | 'payment_received' | 'order_shipped' | 'order_delivered' | 'low_stock' | 'system_alert'

export class NotificationService {
  private getSupabase() {
    return createClient()
  }

  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ) {
    try {
      const supabase = this.getSupabase()
      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .insert({
          type,
          title,
          message,
          data: data || {},
          is_read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        throw error
      }

      console.log('✅ Notification created:', notification)
      return notification
    } catch (error) {
      console.error('❌ Failed to create notification:', error)
      throw error
    }
  }

  async getUnreadNotifications() {
    try {
      const supabase = this.getSupabase()
      const { data: notifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching unread notifications:', error)
        throw error
      }

      return notifications || []
    } catch (error) {
      console.error('❌ Failed to fetch unread notifications:', error)
      return []
    }
  }

  async getAllNotifications(limit = 50) {
    try {
      const supabase = this.getSupabase()
      const { data: notifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching notifications:', error)
        throw error
      }

      return notifications || []
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error)
      return []
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const supabase = this.getSupabase()
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        throw error
      }

      console.log('✅ Notification marked as read:', notificationId)
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error)
      throw error
    }
  }

  async markAllAsRead() {
    try {
      const supabase = this.getSupabase()
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }

      console.log('✅ All notifications marked as read')
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error)
      throw error
    }
  }

  async getUnreadCount() {
    try {
      const supabase = this.getSupabase()
      const { count, error } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('❌ Failed to get unread count:', error)
      return 0
    }
  }

  // Convenience methods for specific notification types
  async notifyNewOrder(orderNumber: string, orderId: string, amount: number) {
    return this.createNotification(
      'new_order',
      'New Order Received',
      `Order #${orderNumber} has been placed for ₦${amount.toLocaleString()}`,
      {
        order_id: orderId,
        order_number: orderNumber,
        amount
      }
    )
  }

  async notifyPaymentReceived(orderNumber: string, orderId: string, amount: number) {
    return this.createNotification(
      'payment_received',
      'Payment Received',
      `Payment of ₦${amount.toLocaleString()} confirmed for Order #${orderNumber}`,
      {
        order_id: orderId,
        order_number: orderNumber,
        amount
      }
    )
  }

  async notifyOrderShipped(orderNumber: string, orderId: string) {
    return this.createNotification(
      'order_shipped',
      'Order Shipped',
      `Order #${orderNumber} has been shipped`,
      {
        order_id: orderId,
        order_number: orderNumber
      }
    )
  }

  async notifyOrderDelivered(orderNumber: string, orderId: string) {
    return this.createNotification(
      'order_delivered',
      'Order Delivered',
      `Order #${orderNumber} has been delivered`,
      {
        order_id: orderId,
        order_number: orderNumber
      }
    )
  }

  async notifyLowStock(productName: string, productId: string, currentStock: number) {
    return this.createNotification(
      'low_stock',
      'Low Stock Alert',
      `Product "${productName}" is running low on stock (${currentStock} remaining)`,
      {
        product_id: productId,
        product_name: productName,
        current_stock: currentStock
      }
    )
  }

  async notifySystemAlert(title: string, message: string, data?: NotificationData) {
    return this.createNotification(
      'system_alert',
      title,
      message,
      data
    )
  }
}

// Export a singleton instance
export const notificationService = new NotificationService() 