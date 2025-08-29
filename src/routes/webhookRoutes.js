// src/routes/webhookRoutes.js
// Express routes for webhook endpoints

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Device-scoped webhook endpoints
// GET /:prefix/attendance/webhook/todayShift - Trigger webhook with today's shift data
router.get('/:prefix/attendance/webhook/todayShift', async (req, res) => {
    const { prefix } = req.params;
    const result = await webhookController.triggerDeviceWebhook(prefix, 'todayShift');
    
    res.setHeader('Content-Type', 'application/json');
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// POST /:prefix/attendance/webhook/today - Trigger webhook with today's data
router.post('/:prefix/attendance/webhook/today', async (req, res) => {
    try {
        const { prefix } = req.params;
        const webhookUrl = req.body?.webhookUrl || null;
        
        const options = {};
        if (webhookUrl) {
            options.webhookUrl = webhookUrl;
        }
        
        const result = await webhookController.triggerDeviceWebhook(prefix, 'today', options);
        
        res.setHeader('Content-Type', 'application/json');
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('💥 Error in /:prefix/attendance/webhook/today route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// POST /:prefix/attendance/webhook/date - Trigger webhook with specific date data
router.post('/:prefix/attendance/webhook/date', async (req, res) => {
    try {
        const { prefix } = req.params;
        const date = req.body?.date;
        const webhookUrl = req.body?.webhookUrl || null;
        
        if (!date) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Date is required in request body'
            });
        }
        
        const options = { date, webhookUrl };
        const result = await webhookController.triggerDeviceWebhook(prefix, 'date', options);
        
        res.setHeader('Content-Type', 'application/json');
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('💥 Error in /:prefix/attendance/webhook/date route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// POST /:prefix/attendance/webhook/all - Trigger webhook with enriched attendance data (includes employee names)
router.post('/:prefix/attendance/webhook/all', async (req, res) => {
    try {
        const { prefix } = req.params;
        const webhookUrl = req.body?.webhookUrl || null;
        
        const result = await webhookController.triggerEnrichedAttendanceWebhook(prefix, webhookUrl);
        
        res.setHeader('Content-Type', 'application/json');
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('💥 Error in /:prefix/attendance/webhook/all route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// Fleet-level webhook endpoints
// POST /devices/webhook/todayShift - Trigger webhook for all devices
router.post('/devices/webhook/todayShift', async (req, res) => {
    try {
        const country = req.body?.country;
        const deviceIds = req.body?.deviceIds;
        
        const selector = {};
        if (country) selector.country = country;
        if (deviceIds) selector.deviceIds = deviceIds;
        
        const result = await webhookController.triggerFleetWebhook('todayShift', selector);
        
        res.setHeader('Content-Type', 'application/json');
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('💥 Error in /devices/webhook/todayShift route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// POST /devices/webhook/today - Trigger webhook for all devices with today's data
router.post('/devices/webhook/today', async (req, res) => {
    try {
        const country = req.body?.country;
        const deviceIds = req.body?.deviceIds;
        
        const selector = {};
        if (country) selector.country = country;
        if (deviceIds) selector.deviceIds = deviceIds;
        
        const result = await webhookController.triggerFleetWebhook('today', selector);
        
        res.setHeader('Content-Type', 'application/json');
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('💥 Error in /devices/webhook/today route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// Utility endpoints
// GET /webhook/test - Test webhook functionality
router.get('/webhook/test', async (req, res) => {
    const result = webhookController.testWebhook();
    res.setHeader('Content-Type', 'application/json');
    res.json(result);
});

// POST /webhook/validate - Validate webhook URL
router.post('/webhook/validate', async (req, res) => {
    try {
        const url = req.body?.url;
        
        if (!url) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'URL is required in request body'
            });
        }
        
        const result = webhookController.validateWebhookUrl(url);
        res.setHeader('Content-Type', 'application/json');
        res.json(result);
    } catch (error) {
        console.error('💥 Error in /webhook/validate route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// POST /webhook/send - Send data to custom webhook
router.post('/webhook/send', async (req, res) => {
    try {
        const data = req.body?.data;
        const webhookUrl = req.body?.webhookUrl;
        
        if (!data || !webhookUrl) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Data and webhookUrl are required in request body'
            });
        }
        
        const result = await webhookController.sendToCustomWebhook(data, webhookUrl);
        
        res.setHeader('Content-Type', 'application/json');
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('💥 Error in /webhook/send route:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

module.exports = router;
