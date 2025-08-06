/**
 * Validates if an image URL is safe to use with Next.js Image component
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  
  const trimmed = url.trim()
  if (trimmed === '') return false
  
  // Block test URLs and invalid domains
  const blockedPatterns = [
    'testurl',
    'test.image',
    'example.com',
    'placeholder',
    'temp',
  ]
  
  const hasBlockedPattern = blockedPatterns.some(pattern => 
    trimmed.toLowerCase().includes(pattern.toLowerCase())
  )
  
  if (hasBlockedPattern) return false
  
  // Must be a valid HTTP/HTTPS URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false
  
  // Basic URL validation
  try {
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}

/**
 * Gets the first valid image URL from an array of URLs
 */
export function getValidImageUrl(urls: (string | null | undefined)[]): string | null {
  for (const url of urls) {
    if (isValidImageUrl(url)) {
      return url!.trim()
    }
  }
  return null
}

/**
 * Gets the best available image for a product
 */
export function getProductImage(featuredImage?: string | null, images?: string[] | null): string | null {
  const candidates = [
    featuredImage,
    ...(images || [])
  ]
  
  return getValidImageUrl(candidates)
} 