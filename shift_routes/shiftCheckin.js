// shift_routes/shiftCheckin.js - Shift check-in endpoint (GET /todayShift/checkin)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');

// GET /todayShift/checkin - Get shift check-in data (yesterday's last entries)
router.get('/', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift check-in data...');

        const shiftData = await processTodayShift();
        
        // Extract only check-in data
        const checkInData = shiftData.employeeShiftSummary.map(employee => ({
            deviceUserId: employee.deviceUserId,
            employeeName: employee.employeeName,
            employeeRole: employee.employeeRole,
            checkIn: employee.shiftCheckIn
        }));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Today\'s shift check-in data retrieved successfully',
            shiftPeriod: shiftData.shiftPeriod,
            totalEmployeesInShift: checkInData.length,
            data: checkInData
        });

    } catch (error) {
        console.error('❌ Today Shift Check-in API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift check-in data'
        });
    }
});

module.exports = router;
