'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { supabase } from '@/lib/supabase/client'
import { getProductImage } from '@/lib/utils/imageUtils'

import { getStorePickupAddress, STORE_CONTACT_ADDRESS } from '@/lib/utils/storeAddress'
import CartButton from '@/components/CartButton'
import {
  ShoppingBag,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowLeft,
  Sparkles,
  Truck,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ShippingAddress {
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
}

export default function CheckoutPage() {
  const { items, clearCart, getSubtotal, getTaxAmount, getTotalItems, removeItem } = useCartStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Nigeria'
  })

  const [billingIsSame, setBillingIsSame] = useState(true)
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Nigeria'
  })

  const [user, setUser] = useState<any>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showOtherAddresses, setShowOtherAddresses] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [appliedPromo, setAppliedPromo] = useState<any>(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    // Get current user and load saved addresses
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Pre-fill email from user account
        setShippingAddress(prev => ({
          ...prev,
          email: user.email || ''
        }))
        setBillingAddress(prev => ({
          ...prev,
          email: user.email || ''
        }))

        // Load saved addresses
        const { data: addresses } = await supabase
          .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })

        if (addresses) {
            setSavedAddresses(addresses)
        }
      }
    }
    
    getCurrentUser()
  }, [])

  const loadAddressData = (address: any) => {
    console.log('📍 Loading address data:', address)
    console.log('🚚 Current delivery method:', deliveryMethod)
    
    if (deliveryMethod === 'shipping' && address.address_line_1 !== STORE_CONTACT_ADDRESS.address_line_1) {
      // Load full shipping address
      setShippingAddress(prev => ({
        ...prev,
        first_name: address.first_name || '',
        last_name: address.last_name || '',
        phone: address.phone || prev.phone,
        address_line_1: address.address_line_1 || '',
        address_line_2: address.address_line_2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        country: address.country || 'Nigeria'
      }))
      console.log('✅ Loaded full shipping address')
    } else {
      // For pickup or contact info, just load contact details
      setShippingAddress(prev => ({
        ...prev,
        first_name: address.first_name || '',
        last_name: address.last_name || '',
        phone: address.phone || prev.phone,
        email: prev.email // Preserve email from user profile
      }))
      console.log('✅ Loaded contact info only')
    }
  }

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId)
    
    if (addressId === '') {
      // Clear form for new address entry
      console.log('🆕 User selected "Enter new address"')
      if (deliveryMethod === 'shipping') {
        setShippingAddress(prev => ({
          ...prev,
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Nigeria'
          // Keep first_name, last_name, email, phone
        }))
      }
    } else {
      // Load selected address
      const address = savedAddresses.find(addr => addr.id === addressId)
      if (address) {
        console.log('📋 User selected saved address:', address.id)
        loadAddressData(address)
      }
    }
  }

  useEffect(() => {
    if (billingIsSame) {
      setBillingAddress(shippingAddress)
    }
  }, [billingIsSame, shippingAddress])

  // Redirect if cart is empty (but not after successful payment)
  useEffect(() => {
    if (mounted && items.length === 0 && !window.location.pathname.includes('/thank-you')) {
      router.push('/cart')
    }
  }, [mounted, items.length, router])

  const handleInputChange = (
    field: keyof ShippingAddress,
    value: string,
    addressType: 'shipping' | 'billing' = 'shipping'
  ) => {
    if (addressType === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [field]: value }))
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateForm = () => {
    // Always required fields for contact
    const basicFields = ['first_name', 'last_name', 'email', 'phone']
    
    for (const field of basicFields) {
      if (!shippingAddress[field as keyof ShippingAddress]) {
        setError(`Please fill in ${field.replace('_', ' ')}`)
        return false
      }
    }

    // Additional fields required for shipping
    if (deliveryMethod === 'shipping') {
      const shippingFields = ['address_line_1', 'city', 'state', 'postal_code']
      for (const field of shippingFields) {
        if (!shippingAddress[field as keyof ShippingAddress]) {
          setError(`Please fill in ${field.replace('_', ' ')}`)
          return false
        }
      }

      if (!billingIsSame) {
        const allFields = [...basicFields, ...shippingFields]
        for (const field of allFields) {
          if (!billingAddress[field as keyof ShippingAddress]) {
            setError(`Please fill in billing ${field.replace('_', ' ')}`)
            return false
          }
        }
      }
    }

    // Validate pickup details for pickup orders
    if (deliveryMethod === 'pickup') {
      if (!pickupDate) {
        setError('Please select a pickup date')
        return false
      }
      if (!pickupTime) {
        setError('Please select a pickup time')
        return false
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shippingAddress.email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const validatePromoBeforePayment = async () => {
    if (appliedPromo && user) {
      console.log('[Promo] Validating promotion before payment:', appliedPromo.code);
      
      // Check if promo still exists and is valid
      const { data: promo, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', appliedPromo.code)
        .eq('is_active', true)
        .maybeSingle();

      if (promoError || !promo) {
        throw new Error('This promotion code is no longer valid.');
      }

      // Check if promo is within valid date range
      const now = new Date();
      if (now < new Date(promo.valid_from) || now > new Date(promo.valid_until)) {
        throw new Error('This promotion code has expired.');
      }



      // Check if user has reached their personal usage limit for this promo
      const { data: userUsageData, error: usageError } = await supabase
        .from('promotion_usage')
        .select('*')
        .eq('promotion_id', promo.id)
        .eq('user_id', user.id);

      if (usageError) throw usageError;

      const userUsageCount = userUsageData ? userUsageData.length : 0;
      
      if (userUsageCount >= promo.usage_limit) {
        throw new Error(`You have already used this promotion code ${promo.usage_limit} time(s).`);
      }
    }
  };

  const handleConfirmPayment = async () => {
    console.log('🛒 Starting payment confirmation with items:', items)
    console.log('📋 Cart validation - items count:', items.length)
    
    if (items.length === 0) {
      setError('Your cart is empty. Please add items before checkout.')
      return
    }

    if (!validateForm()) {
      return
    }

    // Validate promotion code before proceeding
    try {
      await validatePromoBeforePayment();
    } catch (error: any) {
      setError(error.message || 'Promotion code validation failed');
      setPromoDiscount(0);
      setAppliedPromo(null);
      return;
    }

    // Refresh inventory to ensure stock is still available
    try {
      const { refreshInventory } = useCartStore.getState()
      await refreshInventory()
      
      // Check if any items were removed due to insufficient stock
      const updatedItems = useCartStore.getState().items
      if (updatedItems.length !== items.length) {
        setError('Some items in your cart are no longer available. Please review your cart and try again.')
        return
      }
    } catch (error) {
      console.warn('Could not refresh inventory, proceeding with current stock levels')
    }

    setLoading(true)
    setError('')

    try {
      // First create the order
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_variant_id: item.variant_id, // CRITICAL: Include variant_id for inventory reduction
        variant_title: item.variant_title,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        material: item.material,
        total: item.price * item.quantity
      }))

      const orderData = {
        items: orderItems,
        shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : getStorePickupAddress({
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          email: shippingAddress.email,
          phone: shippingAddress.phone
        }),
        billingAddress: billingIsSame || deliveryMethod === 'pickup' ? 
          (deliveryMethod === 'shipping' ? shippingAddress : getStorePickupAddress({
            first_name: shippingAddress.first_name,
            last_name: shippingAddress.last_name,
            email: shippingAddress.email,
            phone: shippingAddress.phone
          })) : billingAddress,
        email: shippingAddress.email,
        deliveryMethod,
        pickupDate: deliveryMethod === 'pickup' ? pickupDate : null,
        pickupTime: deliveryMethod === 'pickup' ? pickupTime : null,
        customerPhone: shippingAddress.phone,
        specialInstructions: null,
        promotion: appliedPromo ? {
          id: appliedPromo.id,
          code: appliedPromo.code,
          discount_percent: appliedPromo.discount_percent,
          discount_amount: promoDiscount
        } : null,
        subtotal: getSubtotal(),
        tax_amount: getTaxAmount(),
        shipping_amount: getShippingAmount(),
        discount_amount: promoDiscount,
        total: getTotal()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      console.log('📝 Order API response:', { status: response.status, result })

      if (!response.ok) {
        console.error('❌ Order creation failed:', result)
        
        // Handle stock validation errors with detailed feedback
        if (result.error === 'Stock validation failed' && result.details) {
          const errorMessage = 'Stock validation failed:\n\n' + result.details.join('\n')
          throw new Error(errorMessage)
        }
        
        throw new Error(result.error || 'Failed to create order')
      }

      console.log('✅ Order created successfully, now initializing payment simulation:', result)

      // Initialize payment simulation
      const total = getTotal()
      console.log('💳 Initializing payment simulation:', {
        email: shippingAddress.email,
        amount: Math.round(total * 100),
        orderId: result.id
      })

      // Call the payment simulation API
      const paymentResponse = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shippingAddress.email,
          amount: Math.round(total * 100),
          metadata: {
            orderId: result.id,
            orderNumber: result.order_number
          }
        })
      })

      const paymentResult = await paymentResponse.json()
      
      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to initialize payment')
      }

      // Redirect to confirm payment page
      const confirmUrl = paymentResult.data.authorization_url
      window.location.href = confirmUrl

    } catch (error: any) {
      console.error('💥 Payment confirmation error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      })
      setError(error.message || 'Failed to initialize payment. Please try again.')
      setLoading(false)
    }
  }

  const handleTestPayment = async () => {
    console.log('🧪 Starting test payment process')
    
    if (items.length === 0) {
      setError('Your cart is empty. Please add items before checkout.')
      return
    }

    if (!validateForm()) {
      return
    }

    // Validate promotion code before proceeding
    try {
      await validatePromoBeforePayment();
    } catch (error: any) {
      setError(error.message || 'Promotion code validation failed');
      setPromoDiscount(0);
      setAppliedPromo(null);
      return;
    }

    // Refresh inventory to ensure stock is still available
    try {
      const { refreshInventory } = useCartStore.getState()
      await refreshInventory()
      
      // Check if any items were removed due to insufficient stock
      const updatedItems = useCartStore.getState().items
      if (updatedItems.length !== items.length) {
        setError('Some items in your cart are no longer available. Please review your cart and try again.')
        return
      }
    } catch (error) {
      console.warn('Could not refresh inventory, proceeding with current stock levels')
    }

    setLoading(true)
    setError('')

    try {
      // Create order first
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_variant_id: item.variant_id, // CRITICAL: Include variant_id for inventory reduction
        variant_title: item.variant_title,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        material: item.material,
        total: item.price * item.quantity
      }))

      const orderData = {
        items: orderItems,
        shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : getStorePickupAddress({
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          email: shippingAddress.email,
          phone: shippingAddress.phone
        }),
        billingAddress: billingIsSame || deliveryMethod === 'pickup' ? 
          (deliveryMethod === 'shipping' ? shippingAddress : getStorePickupAddress({
            first_name: shippingAddress.first_name,
            last_name: shippingAddress.last_name,
            email: shippingAddress.email,
            phone: shippingAddress.phone
          })) : billingAddress,
        email: shippingAddress.email,
        deliveryMethod,
        pickupDate: deliveryMethod === 'pickup' ? pickupDate : null,
        pickupTime: deliveryMethod === 'pickup' ? pickupTime : null,
        customerPhone: shippingAddress.phone,
        specialInstructions: null,
        promotion: appliedPromo ? {
          id: appliedPromo.id,
          code: appliedPromo.code,
          discount_percent: appliedPromo.discount_percent,
          discount_amount: promoDiscount
        } : null,
        subtotal: getSubtotal(),
        tax_amount: getTaxAmount(),
        shipping_amount: getShippingAmount(),
        discount_amount: promoDiscount,
        total: getTotal()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      console.log('📝 Test Order API response:', { status: response.status, result })

      if (!response.ok) {
        // Handle stock validation errors with detailed feedback
        if (result.error === 'Stock validation failed' && result.details) {
          const errorMessage = 'Stock validation failed:\n\n' + result.details.join('\n')
          throw new Error(errorMessage)
        }
        
        throw new Error(result.error || 'Failed to create order')
      }

      console.log('✅ Test order created successfully:', result)

      // Simulate successful payment
      const testPaymentReference = `TEST_${Date.now()}`
      await handlePaymentSuccess(testPaymentReference, result, true) // true = isTestPayment

    } catch (error: any) {
      console.error('💥 Test checkout error:', error)
      setError(error.message || 'Failed to process test order.')
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentReference: string, order: any, isTestPayment: boolean = false) => {
    try {
      console.log('🔍 Verifying payment:', paymentReference, 'isTest:', isTestPayment)
      
      let verifyResult
      
      if (isTestPayment) {
        // Skip Paystack verification for test payments
        console.log('🧪 Using test payment - skipping Paystack verification')
        verifyResult = { success: true }
      } else {
        // Verify real payment with Paystack API
        const verifyResponse = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: paymentReference })
        })

        verifyResult = await verifyResponse.json()
        
        if (!verifyResponse.ok || !verifyResult.success) {
          throw new Error(verifyResult.error || 'Payment verification failed')
        }
      }

      console.log('✅ Payment verified successfully')

      // Update order with payment details
      console.log('🔄 Updating order payment status for order:', order.id)
      const paymentUpdate = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          payment_method: isTestPayment ? 'Test Payment' : 'Paystack',
          payment_reference: paymentReference,
          status: 'confirmed' // Keep as confirmed after payment
        })
        .eq('id', order.id)
        .select() // Add select to see the updated data

      console.log('💳 Payment update result:', paymentUpdate)

      if (paymentUpdate.error) {
        console.error('❌ Payment update failed:', paymentUpdate.error)
        throw new Error(`Failed to update payment status: ${paymentUpdate.error.message}`)
      } else {
        console.log('✅ Payment status updated successfully:', paymentUpdate.data)
      }

      // 🔥 NEW: Create notification for payment received
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_received',
            orderNumber: order.order_number,
            orderId: order.id,
            amount: order.total
          })
        })
        console.log('✅ Payment notification created')
      } catch (notificationError) {
        console.error('❌ Failed to create payment notification:', notificationError)
        // Don't fail the payment success for notification errors
      }

      // 🔥 NEW: Fire webhook after successful payment
      console.log('🌐 Checkout - Firing webhook for successful payment...')
      try {
        // Fetch order items from database for complete order information
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            product_id,
            product_variant_id,
            title,
            variant_title,
            sku,
            quantity,
            price,
            total,
            size,
            color,
            material
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.warn('⚠️ Could not fetch order items for webhook:', itemsError)
        }

        const webhookData = {
          order_id: order.id,
          order_number: order.order_number,
          customer_email: order.email,
          customer_phone: order.customer_phone,
          total_amount: order.total,
          currency: order.currency,
          status: order.status,
          payment_status: 'paid',
          payment_method: isTestPayment ? 'Test Payment' : 'Paystack',
          payment_reference: paymentReference,
          delivery_method: order.delivery_method,
          items: orderItems || items, // Use database items if available, fallback to cart items
          shipping_address: order.shipping_address,
          billing_address: order.billing_address,
          created_at: order.created_at,
          paid_at: new Date().toISOString(),
          webhook_type: 'payment_successful',
          is_test_payment: isTestPayment
        }

        const webhookResponse = await fetch('https://n8n.srv942568.hstgr.cloud/webhook-test/54af3979-4f0b-4213-9e94-7b521050e369', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        })

        if (webhookResponse.ok) {
          console.log('✅ Checkout - Webhook fired successfully after payment')
        } else {
          console.warn('⚠️ Checkout - Webhook failed:', webhookResponse.status, webhookResponse.statusText)
        }
      } catch (webhookError) {
        console.error('❌ Checkout - Webhook error:', webhookError)
        // Don't fail the payment success for webhook errors
      }

      // Save address if user requested it and is logged in
      console.log('💾 Save address checkbox checked:', saveAddress)
      console.log('👤 Current user:', user?.email || 'Not logged in')
      
      if (saveAddress && user) {
        console.log('💾 Starting address save process for logged in user...')
        try {
          if (deliveryMethod === 'shipping') {
            // Check if similar address already exists to avoid duplicates
            const { data: existingAddresses } = await supabase
              .from('addresses')
              .select('*')
              .eq('user_id', user.id)
              .eq('address_line_1', shippingAddress.address_line_1)
              .eq('city', shippingAddress.city)
              .eq('postal_code', shippingAddress.postal_code)

            if (existingAddresses && existingAddresses.length > 0) {
              console.log('ℹ️ Similar address already exists, skipping save')
            } else {
              // Save full shipping address
              const { data: addressResult, error: addressError } = await supabase
                .from('addresses')
                .insert({
                  user_id: user.id,
                  type: 'shipping',
                  is_default: false,
                  first_name: shippingAddress.first_name,
                  last_name: shippingAddress.last_name,
                  address_line_1: shippingAddress.address_line_1,
                  address_line_2: shippingAddress.address_line_2 || null,
                  city: shippingAddress.city,
                  state: shippingAddress.state,
                  postal_code: shippingAddress.postal_code,
                  country: shippingAddress.country,
                  phone: shippingAddress.phone || null
                })
                .select()

              if (addressError) {
                console.error('❌ Error saving shipping address:', addressError)
              } else {
                console.log('✅ Shipping address saved successfully:', addressResult)
              }
            }
          } else {
            // For pickup orders, save contact info if it doesn't exist
            const { data: existingContacts } = await supabase
              .from('addresses')
              .select('*')
              .eq('user_id', user.id)
              .eq('first_name', shippingAddress.first_name)
              .eq('last_name', shippingAddress.last_name)
              .eq('phone', shippingAddress.phone)

            if (existingContacts && existingContacts.length > 0) {
              console.log('ℹ️ Similar contact info already exists, skipping save')
            } else {
              // Save contact info for pickup orders
              const { data: addressResult, error: addressError } = await supabase
                .from('addresses')
                .insert({
                  user_id: user.id,
                  type: 'both',
                  is_default: false,
                  first_name: shippingAddress.first_name,
                  last_name: shippingAddress.last_name,
                  address_line_1: STORE_CONTACT_ADDRESS.address_line_1,
                  city: STORE_CONTACT_ADDRESS.city,
                  state: STORE_CONTACT_ADDRESS.state,
                  postal_code: STORE_CONTACT_ADDRESS.postal_code,
                  country: STORE_CONTACT_ADDRESS.country,
                  phone: shippingAddress.phone || null
                })
                .select()

              if (addressError) {
                console.error('❌ Error saving contact info:', addressError)
              } else {
                console.log('✅ Contact info saved successfully:', addressResult)
              }
            }
          }
        } catch (addressError) {
          console.error('❌ Error saving address (non-blocking):', addressError)
          // Don't block checkout if address saving fails
        }
      } else if (saveAddress && !user) {
        console.log('⚠️ Address save requested but user not logged in - skipping')
      } else {
        console.log('⏭️ Address save skipped - checkbox not checked')
      }

      // Record promotion usage after successful payment
      if (appliedPromo && user) {
        console.log('📝 Recording promotion usage after successful payment')
        try {
          // Try to use database function first
          const { error: usageError } = await supabase
            .rpc('record_promotion_usage', {
              p_promotion_id: appliedPromo.id,
              p_user_id: user.id,
              p_order_id: order.id
            })

          if (usageError) {
            console.warn('⚠️ Database function not available, using manual promotion usage recording')
            // Fallback: manually record promotion usage
            const { error: manualUsageError } = await supabase
              .from('promotion_usage')
              .insert({
                promotion_id: appliedPromo.id,
                user_id: user.id,
                order_id: order.id
              })

            if (manualUsageError) {
              console.error('❌ Failed to record promotion usage manually:', manualUsageError)
              // Don't block the checkout process if this fails
            } else {
              console.log('✅ Promotion usage recorded successfully using manual method')
            }
          } else {
            console.log('✅ Promotion usage recorded successfully using database function')
          }
        } catch (error) {
          console.error('❌ Error recording promotion usage:', error)
          // Don't block the checkout process if this fails
        }
      }

      // Build thank you page URL first
      const thankYouParams = new URLSearchParams({
        order: order.order_number,
        email: shippingAddress.email,
        delivery: deliveryMethod,
        payment: paymentReference
      })

      if (deliveryMethod === 'pickup' && pickupDate && pickupTime) {
        const pickupDetails = {
          date: pickupDate,
          time: pickupTime
        }
        thankYouParams.append('pickup', JSON.stringify(pickupDetails))
      }

      const redirectUrl = `/thank-you?${thankYouParams.toString()}`
      console.log('🔄 Preparing redirect to thank you page:', redirectUrl)
      console.log('📦 Order result:', order)
      
      // Set a flag to prevent cart redirects
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('checkout_completed', 'true')
        sessionStorage.setItem('redirect_to_thank_you', redirectUrl)
      }
      
      // Clear cart AFTER preparing redirect URL
      console.log('🧹 Clearing cart...')
      clearCart()
      console.log('✅ Cart cleared')

      // Force redirect immediately with multiple methods
      console.log('🚀 Starting redirect process...')
      
      // Method 1: Use window.location.replace for immediate redirect
      try {
        window.location.replace(redirectUrl)
        console.log('✅ Window.location.replace redirect initiated')
      } catch (redirectError) {
        console.warn('⚠️ Window.location.replace failed, trying router.push:', redirectError)
        
        // Method 2: Try router.push
        try {
          router.push(redirectUrl)
          console.log('✅ Router.push redirect initiated')
        } catch (routerError) {
          console.warn('⚠️ Router.push failed, using window.location.href:', routerError)
          
          // Method 3: Fallback to window.location.href
          window.location.href = redirectUrl
        }
      }
      
      // Method 4: Final backup redirect after a short delay
      setTimeout(() => {
        if (window.location.pathname !== '/thank-you') {
          console.log('🔄 Final backup redirect triggered')
          window.location.href = redirectUrl
        }
      }, 500)

    } catch (error: any) {
      console.error('💥 Payment verification error:', error)
      
      // Even if payment verification fails, try to redirect to thank you page
      // since the order was already created successfully
      if (order && order.order_number) {
        console.log('🔄 Payment verification failed, but order was created. Attempting redirect...')
        
        const thankYouParams = new URLSearchParams({
          order: order.order_number,
          email: shippingAddress.email,
          delivery: deliveryMethod,
          payment: 'pending' // Mark as pending since verification failed
        })

        const redirectUrl = `/thank-you?${thankYouParams.toString()}`
        console.log('🔄 Redirecting despite payment verification error:', redirectUrl)
        
        try {
          router.push(redirectUrl)
        } catch (redirectError) {
          console.warn('⚠️ Router redirect failed, using window.location:', redirectError)
          window.location.href = redirectUrl
        }
      } else {
        setError(error.message || 'Payment verification failed')
      }
    } finally {
      console.log('🏁 Payment process completed')
      setLoading(false)
    }
  }

  // Generate pickup dates (next 7 days, excluding Sundays)
  const getPickupDates = () => {
    const dates = []
    const today = new Date()
    let count = 0
    let currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + 1) // Start from tomorrow

    while (count < 7) {
      if (currentDate.getDay() !== 0) { // Exclude Sundays
        dates.push({
          value: currentDate.toISOString().split('T')[0],
          label: currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        })
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  // Pickup time slots
  const pickupTimeSlots = [
    { value: '09:00', label: '9:00 AM - 10:00 AM' },
    { value: '10:00', label: '10:00 AM - 11:00 AM' },
    { value: '11:00', label: '11:00 AM - 12:00 PM' },
    { value: '12:00', label: '12:00 PM - 1:00 PM' },
    { value: '14:00', label: '2:00 PM - 3:00 PM' },
    { value: '15:00', label: '3:00 PM - 4:00 PM' },
    { value: '16:00', label: '4:00 PM - 5:00 PM' },
    { value: '17:00', label: '5:00 PM - 6:00 PM' },
  ]

  // Check if address is complete enough to calculate shipping
  const isAddressComplete = () => {
    if (deliveryMethod === 'pickup') return true
    return shippingAddress.city && shippingAddress.state && shippingAddress.country
  }

  // Calculate shipping based on address (this should be done after address input)
  const getShippingAmount = () => {
    if (deliveryMethod === 'pickup' || !isAddressComplete()) return 0
    const subtotal = getSubtotal()
    // Free shipping for orders over 50,000 Naira
    return subtotal >= 50000 ? 0 : 5000
  }

  const getTotal = () => {
    const subtotal = getSubtotal()
    const tax = getTaxAmount()
    const shipping = getShippingAmount()
    const discount = promoDiscount
    return subtotal + tax + shipping - discount
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code.');
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.error('Please log in to apply promo codes.');
      return;
    }
    
    setIsApplyingPromo(true);
    console.log('[Promo] Attempting to apply promo code:', promoCode);
    
    try {
      // First check if the promo code exists using a simple query
      const { data: promo, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .single();

      console.log('[Promo] Query result:', { promo, error: promoError });

      // Handle different types of errors
      if (promoError) {
        if (promoError.code === 'PGRST116') {
          // No rows found
          toast.error('This promotion code is not valid.');
          return;
        } else if (promoError.code === '42501') {
          // Permission denied - fallback to manual promo codes
          console.log('[Promo] Database access denied, using fallback promo codes');
          handleFallbackPromo();
          return;
        } else {
          console.error('[Promo] Database error:', promoError);
          toast.error('Error validating promotion code. Please try again.');
          return;
        }
      }

      if (!promo) {
        toast.error('This promotion code is not valid.');
        return;
      }

      // Check if promo is active
      if (!promo.is_active) {
        toast.error('This promotion code is no longer active.');
        return;
      }

             // Check if promo is within valid date range
       const now = new Date();
       if (now < new Date(promo.valid_from) || now > new Date(promo.valid_until)) {
         toast.error('This promotion code has expired.');
         return;
       }

      // Check if user has reached their personal usage limit for this promo
      try {
        const { data: userUsageData, error: usageError } = await supabase
          .from('promotion_usage')
          .select('*')
          .eq('promotion_id', promo.id)
          .eq('user_id', user.id);

        if (usageError && usageError.code !== '42501') {
          console.error('[Promo] Usage check error:', usageError);
          // Continue anyway if there's a database error
        }

        const userUsageCount = userUsageData ? userUsageData.length : 0;
        
        if (userUsageCount >= promo.usage_limit) {
          toast.error(`You have already used this promotion code ${promo.usage_limit} time(s).`);
          return;
        }
      } catch (usageError) {
        console.log('[Promo] Could not check usage history, proceeding anyway');
        // Allow the promo to be applied if we can't check usage history
      }

      // Apply the discount
      const currentSubtotal = getSubtotal();
      if (currentSubtotal <= 0) {
        toast.error('Cannot apply discount to an empty cart.');
        return;
      }

      const discountAmount = (currentSubtotal * promo.discount_percent) / 100;
      setPromoDiscount(discountAmount);
      setAppliedPromo(promo);
      
      console.log('[Promo] Discount applied:', {
        subtotal: currentSubtotal,
        discountPercent: promo.discount_percent,
        discountAmount: discountAmount
      });
      
      toast.success(`${promo.discount_percent}% discount applied! You saved ₦${discountAmount.toLocaleString()}`);
      
    } catch (error) {
      console.error('[Promo] Unexpected error:', error);
      toast.error('Failed to apply promotion code. Please try again.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

     // Fallback function for manual promo codes when database is not accessible
   const handleFallbackPromo = () => {
     const currentSubtotal = getSubtotal();
     if (currentSubtotal <= 0) {
       toast.error('Cannot apply discount to an empty cart.');
       return;
     }

     // Define some fallback promo codes
     const fallbackPromos: { [key: string]: { discount: number; description: string } } = {
       'WELCOME10': { discount: 10, description: 'Welcome Discount' },
       'SAVE15': { discount: 15, description: 'Save 15%' },
       'NEWCUSTOMER': { discount: 20, description: 'New Customer Discount' }
     };

     const promoUpper = promoCode.toUpperCase();
     const fallbackPromo = fallbackPromos[promoUpper];

     if (fallbackPromo) {
       const discountAmount = (currentSubtotal * fallbackPromo.discount) / 100;
       setPromoDiscount(discountAmount);
       setAppliedPromo({
         code: promoUpper,
         discount_percent: fallbackPromo.discount,
         description: fallbackPromo.description
       });
       
       toast.success(`${fallbackPromo.discount}% discount applied! You saved ₦${discountAmount.toLocaleString()}`);
     } else {
       toast.error('This promotion code is not valid.');
     }
   };

   // Function to remove applied promo code
   const handleRemovePromo = () => {
     setPromoDiscount(0);
     setAppliedPromo(null);
     setPromoCode('');
     toast.success('Promo code removed.');
   };

  // Prevent rendering on server
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-black" />
              </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing checkout</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-32 right-32 w-24 h-24 bg-black/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 right-20 w-16 h-16 bg-yellow-400/30 rounded-full blur-lg"
        />
      </div>

      {/* Floating Cart Button */}
      <CartButton variant="floating" size="lg" />

      <div className="relative z-10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-start mb-8"
            >
              <Link 
                href="/cart"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Cart
              </Link>
            </motion.div>

            {/* Brand Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-full mb-8 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Favorite Things</span>
              <Sparkles className="w-4 h-4" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6"
            >
              Checkout
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              Complete your purchase with secure payment
            </motion.p>
          </motion.div>

          {/* Main Checkout Content */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Checkout Form */}
            <div className="space-y-8">
              {/* Promo Code Section - Mobile First */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="lg:hidden bg-white rounded-3xl shadow-xl border border-yellow-200 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Promo Code</h2>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter promo code"
                  />
                  <motion.button
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoCode.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-6 py-3 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplyingPromo ? 'Applying...' : 'Apply'}
                  </motion.button>
                </div>
                
                {appliedPromo && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-green-800">
                        {appliedPromo.description} - {appliedPromo.discount_percent}% off
                      </span>
                      <button
                        onClick={handleRemovePromo}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Order Summary - Mobile */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="lg:hidden bg-white rounded-3xl shadow-xl border border-yellow-200 p-6"
              >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Summary</h2>

            {/* Items */}
            <div className="space-y-4 mb-6 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 group">
                  <div className="relative w-12 h-12 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    {item.featured_image && getProductImage(item.featured_image, []) ? (
                      <Image
                        src={item.featured_image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all duration-200 p-1"
                      title="Remove item"
                    >
                          <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

                {/* Mobile Summary */}
                <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                <span>₦{getSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                    <span>Tax</span>
                <span>₦{getTaxAmount().toLocaleString()}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₦{promoDiscount.toLocaleString()}</span>
                </div>
              )}
                  <div className="flex justify-between font-semibold text-lg mt-2">
                  <span>Total</span>
                    <span>₦{getTotal().toLocaleString()}</span>
                </div>
              </div>
              </motion.div>

              {/* Shipping Information */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white rounded-3xl shadow-xl border border-yellow-200 p-8"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                
                {/* Delivery Method */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button
                      onClick={() => setDeliveryMethod('shipping')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                    deliveryMethod === 'shipping' 
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                        <Truck className="w-6 h-6 text-yellow-500" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Home Delivery</p>
                          <p className="text-sm text-gray-600">3-5 business days</p>
                    </div>
                    </div>
                    </motion.button>

                    <motion.button
                      onClick={() => setDeliveryMethod('pickup')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                    deliveryMethod === 'pickup' 
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                        <MapPin className="w-6 h-6 text-yellow-500" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Store Pickup</p>
                          <p className="text-sm text-gray-600">Same day pickup</p>
                    </div>
                    </div>
                    </motion.button>
                </div>
              </div>

                {/* Saved Addresses Selection */}
                {user && savedAddresses.length > 0 && deliveryMethod === 'shipping' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Addresses</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="new-address"
                          name="address-selection"
                          value=""
                          checked={selectedAddressId === ''}
                          onChange={(e) => handleAddressSelection(e.target.value)}
                          className="w-4 h-4 text-yellow-400 border-gray-300 focus:ring-yellow-400"
                        />
                        <label htmlFor="new-address" className="text-sm text-gray-700">
                          Enter new address
                        </label>
                      </div>
                      
                      {/* Default Address - Always Visible */}
                      {savedAddresses.filter(addr => addr.is_default).map((address) => (
                        <div key={address.id} className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={`address-${address.id}`}
                            name="address-selection"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={(e) => handleAddressSelection(e.target.value)}
                            className="w-4 h-4 text-yellow-400 border-gray-300 focus:ring-yellow-400 mt-1"
                          />
                          <label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {address.first_name} {address.last_name}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-full">
                                  Default
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {address.address_line_1}
                                {address.address_line_2 && (
                                  <div>{address.address_line_2}</div>
                                )}
                                <div>{address.city}, {address.state} {address.postal_code}</div>
                                <div>{address.country}</div>
                                {address.phone && <div>{address.phone}</div>}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                      
                      {/* Other Addresses - Collapsible */}
                      {savedAddresses.filter(addr => !addr.is_default).length > 0 && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowOtherAddresses(!showOtherAddresses)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              Other Saved Addresses ({savedAddresses.filter(addr => !addr.is_default).length})
                            </span>
                            {showOtherAddresses ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          
                          {showOtherAddresses && (
                            <div className="p-4 space-y-3 bg-white">
                              {savedAddresses.filter(addr => !addr.is_default).map((address) => (
                                <div key={address.id} className="flex items-start space-x-3">
                                  <input
                                    type="radio"
                                    id={`address-${address.id}`}
                                    name="address-selection"
                                    value={address.id}
                                    checked={selectedAddressId === address.id}
                                    onChange={(e) => handleAddressSelection(e.target.value)}
                                    className="w-4 h-4 text-yellow-400 border-gray-300 focus:ring-yellow-400 mt-1"
                                  />
                                  <label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                                    <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {address.first_name} {address.last_name}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        {address.address_line_1}
                                        {address.address_line_2 && (
                                          <div>{address.address_line_2}</div>
                                        )}
                                        <div>{address.city}, {address.state} {address.postal_code}</div>
                                        <div>{address.country}</div>
                                        {address.phone && <div>{address.phone}</div>}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Address Form */}
                <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                        placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                        placeholder="Last name"
                  />
                    </div>
                </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                  </label>
                  <input
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                        placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                        placeholder="+234 80 1234 5678"
                  />
                </div>
              </div>

            {deliveryMethod === 'shipping' && (
                    <>
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 1
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line_1}
                      onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                          placeholder="Street address"
                    />
                  </div>
                  
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                            placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                            placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                            placeholder="Postal code"
                    />
                  </div>
                      </div>
                    </>
                  )}

                  {/* Save Address Option */}
                  {user && deliveryMethod === 'shipping' && selectedAddressId === '' && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <input
                        type="checkbox"
                        id="save-address"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                      />
                      <label htmlFor="save-address" className="text-sm text-gray-700">
                        Save this address for future orders
                      </label>
                    </div>
                  )}
                  
                  {deliveryMethod === 'pickup' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Pickup Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pickup Date
                    </label>
                    <select
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Select a date</option>
                            {getPickupDates().map((date) => (
                              <option key={date.value} value={date.value}>
                                {date.label}
                              </option>
                            ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pickup Time
                    </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Select a time</option>
                            <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                            <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                            <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                          </select>
                  </div>
                  </div>
                  </div>
                  )}
                  </div>
              </motion.div>

              {/* Payment Section */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white rounded-3xl shadow-xl border border-yellow-200 p-8"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment</h2>
                
                {/* Promo Code */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code (Optional)
                    </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter promo code"
                    />
                    <motion.button
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-6 py-3 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApplyingPromo ? 'Applying...' : 'Apply'}
                    </motion.button>
                  </div>
                  {appliedPromo && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800">
                          {appliedPromo.description} - {appliedPromo.discount_percent}% off
                        </span>
                                  <button
                          onClick={handleRemovePromo}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                                  </button>
                              </div>
                        </div>
                    )}
                  </div>

                {/* Payment Button */}
                <motion.button
                  onClick={handleConfirmPayment}
                  disabled={loading || !isAddressComplete()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-4 px-8 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirm Payment - ₦{getTotal().toLocaleString()}
                    </>
                  )}
                </motion.button>

                {/* Error Messages */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}
              </motion.div>
          </div>

          {/* Order Summary - Desktop */}
            <div className="hidden lg:block">
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white rounded-3xl shadow-xl border border-yellow-200 p-8 sticky top-8"
              >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                      {item.featured_image && getProductImage(item.featured_image, []) ? (
                        <Image
                          src={item.featured_image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

                {/* Summary */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₦{getSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold">₦{getTaxAmount().toLocaleString()}</span>
                      </div>
                {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₦{promoDiscount.toLocaleString()}</span>
                  </div>
                )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₦{getTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
              </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}