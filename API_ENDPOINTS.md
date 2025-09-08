# API Endpoints for AI Assistant

This document outlines all available API endpoints for the AI assistant to manage customers and promotions.

## 🧑‍🤝‍🧑 CUSTOMERS API ENDPOINTS

### Core Customer Management
```http
GET    /api/customers                     # List all customers with filtering
GET    /api/customers/:id                 # Get specific customer details
POST   /api/customers                     # Create new customer
PUT    /api/customers/:id                 # Update customer information
DELETE /api/customers/:id                 # Deactivate customer (soft delete)
PATCH  /api/customers/:id/toggle          # Toggle customer active status
```

### Customer Search & Filtering
```http
GET    /api/customers/search              # Advanced customer search
GET    /api/customers/segment/:segment    # Get customers by segment (vip, new, inactive, regular)
GET    /api/customers/active              # Get only active customers
GET    /api/customers/inactive            # Get inactive customers
GET    /api/customers/new                 # Get new customers (registered in last 30 days)
GET    /api/customers/vip                 # Get VIP customers (high spenders)
```

### Customer Analytics
```http
GET    /api/customers/analytics           # Overall customer analytics
GET    /api/customers/:id/analytics       # Specific customer analytics
GET    /api/customers/segments            # Customer segmentation data
GET    /api/customers/retention           # Customer retention metrics
GET    /api/customers/lifetime-value      # Customer lifetime value analysis
```

### Customer Orders & History
```http
GET    /api/customers/:id/orders          # Get customer's order history
GET    /api/customers/:id/orders/recent   # Get customer's recent orders
GET    /api/customers/:id/spending        # Get customer spending analysis
GET    /api/customers/:id/behavior        # Get customer behavior patterns
```

### Customer Communication
```http
POST   /api/customers/:id/send-email      # Send email to specific customer
POST   /api/customers/bulk-email          # Send bulk emails to customer segments
GET    /api/customers/:id/communication   # Get customer communication history
POST   /api/customers/:id/notes           # Add notes to customer profile
```

### Customer Addresses
```http
GET    /api/customers/:id/addresses       # Get customer addresses
POST   /api/customers/:id/addresses       # Add new address for customer
PUT    /api/customers/:id/addresses/:addressId # Update customer address
DELETE /api/customers/:id/addresses/:addressId # Delete customer address
```

### Bulk Customer Operations
```http
POST   /api/customers/bulk-create         # Create multiple customers
PATCH  /api/customers/bulk-update         # Update multiple customers
POST   /api/customers/bulk-segment        # Bulk assign customer segments
POST   /api/customers/export              # Export customer data
POST   /api/customers/import              # Import customer data
```

### Customer Query Parameters
Most GET endpoints support these query parameters:
- `page` - Page number for pagination
- `limit` - Number of results per page
- `search` - Search in email, name, phone
- `segment` - Filter by customer segment (vip, new, inactive, regular)
- `status` - Filter by status (active, inactive)
- `date_from` - Filter by registration date from
- `date_to` - Filter by registration date to
- `sort_by` - Sort field (created_at, total_spent, last_login, etc.)
- `sort_order` - asc/desc

---

## 🎯 PROMOTIONS API ENDPOINTS

### Core Promotion Management
```http
GET    /api/promotions                    # List all promotions with filtering
GET    /api/promotions/:id                # Get specific promotion details
POST   /api/promotions                    # Create new promotion
PUT    /api/promotions/:id                # Update promotion
DELETE /api/promotions/:id               # Delete promotion
PATCH  /api/promotions/:id/toggle         # Toggle promotion active/inactive status
```

### Date & Time Management
```http
PATCH  /api/promotions/:id/extend         # Extend promotion expiration date
PATCH  /api/promotions/:id/schedule       # Schedule promotion activation
POST   /api/promotions/:id/duplicate      # Duplicate promotion with new dates
PATCH  /api/promotions/:id/dates          # Update valid_from/valid_until dates
POST   /api/promotions/schedule-batch     # Schedule multiple promotions
```

### Usage & Limits Management
```http
PATCH  /api/promotions/:id/usage-limit    # Update usage limits
POST   /api/promotions/:id/reset-usage    # Reset usage counter
GET    /api/promotions/:id/usage-stats    # Get detailed usage statistics
PATCH  /api/promotions/:id/increment      # Increment usage count
GET    /api/promotions/:id/usage-history  # Get usage history
```

### Promotion Search & Filtering
```http
GET    /api/promotions/search             # Advanced promotion search
GET    /api/promotions/active             # Get only active promotions
GET    /api/promotions/expired            # Get expired promotions
GET    /api/promotions/expiring           # Get promotions expiring soon
GET    /api/promotions/unused             # Get unused promotions
GET    /api/promotions/popular            # Get most used promotions
GET    /api/promotions/brand/:brandId     # Get promotions by brand
```

### Bulk Promotion Operations
```http
POST   /api/promotions/bulk-create        # Create multiple promotions
PATCH  /api/promotions/bulk-update        # Update multiple promotions
PATCH  /api/promotions/bulk-toggle        # Bulk activate/deactivate
POST   /api/promotions/bulk-extend        # Bulk extend expiration dates
DELETE /api/promotions/bulk-delete        # Bulk delete promotions
POST   /api/promotions/bulk-duplicate     # Bulk duplicate promotions
```

### Promotion Analytics
```http
GET    /api/promotions/analytics          # Overall promotion analytics
GET    /api/promotions/:id/analytics      # Specific promotion analytics
GET    /api/promotions/performance        # Performance metrics
GET    /api/promotions/conversion-rates   # Conversion rate analysis
GET    /api/promotions/usage-trends       # Usage trend analysis
GET    /api/promotions/brand-performance  # Brand-wise promotion performance
```

### Automation & Scheduling
```http
POST   /api/promotions/:id/auto-extend    # Set up auto-extension rules
POST   /api/promotions/auto-create        # Create recurring promotions
GET    /api/promotions/scheduled          # Get scheduled promotions
PATCH  /api/promotions/:id/auto-rules     # Update automation rules
POST   /api/promotions/templates          # Create promotion templates
```

### Integration & Webhooks
```http
POST   /api/promotions/:id/send-webhook   # Send promotion to webhook
POST   /api/promotions/webhook-batch      # Send multiple promotions to webhook
GET    /api/promotions/webhook-status     # Check webhook delivery status
POST   /api/promotions/:id/notify         # Send promotion notifications
POST   /api/promotions/send-to-customers  # Send promotions to customer segments
```

### Validation & Testing
```http
POST   /api/promotions/validate           # Validate promotion code
POST   /api/promotions/:id/test           # Test promotion application
GET    /api/promotions/code-availability  # Check if promotion code is available
POST   /api/promotions/generate-code      # Generate unique promotion codes
POST   /api/promotions/validate-usage     # Validate if customer can use promotion
```

### Export & Import
```http
GET    /api/promotions/export             # Export promotions data
POST   /api/promotions/import             # Import promotions data
GET    /api/promotions/export/:format     # Export in specific format (csv, json, xlsx)
POST   /api/promotions/backup             # Create backup of all promotions
```

### Promotion Query Parameters
Most GET endpoints support these query parameters:
- `page` - Page number for pagination
- `limit` - Number of results per page
- `search` - Search in code, description
- `brand_id` - Filter by brand
- `status` - active/inactive/expired/scheduled
- `date_from` - Filter by valid_from date
- `date_to` - Filter by valid_until date
- `usage_min` - Minimum usage count
- `usage_max` - Maximum usage count
- `discount_min` - Minimum discount percentage
- `discount_max` - Maximum discount percentage
- `sort_by` - Sort field (created_at, usage, expiry, discount, etc.)
- `sort_order` - asc/desc

---

## 🤖 AI ASSISTANT USAGE EXAMPLES

### Customer Commands
```javascript
// "Get all VIP customers"
GET /api/customers/segment/vip

// "Find customers who haven't ordered in 90 days"
GET /api/customers/inactive

// "Show me customer John's order history"
GET /api/customers/search?search=john
// Then GET /api/customers/:id/orders

// "Send welcome email to all new customers"
POST /api/customers/bulk-email
{
  "segment": "new",
  "template": "welcome",
  "subject": "Welcome to our store!"
}

// "Export all customer data"
POST /api/customers/export
{
  "format": "csv",
  "include_orders": true
}
```

### Promotion Commands
```javascript
// "Create a 20% off promotion for Kiowa expiring next Friday"
POST /api/promotions
{
  "brand_id": "kiowa_brand_id",
  "code": "KIOWA20",
  "description": "20% off for Kiowa brand",
  "discount_percent": 20,
  "valid_until": "2024-01-19T23:59:59Z"
}

// "Extend all promotions expiring this week by 3 days"
GET /api/promotions/expiring?days=7
// Then POST /api/promotions/bulk-extend { "days": 3 }

// "Show me unused promotions"
GET /api/promotions/unused

// "Send SUMMER20 promotion to webhook"
POST /api/promotions/:id/send-webhook

// "Create 5 promo codes for each brand with 10% discount"
POST /api/promotions/bulk-create
{
  "template": {
    "discount_percent": 10,
    "usage_limit": 100
  },
  "brands": ["all"],
  "count_per_brand": 5
}
```

---

## 📊 Response Formats

### Customer Response Format
```json
{
  "id": "uuid",
  "email": "customer@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "created_at": "2024-01-01T00:00:00Z",
  "is_active": true,
  "customer_segment": "vip",
  "total_orders": 15,
  "total_spent": 75000,
  "last_order_date": "2024-01-15T00:00:00Z",
  "orders": [...],
  "addresses": [...]
}
```

### Promotion Response Format
```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "code": "SUMMER20",
  "description": "Summer sale promotion",
  "discount_percent": 20,
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-01-31T23:59:59Z",
  "is_active": true,
  "usage_limit": 100,
  "times_used": 25,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Pagination Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
``` 