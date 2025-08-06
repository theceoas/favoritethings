import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Fetch all active brands
    const { data: brands, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching brands:', error)
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }

    return NextResponse.json({
      brands: brands || []
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 