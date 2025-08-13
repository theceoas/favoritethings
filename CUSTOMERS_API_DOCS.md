# Customers API Documentation

This API provides access to customer data without authentication requirements, perfect for use with n8n workflows.

## Base URL
```
http://localhost:3000/api/customers
```

## Endpoints

### 1. Get All Customers
**GET** `/api/customers`

Returns a list of all customers with their information and statistics.

#### Query Parameters
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of customers per page (default: 50, max: 100)
- `search` (optional): Search term for email, name, or phone
- `segment` (optional): Filter by customer segment (vip, new, regular, inactive)
- `status` (optional): Filter by status (active, inactive)

#### Example Request
```bash
curl -X GET "http://localhost:3000/api/customers?limit=10&search=john"
```

#### Example Response
```json
{
  "customers": [
    {
      "id": "6b194887-6b1d-4e82-b229-004475aea99b",
      "email": "ogfarmboy01@gmail.com",
      "full_name": "Amar Yusuf",
      "avatar_url": null,
      "role": "customer",
      "phone": null,
      "created_at": "2025-08-08T04:08:36.117275+00:00",
      "updated_at": "2025-08-08T04:08:36.117275+00:00",
      "email_verified": null,
      "is_active": true,
      "marketing_consent": null,
      "last_login": null,
      "total_orders": 0,
      "total_spent": 0,
      "last_order_date": null,
      "customer_segment": "new",
      "days_since_registration": 4,
      "days_since_last_order": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "filters": {
    "search": "john",
    "segment": "",
    "status": ""
  }
}
```

### 2. Get Customer by ID
**GET** `/api/customers/{id}`

Returns detailed information about a specific customer including their orders and addresses.

#### Example Request
```bash
curl -X GET "http://localhost:3000/api/customers/6b194887-6b1d-4e82-b229-004475aea99b"
```

#### Example Response
```json
{
  "customer": {
    "id": "6b194887-6b1d-4e82-b229-004475aea99b",
    "email": "ogfarmboy01@gmail.com",
    "full_name": "Amar Yusuf",
    "avatar_url": null,
    "role": "customer",
    "phone": null,
    "created_at": "2025-08-08T04:08:36.117275+00:00",
    "updated_at": "2025-08-08T04:08:36.117275+00:00",
    "email_verified": null,
    "is_active": true,
    "marketing_consent": null,
    "last_login": null,
    "total_orders": 0,
    "total_spent": 0,
    "last_order_date": null,
    "customer_segment": "new",
    "days_since_registration": 4,
    "days_since_last_order": null,
    "orders": [],
    "addresses": []
  }
}
```

### 3. Create New Customer
**POST** `/api/customers`

Creates a new customer in the system.

#### Request Body
```json
{
  "email": "newcustomer@example.com",
  "full_name": "John Doe",
  "phone": "+234-801-234-5678",
  "is_active": true,
  "marketing_consent": true
}
```

#### Example Request
```bash
curl -X POST "http://localhost:3000/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcustomer@example.com",
    "full_name": "John Doe",
    "phone": "+234-801-234-5678"
  }'
```

### 4. Update Customer
**PUT** `/api/customers/{id}`

Updates an existing customer's information.

#### Example Request
```bash
curl -X PUT "http://localhost:3000/api/customers/6b194887-6b1d-4e82-b229-004475aea99b" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "phone": "+234-801-234-5679"
  }'
```

### 5. Deactivate Customer
**DELETE** `/api/customers/{id}`

Soft deletes a customer by setting `is_active` to false.

#### Example Request
```bash
curl -X DELETE "http://localhost:3000/api/customers/6b194887-6b1d-4e82-b229-004475aea99b"
```

## Customer Data Fields

### Basic Information
- `id`: Unique customer identifier
- `email`: Customer email address
- `full_name`: Customer's full name
- `avatar_url`: Profile picture URL (if any)
- `role`: Always "customer"
- `phone`: Phone number
- `created_at`: Account creation date
- `updated_at`: Last update date
- `email_verified`: Email verification status
- `is_active`: Account active status
- `marketing_consent`: Marketing consent status
- `last_login`: Last login timestamp

### Computed Fields
- `total_orders`: Number of orders placed
- `total_spent`: Total amount spent (in Naira)
- `last_order_date`: Date of last order
- `customer_segment`: Customer segment (vip, new, regular, inactive)
- `days_since_registration`: Days since account creation
- `days_since_last_order`: Days since last order (null if no orders)

### Detailed Information (Single Customer Endpoint)
- `orders`: Array of customer orders with items
- `addresses`: Array of customer addresses

## Customer Segments

- **VIP**: Customers who have spent more than ₦50,000
- **New**: Customers who registered within the last 30 days
- **Inactive**: Customers who haven't placed an order in 90+ days
- **Regular**: All other customers

## n8n Integration Examples

### 1. Get All Customers
- **HTTP Request Node**
- Method: GET
- URL: `http://localhost:3000/api/customers`
- Query Parameters: `limit=100`

### 2. Search Customers
- **HTTP Request Node**
- Method: GET
- URL: `http://localhost:3000/api/customers`
- Query Parameters: `search={{ $json.searchTerm }}`

### 3. Get Customer Details
- **HTTP Request Node**
- Method: GET
- URL: `http://localhost:3000/api/customers/{{ $json.customerId }}`

### 4. Create Customer
- **HTTP Request Node**
- Method: POST
- URL: `http://localhost:3000/api/customers`
- Headers: `Content-Type: application/json`
- Body: JSON with customer data

## Error Responses

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid data)
- `404`: Customer not found
- `500`: Internal server error

Error response format:
```json
{
  "error": "Error message description"
}
``` 