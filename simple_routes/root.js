// routes/root.js - Root API documentation endpoint
const express = require('express');
const router = express.Router();
const config = require('../config');

// Root API documentation endpoint
router.get('/', (req, res) => {
    res.json({
        service: 'ZKTeco MB460 API for n8n Integration',
        version: '1.0.0',
        baseUrl: '/attendance',
        endpoints: {
            'GET /attendance/health': 'Health check',
            'GET /attendance/apiDocumentation': 'This API documentation',
            'GET /attendance': 'Get all attendance logs',
            'GET /attendance/filter/YYYY-MM-DD&YYYY-MM-DD': 'Get filtered attendance logs (e.g., /attendance/filter/2025-08-14&2025-08-18)',
            'GET /attendance/date/YYYY-MM-DD': 'Get attendance for specific date with employee names (e.g., /attendance/date/2025-05-28)',
            'GET /attendance/today': 'Get today\'s attendance with employee names',
            'GET /attendance/todayShift': 'Complete shift data (yesterday\'s last entry to today\'s first entry)',
            'GET /attendance/todayShift/checkin': 'Shift check-in data (yesterday\'s last entries)',
            'GET /attendance/todayShift/checkout': 'Shift check-out data (today\'s first entries)',
            'GET /attendance/device/info': 'Get device information',
            'GET /attendance/device/status': 'Get device connection status',
            'GET /attendance/webhook/today': 'Get today\'s data and send to N8N webhook',
            'GET /attendance/webhook/date/{date}': 'Get specific date data and send to N8N webhook',
            'GET /attendance/webhook/todayShift': 'Get today\'s shift data and send to N8N webhook',
            'GET /attendance/webhook/test': 'Test endpoint with instructions'
        },
        configuration: {
            MB460_IP: config.ENV.MB460_IP,
            MB460_PORT: config.ENV.MB460_PORT,
            API_PORT: config.ENV.API_PORT,
            API_HOST: config.ENV.API_HOST
        }
    });
});

module.exports = router;


//'GET /attendance/health': Working
// 'GET /attendance/apiDocumentation': Working
// 'GET /attendance': Working
// 'GET /attendance/filter/YYYY-MM-DD&YYYY-MM-DD': Working
// 'GET /attendance/date/YYYY-MM-DD': Working
// 'GET /attendance/today': Check after 2 am
// 'GET /attendance/todayShift': Gave the CheckIn's, Check after 2am for Checkout's

// 'GET /attendance/todayShift/checkin': Check after 2 am, 
// change (if now time = past 12am before 12pm then (yesterday entry after 12pm before 12am) = CheckIn) 
// else (if now time = past 12pm before 12am then (today entry after 12pm before 12am) = CheckIn)

// 'GET /attendance/todayShift/checkout': Check after 2 am,
// change (if now time = past 12am before 12pm then (today entry after 12am before 12pm) = CheckOut)
// else (if now time = past 12pm before 12am then (tomorrow entry after 12am before 12pm) = CheckOut)

// 'GET /attendance/device/info': Working
// 'GET /attendance/device/status': Working
// 'GET /attendance/webhook/today': Check after 2 am
// 'GET /attendance/webhook/date/{date}': Working
// 'GET /attendance/webhook/todayShift': Working (Fixed - Now shows proper check-in/check-out data)
// 'GET /attendance/webhook/test': Working
