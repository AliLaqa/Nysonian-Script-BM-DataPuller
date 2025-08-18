// shift_routes/shiftCheckout.js - Shift check-out endpoint (GET /todayShift/checkout)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');

// GET /attendance/todayShift/checkout - Get shift check-out data (today's first entries)
router.get('/checkout', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift check-out data...');

        const shiftData = await processTodayShift();
        
        // Extract only check-out data
        const checkOutData = shiftData.employeeShiftSummary.map(employee => ({
            deviceUserId: employee.deviceUserId,
            employeeName: employee.employeeName,
            employeeRole: employee.employeeRole,
            checkOut: employee.shiftCheckOut
        }));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Today\'s shift check-out data retrieved successfully',
            shiftPeriod: shiftData.shiftPeriod,
            totalEmployeesInShift: checkOutData.length,
            data: checkOutData
        });

    } catch (error) {
        console.error('❌ Today Shift Check-out API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift check-out data'
        });
    }
});

module.exports = router;
