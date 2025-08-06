export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(price)
}

// Helper function for formatting without currency symbol (for calculations)
export const formatPriceNumber = (price: number): string => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
} 