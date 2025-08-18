// shift_routes/shiftEmployees.js - Employee shift summary endpoint (GET /todayShift/employees)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');

// GET /todayShift/employees - Get just the employee shift summary
router.get('/', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift employee summary...');

        const shiftData = await processTodayShift();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Today\'s shift employee summary retrieved successfully',
            shiftPeriod: shiftData.shiftPeriod,
            totalEmployeesInShift: shiftData.employeeShiftSummary.length,
            data: shiftData.employeeShiftSummary
        });

    } catch (error) {
        console.error('❌ Today Shift Employees API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift employee summary'
        });
    }
});

module.exports = router;
