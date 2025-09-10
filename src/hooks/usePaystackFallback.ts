'use client'

import { useEffect, useState } from 'react'

// Extend window object to include PaystackPop
declare global {
  interface Window {
    PaystackPop: any
  }
}

interface PaystackProps {
  email: string
  amount: number
  publicKey: string
  currency?: string
  channels?: string[]
  onSuccess: (reference: any) => void
  onClose: () => void
  metadata?: any
}

export const usePaystackFallback = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return

    // Check if script is already loaded
    if (window.PaystackPop) {
      setIsScriptLoaded(true)
      return
    }

    // Create script element with better error handling
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    
    // Add timeout for script loading
    const timeout = setTimeout(() => {
      if (!window.PaystackPop) {
        setScriptError('Paystack script failed to load within timeout')
        console.error('❌ Paystack script loading timeout')
      }
    }, 10000) // 10 second timeout

    script.onload = () => {
      clearTimeout(timeout)
      setIsScriptLoaded(true)
      setScriptError(null)
      console.log('✅ Paystack SDK loaded successfully')
    }
    
    script.onerror = (error) => {
      clearTimeout(timeout)
      setScriptError('Failed to load Paystack SDK')
      console.error('❌ Failed to load Paystack SDK:', error)
    }

    // Add script to head
    document.head.appendChild(script)

    return () => {
      clearTimeout(timeout)
      // Cleanup - only remove if we added it
      const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
      if (existingScript && document.head.contains(existingScript)) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  const initializePayment = (config: PaystackProps) => {
    console.log('🚀 Attempting to initialize Paystack payment...')
    
    if (scriptError) {
      console.error('❌ Paystack script failed to load:', scriptError)
      alert('Payment system is currently unavailable. Please try again later or contact support.')
      return
    }
    
    if (!isScriptLoaded || !window.PaystackPop) {
      console.error('❌ Paystack SDK not loaded yet')
      // Try to wait a bit and retry
      setTimeout(() => {
        if (window.PaystackPop) {
          console.log('✅ Paystack SDK loaded after retry')
          initializePayment(config)
        } else {
          console.error('❌ Paystack SDK still not available after retry')
          alert('Payment system is currently unavailable. Please try again later or contact support.')
        }
      }, 2000) // Increased retry time
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
      alert('Payment initialization failed. Please try again or contact support.')
    }
  }

  return { 
    initializePayment, 
    isScriptLoaded, 
    scriptError 
  }
}
