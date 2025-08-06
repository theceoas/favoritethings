import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, customer, order_details } = await request.json()
    
    if (!amount || !customer || !order_details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('❌ Paystack secret key not configured')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    console.log('📝 Creating Paystack invoice:', { amount, customer })
    
    // Create invoice with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // amount should be in kobo
        email: customer.email,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: customer.name
            },
            {
              display_name: "Phone Number",
              variable_name: "phone",
              value: customer.phone || 'Not provided'
            },
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: order_details.order_id
            },
            {
              display_name: "Product Type",
              variable_name: "product_type",
              value: order_details.product_type
            }
          ]
        }
      })
    })

    const result = await response.json()
    console.log('💳 Paystack invoice creation result:', result)

    if (!response.ok) {
      console.error('❌ Paystack invoice creation failed:', result)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 400 })
    }

    if (result.status) {
      console.log('✅ Invoice created successfully')
      return NextResponse.json({
        success: true,
        invoice_url: result.data.authorization_url,
        reference: result.data.reference
      })
    } else {
      console.error('❌ Invoice creation not successful:', result)
      return NextResponse.json({ 
        error: 'Invoice creation failed',
        details: result.message 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Invoice creation error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
} 