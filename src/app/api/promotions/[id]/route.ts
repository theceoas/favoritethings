import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const promotionId = params.id

  try {
    console.log('🔍 Promotions API - Fetching promotion:', promotionId)
    
    const { data: promotion, error } = await supabase
      .from('promotions')
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
      .eq('id', promotionId)
      .single()

    if (error) {
      console.error('❌ Promotions API - Error fetching promotion:', error)
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Add computed fields
    const now = new Date()
    const validFrom = new Date(promotion.valid_from)
    const validUntil = new Date(promotion.valid_until)
    
    let computed_status = 'inactive'
    if (promotion.is_active) {
      if (now < validFrom) {
        computed_status = 'scheduled'
      } else if (now > validUntil) {
        computed_status = 'expired'
      } else {
        computed_status = 'active'
      }
    }

    const usage_percentage = promotion.usage_limit > 0 ? 
      Math.round((promotion.times_used / promotion.usage_limit) * 100) : 0

    const days_until_expiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const enrichedPromotion = {
      ...promotion,
      computed_status,
      usage_percentage,
      days_until_expiry,
      is_expiring_soon: days_until_expiry <= 7 && days_until_expiry > 0,
      is_fully_used: promotion.usage_limit > 0 && promotion.times_used >= promotion.usage_limit
    }

    console.log('✅ Promotions API - Promotion details fetched successfully')
    return NextResponse.json({ promotion: enrichedPromotion })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const promotionId = params.id

  try {
    const updateData = await request.json()
    
    // Remove fields that shouldn't be updated
    const { id, created_at, created_by, times_used, ...safeUpdateData } = updateData
    
    // Validate discount percentage if provided
    if (safeUpdateData.discount_percent !== undefined) {
      safeUpdateData.discount_percent = Math.max(0, Math.min(100, safeUpdateData.discount_percent))
    }

    // Validate dates if provided
    if (safeUpdateData.valid_from && safeUpdateData.valid_until) {
      const validFrom = new Date(safeUpdateData.valid_from)
      const validUntil = new Date(safeUpdateData.valid_until)
      
      if (validUntil <= validFrom) {
        return NextResponse.json({ 
          error: 'Valid until date must be after valid from date' 
        }, { status: 400 })
      }
    }

    // Check if new code conflicts with existing codes (if code is being updated)
    if (safeUpdateData.code) {
      const { data: existingPromo } = await supabase
        .from('promotions')
        .select('id')
        .eq('code', safeUpdateData.code)
        .neq('id', promotionId)
        .single()

      if (existingPromo) {
        return NextResponse.json({ 
          error: 'Promotion code already exists. Please use a unique code.' 
        }, { status: 409 })
      }
    }
    
    // Add updated_at timestamp
    const dataToUpdate = {
      ...safeUpdateData,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('promotions')
      .update(dataToUpdate)
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
      console.error('❌ Promotions API - Error updating promotion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Promotions API - Promotion updated:', promotionId)
    return NextResponse.json({ promotion: data })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const promotionId = params.id

  try {
    // Check if promotion exists and get its usage count
    const { data: promotion, error: fetchError } = await supabase
      .from('promotions')
      .select('times_used, code')
      .eq('id', promotionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // If promotion has been used, we should soft delete (deactivate) instead of hard delete
    if (promotion.times_used > 0) {
      const { error } = await supabase
        .from('promotions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotionId)

      if (error) {
        console.error('❌ Promotions API - Error deactivating promotion:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('✅ Promotions API - Promotion deactivated (has usage):', promotionId)
      return NextResponse.json({ 
        message: 'Promotion deactivated successfully (preserved due to usage history)',
        action: 'deactivated'
      })
    } else {
      // Hard delete if never used
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId)

      if (error) {
        console.error('❌ Promotions API - Error deleting promotion:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('✅ Promotions API - Promotion deleted:', promotionId)
      return NextResponse.json({ 
        message: 'Promotion deleted successfully',
        action: 'deleted'
      })
    }

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 