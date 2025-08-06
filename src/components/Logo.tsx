import Link from 'next/link'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function Logo({ size = 'medium', className = '' }: LogoProps) {
  const sizes = {
    small: 'h-10', // ~40px height for mobile
    medium: 'h-16', // ~64px height for desktop
    large: 'h-20' // ~80px height for larger displays
  }

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <div className={`${sizes[size]} flex flex-col justify-center`}>
        {/* SVG Logo */}
        <svg 
          viewBox="0 0 200 80" 
          className={`${sizes[size]} w-auto`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Decorative circle background */}
          <circle cx="160" cy="40" r="15" fill="#E91E63" opacity="0.1" />
          
          {/* "Favorite" - Main text */}
          <text 
            x="10" 
            y="35" 
            fontFamily="Outfit, sans-serif" 
            fontSize="24" 
            fill="#6A41A1" 
            fontWeight="600"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Favorite
          </text>
          
          {/* "Things" - Secondary text */}
          <text 
            x="10" 
            y="60" 
            fontFamily="Outfit, sans-serif" 
            fontSize="20" 
            fill="#E91E63" 
            fontWeight="500"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Things
          </text>
          
          {/* Decorative sparkle icon */}
          <g transform="translate(150, 25)">
            <path 
              d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" 
              fill="#E91E63" 
              opacity="0.8"
            />
          </g>
        </svg>
      </div>
    </Link>
  )
}

// Alternative pure CSS version for better browser compatibility
export function CSSLogo({ size = 'medium', className = '', withLink = true }: LogoProps & { withLink?: boolean }) {
  const sizeClasses = {
    small: { 
      main: 'text-lg', 
      sub: 'text-sm',
      icon: 'w-4 h-4'
    }, // Mobile - ~40px height
    medium: { 
      main: 'text-2xl', 
      sub: 'text-lg',
      icon: 'w-5 h-5'
    }, // Desktop - ~64px height
    large: { 
      main: 'text-3xl', 
      sub: 'text-xl',
      icon: 'w-6 h-6'
    } // Large screens - ~80px height
  }

  const currentSize = sizeClasses[size]

  const logoContent = (
      <div className="relative flex flex-col justify-center leading-none">
        {/* Main "Favorite" */}
        <div 
          className={`${currentSize.main} font-semibold tracking-wide relative`}
          style={{ 
            fontFamily: 'Outfit, sans-serif',
            color: '#6A41A1',
            textShadow: '0 1px 3px rgba(0,0,0,0.1)',
            lineHeight: '0.9'
          }}
        >
          Favorite
        </div>
        
        {/* "Things" */}
        <div 
          className={`${currentSize.sub} font-medium flex items-center`}
          style={{ 
            fontFamily: 'Outfit, sans-serif',
            color: '#E91E63',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          Things
          {/* Sparkle icon */}
          <svg 
            className={`${currentSize.icon} ml-2`}
            viewBox="0 0 16 16" 
            fill="currentColor"
            style={{ color: '#E91E63' }}
          >
            <path d="M8,0 L9.5,6.5 L16,8 L9.5,9.5 L8,16 L6.5,9.5 L0,8 L6.5,6.5 Z" />
          </svg>
        </div>
      </div>
  )

  if (withLink) {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        {logoContent}
    </Link>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      {logoContent}
    </div>
  )
} 