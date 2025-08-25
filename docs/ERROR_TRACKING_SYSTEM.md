# Global Error Tracking System

## Overview

The Global Error Tracking System provides comprehensive error tracking across the entire data flow chain from biometric device connection to webhook delivery. It uses two key variables:

- **`failedAt`**: Identifies exactly where in the process the failure occurred
- **`failedBecause`**: Provides detailed error information and reason

## Data Flow Chain

The complete error tracking covers this flow:

```
zkHelper.js → attendanceAll.js → attendanceHelper.js → shiftCheckin.js/shiftCheckout.js → shiftData.js → webhook.js
```

## Error Steps Defined

### ZK Helper (`zkHelper.js`)
- `ZK_HELPER`: ZK Instance Creation
- `ZK_CONNECTION`: ZK Device Connection  
- `ZK_USERS_FETCH`: Users Fetch
- `ZK_ATTENDANCE_FETCH`: Attendance Fetch
- `ZK_DISCONNECT`: ZK Disconnect

### Attendance All (`attendanceAll.js`)
- `ATTENDANCE_ALL`: Route Handler
- `ATTENDANCE_ENRICHMENT`: Data Enrichment
- `ATTENDANCE_RESPONSE`: Response Generation

### Attendance Helper (`attendanceHelper.js`)
- `ATTENDANCE_HELPER`: HTTP Request
- `ATTENDANCE_HELPER_RESPONSE`: Response Processing

### Shift Check-in (`shiftCheckin.js`)
- `SHIFT_CHECKIN`: Route Handler
- `SHIFT_CHECKIN_PROCESSING`: Data Processing
- `SHIFT_CHECKIN_RESPONSE`: Response Generation

### Shift Check-out (`shiftCheckout.js`)
- `SHIFT_CHECKOUT`: Route Handler
- `SHIFT_CHECKOUT_PROCESSING`: Data Processing
- `SHIFT_CHECKOUT_RESPONSE`: Response Generation

### Shift Data (`shiftData.js`)
- `SHIFT_DATA`: Route Handler
- `SHIFT_DATA_CHECKIN_FETCH`: Check-in Data Fetch
- `SHIFT_DATA_CHECKOUT_FETCH`: Check-out Data Fetch
- `SHIFT_DATA_MERGE`: Data Merging
- `SHIFT_DATA_RESPONSE`: Response Generation

### Webhook (`webhook.js`)
- `WEBHOOK_HANDLER`: Route Handler
- `WEBHOOK_SHIFT_FETCH`: Shift Data Fetch
- `WEBHOOK_N8N_SEND`: N8N Webhook Send
- `WEBHOOK_RESPONSE`: Response Generation

## Error Response Format

All error responses now include:

```json
{
  "success": false,
  "timestamp": "2025-01-27T10:30:00.000Z",
  "failedAt": "zkHelper.js - ZK Device Connection",
  "failedBecause": "Connection timeout to biometric device",
  "requestId": "req_1706352600000_abc123def",
  "message": "Process failed at: zkHelper.js - ZK Device Connection. Reason: Connection timeout to biometric device"
}
```

## Implementation Details

### 1. Error Tracker Class (`utils/errorTracker.js`)

```javascript
class ErrorTracker {
    constructor() {
        this.failedAt = null;
        this.failedBecause = null;
        this.timestamp = null;
        this.requestId = null;
    }
    
    reset(requestId = null) // Reset for new request
    setError(step, reason, additionalInfo = {}) // Set error with details
    getErrorResponse() // Get formatted error response
    hasError() // Check if error exists
    getState() // Get current state
}
```

### 2. Usage in Routes

Each route now includes:

```javascript
// Reset error tracker for new request
errorTracker.reset();

try {
    // Route logic
} catch (error) {
    // If error tracker has error info, use it; otherwise create generic error
    const errorResponse = errorTracker.hasError() ? 
        errorTracker.getErrorResponse() : 
        {
            success: false,
            timestamp: new Date().toISOString(),
            failedAt: ERROR_STEPS.ROUTE_NAME,
            failedBecause: error.message,
            requestId: errorTracker.requestId,
            error: error.message
        };
    
    res.status(500).json(errorResponse);
}
```

### 3. Granular Error Tracking

Each critical operation is wrapped in try-catch:

```javascript
try {
    await zkInstance.createSocket();
} catch (error) {
    throw errorTracker.setError(ERROR_STEPS.ZK_CONNECTION, 
        `Failed to connect to ZK device: ${error.message}`, 
        { originalError: error.message }
    );
}
```

## Benefits

1. **Precise Error Location**: Know exactly where in the chain the failure occurred
2. **Detailed Error Information**: Get specific error reasons and context
3. **Request Tracking**: Unique request IDs for debugging
4. **Consistent Error Format**: Standardized error responses across all endpoints
5. **Debugging Efficiency**: Faster problem identification and resolution
6. **Monitoring**: Easy to track error patterns and system health

## Example Error Scenarios

### Scenario 1: Biometric Device Connection Failure
```json
{
  "failedAt": "zkHelper.js - ZK Device Connection",
  "failedBecause": "Connection timeout to biometric device at 192.168.1.100:4370"
}
```

### Scenario 2: Data Processing Error
```json
{
  "failedAt": "shiftData.js - Data Merging",
  "failedBecause": "Failed to merge check-in and check-out data: Invalid data format"
}
```

### Scenario 3: Webhook Delivery Failure
```json
{
  "failedAt": "webhook.js - N8N Webhook Send",
  "failedBecause": "Failed to send data to N8N webhook: Network timeout"
}
```

## Testing

Run the test script to see the error tracking system in action:

```bash
node test_error_tracking.js
```

This will demonstrate:
- Basic error tracking functionality
- Error propagation through the chain
- Error response format
- Request ID generation

## Integration

The error tracking system is now integrated into all major components:

- ✅ `utils/zkHelper.js`
- ✅ `simple_routes/attendanceAll.js`
- ✅ `utils/attendanceHelper.js`
- ✅ `shift_routes/shiftCheckin.js`
- ✅ `shift_routes/shiftCheckout.js`
- ✅ `shift_routes/shiftData.js`
- ✅ `webhook_routes/webhook.js`

## Future Enhancements

1. **Error Logging**: Add persistent error logging to database
2. **Error Analytics**: Track error patterns and frequency
3. **Alerting**: Send notifications for critical errors
4. **Error Recovery**: Implement automatic retry mechanisms
5. **Performance Metrics**: Track error impact on system performance
