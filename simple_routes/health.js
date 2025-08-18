// routes/health.js - Health check and documentation endpoints
const express = require('express');
const router = express.Router();
const config = require('../config');

// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ZKTeco MB460 API',
        version: '1.0.0'
    });
});

module.exports = router;
