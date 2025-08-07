// routes/attendanceWithNames.js - Attendance endpoints with employee names
const express = require('express');
const router = express.Router();
const { createZKInstance, safeDisconnect } = require('../utils/zkHelper');

// Helper function to process attendance data with employee names
async function processAttendanceWithNames(zkInstance, dateFilter = null) {
    // Get all users first to map IDs to names
    const users = await zkInstance.getUsers();
    const userMap = {};
    users.data.forEach(user => {
        userMap[user.userId] = {
            name: user.name,
            role: user.role,
            uid: user.uid
        };
    });

    // Get all attendance logs
    const logs = await zkInstance.getAttendances();
    
    // Apply date filter if provided
    let filteredLogs = logs.data;
    if (dateFilter) {
        filteredLogs = logs.data.filter(record => {
            const recordDate = new Date(record.recordTime);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr === dateFilter;
        });
    }

    // Enrich with employee names
    const enrichedLogs = filteredLogs.map(record => ({
        userSn: record.userSn,
        deviceUserId: record.deviceUserId,
        employeeName: userMap[record.deviceUserId]?.name || 'Unknown Employee',
        employeeRole: userMap[record.deviceUserId]?.role || 0,
        recordTime: record.recordTime,
        recordDate: new Date(record.recordTime).toLocaleDateString('en-GB'),
        recordTimeFormatted: new Date(record.recordTime).toLocaleString('en-GB'),
        timeOnly: new Date(record.recordTime).toLocaleTimeString('en-GB'),
        ip: record.ip
    }));

    // Group by employee for summary
    const employeeSummary = {};
    enrichedLogs.forEach(record => {
        const key = record.deviceUserId;
        if (!employeeSummary[key]) {
            employeeSummary[key] = {
                deviceUserId: record.deviceUserId,
                employeeName: record.employeeName,
                employeeRole: record.employeeRole,
                totalRecords: 0,
                firstEntry: null,
                lastEntry: null,
                allRecords: []
            };
        }
        employeeSummary[key].totalRecords++;
        employeeSummary[key].allRecords.push(record);
        
        if (!employeeSummary[key].firstEntry || new Date(record.recordTime) < new Date(employeeSummary[key].firstEntry.recordTime)) {
            employeeSummary[key].firstEntry = record;
        }
        if (!employeeSummary[key].lastEntry || new Date(record.recordTime) > new Date(employeeSummary[key].lastEntry.recordTime)) {
            employeeSummary[key].lastEntry = record;
        }
    });

    return {
        enrichedLogs,
        employeeSummary: Object.values(employeeSummary)
    };
}

// Get attendance by date with employee names
router.get('/date/:date', async (req, res) => {
    const requestedDate = req.params.date; // Expected format: YYYY-MM-DD
    let zkInstance = null;

    try {
        console.log(`🔄 Fetching attendance for ${requestedDate} with employee names...`);
        zkInstance = createZKInstance();
        await zkInstance.createSocket();

        const { enrichedLogs, employeeSummary } = await processAttendanceWithNames(zkInstance, requestedDate);

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
    } finally {
        await safeDisconnect(zkInstance);
    }
});

// Get today's attendance with employee names (August 6, 2025)
router.get('/today', async (req, res) => {
    let zkInstance = null;

    try {
        console.log('🔄 Fetching today\'s attendance with employee names...');
        zkInstance = createZKInstance();
        await zkInstance.createSocket();

        // Filter for today's date (August 6, 2025)
        const today = new Date('2025-08-06');
        const todayStr = today.toISOString().split('T')[0]; // '2025-08-06'
        
        const { enrichedLogs, employeeSummary } = await processAttendanceWithNames(zkInstance, todayStr);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            date: '2025-08-06',
            dateFormatted: 'Tuesday, August 6, 2025',
            totalRecordsToday: enrichedLogs.length,
            uniqueEmployeesToday: employeeSummary.length,
            data: employeeSummary
        });

    } catch (error) {
        console.error('❌ Today\'s attendance API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            date: '2025-08-06',
            totalRecordsToday: 0,
            data: []
        });
    } finally {
        await safeDisconnect(zkInstance);
    }
});

module.exports = router;
