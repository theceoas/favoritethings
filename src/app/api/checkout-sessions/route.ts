import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const sessionId = request.headers.get('x-session-id')

    if (!user && !sessionId) {
      return NextResponse.json({ checkoutData: null })
    }

    const { data: checkoutSession, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .or(`user_id.eq.${user?.id || ''},session_id.eq.${sessionId || ''}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching checkout session:', error)
      return NextResponse.json({ checkoutData: null })
    }

    return NextResponse.json({ 
      checkoutData: checkoutSession?.checkout_data || null 
    })
  } catch (error) {
    console.error('Error in checkout-sessions GET:', error)
    return NextResponse.json({ checkoutData: null })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { checkoutData, sessionId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!checkoutData) {
      return NextResponse.json({ error: 'Checkout data is required' }, { status: 400 })
    }

    const { data: checkoutSession, error } = await supabase
      .from('checkout_sessions')
      .upsert({
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        checkout_data: checkoutData,
        status: 'pending',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(checkoutSession)
  } catch (error) {
    console.error('Error in checkout-sessions POST:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { sessionId } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('checkout_sessions')
      .delete()
      .or(`user_id.eq.${user?.id || ''},session_id.eq.${sessionId || ''}`)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in checkout-sessions DELETE:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
