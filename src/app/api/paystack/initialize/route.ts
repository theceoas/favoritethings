import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, metadata } = body

    // Validate required fields
    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email and amount are required' },
        { status: 400 }
      )
    }

    console.log('Payment simulation request:', { email, amount, metadata })

    // Generate a mock payment reference
    const reference = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Simulate payment initialization with mock data
    const mockResponse = {
      access_code: `sim_access_${Date.now()}`,
      authorization_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/confirm-payment?ref=${reference}`,
      reference: reference
    }

    console.log('Payment simulation response:', mockResponse)

    return NextResponse.json({
      success: true,
      data: mockResponse
    })

  } catch (error) {
    console.error('Payment simulation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}