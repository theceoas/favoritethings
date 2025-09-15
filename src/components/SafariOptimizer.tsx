'use client'

import { useEffect, useState } from 'react'
import { detectBrowser } from '@/lib/utils/browser-compatibility'

interface SafariOptimizerProps {
  children: React.ReactNode
  reduceAnimations?: boolean
  disableComplexEffects?: boolean
}

export default function SafariOptimizer({ 
  children, 
  reduceAnimations = true, 
  disableComplexEffects = true 
}: SafariOptimizerProps) {
  const [isSafari, setIsSafari] = useState(false)
  const [isLowPerformance, setIsLowPerformance] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const browserInfo = detectBrowser()
    const safariDetected = browserInfo.name === 'Safari'
    setIsSafari(safariDetected)

    // Enhanced performance checking for Safari
    const checkPerformance = () => {
      // Check if device has limited memory or processing power
      const connection = (navigator as any).connection
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      const deviceMemory = (navigator as any).deviceMemory || 4

      const isLowEnd = hardwareConcurrency <= 2 || deviceMemory <= 2
      const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')
      
      // Safari-specific performance checks
      const safariVersion = parseFloat(browserInfo.version)
      const isOldSafari = safariDetected && safariVersion < 14
      
      setIsLowPerformance(isLowEnd || isSlowConnection || isOldSafari || false)
    }

    checkPerformance()

    // Enhanced Safari-specific optimizations
    if (safariDetected) {
      // Reduce motion for Safari users if they prefer it
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      if (prefersReducedMotion || reduceAnimations) {
        document.documentElement.style.setProperty('--animation-duration', '0.05s')
        document.documentElement.style.setProperty('--transition-duration', '0.05s')
      }

      // Disable complex CSS effects that Safari handles poorly
      if (disableComplexEffects) {
        document.documentElement.classList.add('safari-optimized')
      }

      // Add Safari-specific CSS class (if not already added by browser-compatibility)
      if (!document.documentElement.classList.contains('is-safari')) {
        document.documentElement.classList.add('is-safari')
      }
      
      // Force hardware acceleration for better performance
      document.documentElement.style.setProperty('-webkit-transform', 'translateZ(0)')
      
      console.log('🍎 Safari detected - Enhanced performance optimizations applied')
    }

    // Low performance device optimizations
    checkPerformance()
    if (isLowPerformance) {
      document.documentElement.classList.add('low-performance')
      console.log('⚡ Low performance device detected - Optimizations applied')
    }

  }, [])

  // Provide context to child components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__safariOptimizer = {
        isSafari,
        isLowPerformance,
        shouldReduceAnimations: isSafari && reduceAnimations,
        shouldDisableComplexEffects: isSafari && disableComplexEffects
      }
    }
  }, [isSafari, isLowPerformance, reduceAnimations, disableComplexEffects])

  return (
    <>
      {children}
      {/* Add Safari-specific styles */}
      {isSafari && (
        <style jsx global>{`
          .is-safari {
            /* Reduce transform3d usage that can cause issues in Safari */
            --webkit-transform: translateZ(0);
          }
          
          .safari-optimized .motion-reduce {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          .safari-optimized [data-framer-motion] {
            /* Reduce complex animations for Safari */
            will-change: auto !important;
          }
          
          .safari-optimized button {
            /* Improve button responsiveness in Safari */
            -webkit-appearance: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            cursor: pointer;
          }
          
          .safari-optimized button:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }
          
          .low-performance * {
            /* Disable expensive effects on low-end devices */
            backdrop-filter: none !important;
            filter: none !important;
            box-shadow: none !important;
            transform: none !important;
          }
          
          .low-performance .motion-reduce {
            animation: none !important;
            transition: none !important;
          }
          
          .low-performance button {
            /* Simplified buttons for low performance */
            transition: none !important;
            transform: none !important;
          }
        `}</style>
      )}
    </>
  )
}

// Hook for components to check Safari optimization status
export function useSafariOptimizer() {
  const [optimizerState, setOptimizerState] = useState({
    isSafari: false,
    isLowPerformance: false,
    shouldReduceAnimations: false,
    shouldDisableComplexEffects: false
  })

  useEffect(() => {
    const checkOptimizer = () => {
      const state = (window as any).__safariOptimizer
      if (state) {
        setOptimizerState(state)
      }
    }

    checkOptimizer()
    
    // Check periodically in case it's not ready immediately
    const interval = setInterval(checkOptimizer, 100)
    
    return () => clearInterval(interval)
  }, [])

  return optimizerState
}