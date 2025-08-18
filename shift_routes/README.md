# Shift Routes

Simple reference for all shift-related API endpoints.

## Endpoints

- `GET /attendance/todayShift` - Complete shift data (yesterday's last entry to today's first entry)
- `GET /attendance/todayShift/checkin` - Shift check-in data (yesterday's last entries)
- `GET /attendance/todayShift/checkout` - Shift check-out data (today's first entries)

## Files

- `shiftUtils.js` - Shared utility functions for shift processing
- `shiftData.js` - Main shift data endpoint (GET /attendance/todayShift)
- `shiftCheckin.js` - Shift check-in endpoint (GET /attendance/todayShift/checkin)
- `shiftCheckout.js` - Shift check-out endpoint (GET /attendance/todayShift/checkout)
