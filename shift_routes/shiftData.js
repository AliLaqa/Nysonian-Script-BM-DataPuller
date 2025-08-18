// shift_routes/shiftData.js - Main shift data endpoint (GET /todayShift)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');

// GET /todayShift - Get today's shift data (spanning midnight)
router.get('/', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift data (spanning midnight)...');

        const shiftData = await processTodayShift();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Today\'s shift data retrieved successfully',
            shiftData: shiftData,
            summary: {
                totalEmployeesInShift: shiftData.employeeShiftSummary.length,
                shiftPeriod: shiftData.shiftPeriod.description
            }
        });

    } catch (error) {
        console.error('❌ Today Shift API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift data'
        });
    }
});

module.exports = router;
