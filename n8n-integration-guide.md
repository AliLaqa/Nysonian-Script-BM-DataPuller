# n8n Integration Guide for ZKTeco MB460 API

## 🎯 Prerequisites

Before setting up n8n integration, ensure your local API server is running:
1. **Complete the setup** from `script-start.md`
2. **Start your API server** with `npm start`
3. **Note your machine's IP address** (e.g., `192.168.1.140`)

---

## 📡 API Endpoints for n8n

Your local API server provides these endpoints for n8n integration:

### 🎯 **Primary Endpoints (With Employee Names)**

#### Get Today's Attendance
```
GET http://YOUR_IP:3000/attendance/today
```
**Returns:** Today's attendance with employee names (August 6, 2025)

#### Get Attendance for Specific Date
```
GET http://YOUR_IP:3000/attendance/date/YYYY-MM-DD
```
**Examples:**
- `http://192.168.1.140:3000/attendance/date/2025-08-06`
- `http://192.168.1.140:3000/attendance/date/2025-05-28`

**Returns:** Attendance for specified date with employee names

### 🔧 **Additional Endpoints**

#### Health Check
```
GET http://YOUR_IP:3000/health
```
**Purpose:** Verify API server is running

#### All Attendance Records
```
GET http://YOUR_IP:3000/attendance
```
**Purpose:** Get all attendance records (without employee names)

#### Date Range Filter
```
GET http://YOUR_IP:3000/attendance/filter?startDate=2025-08-01&endDate=2025-08-06
```
**Purpose:** Get attendance records within date range

#### Device Information
```
GET http://YOUR_IP:3000/device/info
```
**Purpose:** Get MB460 device information and status

---

## 🎯 n8n Workflow Setup

### Step 1: Create HTTP Request Node
1. **Add HTTP Request node** in your n8n workflow
2. **Configure the node:**
   - **Method**: `GET`
   - **URL**: `http://YOUR_IP:3000/attendance/date/2025-08-06` (replace with your IP)
   - **Response Format**: `JSON`

### Step 2: Add Schedule Trigger
1. **Add Schedule Trigger node**
2. **Set your preferred interval:**
   - Every 15 minutes: `*/15 * * * *`
   - Every hour: `0 * * * *`
   - Daily at 9 AM: `0 9 * * *`
3. **Connect** Schedule Trigger → HTTP Request

### Step 3: Add Data Processing (Optional)
1. **Add Function node** to process the response
2. **Extract data** from the API response:
   ```javascript
   // Extract detailed records with employee names
   const records = $json.detailedRecords || [];
   
   return records.map(record => ({
     employeeName: record.employeeName,
     deviceUserId: record.deviceUserId,
     timeIn: record.timeOnly,
     date: record.recordDate,
     fullTimestamp: record.recordTimeFormatted
   }));
   ```

### Step 4: Add Google Sheets Integration
1. **Add Google Sheets node**
2. **Configure authentication** (OAuth2 or Service Account)
3. **Set operation**: `Append` or `Update`
4. **Configure your spreadsheet:**
   - **Document ID**: Your Google Sheet ID
   - **Sheet Name**: e.g., "Attendance"
   - **Range**: e.g., "A:E"

### Step 5: Map Data Fields
Map the API response to Google Sheets columns:
- **Column A**: `{{$json.employeeName}}` (Employee Name)
- **Column B**: `{{$json.deviceUserId}}` (Employee ID)
- **Column C**: `{{$json.timeOnly}}` (Time)
- **Column D**: `{{$json.recordDate}}` (Date)
- **Column E**: `{{$json.recordTimeFormatted}}` (Full Timestamp)

### Step 6: Add Error Handling
1. **Add If node** to check API response:
   - **Condition**: `{{$json.success}} = true`
2. **Add Set node** for error formatting
3. **Optional**: Add notification nodes (Slack, Email, etc.)

---

## 📊 Data Structure Reference

### API Response Structure
```json
{
  "success": true,
  "requestedDate": "2025-08-06",
  "totalRecordsForDate": 5,
  "uniqueEmployeesForDate": 2,
  "summary": [...],
  "detailedRecords": [
    {
      "employeeName": "Zeeshan Shad",
      "deviceUserId": "78",
      "timeOnly": "22:41:58",
      "recordDate": "28/05/2025",
      "recordTimeFormatted": "28/05/2025, 22:41:58"
    }
  ]
}
```

### Google Sheets Mapping Options

#### Option 1: Simple Mapping
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Employee Name | Time | Date | Employee ID |

#### Option 2: Detailed Mapping
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Employee Name | Employee ID | Time Only | Date | Full Timestamp |

#### Option 3: Summary View
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Employee Name | First Entry | Last Entry | Total Records |

---

## 📋 Sample n8n Workflow JSON

### Basic Daily Attendance Workflow
```json
{
  "name": "ZKTeco Daily Attendance to Google Sheets",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * *"
            }
          ]
        }
      },
      "name": "Daily at 9 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "http://192.168.1.140:3000/attendance/today",
        "options": {}
      },
      "name": "Get Today's Attendance",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.success}}",
              "value2": true
            }
          ]
        }
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const records = $json.detailedRecords || [];\n\nreturn records.map(record => ({\n  employeeName: record.employeeName,\n  deviceUserId: record.deviceUserId,\n  timeIn: record.timeOnly,\n  date: record.recordDate,\n  fullTimestamp: record.recordTimeFormatted\n}));"
      },
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 220]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "resource": "sheet",
        "operation": "append",
        "documentId": "YOUR_GOOGLE_SHEET_ID",
        "sheetName": "Attendance",
        "range": "A:E",
        "values": {
          "values": [
            [
              "={{$json.employeeName}}",
              "={{$json.deviceUserId}}",
              "={{$json.timeIn}}",
              "={{$json.date}}",
              "={{$json.fullTimestamp}}"
            ]
          ]
        }
      },
      "name": "Append to Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [1120, 220]
    }
  ],
  "connections": {
    "Daily at 9 AM": {
      "main": [
        [
          {
            "node": "Get Today's Attendance",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Today's Attendance": {
      "main": [
        [
          {
            "node": "Check Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Success": {
      "main": [
        [
          {
            "node": "Process Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Data": {
      "main": [
        [
          {
            "node": "Append to Google Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

## 🔧 Troubleshooting

### API Connection Issues

1. **"Connection refused" error:**
   ```bash
   # Check if API server is running
   curl http://YOUR_IP:3000/health
   
   # If not running, start it:
   npm start
   ```

2. **"timeout" error:**
   - Check your machine's IP address is correct in n8n
   - Verify your machine and n8n are on the same network
   - Check firewall settings

3. **"Empty response" or no data:**
   ```bash
   # Test the specific endpoint
   curl http://YOUR_IP:3000/attendance/date/2025-08-06
   
   # Check if date has data
   curl http://YOUR_IP:3000/attendance/date/2025-05-28
   ```

### Data Issues

1. **No employee names showing:**
   - Verify MB460 device has user data
   - Check the `/device/info` endpoint for user count

2. **Wrong date data:**
   - Ensure date format is YYYY-MM-DD
   - Check available dates in your MB460 data

3. **Incomplete records:**
   - Verify MB460 connection is stable
   - Check API server logs for errors

### Google Sheets Issues

1. **Authentication errors:**
   - Verify Google Sheets credentials in n8n
   - Check permissions on target spreadsheet

2. **Data not appearing:**
   - Verify sheet name and range are correct
   - Check data mapping in Google Sheets node

### Testing Your Setup

```bash
# 1. Test API server health
curl http://YOUR_IP:3000/health

# 2. Test today's attendance
curl http://YOUR_IP:3000/attendance/today

# 3. Test specific date with data
curl http://YOUR_IP:3000/attendance/date/2025-05-28

# 4. Check device connection
curl http://YOUR_IP:3000/device/info
```

---

## 🎯 Advanced Configuration

### Dynamic Date Handling
Use n8n expressions for dynamic dates:
```javascript
// Today's date
{{new Date().toISOString().split('T')[0]}}

// Yesterday's date  
{{new Date(Date.now() - 86400000).toISOString().split('T')[0]}}

// Specific date format
http://YOUR_IP:3000/attendance/date/{{new Date().toISOString().split('T')[0]}}
```

### Multiple Date Ranges
Create separate workflows for different date ranges:
- **Daily**: Gets today's attendance every morning
- **Weekly**: Gets last week's summary every Monday
- **Monthly**: Gets monthly report on 1st of each month

### Error Notifications
Add notification nodes for errors:
1. **Slack notification** for API failures
2. **Email alerts** for connection issues
3. **Webhook** to monitoring systems

---

## 🎉 Success Indicators

✅ **n8n Workflow Running:** Green status indicators  
✅ **API Responding:** Health check returns `{"status": "OK"}`  
✅ **Data Flowing:** Google Sheets updating with employee names  
✅ **No Errors:** Clean execution logs in n8n  

Your automated attendance system is now fully operational! 🚀

**Data Flow:** MB460 → Your Local API → n8n Cloud → Google Sheets