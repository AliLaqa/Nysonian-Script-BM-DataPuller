# Webhook Integration Setup Guide

This guide explains how to set up and use the webhook integration feature that fetches data from the today's API and sends it to an N8N webhook.

## Overview

The webhook integration provides API endpoints that:
1. Fetch attendance data from the today's API (`/attendance/today`) or specific date API (`/attendance/date/{date}`)
2. Send this data to an N8N webhook URL
3. Return detailed status information about the process

## API Endpoints

### 1. GET `/webhook/today`
**Purpose**: Fetch today's attendance data and send it to an N8N webhook

**Method**: GET

**URL**: `http://192.168.1.140:3000/webhook/today`

**Response**:
```json
{
    "success": true,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "message": "Data successfully sent to N8N webhook",
    "process": {
        "step1": {
            "status": "completed",
            "action": "Fetched today's attendance data",
            "recordCount": 15,
            "employeeCount": 8
        },
        "step2": {
            "status": "completed",
            "action": "Sent data to N8N webhook",
            "webhookUrl": "https://nysonian.app.n8n.cloud/webhook/today-bm",
            "statusCode": 200
        }
    },
    "summary": {
        "totalRecordsToday": 15,
        "uniqueEmployeesToday": 8,
        "webhookResponse": { /* N8N response data */ }
    }
}
```

### 2. GET `/webhook/date/{date}`
**Purpose**: Fetch attendance data from a specific date and send it to an N8N webhook

**Method**: GET

**URL**: `http://192.168.1.140:3000/webhook/date/{date}`

**Parameters**:
- `{date}`: Date in YYYY-MM-DD format (e.g., `2025-08-04`)

**Example**: `GET /webhook/date/2025-08-04`

**Response**:
```json
{
    "success": true,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "message": "Data successfully sent to N8N webhook for 2025-08-04",
    "requestedDate": "2025-08-04",
    "process": {
        "step1": {
            "status": "completed",
            "action": "Fetched attendance data for 2025-08-04",
            "recordCount": 95,
            "employeeCount": 52
        },
        "step2": {
            "status": "completed",
            "action": "Sent data to N8N webhook",
            "webhookUrl": "https://nysonian.app.n8n.cloud/webhook/today-bm",
            "statusCode": 200
        }
    },
    "summary": {
        "totalRecordsForDate": 95,
        "uniqueEmployeesForDate": 52,
        "webhookResponse": { /* N8N response data */ }
    }
}
```

### 3. GET `/webhook/test`
**Purpose**: Test endpoint to verify webhook functionality

**Response**:
```json
{
    "success": true,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "message": "Webhook test endpoint is working",
    "testData": {
        "message": "Webhook test successful",
        "timestamp": "2025-01-27T10:30:00.000Z",
        "source": "ZKTeco-MB460-API",
        "testPayload": {
            "testField": "testValue",
            "numbers": [1, 2, 3, 4, 5],
            "nested": {
                "key": "value"
            }
        }
    },
    "instructions": {
        "toTestWebhook": "POST to /webhook/today with webhookUrl in body",
        "example": {
            "method": "POST",
            "url": "/webhook/today",
            "body": {
                "webhookUrl": "https://your-n8n-instance.com/webhook/your-webhook-id"
            }
        }
    }
}
```

## Setting Up N8N Webhook

### Step 1: Create a Webhook Node in N8N

1. **Open N8N** and create a new workflow
2. **Add a Webhook node**:
   - Click the "+" button to add a node
   - Search for "Webhook"
   - Select "Webhook" from the results

### Step 2: Configure the Webhook Node

1. **HTTP Method**: Set to `POST` (default)
2. **Path**: This will be auto-generated (e.g., `2b5a00ef-c581-4265-be0f-5ca235f4aec8`)
3. **Authentication**: Set to "None" for testing (you can add authentication later)
4. **Respond**: Set to "Immediately"

### Step 3: Get Your Webhook URL

After configuring the webhook node, you'll see a URL like:
```
https://nysonian.app.n8n.cloud/webhook-test/2b5a00ef-c581-4265-be0f-5ca235f4aec8
```

**Copy this URL** - you'll need it for the API call.

### Step 4: Test the Webhook

1. **Click "Listen for test event"** in the webhook node
2. **Make a test call** to your webhook endpoint:
   ```bash
   # Test today's data
   curl -X GET http://192.168.1.140:3000/webhook/today
   
   # Test specific date data
   curl -X GET http://192.168.1.140:3000/webhook/date/2025-08-04
   ```

3. **Check N8N** - you should see the data appear in the webhook node

## Data Structure Sent to N8N

The webhook sends the following payload to N8N:

```json
{
    "timestamp": "2025-01-27T10:30:00.000Z",
    "source": "ZKTeco-MB460-API",
    "data": {
        "success": true,
        "timestamp": "2025-01-27T10:30:00.000Z",
        "date": "2025-08-06",
        "dateFormatted": "Tuesday, August 6, 2025",
        "totalRecordsToday": 15,
        "uniqueEmployeesToday": 8,
        "summary": [
            {
                "deviceUserId": "1",
                "employeeName": "John Doe",
                "employeeRole": 0,
                "totalRecords": 2,
                "firstEntry": {
                    "deviceUserId": "1",
                    "employeeName": "John Doe",
                    "recordTime": "2025-08-06T08:30:00.000Z",
                    "timeOnly": "08:30:00"
                },
                "lastEntry": {
                    "deviceUserId": "1",
                    "employeeName": "John Doe",
                    "recordTime": "2025-08-06T17:30:00.000Z",
                    "timeOnly": "17:30:00"
                }
            }
        ],
        "detailedRecords": [
            {
                "deviceUserId": "1",
                "employeeName": "John Doe",
                "recordTime": "2025-08-06T08:30:00.000Z",
                "timeOnly": "08:30:00",
                "recordDate": "06/08/2025"
            }
        ]
    }
}
```

## Usage Examples

### Using cURL

```bash
# Test the webhook endpoint
curl -X GET http://192.168.1.140:3000/webhook/test

# Send today's data to N8N webhook
curl -X GET http://192.168.1.140:3000/webhook/today

# Send specific date data to N8N webhook
curl -X GET http://192.168.1.140:3000/webhook/date/2025-08-04
```

### Using JavaScript/Fetch

```javascript
// Test endpoint
const testResponse = await fetch('http://192.168.1.140:3000/webhook/test');
const testData = await testResponse.json();
console.log(testData);

// Send today's data to webhook
const todayResponse = await fetch('http://192.168.1.140:3000/webhook/today');
const todayData = await todayResponse.json();
console.log(todayData);

// Send specific date data to webhook
const dateResponse = await fetch('http://192.168.1.140:3000/webhook/date/2025-08-04');
const dateData = await dateResponse.json();
console.log(dateData);
```

### Using PowerShell

```powershell
# Test endpoint
Invoke-RestMethod -Uri "http://192.168.1.140:3000/webhook/test" -Method GET

# Send today's data to webhook
Invoke-RestMethod -Uri "http://192.168.1.140:3000/webhook/today" -Method GET

# Send specific date data to webhook
Invoke-RestMethod -Uri "http://192.168.1.140:3000/webhook/date/2025-08-04" -Method GET
```

## Error Handling

The API provides detailed error information:

### Missing Webhook URL
```json
{
    "success": false,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "error": "webhookUrl is required in request body",
    "example": {
        "webhookUrl": "https://your-n8n-instance.com/webhook/your-webhook-id"
    }
}
```

### Invalid URL Format
```json
{
    "success": false,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "error": "Invalid webhook URL format",
    "providedUrl": "invalid-url"
}
```

### Failed to Fetch Today's Data
```json
{
    "success": false,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "error": "Failed to fetch today's data",
    "details": "Connection timeout"
}
```

### Failed to Send to Webhook
```json
{
    "success": false,
    "timestamp": "2025-01-27T10:30:00.000Z",
    "error": "Failed to send data to N8N webhook",
    "details": "Request failed with status code 404",
    "statusCode": 404,
    "todayDataFetched": true,
    "todayDataSummary": {
        "totalRecordsToday": 15,
        "uniqueEmployeesToday": 8
    }
}
```

## Security Considerations

1. **Webhook URL Security**: Keep your webhook URLs private and secure
2. **Authentication**: Consider adding authentication to your N8N webhook
3. **HTTPS**: Use HTTPS URLs for production webhooks
4. **Rate Limiting**: Be mindful of API rate limits

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Check if the API server is running and accessible
2. **Invalid Webhook URL**: Ensure the webhook URL is correctly formatted
3. **N8N Not Receiving Data**: Verify the webhook node is active and listening
4. **CORS Issues**: The API includes CORS headers, but check browser console for errors

### Debug Steps

1. **Test the API endpoint first**: `GET /webhook/test`
2. **Check API server logs**: Look for error messages in the console
3. **Verify N8N webhook**: Use the "Listen for test event" feature
4. **Check network connectivity**: Ensure both services can reach each other

## Dependencies

The webhook functionality requires the `axios` package for HTTP requests. Install it with:

```bash
npm install axios
```

## Available Endpoints Summary

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/webhook/today` | GET | Get today's attendance data and send to webhook | `GET /webhook/today` |
| `/webhook/date/{date}` | GET | Get specific date attendance data and send to webhook | `GET /webhook/date/2025-08-04` |
| `/webhook/test` | GET | Test endpoint with instructions | `GET /webhook/test` |

### Features

- **✅ DRY Principle**: Clean, reusable code architecture
- **✅ Date Validation**: Proper YYYY-MM-DD format validation
- **✅ Error Handling**: Comprehensive error responses
- **✅ Backward Compatibility**: Existing endpoints still work
- **✅ Consistent API**: Unified response format across endpoints

## Next Steps

Once the basic webhook is working, you can:

1. **Add authentication** to your N8N webhook
2. **Set up automated triggers** (cron jobs, scheduled tasks)
3. **Process the data** in N8N workflows
4. **Store data** in databases or other systems
5. **Send notifications** based on attendance data
6. **Test with different dates** using the new date endpoint
