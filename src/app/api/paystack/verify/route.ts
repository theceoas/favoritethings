import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    console.log('🔍 Paystack Verify API - Processing reference:', reference)

    // Validate required fields
    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Check if this is a simulation reference
    if (reference.startsWith('sim_')) {
      console.log('🎭 Simulation mode - Returning mock successful payment')
      
      // Extract timestamp from reference to find the corresponding order
      const timestampMatch = reference.match(/sim_(\d+)_/)
      let orderMetadata = { simulation: true }
      
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1])
        console.log('🔍 Extracted timestamp from reference:', timestamp)
        
        // Try to find the order created around this time (within 5 minutes)
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        
        const timeWindow = 5 * 60 * 1000 // 5 minutes in milliseconds
        const startTime = new Date(timestamp - timeWindow).toISOString()
        const endTime = new Date(timestamp + timeWindow).toISOString()
        
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, order_number')
          .gte('created_at', startTime)
          .lte('created_at', endTime)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (!error && orders && orders.length > 0) {
          const order = orders[0]
          orderMetadata = {
            simulation: true,
            orderId: order.id,
            orderNumber: order.order_number
          }
          console.log('✅ Found matching order for simulation:', orderMetadata)
        } else {
          console.log('⚠️ No matching order found for timestamp, using simulation metadata only')
        }
      }
      
      // Return simulated successful payment data
      return NextResponse.json({
        success: true,
        data: {
          status: 'success',
          reference: reference,
          amount: 100000, // Mock amount in kobo
          currency: 'NGN',
          paid_at: new Date().toISOString(),
          channel: 'card',
          customer: {
            email: 'test@example.com'
          },
          metadata: orderMetadata
        }
      })
    }

    // Get Paystack secret key for real transactions
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('❌ Paystack secret key not configured')
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    console.log('🔄 Making real Paystack API call for reference:', reference)

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Paystack verification failed:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to verify payment' },
        { status: response.status }
      )
    }

    // Check if payment was successful
    const transaction = data.data
    const isSuccessful = transaction.status === 'success'

    console.log('✅ Paystack verification result:', { 
      reference: transaction.reference, 
      status: transaction.status,
      success: isSuccessful 
    })

    return NextResponse.json({
      success: isSuccessful,
      data: {
        status: transaction.status,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        paid_at: transaction.paid_at,
        channel: transaction.channel,
        customer: transaction.customer,
        metadata: transaction.metadata
      }
    })

  } catch (error) {
    console.error('💥 Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}