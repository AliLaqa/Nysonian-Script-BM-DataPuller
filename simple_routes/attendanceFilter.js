// simple_routes/attendanceFilter.js - Get filtered attendance logs with employee names (GET /attendance/filter/:startDate&:endDate)
const express = require('express');
const router = express.Router();
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');

// Get attendance logs with date filtering and employee names
// Route: /attendance/filter/:startDate&:endDate
router.get('/:startDate&:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        console.log(`🔄 Fetching filtered attendance logs with employee names (${startDate} to ${endDate})...`);
        
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Invalid date format. Use YYYY-MM-DD format (e.g., 2025-08-14&2025-08-18)',
                example: '/attendance/filter/2025-08-14&2025-08-18'
            });
        }
        
        // Get enriched attendance data from the attendance API
        const result = await getEnrichedAttendanceData();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Apply date filtering
        const filteredData = result.data.filter(record => {
            const recordDate = new Date(record.recordTime);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return recordDate >= start && recordDate <= end;
        });
        
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
