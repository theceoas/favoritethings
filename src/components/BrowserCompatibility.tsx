'use client'

import { useEffect } from 'react'
import { initializeBrowserCompatibility } from '@/lib/utils/browser-compatibility'

export default function BrowserCompatibility() {
  useEffect(() => {
    // Initialize browser compatibility checks
    initializeBrowserCompatibility()
  }, [])

  return null // This component doesn't render anything
}
