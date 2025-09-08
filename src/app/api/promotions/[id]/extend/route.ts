import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const promotionId = params.id

  try {
    const { days, hours, new_date } = await request.json()
    
    if (!days && !hours && !new_date) {
      return NextResponse.json({ 
        error: 'Must provide either days, hours, or new_date to extend promotion' 
      }, { status: 400 })
    }

    console.log('📅 Promotions API - Extending promotion:', promotionId)
    
    // Get current promotion
    const { data: promotion, error: fetchError } = await supabase
      .from('promotions')
      .select('valid_until, code')
      .eq('id', promotionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    let newValidUntil: string

    if (new_date) {
      // Use specific new date
      const newDate = new Date(new_date)
      if (newDate <= new Date()) {
        return NextResponse.json({ 
          error: 'New expiration date must be in the future' 
        }, { status: 400 })
      }
      newValidUntil = newDate.toISOString()
    } else {
      // Extend by days/hours from current expiration
      const currentExpiry = new Date(promotion.valid_until)
      const extensionMs = (days || 0) * 24 * 60 * 60 * 1000 + (hours || 0) * 60 * 60 * 1000
      newValidUntil = new Date(currentExpiry.getTime() + extensionMs).toISOString()
    }

    const { data, error } = await supabase
      .from('promotions')
      .update({ 
        valid_until: newValidUntil,
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
      console.error('❌ Promotions API - Error extending promotion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const extensionDescription = new_date 
      ? `until ${new Date(new_date).toLocaleDateString()}`
      : `by ${days || 0} days${hours ? ` and ${hours} hours` : ''}`

    console.log(`✅ Promotions API - Promotion extended ${extensionDescription}:`, promotionId)
    return NextResponse.json({ 
      promotion: data,
      message: `Promotion ${promotion.code} extended ${extensionDescription}`,
      old_expiry: promotion.valid_until,
      new_expiry: newValidUntil
    })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 