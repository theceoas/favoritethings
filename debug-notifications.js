// Debug script for notifications - paste this in browser console
// Make sure you're on the admin page when running this

const debugNotifications = async () => {
  console.log('🔍 DEBUG: Checking notification state...')
  
  try {
    // Try to access the global Supabase client if available
    const supabaseModule = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = supabaseModule.createClient(
      'https://your-project.supabase.co', // Replace with your URL
      'your-anon-key' // Replace with your anon key
    )
    
    // Check current notifications
    console.log('1. Fetching all notifications...')
    const { data: allNotifications, error: allError } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('Error fetching notifications:', allError)
      return
    }
    
    console.log('All notifications:', allNotifications)
    
    // Check unread count
    const unreadCount = allNotifications.filter(n => !n.is_read).length
    console.log(`Unread count: ${unreadCount}`)
    
    // Check what's in the DOM
    const bellButton = document.querySelector('[data-testid="notification-bell"]') || 
                      document.querySelector('button[aria-label*="notification"]') ||
                      document.querySelector('button:has(.lucide-bell)')
    
    if (bellButton) {
      console.log('Bell button found:', bellButton)
      const badge = bellButton.querySelector('.bg-red-500') || bellButton.querySelector('[class*="red"]')
      if (badge) {
        console.log('Red badge found:', badge.textContent)
      } else {
        console.log('No red badge found')
      }
    } else {
      console.log('Bell button not found')
    }
    
    return { allNotifications, unreadCount }
    
  } catch (error) {
    console.error('Debug failed:', error)
  }
}

// Function to manually trigger mark all as read
const manualMarkAllAsRead = async () => {
  console.log('🔄 Manually marking all as read...')
  
  try {
    const response = await fetch('/api/notifications/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('API response:', result)
    
    if (response.ok) {
      console.log('✅ API call successful')
      // Wait a bit then check state
      setTimeout(debugNotifications, 2000)
    } else {
      console.error('❌ API call failed:', result)
    }
    
  } catch (error) {
    console.error('❌ Manual mark all as read failed:', error)
  }
}

// Run initial debug
debugNotifications()

// Make functions available globally
window.debugNotifications = debugNotifications
window.manualMarkAllAsRead = manualMarkAllAsRead

console.log('🎯 Debug functions loaded! Run debugNotifications() or manualMarkAllAsRead() in console') 