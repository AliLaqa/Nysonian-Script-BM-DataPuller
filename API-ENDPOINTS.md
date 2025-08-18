# API Endpoints

Simple reference for all available API endpoints.

## Health & Documentation
- `GET /health` - Health check and server status
- `GET /` - API documentation and overview

## Attendance Data
- `GET /attendance` - Get all attendance logs
- `GET /attendance/filter?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Filtered attendance by date range
- `GET /attendance/date/YYYY-MM-DD` - Specific date attendance with employee names
- `GET /attendance/today` - Today's attendance with employee names

## Today's Shift (Spanning Midnight)
- `GET /todayShift` - Complete shift data (5 PM yesterday to 3 AM today)
- `GET /todayShift/employees` - Employee shift summary only
- `GET /todayShift/checkin` - Shift check-in data (yesterday's last entries)
- `GET /todayShift/checkout` - Shift check-out data (today's first entries)

## Webhook Integration
- `GET /webhook/today` - Get today's data and send to N8N webhook
- `GET /webhook/date/{date}` - Get specific date data and send to N8N webhook
- `GET /webhook/todayShift` - Get today's shift data and send to N8N webhook
- `GET /webhook/test` - Test endpoint with instructions

## Device Information
- `GET /device/info` - Device information and status
- `GET /device/status` - Device connection status

## Usage Examples

```bash
# Health check
curl http://localhost:3000/health

# Today's attendance
curl http://localhost:3000/attendance/today

# Today's shift data
curl http://localhost:3000/todayShift

# Specific date
curl http://localhost:3000/attendance/date/2025-01-27

# Webhook trigger
curl http://localhost:3000/webhook/today
```

## Base URL
- Local: `http://localhost:3000`
- Network: `http://YOUR_IP:3000`
