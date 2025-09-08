import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Mark all unread notifications as read
    const { error } = await supabase
      .from('admin_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('is_read', false)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to clear notifications', 
        details: error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Clear notifications error:', error)
    return NextResponse.json({ 
      error: 'Clear failed', 
      details: error 
    }, { status: 500 })
  }
} 