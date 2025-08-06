import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()
    
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('❌ Paystack secret key not configured')
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 })
    }

    console.log('🔍 Verifying Paystack payment:', reference)
    
    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    console.log('💳 Paystack verification result:', result)

    if (!response.ok) {
      console.error('❌ Paystack verification failed:', result)
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    if (result.status && result.data.status === 'success') {
      console.log('✅ Payment verified successfully')
      return NextResponse.json({
        success: true,
        data: result.data,
        amount: result.data.amount / 100, // Convert from kobo to naira
        reference: result.data.reference
      })
    } else {
      console.error('❌ Payment not successful:', result.data.status)
      return NextResponse.json({ 
        error: 'Payment was not successful',
        status: result.data.status 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Payment verification error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
} 