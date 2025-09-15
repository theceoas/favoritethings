import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { payment_reference, payment_status, payment_data } = await request.json()

    console.log('🔄 Payment Status Update API - Processing:', { payment_reference, payment_status })

    // Validate required fields
    if (!payment_reference || !payment_status) {
      return NextResponse.json(
        { error: 'Payment reference and status are required' },
        { status: 400 }
      )
    }

    // First try to find the order by payment reference
    let { data: order, error: findError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        total,
        payment_status,
        status,
        user_id
      `)
      .eq('payment_reference', payment_reference)
      .single()

    // If not found by payment_reference, try to find by order metadata from payment_data
    if (findError || !order) {
      console.log('⚠️ Order not found by payment_reference, trying metadata fallback...')
      
      if (payment_data?.metadata?.orderId) {
        console.log('🔍 Trying to find order by ID from metadata:', payment_data.metadata.orderId)
        const { data: orderById, error: findByIdError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            email,
            total,
            payment_status,
            status,
            user_id
          `)
          .eq('id', payment_data.metadata.orderId)
          .single()

        if (!findByIdError && orderById) {
          order = orderById
          console.log('✅ Found order by metadata ID:', order.order_number)
        }
      }
      
      if (!order && payment_data?.metadata?.orderNumber) {
        console.log('🔍 Trying to find order by number from metadata:', payment_data.metadata.orderNumber)
        const { data: orderByNumber, error: findByNumberError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            email,
            total,
            payment_status,
            status,
            user_id
          `)
          .eq('order_number', payment_data.metadata.orderNumber)
          .single()

        if (!findByNumberError && orderByNumber) {
          order = orderByNumber
          console.log('✅ Found order by metadata order number:', order.order_number)
        }
      }
    }

    if (!order) {
      console.error('❌ Order not found for payment reference:', payment_reference, 'or metadata')
      return NextResponse.json(
        { error: 'Order not found for this payment reference' },
        { status: 404 }
      )
    }

    console.log('✅ Found order:', order.order_number)

    // Check if payment is already processed
    if (order.payment_status === 'paid') {
      console.log('⚠️ Payment already processed for order:', order.order_number)
      return NextResponse.json({
        message: 'Payment already processed',
        order_number: order.order_number,
        id: order.id,
        total: order.total
      })
    }

    // Update order payment status and order status
    const updateData: any = {
      payment_status,
      payment_reference, // Always set the payment reference
      updated_at: new Date().toISOString()
    }

    // If payment is successful, also update order status to confirmed
    if (payment_status === 'paid') {
      updateData.status = 'confirmed'
    }

    // Add payment data if provided
    if (payment_data) {
      updateData.payment_method = payment_data.channel || 'paystack'
      // Store additional payment metadata if needed
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)
      .select(`
        id,
        order_number,
        email,
        total,
        payment_status,
        status,
        payment_method,
        user_id
      `)
      .single()

    if (updateError) {
      console.error('❌ Failed to update order payment status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order payment status' },
        { status: 500 }
      )
    }

    console.log('✅ Order payment status updated successfully:', {
      order_number: updatedOrder.order_number,
      payment_status: updatedOrder.payment_status,
      status: updatedOrder.status
    })

    return NextResponse.json({
      message: 'Payment status updated successfully',
      order_number: updatedOrder.order_number,
      id: updatedOrder.id,
      total: updatedOrder.total,
      payment_status: updatedOrder.payment_status,
      status: updatedOrder.status
    })

  } catch (error) {
    console.error('💥 Payment Status Update API - Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}