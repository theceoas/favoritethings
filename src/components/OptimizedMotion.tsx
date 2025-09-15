'use client'

import { motion, MotionProps } from 'framer-motion'
import { useSafariOptimizer } from './SafariOptimizer'
import { forwardRef, HTMLAttributes } from 'react'

interface OptimizedMotionProps extends Omit<MotionProps, 'ref'> {
  children: React.ReactNode
  fallback?: React.ComponentType<any>
  reduceForSafari?: boolean
  disableForLowPerformance?: boolean
  className?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

// Simplified animation variants for Safari
const safariVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

// No animation variants for low performance devices
const noAnimationVariants = {
  initial: {},
  animate: {},
  exit: {},
  hover: {},
  tap: {}
}

const OptimizedMotion = forwardRef<HTMLDivElement, OptimizedMotionProps>((
  { 
    children, 
    fallback: Fallback, 
    reduceForSafari = true, 
    disableForLowPerformance = true,
    initial,
    animate,
    exit,
    whileHover,
    whileTap,
    transition,
    ...props 
  }, 
  ref
) => {
  const { isSafari, isLowPerformance, shouldReduceAnimations } = useSafariOptimizer()

  // If low performance device and we should disable animations
  if (isLowPerformance && disableForLowPerformance) {
    if (Fallback) {
      return <Fallback {...props}>{children}</Fallback>
    }
    const { style, className, ...divProps } = props as any
    return <div {...divProps} ref={ref} style={style as React.CSSProperties} className={className}>{children}</div>
  }

  // If Safari and we should reduce animations
  if (isSafari && reduceForSafari && shouldReduceAnimations) {
    const safariTransition = {
      duration: 0.15,
      ease: 'easeOut' as const,
      ...transition
    }

    return (
      <motion.div
        ref={ref}
        initial={initial || safariVariants.initial}
        animate={animate || safariVariants.animate}
        exit={exit || safariVariants.exit}
        whileHover={whileHover || safariVariants.hover}
        whileTap={whileTap || safariVariants.tap}
        transition={safariTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  // Full animations for other browsers
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  )
})

OptimizedMotion.displayName = 'OptimizedMotion'

// Specific optimized components
export const OptimizedMotionDiv = OptimizedMotion

export const OptimizedMotionButton = forwardRef<HTMLButtonElement, OptimizedMotionProps & { onClick?: () => void }>((
  { children, onClick, ...props }, 
  ref
) => {
  const { isLowPerformance } = useSafariOptimizer()

  if (isLowPerformance) {
    const { className, style, ...buttonProps } = props as any
    return (
      <button 
        ref={ref as any}
        onClick={onClick}
        className={className}
        style={style as React.CSSProperties}
        {...buttonProps}
      >
        {children}
      </button>
    )
  }

  return (
    <motion.button
      ref={ref as any}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.button>
  )
})

OptimizedMotionButton.displayName = 'OptimizedMotionButton'

export const OptimizedMotionCard = forwardRef<HTMLDivElement, OptimizedMotionProps>((
  { children, onClick, onMouseEnter, onMouseLeave, ...props }, 
  ref
) => {
  const { isSafari, isLowPerformance } = useSafariOptimizer()

  if (isLowPerformance) {
    const { style, className, ...divProps } = props as any
    return (
      <div 
        ref={ref} 
        {...divProps} 
        style={style as React.CSSProperties} 
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>
    )
  }

  const cardVariants = isSafari ? {
    hover: { y: -2, scale: 1.01 },
    tap: { scale: 0.99 }
  } : {
    hover: { y: -8, scale: 1.02 },
    tap: { scale: 0.98 }
  }

  return (
    <motion.div
      ref={ref}
      whileHover={cardVariants.hover}
      whileTap={cardVariants.tap}
      transition={{ duration: isSafari ? 0.15 : 0.3 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </motion.div>
  )
})

OptimizedMotionCard.displayName = 'OptimizedMotionCard'

// Hook to get optimized animation settings
export function useOptimizedAnimations() {
  const { isSafari, isLowPerformance, shouldReduceAnimations } = useSafariOptimizer()

  return {
    isSafari,
    isLowPerformance,
    shouldReduceAnimations,
    getTransition: (duration = 0.3) => ({
      duration: shouldReduceAnimations ? Math.min(duration, 0.15) : duration,
      ease: 'easeOut'
    }),
    getVariants: (variants: any) => {
      if (isLowPerformance) return noAnimationVariants
      if (shouldReduceAnimations) return safariVariants
      return variants
    }
  }
}

export default OptimizedMotion