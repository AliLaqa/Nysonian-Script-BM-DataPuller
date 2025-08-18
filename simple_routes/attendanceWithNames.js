// routes/attendanceWithNames.js - Attendance endpoints with employee names
const express = require('express');
const router = express.Router();
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');

// Helper function to process attendance data with employee names
async function processAttendanceWithNames(dateFilter = null) {
    // Get enriched attendance data from the attendance API
    const result = await getEnrichedAttendanceData();
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    // Apply date filter if provided
    let filteredLogs = result.data;
    if (dateFilter) {
        filteredLogs = result.data.filter(record => {
            const recordDate = new Date(record.recordTime);
            // Use local date formatting to ensure consistent timezone handling
            const recordDateStr = recordDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            return recordDateStr === dateFilter;
        });
    }

    // Group by employee for summary
    const employeeSummary = {};
    filteredLogs.forEach(record => {
        const key = record.deviceUserId;
        if (!employeeSummary[key]) {
            employeeSummary[key] = {
                deviceUserId: record.deviceUserId,
                employeeName: record.employeeName,
                employeeRole: record.employeeRole,
                totalRecords: 0,
                firstEntry: null,
                lastEntry: null
            };
        }
        employeeSummary[key].totalRecords++;
        
        if (!employeeSummary[key].firstEntry || new Date(record.recordTime) < new Date(employeeSummary[key].firstEntry.recordTime)) {
            // Remove employeeName from firstEntry
            const { employeeName, ...firstEntryRest } = record;
            employeeSummary[key].firstEntry = firstEntryRest;
        }
        if (!employeeSummary[key].lastEntry || new Date(record.recordTime) > new Date(employeeSummary[key].lastEntry.recordTime)) {
            // Remove employeeName from lastEntry
            const { employeeName, ...lastEntryRest } = record;
            employeeSummary[key].lastEntry = lastEntryRest;
        }
    });

    return {
        enrichedLogs: filteredLogs,
        employeeSummary: Object.values(employeeSummary)
    };
}

// Get attendance by date with employee names
router.get('/date/:date', async (req, res) => {
    const requestedDate = req.params.date; // Expected format: YYYY-MM-DD

    try {
        console.log(`🔄 Fetching attendance for ${requestedDate} with employee names...`);

        const { enrichedLogs, employeeSummary } = await processAttendanceWithNames(requestedDate);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            requestedDate: requestedDate,
            dateFormatted: new Date(requestedDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            totalRecordsForDate: enrichedLogs.length,
            uniqueEmployeesForDate: employeeSummary.length,
            data: employeeSummary
        });

    } catch (error) {
        console.error(`❌ Date attendance API Error for ${requestedDate}:`, error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestedDate: requestedDate,
            totalRecordsForDate: 0,
            data: []
        });
    }
});

// Get today's attendance with employee names
router.get('/today', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s attendance with employee names...');

        // Get today's actual date dynamically
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        
        const { enrichedLogs, employeeSummary } = await processAttendanceWithNames(todayStr);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            requestedDate: todayStr,
            dateFormatted: today.toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            totalRecordsForDate: enrichedLogs.length,
            uniqueEmployeesForDate: employeeSummary.length,
            data: employeeSummary
        });

    } catch (error) {
        console.error('❌ Today\'s attendance API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestedDate: new Date().toLocaleDateString('en-CA'),
            totalRecordsForDate: 0,
            data: []
        });
    }
});

module.exports = router;
