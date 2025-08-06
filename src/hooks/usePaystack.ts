'use client'

import { useEffect } from 'react'

interface PaystackProps {
  email: string
  amount: number // in kobo (multiply by 100)
  publicKey: string
  currency?: string
  channels?: string[]
  onSuccess: (reference: any) => void
  onClose: () => void
  metadata?: any
}

// Extend window object to include PaystackPop
declare global {
  interface Window {
    PaystackPop: any
  }
}

export const usePaystack = () => {
  useEffect(() => {
    // Check if script is already loaded
    if (window.PaystackPop) {
      console.log('✅ Paystack SDK already loaded')
      return
    }

    // Load Paystack script
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => {
      console.log('✅ Paystack SDK loaded successfully')
    }
    script.onerror = () => {
      console.error('❌ Failed to load Paystack SDK')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup - only remove if we added it
      const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
      if (existingScript && document.head.contains(existingScript)) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  const initializePayment = (config: PaystackProps) => {
    console.log('🚀 Attempting to initialize Paystack payment...')
    
    if (!window.PaystackPop) {
      console.error('❌ Paystack SDK not loaded yet')
      // Try to wait a bit and retry
      setTimeout(() => {
        if (window.PaystackPop) {
          console.log('✅ Paystack SDK loaded after retry')
          initializePayment(config)
        } else {
          console.error('❌ Paystack SDK still not available after retry')
        }
      }, 1000)
      return
    }

    console.log('💳 Setting up Paystack payment with config:', {
      email: config.email,
      amount: config.amount,
      publicKey: config.publicKey.substring(0, 10) + '...'
    })

    try {
      const handler = window.PaystackPop.setup({
        key: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency || 'NGN',
        channels: config.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        callback: function(response: any) {
          console.log('✅ Paystack callback triggered:', response)
          config.onSuccess(response)
        },
        onClose: function() {
          console.log('🚪 Paystack popup closed')
          config.onClose()
        },
        metadata: config.metadata || {}
      })

      console.log('📱 Opening Paystack iframe...')
      handler.openIframe()
    } catch (error) {
      console.error('❌ Error setting up Paystack payment:', error)
    }
  }

  return { initializePayment }
} 