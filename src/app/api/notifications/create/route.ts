import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { type, orderNumber, orderId, amount, productName, productId, currentStock, title, message, data } = await request.json()
    const supabase = await createClient()

    let notificationData = {}

    switch (type) {
      case 'new_order':
        if (!orderNumber || !orderId || !amount) {
          return NextResponse.json({ error: 'Missing required fields for new order notification' }, { status: 400 })
        }
        notificationData = {
          type: 'new_order',
          title: 'New Order Received',
          message: `Order #${orderNumber} has been placed for ₦${amount.toLocaleString()}`,
          data: {
            order_id: orderId,
            order_number: orderNumber,
            amount
          },
          is_read: false
        }
        break

      case 'payment_received':
        if (!orderNumber || !orderId || !amount) {
          return NextResponse.json({ error: 'Missing required fields for payment notification' }, { status: 400 })
        }
        notificationData = {
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment of ₦${amount.toLocaleString()} confirmed for Order #${orderNumber}`,
          data: {
            order_id: orderId,
            order_number: orderNumber,
            amount
          },
          is_read: false
        }
        break

      case 'order_shipped':
        if (!orderNumber || !orderId) {
          return NextResponse.json({ error: 'Missing required fields for shipped notification' }, { status: 400 })
        }
        notificationData = {
          type: 'order_shipped',
          title: 'Order Shipped',
          message: `Order #${orderNumber} has been shipped`,
          data: {
            order_id: orderId,
            order_number: orderNumber
          },
          is_read: false
        }
        break

      case 'order_delivered':
        if (!orderNumber || !orderId) {
          return NextResponse.json({ error: 'Missing required fields for delivered notification' }, { status: 400 })
        }
        notificationData = {
          type: 'order_delivered',
          title: 'Order Delivered',
          message: `Order #${orderNumber} has been delivered`,
          data: {
            order_id: orderId,
            order_number: orderNumber
          },
          is_read: false
        }
        break

      case 'low_stock':
        if (!productName || !productId || currentStock === undefined) {
          return NextResponse.json({ error: 'Missing required fields for low stock notification' }, { status: 400 })
        }
        notificationData = {
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `Product "${productName}" is running low on stock (${currentStock} remaining)`,
          data: {
            product_id: productId,
            product_name: productName,
            current_stock: currentStock
          },
          is_read: false
        }
        break

      case 'system_alert':
        if (!title || !message) {
          return NextResponse.json({ error: 'Missing required fields for system alert' }, { status: 400 })
        }
        notificationData = {
          type: 'system_alert',
          title,
          message,
          data: data || {},
          is_read: false
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    const { data: notification, error } = await supabase
      .from('admin_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
} 