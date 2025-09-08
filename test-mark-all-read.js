// Test script for mark all as read functionality
// Run this in browser console on the admin page to test

const testMarkAllAsRead = async () => {
  console.log('🧪 Testing mark all as read functionality...')
  
  try {
    // Get Supabase client (assuming it's available globally or import it)
    const { createClient } = await import('/src/lib/supabase/client.js')
    const supabase = createClient()
    
    console.log('1. Checking current notifications...')
    const { data: before, error: beforeError } = await supabase
      .from('admin_notifications')
      .select('id, is_read')
    
    if (beforeError) {
      console.error('Error fetching notifications:', beforeError)
      return
    }
    
    console.log(`Found ${before.length} notifications, ${before.filter(n => !n.is_read).length} unread`)
    
    console.log('2. Attempting to mark all as read...')
    const { error: updateError } = await supabase
      .from('admin_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('is_read', false)
    
    if (updateError) {
      console.error('❌ Update failed:', updateError)
      return
    }
    
    console.log('✅ Update successful')
    
    console.log('3. Checking notifications after update...')
    const { data: after, error: afterError } = await supabase
      .from('admin_notifications')
      .select('id, is_read')
    
    if (afterError) {
      console.error('Error fetching notifications after update:', afterError)
      return
    }
    
    console.log(`After update: ${after.length} notifications, ${after.filter(n => !n.is_read).length} unread`)
    
    if (after.filter(n => !n.is_read).length === 0) {
      console.log('✅ SUCCESS: All notifications marked as read!')
    } else {
      console.log('❌ FAILED: Some notifications still unread')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testMarkAllAsRead() 