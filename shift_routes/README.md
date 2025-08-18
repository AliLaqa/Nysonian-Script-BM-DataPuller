# Shift Routes

Simple reference for all shift-related API endpoints.

## Endpoints

- `GET /todayShift` - Complete shift data (5 PM yesterday to 3 AM today)
- `GET /todayShift/employees` - Employee shift summary only
- `GET /todayShift/checkin` - Shift check-in data (yesterday's last entries)
- `GET /todayShift/checkout` - Shift check-out data (today's first entries)

## Files

- `shiftUtils.js` - Shared utility functions for shift processing
- `shiftData.js` - Main shift data endpoint (GET /todayShift)
- `shiftEmployees.js` - Employee shift summary endpoint (GET /todayShift/employees)
- `shiftCheckin.js` - Shift check-in endpoint (GET /todayShift/checkin)
- `shiftCheckout.js` - Shift check-out endpoint (GET /todayShift/checkout)
