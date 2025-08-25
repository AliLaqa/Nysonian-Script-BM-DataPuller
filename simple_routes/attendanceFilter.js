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
        
        // Validate date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Start date cannot be after end date',
                startDate,
                endDate
            });
        }
        
        // Check if date range is reasonable (not more than 1 year)
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Date range cannot exceed 1 year',
                startDate,
                endDate,
                daysInRange: daysDiff
            });
        }
        
        // Get enriched attendance data from the attendance API
        const result = await getEnrichedAttendanceData();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Validate that we have data
        if (!result.data || result.data.length === 0) {
            return res.json({
                success: true,
                timestamp: new Date().toISOString(),
                totalRecords: 0,
                filteredRecords: 0,
                uniqueEmployees: 0,
                filters: { startDate, endDate },
                data: [],
                message: 'No attendance data available for the specified date range'
            });
        }
        
        // Apply date filtering with proper timezone handling
        const filteredData = result.data.filter(record => {
            if (!record.recordTime) {
                console.warn('⚠️ Record missing recordTime:', record);
                return false;
            }
            
            const recordDate = new Date(record.recordTime);
            
            // Set time to start of day for start date and end of day for end date
            const startOfDay = new Date(start);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            
            return recordDate >= startOfDay && recordDate <= endOfDay;
        });
        
        // Sort filtered data by record time for consistency
        filteredData.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
        
        // Get unique employees from filtered data
        const uniqueEmployeesInRange = new Set(filteredData.map(record => record.deviceUserId)).size;
        
        // Get date range info for debugging
        const firstRecord = filteredData.length > 0 ? new Date(filteredData[0].recordTime) : null;
        const lastRecord = filteredData.length > 0 ? new Date(filteredData[filteredData.length - 1].recordTime) : null;
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            totalRecords: result.data.length,
            filteredRecords: filteredData.length,
            uniqueEmployees: uniqueEmployeesInRange,
            filters: { 
                startDate, 
                endDate,
                daysInRange: daysDiff
            },
            dataRange: {
                firstRecordDate: firstRecord ? firstRecord.toISOString() : null,
                lastRecordDate: lastRecord ? lastRecord.toISOString() : null,
                actualStartDate: firstRecord ? firstRecord.toLocaleDateString('en-US') : null,
                actualEndDate: lastRecord ? lastRecord.toLocaleDateString('en-US') : null
            },
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
