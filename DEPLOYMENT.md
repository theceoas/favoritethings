# Deployment Guide for Bedz&Buttunz E-commerce Platform

## Environment Variables Required

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Paystack Configuration  
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your-test-public-key
PAYSTACK_SECRET_KEY=sk_test_your-test-secret-key
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Optional Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Admin Configuration
```
ADMIN_EMAIL=favoritethings@gmail.com
```

## Vercel Deployment Steps

1. **Connect Repository**: Import project from GitHub
2. **Set Environment Variables**: Add all the above variables in Vercel dashboard
3. **Database Setup**: Ensure Supabase database is running with proper schema
4. **Deploy**: Vercel will automatically build and deploy

## Pre-deployment Checklist

- ✅ All environment variables configured
- ✅ Supabase database schema applied
- ✅ RLS policies configured
- ✅ Product categories and initial data seeded
- ✅ Storage buckets configured for images
- ✅ Admin user created
- ✅ Payment integration tested

## Build Configuration

The project uses:
- **Framework**: Next.js 15.3.3
- **Node.js**: ^18.0.0 (recommended)
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Install Command**: `npm install`

## Important Notes

1. **Paystack Keys**: Make sure to use test keys for testing and live keys for production
2. **Supabase RLS**: Ensure Row Level Security policies are properly configured
3. **Image Domains**: Configure allowed image domains in next.config.ts
4. **CORS**: Supabase CORS settings should allow your domain

## Post-deployment Steps

1. Test user registration and login
2. Test product browsing and cart functionality
3. Test payment flow with Paystack
4. Verify admin dashboard access
5. Test order management and inventory updates
6. Verify email notifications (if configured) 