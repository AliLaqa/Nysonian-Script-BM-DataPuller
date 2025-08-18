// simple_routes/attendanceAll.js - Get all attendance logs with employee names (GET /attendance)
const express = require('express');
const router = express.Router();
const { createZKInstance, safeDisconnect } = require('../utils/zkHelper');

// Get all attendance logs with employee names
router.get('/', async (req, res) => {
    let zkInstance = null;

    try {
        console.log('🔄 Fetching all attendance logs with employee names...');
        zkInstance = createZKInstance();
        await zkInstance.createSocket();

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
        
        // Enrich with employee names
        const enrichedLogs = logs.data.map(record => ({
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

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            recordCount: enrichedLogs.length,
            uniqueEmployees: Object.keys(userMap).length,
            data: enrichedLogs
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
    } finally {
        await safeDisconnect(zkInstance);
    }
});

module.exports = router;
