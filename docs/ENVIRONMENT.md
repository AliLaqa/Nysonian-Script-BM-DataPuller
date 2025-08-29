# Environment Configuration

## Overview
This document provides the standardized multi-device environment template for the ZKTeco Multi-Device API Server.

## Core API Configuration

```bash
# API Server Configuration
API_HOST=0.0.0.0
API_PORT=3000
NODE_ENV=production
```

## Device Configuration

### Device Prefixes
Each device is identified by a unique prefix (e.g., `pk01`, `us01`, `uk01`, `ae01`).

### Standard Device Variables
For each device prefix, configure the following variables:

```bash
# Device: pk01 (Pakistan - Main Office)
PK01_IP=192.168.1.100
PK01_PORT=4370
PK01_NAME="Pakistan Main Office"
PK01_LOCATION="Karachi, Pakistan"
PK01_COUNTRY="PK"
PK01_TIMEZONE="Asia/Karachi"

# Device: us01 (United States - New York)
US01_IP=192.168.1.101
US01_PORT=4370
US01_NAME="US New York Office"
US01_LOCATION="New York, USA"
US01_COUNTRY="US"
US01_TIMEZONE="America/New_York"

# Device: uk01 (United Kingdom - London)
UK01_IP=192.168.1.102
UK01_PORT=4370
UK01_NAME="UK London Office"
UK01_LOCATION="London, UK"
UK01_COUNTRY="UK"
UK01_TIMEZONE="Europe/London"

# Device: ae01 (UAE - Dubai)
AE01_IP=192.168.1.103
AE01_PORT=4370
AE01_NAME="UAE Dubai Office"
AE01_LOCATION="Dubai, UAE"
AE01_COUNTRY="AE"
AE01_TIMEZONE="Asia/Dubai"
```

## Shift Configuration

### Default Shift Pattern (pk01 - Overnight Shifts)
The default configuration preserves the sophisticated business logic for `pk01` with 6pm-2am overnight shifts:

```bash
# PK01 Shift Configuration (Default - Overnight Shifts)
PK01_SHIFT_START_HOUR=18        # 6 PM
PK01_SHIFT_END_HOUR=2           # 2 AM next day
PK01_CHECKIN_BUFFER_START=12    # 12 PM (noon) - Check-in buffer start
PK01_CHECKIN_BUFFER_END=24      # 12 AM (midnight) - Check-in buffer end
PK01_CHECKOUT_BUFFER_START=0    # 12 AM (midnight) - Check-out buffer start
PK01_CHECKOUT_BUFFER_END=12     # 12 PM (noon) - Check-out buffer end
PK01_SHIFT_DESCRIPTION="Overnight shift (6 PM - 2 AM) with buffer zones"
PK01_TIMEZONE="Asia/Karachi"
```

### Custom Shift Patterns
Other devices can have different shift patterns:

```bash
# US01 Shift Configuration (Day Shifts)
US01_SHIFT_START_HOUR=9         # 9 AM
US01_SHIFT_END_HOUR=17          # 5 PM
US01_CHECKIN_BUFFER_START=8     # 8 AM - Early arrival buffer
US01_CHECKIN_BUFFER_END=10      # 10 AM - Late arrival cutoff
US01_CHECKOUT_BUFFER_START=16   # 4 PM - Early departure start
US01_CHECKOUT_BUFFER_END=19     # 7 PM - Late departure buffer
US01_SHIFT_DESCRIPTION="Day shift (9 AM - 5 PM) with flexible arrival/departure"
US01_TIMEZONE="America/New_York"

# UK01 Shift Configuration (Flexible Hours)
UK01_SHIFT_START_HOUR=8         # 8 AM
UK01_SHIFT_END_HOUR=18          # 6 PM
UK01_CHECKIN_BUFFER_START=7     # 7 AM - Early arrival buffer
US01_CHECKIN_BUFFER_END=9       # 9 AM - Late arrival cutoff
UK01_CHECKOUT_BUFFER_START=17   # 5 PM - Early departure start
UK01_CHECKOUT_BUFFER_END=20     # 8 PM - Late departure buffer
UK01_SHIFT_DESCRIPTION="Flexible hours (8 AM - 6 PM) with extended buffers"
UK01_TIMEZONE="Europe/London"

# AE01 Shift Configuration (Split Shifts)
AE01_SHIFT_START_HOUR=8         # 8 AM
AE01_SHIFT_END_HOUR=18          # 6 PM
AE01_CHECKIN_BUFFER_START=7     # 7 AM - Early arrival buffer
AE01_CHECKIN_BUFFER_END=9       # 9 AM - Late arrival cutoff
AE01_CHECKOUT_BUFFER_START=17   # 5 PM - Early departure start
AE01_CHECKOUT_BUFFER_END=20     # 8 PM - Late departure buffer
AE01_SHIFT_DESCRIPTION="Standard business hours (8 AM - 6 PM)"
AE01_TIMEZONE="Asia/Dubai"
```

## N8N Webhook Configuration

```bash
# N8N Webhook URLs
N8N_WEBHOOK_TODAY=https://your-n8n-instance.com/webhook/today
N8N_WEBHOOK_TODAYSHIFT=https://your-n8n-instance.com/webhook/todayShift
N8N_WEBHOOK_DATE=https://your-n8N-instance.com/webhook/date
N8N_WEBHOOK_ATTENDANCE=https://your-n8n-instance.com/webhook/attendance
```

## Webhook Scheduler Configuration

```bash
# Webhook Scheduler Settings
WEBHOOK_SCHEDULER_INTERVAL_MINUTES=15
WEBHOOK_SCHEDULER_MAX_CONCURRENT_DEVICES=3
WEBHOOK_SCHEDULER_BATCH_DELAY_MS=1000
WEBHOOK_SCHEDULER_MAX_RETRY_ATTEMPTS=3
WEBHOOK_SCHEDULER_RETRY_DELAY_MS=5000
WEBHOOK_SCHEDULER_REQUEST_TIMEOUT_MS=30000
```

## Logging Configuration

```bash
# Logging Settings
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_CORRELATION=true
LOG_ENABLE_PERFORMANCE=true
```

## Error Tracking Configuration

```bash
# Error Tracking
ERROR_TRACKING_ENABLED=true
ERROR_TRACKING_MAX_ENTRIES=1000
ERROR_TRACKING_RETENTION_HOURS=24
```

## Complete Environment File Example

```bash
# .env
# Core API Configuration
API_HOST=0.0.0.0
API_PORT=3000
NODE_ENV=production

# Device: pk01 (Pakistan - Main Office)
PK01_IP=192.168.1.100
PK01_PORT=4370
PK01_NAME="Pakistan Main Office"
PK01_LOCATION="Karachi, Pakistan"
PK01_COUNTRY="PK"
PK01_TIMEZONE="Asia/Karachi"

# PK01 Shift Configuration (Default - Overnight Shifts)
PK01_SHIFT_START_HOUR=18
PK01_SHIFT_END_HOUR=2
PK01_CHECKIN_BUFFER_START=12
PK01_CHECKIN_BUFFER_END=24
PK01_CHECKOUT_BUFFER_START=0
PK01_CHECKOUT_BUFFER_END=12
PK01_SHIFT_DESCRIPTION="Overnight shift (6 PM - 2 AM) with buffer zones"

# Device: us01 (United States - New York)
US01_IP=192.168.1.101
US01_PORT=4370
US01_NAME="US New York Office"
US01_LOCATION="New York, USA"
US01_COUNTRY="US"
US01_TIMEZONE="America/New_York"

# US01 Shift Configuration (Day Shifts)
US01_SHIFT_START_HOUR=9
US01_SHIFT_END_HOUR=17
US01_CHECKIN_BUFFER_START=8
US01_CHECKIN_BUFFER_END=10
US01_CHECKOUT_BUFFER_START=16
US01_CHECKOUT_BUFFER_END=19
US01_SHIFT_DESCRIPTION="Day shift (9 AM - 5 PM) with flexible arrival/departure"

# N8N Webhook URLs
N8N_WEBHOOK_TODAY=https://your-n8n-instance.com/webhook/today
N8N_WEBHOOK_TODAYSHIFT=https://your-n8n-instance.com/webhook/todayShift
N8N_WEBHOOK_DATE=https://your-n8N-instance.com/webhook/date
N8N_WEBHOOK_ATTENDANCE=https://your-n8n-instance.com/webhook/attendance

# Webhook Scheduler Settings
WEBHOOK_SCHEDULER_INTERVAL_MINUTES=15
WEBHOOK_SCHEDULER_MAX_CONCURRENT_DEVICES=3
WEBHOOK_SCHEDULER_BATCH_DELAY_MS=1000
WEBHOOK_SCHEDULER_MAX_RETRY_ATTEMPTS=3
WEBHOOK_SCHEDULER_RETRY_DELAY_MS=5000
WEBHOOK_SCHEDULER_REQUEST_TIMEOUT_MS=30000

# Logging Settings
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_CORRELATION=true
LOG_ENABLE_PERFORMANCE=true

# Error Tracking
ERROR_TRACKING_ENABLED=true
ERROR_TRACKING_MAX_ENTRIES=1000
ERROR_TRACKING_RETENTION_HOURS=24
```

## Shift Logic Explanation

### Buffer Zone Concept
The shift system uses buffer zones to accommodate:
- **Early arrivals**: Employees who come before official shift start
- **Late departures**: Employees who leave after official shift end
- **Overtime**: Extended work hours beyond normal shift

### Time-Based Logic
The system automatically determines which day's records to use based on current time:
- **Check-in logic**: Changes based on whether current time is before/after noon
- **Check-out logic**: Changes based on whether current time is before/after midnight
- **Cross-day calculations**: Handles shifts that span midnight

### Device-Specific Flexibility
Each device can have:
- Different shift start/end hours
- Custom buffer zone times
- Unique shift descriptions
- Timezone-specific handling

This configuration system ensures that the sophisticated business logic from the original `pk01` implementation is preserved while allowing other devices to have completely different shift patterns.


