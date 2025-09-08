import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const promotionId = params.id

  try {
    console.log('🔄 Promotions API - Toggling promotion status:', promotionId)
    
    // Get current promotion status
    const { data: promotion, error: fetchError } = await supabase
      .from('promotions')
      .select('is_active, code')
      .eq('id', promotionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Toggle the status
    const newStatus = !promotion.is_active

    const { data, error } = await supabase
      .from('promotions')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', promotionId)
      .select(`
        *,
        brands (
          id,
          name,
          slug,
          primary_color,
          secondary_color
        )
      `)
      .single()

    if (error) {
      console.error('❌ Promotions API - Error toggling promotion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Promotions API - Promotion ${newStatus ? 'activated' : 'deactivated'}:`, promotionId)
    return NextResponse.json({ 
      promotion: data,
      message: `Promotion ${promotion.code} ${newStatus ? 'activated' : 'deactivated'} successfully`,
      status: newStatus ? 'activated' : 'deactivated'
    })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 