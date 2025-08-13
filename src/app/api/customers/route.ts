import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const segment = searchParams.get('segment') || ''
  const status = searchParams.get('status') || ''

  try {
    console.log('🔍 Customers API - Fetching customers...')
    
    // Build the base query
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Get total count for pagination
    const { count } = await query

    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data: customers, error } = await query

    if (error) {
      console.error('❌ Customers API - Error fetching customers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch orders for customer stats
    let orders: any[] = []
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, email, total, created_at, status')
        .not('status', 'in', ['cancelled', 'refunded'])

      if (!ordersError) {
        orders = ordersData || []
        console.log('✅ Customers API - Orders fetched:', orders.length)
      }
    } catch (ordersTableError) {
      console.warn('⚠️ Customers API - Orders table not accessible')
    }

    // Fetch addresses for phone numbers
    let addresses: any[] = []
    try {
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('user_id, phone, type')
        .not('phone', 'is', null)

      if (!addressesError) {
        addresses = addressesData || []
        console.log('✅ Customers API - Addresses fetched:', addresses.length)
      }
    } catch (addressesTableError) {
      console.warn('⚠️ Customers API - Addresses table not accessible')
    }

    // Process customers with additional data
    const customersWithStats = customers?.map((customer: any) => {
      // Match orders to this customer
      const customerId = customer.id
      const customerEmail = customer.email
      
      let customerOrders = orders.filter(order => order.user_id === customerId) || []
      
      // If no orders found by user_id, try matching by email
      if (customerOrders.length === 0) {
        customerOrders = orders.filter(order => order.email === customerEmail) || []
      }
      
      // Calculate total spent with kobo to naira conversion
      const totalSpent = customerOrders.reduce((sum, order) => {
        let orderTotal = 0
        if (typeof order.total === 'string') {
          orderTotal = parseFloat(order.total) || 0
        } else if (typeof order.total === 'number') {
          orderTotal = order.total
        }
        
        // Convert from kobo to naira if needed
        if (orderTotal > 1000000) {
          orderTotal = orderTotal / 100
        }
        
        return sum + orderTotal
      }, 0)

      const totalOrders = customerOrders.length
      const lastOrder = customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      // Get phone numbers from addresses
      const customerAddresses = addresses.filter(addr => addr.user_id === customerId) || []
      const addressPhones = customerAddresses.map(addr => addr.phone).filter(Boolean)
      const primaryPhone = customer.phone || addressPhones[0] || null

      // Determine customer segment
      let segment: 'vip' | 'new' | 'inactive' | 'regular' = 'regular'
      const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)) : Infinity
      const daysSinceRegistration = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))

      if (totalSpent > 50000) {
        segment = 'vip'
      } else if (daysSinceRegistration <= 30) {
        segment = 'new'
      } else if (daysSinceLastOrder > 90) {
        segment = 'inactive'
      }

      return {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name || customer.name,
        avatar_url: customer.avatar_url,
        role: customer.role,
        phone: primaryPhone,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        email_verified: customer.email_verified,
        is_active: customer.is_active !== false,
        marketing_consent: customer.marketing_consent,
        last_login: customer.last_login,
        // Computed fields
        total_orders: totalOrders,
        total_spent: totalSpent,
        last_order_date: lastOrder?.created_at,
        customer_segment: segment,
        // Additional computed fields
        days_since_registration: daysSinceRegistration,
        days_since_last_order: daysSinceLastOrder === Infinity ? null : daysSinceLastOrder
      }
    }) || []

    // Apply segment filter after processing
    let filteredCustomers = customersWithStats
    if (segment) {
      filteredCustomers = customersWithStats.filter(c => c.customer_segment === segment)
    }

    console.log('✅ Customers API - Processed customers:', filteredCustomers.length)

    return NextResponse.json({
      customers: filteredCustomers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        search,
        segment,
        status
      }
    })

  } catch (error) {
    console.error('❌ Customers API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const customerData = await request.json()
    
    // Validate required fields
    if (!customerData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Set default values
    const newCustomer = {
      ...customerData,
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(newCustomer)
      .select()
      .single()

    if (error) {
      console.error('❌ Customers API - Error creating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Customers API - Customer created:', data.id)
    return NextResponse.json({ customer: data }, { status: 201 })

  } catch (error) {
    console.error('❌ Customers API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 