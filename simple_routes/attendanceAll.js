// simple_routes/attendanceAll.js - Get all attendance logs with employee names (GET /attendance)
const express = require('express');
const router = express.Router();
const { createZKInstance, safeDisconnect, getAttendanceDataWithRetry } = require('../utils/zkHelper');

// Get all attendance logs with employee names
router.get('/', async (req, res) => {
    let zkInstance = null;

    try {
        console.log('🔄 Fetching all attendance logs with employee names...');
        zkInstance = createZKInstance();

        // Establish socket connection with a small retry loop to handle transient WAN issues
        const maxConnectRetries = 3;
        let connected = false;
        for (let attempt = 1; attempt <= maxConnectRetries && !connected; attempt++) {
            try {
                await zkInstance.createSocket();
                connected = true;
            } catch (e) {
                console.log(`❌ Socket connect failed (attempt ${attempt}/${maxConnectRetries}): ${e.message}`);
                if (attempt === maxConnectRetries) throw e;
                const backoffMs = 1000 * attempt;
                console.log(`⏳ Retrying connect in ${backoffMs}ms...`);
                await new Promise(r => setTimeout(r, backoffMs));
            }
        }

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

        // Get all attendance logs with retries for network/device hiccups
        const logs = await getAttendanceDataWithRetry(zkInstance, 3);
        
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
