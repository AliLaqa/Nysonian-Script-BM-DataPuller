# Multi-Device Setup Guide

This guide explains how to configure and use multiple ZKTeco biometric devices with location-based endpoints.

## 🎯 **Overview**

The system now supports multiple biometric devices with location-based endpoint prefixes:
- `pk01/attendance` - Pakistan Device 1
- `us01/attendance` - USA Device 1
- `pk02/attendance` - Pakistan Device 2
- `us02/attendance` - USA Device 2

## 📋 **Environment Variables Setup**

### **Basic Configuration**
```env
# API Server Configuration
API_HOST=0.0.0.0
API_PORT=3000

# Legacy Device (automatically mapped to pk01)
MB460_IP=45.115.86.64
MB460_PORT=4370
MB460_TIMEOUT=10000
MB460_INPORT=4000
```

### **Multi-Device Configuration**
```env
# Pakistan Devices
PK01_IP=45.115.86.64
PK01_PORT=4370
PK01_TIMEOUT=10000
PK01_INPORT=4000
PK01_NAME=ZKTeco MB460 (Pakistan Office)
PK01_MODEL=MB460
PK01_LOCATION=Pakistan
PK01_DESCRIPTION=Primary biometric device in Pakistan office

PK02_IP=45.115.86.65
PK02_PORT=4370
PK02_TIMEOUT=10000
PK02_INPORT=4000
PK02_NAME=ZKTeco MB460 (Pakistan Branch)
PK02_MODEL=MB460
PK02_LOCATION=Pakistan
PK02_DESCRIPTION=Secondary biometric device in Pakistan branch

# USA Devices
US01_IP=192.168.1.100
US01_PORT=4370
US01_TIMEOUT=10000
US01_INPORT=4000
US01_NAME=ZKTeco MB460 (USA Office)
US01_MODEL=MB460
US01_LOCATION=USA
US01_DESCRIPTION=Primary biometric device in USA office

US02_IP=192.168.1.101
US02_PORT=4370
US02_TIMEOUT=10000
US02_INPORT=4000
US02_NAME=ZKTeco MB460 (USA Branch)
US02_MODEL=MB460
US02_LOCATION=USA
US02_DESCRIPTION=Secondary biometric device in USA branch

# UK Devices (if needed)
UK01_IP=10.0.0.100
UK01_PORT=4370
UK01_TIMEOUT=10000
UK01_INPORT=4000
UK01_NAME=ZKTeco MB460 (UK Office)
UK01_MODEL=MB460
UK01_LOCATION=United Kingdom
UK01_DESCRIPTION=Primary biometric device in UK office

# UAE Devices (if needed)
AE01_IP=172.16.0.100
AE01_PORT=4370
AE01_TIMEOUT=10000
AE01_INPORT=4000
AE01_NAME=ZKTeco MB460 (UAE Office)
AE01_MODEL=MB460
AE01_LOCATION=UAE
AE01_DESCRIPTION=Primary biometric device in UAE office
```

## 🚀 **Available Endpoints**

### **Device-Specific Endpoints**
```
GET /pk01/attendance          # Pakistan Device 1 attendance
GET /us01/attendance          # USA Device 1 attendance
GET /pk02/attendance          # Pakistan Device 2 attendance
GET /us02/attendance          # USA Device 2 attendance
GET /uk01/attendance          # UK Device 1 attendance
GET /ae01/attendance          # UAE Device 1 attendance
```

### **Device Information**
```
GET /pk01/device/info         # Pakistan Device 1 info
GET /us01/device/info         # USA Device 1 info
GET /pk01/health              # Pakistan Device 1 health
GET /us01/health              # USA Device 1 health
```

### **Multi-Device Management**
```
GET /devices                  # List all configured devices
GET /devices/health           # Health check for all devices
GET /devices/attendance/all   # Attendance from all devices
GET /devices/country/PK       # List Pakistan devices
GET /devices/country/US       # List USA devices
GET /devices/attendance/country/PK  # Attendance from Pakistan devices
GET /devices/attendance/country/US  # Attendance from USA devices
```

### **Legacy Compatibility**
```
GET /attendance               # Redirects to /pk01/attendance
```

## 📊 **Response Format**

### **Device-Specific Attendance Response**
```json
{
  "success": true,
  "timestamp": "2025-08-27T18:51:44.057Z",
  "device": {
    "id": "pk01",
    "name": "ZKTeco MB460 (Pakistan Office)",
    "location": "Pakistan",
    "country": "PK",
    "ip": "45.115.86.64",
    "port": 4370
  },
  "recordCount": 6092,
  "uniqueEmployees": 67,
  "data": [
    {
      "userSn": "123456",
      "deviceUserId": "2",
      "employeeName": "John Doe",
      "employeeRole": 0,
      "recordTime": "2025-08-27T18:30:00.000Z",
      "recordDate": "27/08/2025",
      "recordTimeFormatted": "27/08/2025, 18:30:00",
      "timeOnly": "18:30:00",
      "ip": "45.115.86.64",
      "deviceId": "pk01",
      "deviceLocation": "Pakistan",
      "deviceCountry": "PK"
    }
  ]
}
```

### **Multi-Device Response**
```json
{
  "success": true,
  "timestamp": "2025-08-27T18:51:44.057Z",
  "summary": {
    "totalDevices": 4,
    "successfulDevices": 3,
    "failedDevices": 1,
    "totalRecords": 15234
  },
  "devices": {
    "pk01": {
      "success": true,
      "recordCount": 6092,
      "data": [...],
      "deviceInfo": {...}
    },
    "us01": {
      "success": true,
      "recordCount": 9142,
      "data": [...],
      "deviceInfo": {...}
    },
    "pk02": {
      "success": false,
      "error": "Connection timeout",
      "deviceInfo": {...}
    }
  }
}
```

## 🔧 **Deployment Configuration**

### **Fly.io Environment Variables**
```bash
# Set all device configurations
flyctl secrets set \
  API_HOST=0.0.0.0 \
  API_PORT=3000 \
  MB460_IP=45.115.86.64 \
  MB460_PORT=4370 \
  MB460_TIMEOUT=10000 \
  MB460_INPORT=4000 \
  PK01_IP=45.115.86.64 \
  PK01_PORT=4370 \
  PK01_TIMEOUT=10000 \
  PK01_INPORT=4000 \
  PK01_NAME="ZKTeco MB460 (Pakistan Office)" \
  PK01_LOCATION=Pakistan \
  US01_IP=192.168.1.100 \
  US01_PORT=4370 \
  US01_TIMEOUT=10000 \
  US01_INPORT=4000 \
  US01_NAME="ZKTeco MB460 (USA Office)" \
  US01_LOCATION=USA
```

## 🛠️ **Testing Endpoints**

### **Local Testing**
```bash
# Test individual devices
curl http://localhost:3000/pk01/attendance
curl http://localhost:3000/us01/attendance

# Test device health
curl http://localhost:3000/pk01/health
curl http://localhost:3000/us01/health

# Test multi-device endpoints
curl http://localhost:3000/devices
curl http://localhost:3000/devices/health
curl http://localhost:3000/devices/attendance/all
```

### **Production Testing**
```bash
# Test deployed endpoints
curl https://your-app.fly.dev/pk01/attendance
curl https://your-app.fly.dev/us01/attendance
curl https://your-app.fly.dev/devices/health
```

## 🚨 **Important Notes**

1. **Device Prefixes**: Only devices with both `IP` and `PORT` configured will be loaded
2. **Backward Compatibility**: Legacy `/attendance` endpoint redirects to `/pk01/attendance`
3. **Parallel Processing**: Maximum 3 devices processed simultaneously to avoid overwhelming the system
4. **Error Handling**: Individual device failures don't affect other devices
5. **Health Monitoring**: Each device has its own health check endpoint

## 📈 **Scaling Considerations**

- **Performance**: Process devices in batches of 3 to avoid memory issues
- **Network**: Each device connection is independent and retried separately
- **Monitoring**: Use `/devices/health` to monitor all device statuses
- **Logging**: Each device operation is logged with device prefix for easy tracking

## 🔄 **Migration from Single Device**

1. **Keep existing configuration**: Legacy `MB460_*` variables still work
2. **Add new devices**: Configure additional devices with `PK01_*`, `US01_*`, etc.
3. **Update endpoints**: Change from `/attendance` to `/pk01/attendance` for explicit device targeting
4. **Test thoroughly**: Verify all devices are accessible before production deployment
