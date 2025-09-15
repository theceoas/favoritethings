'use client'

import { useState, useEffect } from 'react'

interface PaystackConfig {
  email: string
  amount: number
  metadata?: any
  onSuccess: (transaction: any) => void
  onClose: () => void
}

interface PaystackPopup {
  resumeTransaction: (accessCode: string) => void
}

declare global {
  interface Window {
    PaystackPop?: any
  }
}

export const usePaystack = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Paystack script is already loaded
    if (window.PaystackPop) {
      setIsLoaded(true)
      return
    }

    // Load Paystack script
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
      setError(null)
    }
    script.onerror = () => {
      setError('Failed to load Paystack script')
      setIsLoaded(false)
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const initializePayment = async (config: PaystackConfig) => {
    if (!isLoaded) {
      throw new Error('Paystack script not loaded')
    }

    if (!window.PaystackPop) {
      throw new Error('PaystackPop not available')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Initialize transaction on backend
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: config.email,
          amount: config.amount,
          metadata: config.metadata
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to initialize payment')
      }

      // Create Paystack popup instance
      const popup = new window.PaystackPop()

      // Resume transaction with access code
      popup.resumeTransaction(result.data.access_code)

      // Set up event handlers
      popup.onSuccess = (transaction: any) => {
        setIsLoading(false)
        config.onSuccess(transaction)
      }

      popup.onClose = () => {
        setIsLoading(false)
        config.onClose()
      }

      popup.onError = (error: any) => {
        setIsLoading(false)
        setError(error.message || 'Payment failed')
        config.onClose()
      }

    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || 'Payment initialization failed')
      throw err
    }
  }

  return {
    isLoaded,
    isLoading,
    error,
    initializePayment
  }
}