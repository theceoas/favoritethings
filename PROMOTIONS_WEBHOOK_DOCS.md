# Promotions Webhook Integration

This document describes the webhook integration for the promotions system that sends promotion data to n8n when the "Send" button is clicked.

## Webhook URL
```
https://n8n.srv942568.hstgr.cloud/webhook-test/7c39c404-0fd6-4e17-8f09-c791402fe02a
```

## How It Works

When you click the "Send to Webhook" button on any promotion in the admin panel, the system will:

1. **Collect Promotion Data**: Gather all promotion information including brand details
2. **Send to n8n**: POST the data to the webhook URL
3. **Handle Response**: Show success/error messages to the user
4. **Log Activity**: Console logs for debugging

## Data Structure Sent to Webhook

The webhook receives a JSON payload with the following structure:

```json
{
  "id": "promotion-uuid",
  "code": "PROMO20",
  "description": "20% off all items",
  "discount_percent": 20,
  "valid_from": "2025-08-12T00:00:00Z",
  "valid_until": "2025-08-19T00:00:00Z",
  "is_active": true,
  "usage_limit": 100,
  "times_used": 0,
  "created_at": "2025-08-12T10:00:00Z",
  "updated_at": "2025-08-12T10:00:00Z",
  "brand": {
    "id": "brand-uuid",
    "name": "Kiowa",
    "slug": "kiowa",
    "primary_color": "#ff6b35",
    "secondary_color": "#f7931e"
  },
  "sent_at": "2025-08-12T14:24:00Z",
  "sent_by": "admin_panel",
  "webhook_url": "https://n8n.srv942568.hstgr.cloud/webhook-test/7c39c404-0fd6-4e17-8f09-c791402fe02a"
}
```

## Field Descriptions

### Promotion Fields
- `id`: Unique promotion identifier
- `code`: Promotion code (e.g., "PROMO20")
- `description`: Human-readable description
- `discount_percent`: Discount percentage (0-100)
- `valid_from`: Start date/time (ISO 8601)
- `valid_until`: End date/time (ISO 8601)
- `is_active`: Whether promotion is currently active
- `usage_limit`: Maximum number of uses (-1 for unlimited)
- `times_used`: Current usage count
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Brand Fields
- `id`: Brand identifier
- `name`: Brand name (e.g., "Kiowa", "Omogebyify", "MiniMe")
- `slug`: URL-friendly brand name
- `primary_color`: Primary brand color (hex)
- `secondary_color`: Secondary brand color (hex)

### Metadata Fields
- `sent_at`: When the webhook was triggered
- `sent_by`: Source of the webhook trigger
- `webhook_url`: The webhook URL that was called

## n8n Workflow Setup

### 1. Webhook Node Configuration
- **Method**: POST
- **Path**: `/webhook-test/7c39c404-0fd6-4e17-8f09-c791402fe02a`
- **Response Mode**: Respond to Webhook

### 2. Data Processing
The webhook will receive the promotion data in the `$json` variable. You can access:
- `$json.code` - Promotion code
- `$json.description` - Promotion description
- `$json.discount_percent` - Discount percentage
- `$json.brand.name` - Brand name
- `$json.valid_until` - Expiration date

### 3. Example n8n Workflow Actions
- **Send Email**: Notify customers about new promotions
- **Create SMS**: Send promotional codes via SMS
- **Update Database**: Log promotion sends
- **Slack Notification**: Alert team about new promotions
- **Analytics**: Track promotion performance

## Error Handling

The webhook integration includes:

### Timeout Protection
- 10-second timeout to prevent hanging requests
- Automatic abort if webhook doesn't respond

### Error Types
- **Network Errors**: Connection issues
- **Timeout Errors**: Webhook not responding
- **HTTP Errors**: 4xx/5xx status codes
- **JSON Errors**: Invalid response format

### User Feedback
- Success toast: "Promotion {code} sent successfully to webhook!"
- Error toast: Specific error message with details

## Testing the Webhook

### Manual Test
```bash
curl -X POST "https://n8n.srv942568.hstgr.cloud/webhook-test/7c39c404-0fd6-4e17-8f09-c791402fe02a" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "code": "TEST20",
    "description": "Test promotion",
    "discount_percent": 20,
    "valid_from": "2025-08-12T00:00:00Z",
    "valid_until": "2025-08-19T00:00:00Z",
    "is_active": true,
    "usage_limit": 100,
    "times_used": 0,
    "brand": {
      "id": "brand-1",
      "name": "Test Brand",
      "slug": "test-brand",
      "primary_color": "#ff0000",
      "secondary_color": "#00ff00"
    },
    "sent_at": "2025-08-12T14:24:00Z",
    "sent_by": "admin_panel"
  }'
```

### Expected Response
```json
{
  "message": "Workflow was started"
}
```

## Security Considerations

- **No Authentication**: Webhook is public (as requested)
- **Data Validation**: All promotion data is validated before sending
- **Error Logging**: Failed requests are logged for debugging
- **Timeout Protection**: Prevents hanging requests

## Troubleshooting

### Common Issues

1. **Webhook Not Responding**
   - Check if n8n workflow is active
   - Verify webhook URL is correct
   - Check n8n server status

2. **Timeout Errors**
   - Webhook taking too long to respond
   - Increase timeout in code if needed
   - Optimize n8n workflow performance

3. **Data Not Received**
   - Check n8n webhook node configuration
   - Verify JSON structure matches expected format
   - Check n8n execution logs

### Debug Information
- Browser console logs show webhook requests
- Network tab shows request/response details
- n8n execution history shows received data

## Future Enhancements

- **Retry Logic**: Automatic retry for failed webhooks
- **Batch Processing**: Send multiple promotions at once
- **Webhook Validation**: Verify webhook endpoint before sending
- **Rate Limiting**: Prevent spam to webhook endpoint 