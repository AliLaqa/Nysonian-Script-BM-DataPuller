// src/routes/attendanceRoutes.js
// Express routes for attendance endpoints

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Device-scoped attendance endpoints
// GET /:prefix/attendance - Get latest attendance for device
router.get('/:prefix/attendance', async (req, res) => {
    const { prefix } = req.params;
    const result = await attendanceController.getLatest(prefix);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// GET /:prefix/attendance/date/:date - Get date-specific attendance
router.get('/:prefix/attendance/date/:date', async (req, res) => {
    const { prefix, date } = req.params;
    const result = await attendanceController.getByDate(prefix, date);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// GET /:prefix/attendance/filter/:start/:end - Get filtered attendance
router.get('/:prefix/attendance/filter/:start/:end', async (req, res) => {
    const { prefix, start, end } = req.params;
    const result = await attendanceController.getByRange(prefix, start, end);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// GET /:prefix/attendance/today - Get today's attendance
router.get('/:prefix/attendance/today', async (req, res) => {
    const { prefix } = req.params;
    const result = await attendanceController.getToday(prefix);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// Fleet-level attendance endpoints
// GET /attendance/all-devices - Get attendance from all devices
router.get('/attendance/all-devices', async (req, res) => {
    const result = await attendanceController.getAllDevices();
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// GET /country/:code/attendance - Get attendance by country
router.get('/country/:code/attendance', async (req, res) => {
    const { code } = req.params;
    const result = await attendanceController.getByCountry(code);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

module.exports = router;
