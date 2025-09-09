# Database Storage Migration Guide

## Overview
This migration removes all localStorage and sessionStorage usage from your application and replaces it with Supabase database storage. This ensures data persistence across devices and sessions.

## Files Created/Modified

### 1. SQL Migration
- **File**: `migrate-to-database-cart.sql`
- **Purpose**: Creates database tables and functions for cart, preferences, and checkout sessions
- **Action**: Run this SQL in your Supabase SQL editor

### 2. Updated Cart Store
- **File**: `src/lib/store/cartStore.ts`
- **Changes**: 
  - Removed Zustand persist middleware
  - Added database sync functionality
  - Added session management for anonymous users
  - Added loading states

### 3. Updated API Routes
- **File**: `src/app/api/cart/route.ts`
- **Changes**: Updated to work with database-only cart system

- **File**: `src/app/api/preferences/route.ts` (NEW)
- **Purpose**: Manages user preferences in database

- **File**: `src/app/api/checkout-sessions/route.ts` (NEW)
- **Purpose**: Manages checkout session data in database

### 4. Database Storage Utility
- **File**: `src/lib/utils/databaseStorage.ts` (NEW)
- **Purpose**: Provides localStorage-like interface using Supabase database

### 5. Updated Supabase Client
- **File**: `src/lib/supabase/client.ts`
- **Changes**: Removed localStorage usage for auth storage

### 6. Updated Auth Utils
- **File**: `src/lib/supabase/auth-utils.ts`
- **Changes**: Removed localStorage clearing logic

## Database Schema

### New Tables Created:
1. **cart_sessions** - Manages cart sessions for anonymous and authenticated users
2. **user_preferences** - Stores user preferences (replaces localStorage)
3. **checkout_sessions** - Stores checkout session data (replaces sessionStorage)

### New Functions Created:
1. **get_or_create_cart()** - Gets existing cart or creates new one
2. **cleanup_expired_carts()** - Cleans up expired carts and sessions

### New Views Created:
1. **user_carts** - Easy access to user carts with session info

## Migration Steps

### Step 1: Run SQL Migration
```sql
-- Copy and paste the contents of migrate-to-database-cart.sql
-- into your Supabase SQL editor and run it
```

### Step 2: Update Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Test the Migration
1. Start your development server: `npm run dev`
2. Try adding items to cart
3. Check that cart persists across page refreshes
4. Test with both logged-in and anonymous users

### Step 4: Clean Up (Optional)
Run the cleanup script to remove localStorage-related files:
```bash
node cleanup-localStorage-files.js
```

## Key Benefits

1. **Data Persistence**: Cart and preferences persist across devices and sessions
2. **User Experience**: Seamless experience for both anonymous and authenticated users
3. **Scalability**: Database storage scales better than localStorage
4. **Security**: Data is properly secured with RLS policies
5. **Analytics**: Can track user behavior and cart abandonment

## Session Management

### Anonymous Users
- Uses sessionStorage for session ID only
- Cart data stored in database with session ID
- Session expires after 30 days

### Authenticated Users
- Cart data linked to user ID
- Preferences persist across all devices
- Automatic cart merge on login

## Error Handling

The new system includes comprehensive error handling:
- Graceful fallbacks if database is unavailable
- Automatic retry mechanisms
- User-friendly error messages
- Logging for debugging

## Performance Considerations

- Cart data is cached in Zustand store for fast UI updates
- Database sync happens asynchronously
- Expired carts are automatically cleaned up
- Indexes ensure fast queries

## Testing Checklist

- [ ] Cart persists across page refreshes
- [ ] Cart works for anonymous users
- [ ] Cart works for authenticated users
- [ ] Cart merges properly on login
- [ ] Preferences are saved and loaded
- [ ] Checkout sessions work correctly
- [ ] Expired carts are cleaned up
- [ ] Error handling works properly

## Troubleshooting

### Common Issues:
1. **Cart not loading**: Check Supabase connection and RLS policies
2. **Session not persisting**: Verify sessionStorage is available
3. **Database errors**: Check table permissions and RLS policies
4. **Performance issues**: Monitor database queries and add indexes if needed

### Debug Commands:
```javascript
// Check cart in database
console.log('Cart items:', await fetch('/api/cart').then(r => r.json()));

// Check preferences
console.log('Preferences:', await fetch('/api/preferences').then(r => r.json()));

// Check session ID
console.log('Session ID:', sessionStorage.getItem('cart-session-id'));
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase connection
3. Check RLS policies are correct
4. Ensure all environment variables are set
5. Test with a fresh browser session

The migration maintains backward compatibility while providing a more robust and scalable storage solution.
