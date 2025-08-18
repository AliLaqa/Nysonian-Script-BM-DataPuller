# Triggers Directory

This directory contains automated trigger modules that handle scheduled tasks and automatic operations for the API server.

## Files

### `webhookScheduler.js`
Handles automatic webhook calls and scheduling functionality:

- **Initial Webhook Call**: Automatically triggers `/webhook/today` when the server starts
- **Scheduled Webhooks**: Calls `/webhook/today` every 30 minutes
- **Graceful Shutdown**: Properly stops scheduled intervals when the server shuts down

#### Features:
- `init()`: Initialize the scheduler (triggers initial call and starts intervals)
- `triggerInitialWebhook()`: Manually trigger the initial webhook call
- `startScheduledWebhooks()`: Start the 30-minute interval schedule
- `stopScheduledWebhooks()`: Stop all scheduled webhook calls
- `getWebhookUrl()`: Get the current webhook URL
- `isRunning()`: Check if the scheduler is currently running

#### Usage:
```javascript
const WebhookScheduler = require('./triggers/webhookScheduler');

const scheduler = new WebhookScheduler();
scheduler.init();
```

## Future Triggers

This directory can be expanded to include other automated triggers such as:
- Data cleanup tasks
- Periodic health checks
- Backup operations
- Report generation
- Email notifications
