import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { code, user_id, brand_id } = await request.json()

    if (!code) {
      return NextResponse.json({ 
        error: 'Promotion code is required' 
      }, { status: 400 })
    }

    console.log('🔍 Promotions API - Validating promotion code:', code)

    // Find the promotion
    const { data: promotion, error: fetchError } = await supabase
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
      .eq('code', code.toUpperCase())
      .single()

    if (fetchError || !promotion) {
      return NextResponse.json({
        valid: false,
        error: 'Promotion code not found',
        code: code
      }, { status: 404 })
    }

    const now = new Date()
    const validFrom = new Date(promotion.valid_from)
    const validUntil = new Date(promotion.valid_until)
    const validationResult: any = {
      code: promotion.code,
      valid: true,
      promotion: null,
      reasons: []
    }

    // Check if promotion is active
    if (!promotion.is_active) {
      validationResult.valid = false
      validationResult.reasons.push('Promotion is not active')
    }

    // Check if promotion has started
    if (now < validFrom) {
      validationResult.valid = false
      validationResult.reasons.push(`Promotion starts on ${validFrom.toLocaleDateString()}`)
    }

    // Check if promotion has expired
    if (now > validUntil) {
      validationResult.valid = false
      validationResult.reasons.push(`Promotion expired on ${validUntil.toLocaleDateString()}`)
    }

    // Check usage limits
    if (promotion.usage_limit > 0 && promotion.times_used >= promotion.usage_limit) {
      validationResult.valid = false
      validationResult.reasons.push('Promotion usage limit reached')
    }

    // Check brand compatibility if brand_id is provided
    if (brand_id && promotion.brand_id !== brand_id) {
      validationResult.valid = false
      validationResult.reasons.push('Promotion not valid for this brand')
    }

    // If user_id is provided, check if user has already used this promotion
    if (user_id && validationResult.valid) {
      // This would require a promotion_usage table to track individual usage
      // For now, we'll skip this check but add it to the response structure
      validationResult.user_usage_check = 'not_implemented'
    }

    // Add promotion details if valid
    if (validationResult.valid) {
      const days_until_expiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const usage_percentage = promotion.usage_limit > 0 ? 
        Math.round((promotion.times_used / promotion.usage_limit) * 100) : 0

      validationResult.promotion = {
        id: promotion.id,
        code: promotion.code,
        description: promotion.description,
        discount_percent: promotion.discount_percent,
        valid_from: promotion.valid_from,
        valid_until: promotion.valid_until,
        usage_limit: promotion.usage_limit,
        times_used: promotion.times_used,
        usage_percentage,
        days_until_expiry,
        is_expiring_soon: days_until_expiry <= 7,
        brand: promotion.brands
      }

      validationResult.message = `Promotion code is valid! ${promotion.discount_percent}% discount available.`
    } else {
      validationResult.error = validationResult.reasons.join(', ')
    }

    const statusCode = validationResult.valid ? 200 : 400
    
    console.log(`${validationResult.valid ? '✅' : '❌'} Promotions API - Code validation result:`, validationResult.valid)
    
    return NextResponse.json(validationResult, { status: statusCode })

  } catch (error) {
    console.error('❌ Promotions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 