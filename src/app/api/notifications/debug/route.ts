import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Check if table exists and get count
    const { data: notifications, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('*')
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: fetchError,
        tableExists: false 
      }, { status: 500 })
    }

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0
    const totalCount = notifications?.length || 0

    return NextResponse.json({
      success: true,
      tableExists: true,
      totalNotifications: totalCount,
      unreadNotifications: unreadCount,
      sampleNotifications: notifications?.slice(0, 3) || []
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error 
    }, { status: 500 })
  }
} 