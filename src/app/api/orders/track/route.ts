import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Order tracking API called')
  
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('order_number')

  console.log('📦 Raw order number from request:', orderNumber)

  if (!orderNumber) {
    console.log('❌ No order number provided')
    return NextResponse.json({ 
      error: 'Order number is required' 
    }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    // Clean the order number - remove any whitespace and ensure proper format
    const cleanOrderNumber = orderNumber.trim()
    console.log('🔍 Clean order number:', cleanOrderNumber)
    
    // First, let's see what order numbers exist
    const { data: allOrders, error: listError } = await supabase
      .from('orders')
      .select('order_number')
      .limit(5)
    
    console.log('📊 Sample order numbers in DB:', allOrders)

    // Try to find the order with a more flexible search
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            title,
            featured_image
          )
        )
      `)
      .or(`order_number.eq."${cleanOrderNumber}",order_number.ilike."${cleanOrderNumber}%"`)
      .single()

    console.log('📊 Supabase query result:', { order, error })

    if (error) {
      console.log('❌ Supabase error:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Order not found',
          order_found: false,
          debug_info: {
            searched_for: cleanOrderNumber,
            sample_orders: allOrders
          }
        }, { status: 404 })
      }
      throw error
    }

    console.log('✅ Order found:', order.order_number)

    // Return the order data directly since it matches the frontend's Order interface
    const response = {
      ...order,
      order_items: order.order_items.map(item => ({
        ...item,
        total: item.price * item.quantity
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Error fetching order:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Allow CORS for AI agent access
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 