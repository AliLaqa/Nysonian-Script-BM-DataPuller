# API Endpoints

Simple reference for all available API endpoints.

## Health & Documentation
- `GET /attendance/health` - Health check and server status
- `GET /attendance/apiDocumentation` - API documentation and overview

## Attendance Data
- `GET /attendance` - Get all attendance logs
- `GET /attendance/filter/YYYY-MM-DD&YYYY-MM-DD` - Filtered attendance by date range (e.g., /attendance/filter/2025-08-14&2025-08-18)
- `GET /attendance/date/YYYY-MM-DD` - Specific date attendance with employee names
- `GET /attendance/today` - Today's attendance with employee names

## Today's Shift (Spanning Midnight)
- `GET /attendance/todayShift` - Complete shift data (yesterday's last entry to today's first entry)
- `GET /attendance/todayShift/checkin` - Shift check-in data (yesterday's last entries)
- `GET /attendance/todayShift/checkout` - Shift check-out data (today's first entries)

## Webhook Integration
- `GET /attendance/webhook/today` - Get today's data and send to N8N webhook
- `GET /attendance/webhook/date/{date}` - Get specific date data and send to N8N webhook
- `GET /attendance/webhook/todayShift` - Get today's shift data and send to N8N webhook
- `GET /attendance/webhook/test` - Test endpoint with instructions

## Device Information
- `GET /attendance/device/info` - Device information and status
- `GET /attendance/device/status` - Device connection status

## Usage Examples

```bash
# Health check
curl http://localhost:3000/attendance/health

# API documentation
curl http://localhost:3000/attendance/apiDocumentation

# Today's attendance
curl http://localhost:3000/attendance/today

# Today's shift data
curl http://localhost:3000/attendance/todayShift

# Specific date
curl http://localhost:3000/attendance/date/2025-01-27

# Webhook trigger
curl http://localhost:3000/attendance/webhook/today
```

## Base URL
- Local: `http://localhost:3000`
- Network: `http://YOUR_IP:3000`

## API Structure
All endpoints are organized under the `/attendance` base path for consistency and scalability:
- `/attendance/health` - Health monitoring
- `/attendance/apiDocumentation` - API documentation
- `/attendance/*` - All attendance-related endpoints
- `/attendance/webhook/*` - Webhook integration endpoints
- `/attendance/device/*` - Device management endpoints
