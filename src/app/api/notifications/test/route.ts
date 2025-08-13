import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { count = 3 } = await request.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const notifications = []
    
    for (let i = 1; i <= count; i++) {
      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'new_order',
          title: 'Test Order Received',
          message: `Test Order #TEST-${Date.now()}-${i} has been placed for ₦${(50000 + (i * 1000)).toLocaleString()}`,
          data: {
            order_id: `test-order-${i}`,
            order_number: `TEST-${Date.now()}-${i}`,
            amount: 50000 + (i * 1000)
          },
          is_read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        continue
      }

      notifications.push(notification)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${notifications.length} test notifications`,
      notifications 
    })
  } catch (error) {
    console.error('Error creating test notifications:', error)
    return NextResponse.json({ error: 'Failed to create test notifications' }, { status: 500 })
  }
} 