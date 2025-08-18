# ZKTeco MB460 Biometric API Server with Slack Integration - Setup & Usage Guide

## 🚀 Quick Start

This project creates a REST API server that connects to your ZKTeco MB460 biometric device and serves attendance data with employee names for n8n automation. **NEW: Automatic Slack integration sends beautifully formatted attendance reports to your Slack channel!**

---

## 📋 Prerequisites

### Required Software
- **Node.js LTS** (v16 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **ZKTeco MB460** device connected to your network

### Network Requirements
- MB460 device accessible on your LAN
- Know your MB460's IP address (e.g., `192.168.1.113`)
- Default port: `4370`

---

## 🛠️ Installation

### 1. Clone or Download Project
```bash
git clone <your-repo-url>
cd biometricmachinescript
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Device Settings
Edit the `.env` file with your MB460's details:
```env
MB460_IP=192.168.1.113        # Replace with your MB460's IP
MB460_PORT=4370               # Default ZKTeco port
MB460_TIMEOUT=10000           # Connection timeout (ms)
MB460_INPORT=4000             # Internal port
API_PORT=3000                 # API server port
API_HOST=0.0.0.0              # Bind to all network interfaces (for LAN access)
```

---

## 🎯 Available Commands

### 🖥️ **Which Terminal to Use?**

Since Node.js PATH might not be configured in all terminals, you have these options:

#### **🔧 Fix PATH (One-time setup - Recommended)**
1. **Close ALL terminal windows**
2. **Restart your computer** (to reload PATH environment variable)
3. **Open a new Command Prompt or PowerShell**
4. **Test**: `npm --version` (should work now)

If PATH is still not working, use the full path commands below:

#### **Option 1: Command Prompt (Recommended)**
Open **Command Prompt** and use full paths:
```cmd
"C:\Program Files\nodejs\npm.cmd" start
```

#### **Option 2: PowerShell with Full Paths**
Open **PowerShell** and use:
```powershell
& "C:\Program Files\nodejs\npm.cmd" start
```

#### **Option 3: PowerShell with Environment Variables**
```powershell
$env:MB460_IP="192.168.1.113"; $env:MB460_PORT="4370"; $env:API_HOST="0.0.0.0"; & "C:\Program Files\nodejs\node.exe" api-server.js
```

### 🚀 **Server Commands**

#### Start API Server
**Command Prompt:**
```cmd
"C:\Program Files\nodejs\npm.cmd" start
```

**PowerShell:**
```powershell
& "C:\Program Files\nodejs\npm.cmd" start
```

**Direct Node.js (PowerShell):**
```powershell
$env:MB460_IP="YOUR_MB460_IP"; $env:API_HOST="0.0.0.0"; & "C:\Program Files\nodejs\node.exe" api-server.js
```

**Server will be available at:** `http://YOUR_IP:3000`

#### Test Slack Integration
**Command Prompt:**
```cmd
"C:\Program Files\nodejs\npm.cmd" run test-slack
```

**PowerShell:**
```powershell
& "C:\Program Files\nodejs\npm.cmd" run test-slack
```

#### Test MB460 Connection
**Command Prompt:**
```cmd
"C:\Program Files\nodejs\npm.cmd" test
```

**PowerShell:**
```powershell
& "C:\Program Files\nodejs\npm.cmd" test
```

**Direct Node.js (PowerShell):**
```powershell
$env:MB460_IP="YOUR_MB460_IP"; & "C:\Program Files\nodejs\node.exe" tests/test-connection.js
```

#### Pull Logs Once (Manual)
**Command Prompt:**
```cmd
"C:\Program Files\nodejs\npm.cmd" run logs
```

**PowerShell:**
```powershell
& "C:\Program Files\nodejs\npm.cmd" run logs
```

#### Stop Server
Press `Ctrl+C` in the terminal running the server

#### Kill Stuck Processes
```powershell
taskkill /f /im node.exe
```

---

## 🌐 API Endpoints

Once the server is running, these endpoints will be available:

### 📊 **Main Endpoints**

#### Get Today's Attendance
```
GET http://YOUR_IP:3000/attendance/today
```

#### Get Attendance for Any Date
```
GET http://YOUR_IP:3000/attendance/date/YYYY-MM-DD
```
**Examples:**
- `http://YOUR_IP:3000/attendance/date/2025-08-06`
- `http://YOUR_IP:3000/attendance/date/2025-05-28`

#### Get All Attendance Records
```
GET http://YOUR_IP:3000/attendance
```

#### Get Filtered Attendance (Date Range)
```
GET http://YOUR_IP:3000/attendance/filter/2025-08-01&2025-08-06
```

### 🔧 **Utility Endpoints**

#### Health Check
```
GET http://YOUR_IP:3000/health
```

#### Test Slack Connection
```
GET http://YOUR_IP:3000/slack/test
```

#### Device Information
```
GET http://YOUR_IP:3000/device/info
```

#### API Documentation
```
GET http://YOUR_IP:3000/
```

---

## 📊 Response Format

### Date-Specific Endpoint Response
```json
{
  "success": true,
  "timestamp": "2025-08-06T18:30:41.380Z",
  "requestedDate": "2025-05-28",
  "dateFormatted": "Wednesday, 28 May 2025",
  "totalRecordsForDate": 5,
  "uniqueEmployeesForDate": 2,
  "summary": [
    {
      "deviceUserId": "78",
      "employeeName": "Zeeshan Shad",
      "employeeRole": 14,
      "totalRecords": 3,
      "firstEntry": { "recordTime": "2025-05-28T17:41:58.000Z", ... },
      "lastEntry": { "recordTime": "2025-05-28T19:13:51.000Z", ... }
    }
  ],
  "detailedRecords": [
    {
      "userSn": 1,
      "deviceUserId": "78",
      "employeeName": "Zeeshan Shad",
      "employeeRole": 14,
      "recordTime": "2025-05-28T17:41:58.000Z",
      "recordTimeFormatted": "28/05/2025, 22:41:58",
      "timeOnly": "22:41:58",
      "ip": "192.168.1.113"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Server Won't Start

#### **"npm is not recognized" Error**
This means your PATH environment variable isn't set up. Use one of these solutions:

**Solution 1 (Recommended): Restart Computer**
1. Close all terminal windows
2. Restart your computer
3. Open new Command Prompt or PowerShell
4. Try: `npm --version`

**Solution 2: Use Full Paths**
```cmd
"C:\Program Files\nodejs\npm.cmd" --version
```

#### **Check Node.js Installation**
**Command Prompt:**
```cmd
"C:\Program Files\nodejs\node.exe" --version
"C:\Program Files\nodejs\npm.cmd" --version
```

**PowerShell:**
```powershell
& "C:\Program Files\nodejs\node.exe" --version
& "C:\Program Files\nodejs\npm.cmd" --version
```

#### **Install Dependencies**
**Command Prompt:**
```cmd
"C:\Program Files\nodejs\npm.cmd" install
```

**PowerShell:**
```powershell
& "C:\Program Files\nodejs\npm.cmd" install
```

#### **Check Port Availability**
```cmd
netstat -an | findstr :3000
```

### Connection Issues
1. **Test MB460 connection:**
   ```bash
   npm test
   ```

2. **Check MB460 IP address in `.env` file**

3. **Verify MB460 is on same network**

4. **Check firewall settings**

### Clear Cache (if needed)
```bash
# Stop server first (Ctrl+C)
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s node_modules
npm install
```

### Kill Stuck Processes
```bash
# Windows
taskkill /f /im node.exe

# Then restart
npm start
```

---

## 🖥️ Server Management

### Start Server for LAN Access
The server is configured to bind to `0.0.0.0:3000` which makes it accessible from:
- **Local machine:** `http://localhost:3000`
- **LAN devices:** `http://YOUR_IP:3000` (e.g., `http://192.168.1.140:3000`)
- **n8n cloud:** `http://YOUR_IP:3000`

### Get Your IP Address
```bash
# Windows
ipconfig | findstr "IPv4"

# Result example: 192.168.1.140
```

### Environment Variables Override
You can override settings when starting:
```bash
# Windows PowerShell
$env:MB460_IP="192.168.1.113"; $env:API_HOST="0.0.0.0"; npm start

# Command Prompt
set MB460_IP=192.168.1.113 && set API_HOST=0.0.0.0 && npm start
```

---

## 📁 Project Structure

```
biometricmachinescript/
├── api-server.js              # Main API server with Slack integration
├── slack-integration.js       # Slack integration module
├── tests/test-slack.js        # Slack integration testing script
├── pull-logs.js               # Core MB460 connection logic
├── tests/test-connection.js   # Connection testing script
├── package.json               # Dependencies and scripts
├── .env                       # Configuration file
├── script-start.md           # This setup guide
├── SLACK_INTEGRATION.md      # Slack integration guide
├── n8n-integration-guide.md  # n8n specific guide
└── node_modules/             # Dependencies (auto-generated)
```

---

## 💬 Slack Integration

### Overview
Your API now automatically sends attendance data to Slack! Every time you call an attendance endpoint, a beautifully formatted message is sent to your configured Slack channel.

### Quick Test
```bash
# Test Slack connection
npm run test-slack

# Test with real data
curl http://localhost:3000/attendance/today
```

### Configuration
- **Channel ID**: `C099AS807V4` (pre-configured)
- **Bot Token**: `xoxb-7875761666098-9344531014592-ck2SJzzl8jtO60aI5sEhzo6Z` (pre-configured)

### What Gets Sent
- 📊 **Attendance summaries** with employee breakdowns
- 👥 **Total records and unique employees**
- 📋 **Recent attendance records** (first 10)
- ⏰ **Generation timestamps**

### Endpoints with Slack Integration
- `GET /attendance` - All attendance data
- `GET /attendance/filter` - Filtered attendance data
- `GET /attendance/date/YYYY-MM-DD` - Date-specific attendance
- `GET /attendance/today` - Today's attendance

For detailed Slack integration information, see `SLACK_INTEGRATION.md`.

---

## 🔄 Development Workflow

### Making Changes
1. Stop the server (`Ctrl+C`)
2. Edit your files
3. Restart the server (`npm start`)

### Adding New Endpoints
Edit `api-server.js` and add your new routes before the error handling middleware.

### Testing Changes
```bash
# Test connection
npm test

# Test specific endpoint
curl http://localhost:3000/health
```

---

## 🛡️ Security Notes

- **LAN Only:** Server is accessible within your local network only
- **No Authentication:** Currently no API key required (add if needed)
- **Firewall Protected:** Router firewall protects from external access
- **HTTPS:** Consider adding SSL/TLS for production use

---

## 📝 Logs and Monitoring

### Server Logs
The server displays real-time logs showing:
- API requests received
- MB460 connection status
- Data retrieval progress
- Error messages

### Sample Log Output
```
🚀 ZKTeco MB460 API Server started!
📍 Server: http://0.0.0.0:3000
⚙️ Configuration:
   MB460 Device: 192.168.1.113:4370
🎯 Ready for n8n integration!

2025-08-06T18:30:29.645Z - GET /attendance/date/2025-05-28
🔄 Fetching attendance for 2025-05-28 with employee names...
ok tcp
✅ Connected to MB460 successfully!
```

---

## 🎉 Success Indicators

✅ **Server Started:** See "🚀 ZKTeco MB460 API Server started!"  
✅ **MB460 Connected:** See "ok tcp" and "✅ Connected to MB460 successfully!"  
✅ **Data Retrieved:** See "✅ Retrieved X attendance records"  
✅ **API Working:** Health check returns `{"status": "OK"}`  
✅ **Slack Integration:** See "✅ Slack connection test successful!"  
✅ **Slack Messages:** Check your Slack channel for attendance reports  

Your biometric attendance API is now ready for n8n integration with automatic Slack notifications!