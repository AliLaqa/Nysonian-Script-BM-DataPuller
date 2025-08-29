// src/routes/shiftRoutes.js
// Express routes for shift endpoints

const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// Device-scoped shift endpoints
// GET /:prefix/attendance/todayShift - Get today's shift data (spanning midnight)
router.get('/:prefix/attendance/todayShift', async (req, res) => {
    const { prefix } = req.params;
    const result = await shiftController.getTodayShift(prefix);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// GET /:prefix/attendance/todayShift/checkin - Get shift check-in data
router.get('/:prefix/attendance/todayShift/checkin', async (req, res) => {
    const { prefix } = req.params;
    const result = await shiftController.getShiftCheckin(prefix);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// GET /:prefix/attendance/todayShift/checkout - Get shift check-out data
router.get('/:prefix/attendance/todayShift/checkout', async (req, res) => {
    const { prefix } = req.params;
    const result = await shiftController.getShiftCheckout(prefix);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// Fleet-level shift endpoints
// GET /attendance/all-devices/todayShift - Get shift data from all devices
router.get('/attendance/all-devices/todayShift', async (req, res) => {
    const result = await shiftController.getAllDevicesShift();
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// POST /:prefix/attendance/todayShift/process - Process shift data with custom config
router.post('/:prefix/attendance/todayShift/process', async (req, res) => {
    const { prefix } = req.params;
    const { records, shiftConfig } = req.body;
    
    if (!records) {
        return res.status(400).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Records are required in request body'
        });
    }
    
    const result = shiftController.processShiftData(records, shiftConfig);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

module.exports = router;
