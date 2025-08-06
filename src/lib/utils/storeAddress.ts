export const STORE_ADDRESS = {
  address_line_1: 'Plot 2, Rumah Plaza, Euphrates Street, Maitama',
  city: 'Abuja',
  state: 'Federal Capital Territory',
  postal_code: '904101',
  country: 'Nigeria'
}

export const getStorePickupAddress = (customerInfo: {
  first_name: string
  last_name: string
  email: string
  phone: string
}) => {
  return {
    first_name: customerInfo.first_name,
    last_name: customerInfo.last_name,
    email: customerInfo.email,
    phone: customerInfo.phone,
    ...STORE_ADDRESS
  }
}

export const STORE_CONTACT_ADDRESS = {
  address_line_1: 'Store Pickup - Contact Info Only',
  ...STORE_ADDRESS
} 