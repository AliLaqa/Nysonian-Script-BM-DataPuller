// routes/attendance.js - Attendance-related API endpoints
const express = require('express');
const router = express.Router();
const { pullAttendanceLogs } = require('../pull-logs');

// Get all attendance logs
router.get('/', async (req, res) => {
    try {
        console.log('🔄 Fetching attendance logs...');
        const result = await pullAttendanceLogs();
        
        if (result.success) {
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                recordCount: result.count,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: result.error,
                recordCount: 0,
                data: []
            });
        }
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

// Get attendance logs with date filtering
router.get('/filter', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`🔄 Fetching filtered attendance logs (${startDate} to ${endDate})...`);
        
        const result = await pullAttendanceLogs();
        
        if (result.success) {
            let filteredData = result.data;
            
            // Apply date filtering if provided
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
                totalRecords: result.count,
                filteredRecords: filteredData.length,
                filters: { startDate, endDate },
                data: filteredData
            });
        } else {
            res.status(500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: result.error,
                recordCount: 0,
                data: []
            });
        }
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
