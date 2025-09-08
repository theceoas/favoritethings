import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const promotionId = params.id

  try {
    const { 
      new_code, 
      valid_from, 
      valid_until, 
      usage_limit, 
      discount_percent,
      description_suffix 
    } = await request.json()

    console.log('📋 Promotions API - Duplicating promotion:', promotionId)
    
    // Get original promotion
    const { data: originalPromotion, error: fetchError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Original promotion not found' }, { status: 404 })
    }

    // Generate new code if not provided
    const duplicateCode = new_code || `${originalPromotion.code}_COPY_${Date.now()}`

    // Check if new code already exists
    const { data: existingPromo } = await supabase
      .from('promotions')
      .select('id')
      .eq('code', duplicateCode)
      .single()

    if (existingPromo) {
      return NextResponse.json({ 
        error: 'Duplicate code already exists. Please provide a unique code.' 
      }, { status: 409 })
    }

    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser()

    // Set default dates if not provided
    const now = new Date()
    const defaultValidFrom = valid_from || now.toISOString()
    const defaultValidUntil = valid_until || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Validate dates
    if (new Date(defaultValidUntil) <= new Date(defaultValidFrom)) {
      return NextResponse.json({ 
        error: 'Valid until date must be after valid from date' 
      }, { status: 400 })
    }

    // Create duplicate promotion
    const duplicatePromotion = {
      brand_id: originalPromotion.brand_id,
      code: duplicateCode,
      description: description_suffix 
        ? `${originalPromotion.description} ${description_suffix}`
        : `${originalPromotion.description} (Copy)`,
      discount_percent: discount_percent !== undefined 
        ? Math.max(0, Math.min(100, discount_percent))
        : originalPromotion.discount_percent,
      valid_from: defaultValidFrom,
      valid_until: defaultValidUntil,
      is_active: true,
      usage_limit: usage_limit !== undefined ? usage_limit : originalPromotion.usage_limit,
      times_used: 0,
      created_by: user?.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert([duplicatePromotion])
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
      console.error('❌ Promotions API - Error duplicating promotion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Promotions API - Promotion duplicated successfully:', data.id)
    return NextResponse.json({ 
      promotion: data,
      original_promotion: {
        id: originalPromotion.id,
        code: originalPromotion.code
      },
      message: `Promotion duplicated successfully as ${duplicateCode}`
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 