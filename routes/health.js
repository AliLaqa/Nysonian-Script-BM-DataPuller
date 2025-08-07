// routes/health.js - Health check and documentation endpoints
const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ZKTeco MB460 API',
        version: '1.0.0'
    });
});

// API documentation endpoint
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
            'GET /device/info': 'Get device information',
            'GET /device/status': 'Get device connection status',
            'GET /': 'This documentation'
        },
        configuration: {
            MB460_IP: process.env.MB460_IP,
            MB460_PORT: process.env.MB460_PORT,
            API_PORT: process.env.API_PORT || 3000,
            API_HOST: process.env.API_HOST || 'localhost'
        }
    });
});

module.exports = router;
