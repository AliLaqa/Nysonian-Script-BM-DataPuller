# ZKTeco MB460 Biometric API Server

A Node.js REST API server that connects to ZKTeco MB460 biometric devices and provides attendance data for n8n automation workflows.

## 🏗️ Project Structure

```
Nysonian-Script-BM-DataPuller/
├── 📁 routes/                    # API route modules
│   ├── attendance.js            # Basic attendance endpoints
│   ├── attendanceWithNames.js   # Attendance with employee names
│   ├── device.js                # Device information endpoints
│   └── health.js                # Health check and documentation
├── 📁 utils/                    # Shared utility functions
│   └── zkHelper.js              # ZK device helper functions
├── api-server.js                # Main server (modular structure)
├── api-server-modular.js        # Alternative modular server
├── pull-logs.js                 # Core biometric device connection
├── test-connection.js           # Connection testing utility
├── package.json                 # Dependencies and scripts
├── script-start.md              # Setup and usage guide
├── n8n-integration-guide.md     # n8n integration guide
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js LTS (v16 or higher)
- ZKTeco MB460 device connected to your network
- Know your MB460's IP address (e.g., `192.168.1.113`)

### Installation
```bash
# Install dependencies
npm install

# Configure device settings in .env file
MB460_IP=192.168.1.113
MB460_PORT=4370
API_PORT=3000
API_HOST=0.0.0.0
```

### Running the Server

#### Start the Server
```bash
npm start
```

#### Test Connection
```bash
npm test
```

## 📡 API Endpoints

### Health & Documentation
- `GET /health` - Health check
- `GET /` - API documentation

### Attendance Data
- `GET /attendance` - Get all attendance logs
- `GET /attendance/filter?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Filtered attendance
- `GET /attendance/date/YYYY-MM-DD` - Specific date with employee names
- `GET /attendance/today` - Today's attendance with employee names

### Device Information
- `GET /device/info` - Device information and status
- `GET /device/status` - Device connection status

## 🔧 Development

### Code Organization

#### Routes (`/routes/`)
Each route file handles a specific group of endpoints:
- **`attendance.js`** - Basic attendance data without employee names
- **`attendanceWithNames.js`** - Attendance data enriched with employee names
- **`device.js`** - Device information and status endpoints
- **`health.js`** - Health checks and API documentation

#### Utilities (`/utils/`)
Shared helper functions:
- **`zkHelper.js`** - ZK device connection and configuration utilities

### Adding New Endpoints

1. **Create or modify route file** in `/routes/`
2. **Add shared utilities** to `/utils/` if needed
3. **Mount routes** in `api-server-modular.js`
4. **Test** with `npm test`

### Best Practices

- ✅ Use shared utilities for common functions
- ✅ Implement proper error handling
- ✅ Add request logging
- ✅ Use environment variables for configuration
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
