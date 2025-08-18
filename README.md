# ZKTeco MB460 Attendance Data Puller

A Node.js API server for fetching attendance data from ZKTeco MB460 devices and integrating with N8N automation workflows.

## 🏗️ Project Structure

```
Nysonian-Script-BM-DataPuller/
├── 📁 routes/                    # API route modules
│   ├── attendance.js            # Basic attendance endpoints
│   ├── attendanceWithNames.js   # Attendance with employee names
│   ├── device.js                # Device information endpoints
│   ├── health.js                # Health check and documentation
│   ├── webhook.js               # Webhook integration endpoints
│   └── todayShift.js            # Today's shift endpoints (spanning midnight)
├── 📁 utils/                    # Shared utility functions
│   └── zkHelper.js              # ZK device helper functions
├── 📁 triggers/                 # Automated triggers and schedulers
│   ├── webhookScheduler.js      # Webhook scheduling and auto-triggers
│   └── README.md                # Triggers documentation
├── 📁 tests/                    # Test files and utilities
│   ├── test-connection.js       # Connection testing utility
│   ├── test-webhook.js          # Webhook testing utility
│   ├── test-n8n-webhook.js      # n8n webhook testing
│   ├── test-date-webhook.js     # Date-specific webhook testing
│   ├── test-today-shift.js      # Today shift endpoint testing
│   ├── test-get-webhook.js      # GET webhook testing
│   └── README.md                # Tests documentation
├── 📁 ReadMeFiles/              # Additional documentation
│   ├── n8n-integration-guide.md # n8n integration guide
│   ├── REFACTORING-SUMMARY.md   # Refactoring documentation
│   ├── script-start.md          # Setup and usage guide
│   ├── TODAY-SHIFT-API-GUIDE.md # Today shift API documentation
│   └── WEBHOOK-SETUP-GUIDE.md   # Webhook integration guide
├── api-server.js                # Main server (modular structure)
├── pull-logs.js                 # Core biometric device connection
├── config.js                    # Configuration settings
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- ZKTeco MB460 device connected to network
- Network access to device IP and port

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file in the root directory:
```env
MB460_IP=192.168.1.113
MB460_PORT=4370
API_HOST=0.0.0.0
API_PORT=3000
```

### Start Server
```bash
node api-server.js
```

## 📊 API Endpoints

### Health & Documentation
- `GET /attendance/health` - Health check and server status
- `GET /attendance/apiDocumentation` - API documentation and overview

### Attendance Data
- `GET /attendance` - Get all attendance logs
- `GET /attendance/filter/YYYY-MM-DD&YYYY-MM-DD` - Filtered attendance by date range (e.g., /attendance/filter/2025-08-14&2025-08-18)
- `GET /attendance/date/YYYY-MM-DD` - Specific date attendance with employee names
- `GET /attendance/today` - Today's attendance with employee names

### Today's Shift (Spanning Midnight)
- `GET /attendance/todayShift` - Complete shift data (yesterday's last entry to today's first entry)
- `GET /attendance/todayShift/checkin` - Shift check-in data (yesterday's last entries)
- `GET /attendance/todayShift/checkout` - Shift check-out data (today's first entries)

### Webhook Integration
- `GET /attendance/webhook/today` - Get today's data and send to N8N webhook
- `GET /attendance/webhook/date/{date}` - Get specific date data and send to N8N webhook
- `GET /attendance/webhook/todayShift` - Get today's shift data and send to N8N webhook
- `GET /attendance/webhook/test` - Test endpoint with instructions

### Device Information
- `GET /attendance/device/info` - Device information and status
- `GET /attendance/device/status` - Device connection status

## 🔧 Development

### Webhook Integration Features

The webhook integration provides seamless connectivity with N8N automation workflows:

- **✅ Today's Data**: `GET /attendance/webhook/today` - Automatically fetches and sends today's attendance data
- **✅ Date-Specific Data**: `GET /attendance/webhook/date/{date}` - Fetches and sends data from any specific date
- **✅ DRY Architecture**: Clean, reusable code following the DRY principle
- **✅ Error Handling**: Comprehensive error responses with detailed information
- **✅ Date Validation**: Proper YYYY-MM-DD format validation
- **✅ Consistent API**: Unified response format across all endpoints

### Code Organization

#### Routes (`/routes/`)
Each route file handles a specific group of endpoints:
- **`attendance.js`** - Basic attendance data without employee names
- **`attendanceWithNames.js`** - Attendance data enriched with employee names
- **`device.js`** - Device information and status endpoints
- **`health.js`** - Health checks and API documentation
- **`webhook.js`** - Webhook integration endpoints for N8N

#### Utilities (`/utils/`)
Shared helper functions:
- **`zkHelper.js`** - ZK device connection and configuration utilities

### Adding New Endpoints

1. **Create or modify route file** in `/routes/`
2. **Add shared utilities** to `/utils/` if needed
3. **Mount routes** in `api-server.js`
4. **Test** with `npm test`

### Best Practices

- ✅ Use shared utilities for common functions
- ✅ Implement proper error handling
- ✅ Add request logging
- ✅ Use environment variables for configuration
- ✅ Follow DRY principle for code reusability
- ✅ Provide comprehensive error responses
- ✅ Maintain backward compatibility
- ✅ Follow consistent naming conventions
- ✅ Add JSDoc comments for functions

## 🎯 Features

- **Modular Architecture** - Clean separation of concerns
- **Employee Name Mapping** - Converts device IDs to names
- **Date Filtering** - Flexible date range queries
- **Real-time Data** - Fresh data from device on each request
- **LAN Access** - Network-accessible API
- **Error Handling** - Comprehensive error management
- **n8n Integration** - Designed for automation workflows

## 📊 Data Flow

```
ZKTeco MB460 Device → Local API Server → n8n Cloud → Google Sheets/Databases
```

## 🛠️ Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   ```bash
   # Use full path
   "C:\Program Files\nodejs\npm.cmd" start
   ```

2. **Connection refused**
   - Check MB460 IP address in `.env`
   - Verify device is powered on and connected
   - Test with `npm test`

3. **No data returned**
   - Check device has attendance records
   - Verify date format (YYYY-MM-DD)
   - Test device connection

### Server Management

```bash
# Start server
npm start

# Test connection
npm test

# Kill stuck processes
taskkill /f /im node.exe
```

## 📝 License

ISC License

---

For detailed setup instructions, see `script-start.md`
For n8n integration guide, see `n8n-integration-guide.md`
