// routes/root.js - Root API documentation endpoint
const express = require('express');
const router = express.Router();
const config = require('../config');

// Root API documentation endpoint
router.get('/', (req, res) => {
    res.json({
        service: 'ZKTeco MB460 API for n8n Integration',
        version: '1.0.0',
        endpoints: {
            'GET /health': 'Health check',
            'GET /attendance': 'Get all attendance logs',
            'GET /attendance/filter?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD': 'Get filtered attendance logs',
            'GET /attendance/date/YYYY-MM-DD': 'Get attendance for specific date with employee names (e.g., /attendance/date/2025-05-28)',
            'GET /attendance/today': 'Get today\'s attendance with employee names (August 6, 2025)',
            'GET /todayShift': 'Complete shift data (5 PM yesterday to 3 AM today)',
            'GET /todayShift/employees': 'Employee shift summary only',
            'GET /todayShift/checkin': 'Shift check-in data (yesterday\'s last entries)',
            'GET /todayShift/checkout': 'Shift check-out data (today\'s first entries)',
            'GET /device/info': 'Get device information',
            'GET /device/status': 'Get device connection status',
            'GET /': 'This documentation'
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
