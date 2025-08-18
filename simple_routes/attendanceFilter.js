// simple_routes/attendanceFilter.js - Get filtered attendance logs with employee names (GET /attendance/filter)
const express = require('express');
const router = express.Router();
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');

// Get attendance logs with date filtering and employee names
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`🔄 Fetching filtered attendance logs with employee names (${startDate} to ${endDate})...`);
        
        // Get enriched attendance data from the attendance API
        const result = await getEnrichedAttendanceData();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Apply date filtering if provided
        let filteredData = result.data;
        if (startDate || endDate) {
            filteredData = result.data.filter(record => {
                const recordDate = new Date(record.recordTime);
                const start = startDate ? new Date(startDate) : new Date('1900-01-01');
                const end = endDate ? new Date(endDate) : new Date('2100-12-31');
                
                return recordDate >= start && recordDate <= end;
            });
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            totalRecords: result.data.length,
            filteredRecords: filteredData.length,
            uniqueEmployees: result.uniqueEmployees,
            filters: { startDate, endDate },
            data: filteredData
        });

    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            recordCount: 0,
            data: []
        });
    }
});

module.exports = router;
