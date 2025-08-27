// simple_routes/attendanceAll.js - Get all attendance logs with employee names (GET /attendance)
// Updated to support multi-device endpoints with location-based prefixes
const express = require('express');
const router = express.Router();
const { createZKInstance, safeDisconnect, getAttendanceDataWithRetry, getDeviceConfig, isValidDeviceId } = require('../utils/zkHelper');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

// Legacy endpoint - maps to pk01/attendance for backward compatibility
router.get('/', async (req, res) => {
    // Redirect to pk01/attendance for backward compatibility
    return res.redirect('/pk01/attendance');
});

// Device-specific attendance endpoint: /:prefix/attendance
router.get('/:prefix/attendance', async (req, res) => {
    const { prefix } = req.params;
    let zkInstance = null;

    try {
        // Validate device prefix
        if (!isValidDeviceId(prefix)) {
            return res.status(404).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: `Device not found: ${prefix}`,
                availableDevices: ['pk01', 'us01', 'pk02', 'us02', 'uk01', 'ae01'],
                message: 'Use a valid device prefix (e.g., pk01, us01, pk02, us02)'
            });
        }

        const device = getDeviceConfig(prefix);
        console.log(`🔄 [${prefix}] Fetching all attendance logs with employee names from ${device.location}...`);
        
        zkInstance = createZKInstance(prefix);

        // Establish socket connection with a small retry loop to handle transient WAN issues
        const maxConnectRetries = 3;
        let connected = false;
        for (let attempt = 1; attempt <= maxConnectRetries && !connected; attempt++) {
            try {
                await zkInstance.createSocket();
                connected = true;
                console.log(`✅ [${prefix}] Connected to device successfully`);
            } catch (e) {
                console.log(`❌ [${prefix}] Socket connect failed (attempt ${attempt}/${maxConnectRetries}): ${e.message}`);
                if (attempt === maxConnectRetries) throw e;
                const backoffMs = 1000 * attempt;
                console.log(`⏳ [${prefix}] Retrying connect in ${backoffMs}ms...`);
                await new Promise(r => setTimeout(r, backoffMs));
            }
        }

        // Get all users first to map IDs to names
        console.log(`👥 [${prefix}] Fetching user list from device...`);
        const users = await zkInstance.getUsers();
        const userMap = {};
        users.data.forEach(user => {
            userMap[user.userId] = {
                name: user.name,
                role: user.role,
                uid: user.uid
            };
        });
        console.log(`✅ [${prefix}] Found ${Object.keys(userMap).length} users on device`);

        // Get all attendance logs with retries for network/device hiccups
        const logs = await getAttendanceDataWithRetry(zkInstance, prefix, 3);
        
        // Enrich with employee names and device information
        const enrichedLogs = logs.data.map(record => ({
            userSn: record.userSn,
            deviceUserId: record.deviceUserId,
            employeeName: userMap[record.deviceUserId]?.name || 'Unknown Employee',
            employeeRole: userMap[record.deviceUserId]?.role || 0,
            recordTime: record.recordTime,
            recordDate: new Date(record.recordTime).toLocaleDateString('en-GB'),
            recordTimeFormatted: new Date(record.recordTime).toLocaleString('en-GB'),
            timeOnly: new Date(record.recordTime).toLocaleTimeString('en-GB'),
            ip: record.ip,
            // Add device information
            deviceId: prefix,
            deviceLocation: device.location,
            deviceCountry: device.country
        }));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            device: {
                id: prefix,
                name: device.name,
                location: device.location,
                country: device.country,
                ip: device.ip,
                port: device.port
            },
            recordCount: enrichedLogs.length,
            uniqueEmployees: Object.keys(userMap).length,
            data: enrichedLogs
        });

    } catch (error) {
        console.error(`❌ [${prefix}] API Error:`, error);
        
        const errorResponse = errorTracker.hasError() ? 
            errorTracker.getErrorResponse() : 
            {
                success: false,
                timestamp: new Date().toISOString(),
                deviceId: prefix,
                error: error.message,
                recordCount: 0,
                data: []
            };
        
        res.status(500).json(errorResponse);
    } finally {
        await safeDisconnect(zkInstance);
    }
});

// Device info endpoint: /:prefix/device/info
router.get('/:prefix/device/info', async (req, res) => {
    const { prefix } = req.params;
    let zkInstance = null;

    try {
        // Validate device prefix
        if (!isValidDeviceId(prefix)) {
            return res.status(404).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: `Device not found: ${prefix}`,
                availableDevices: ['pk01', 'us01', 'pk02', 'us02', 'uk01', 'ae01']
            });
        }

        const device = getDeviceConfig(prefix);
        console.log(`🔍 [${prefix}] Fetching device information...`);
        
        zkInstance = createZKInstance(prefix);

        // Try to connect and get device info
        try {
            await zkInstance.createSocket();
            const deviceInfo = await zkInstance.getInfo();
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                device: {
                    id: prefix,
                    name: device.name,
                    location: device.location,
                    country: device.country,
                    ip: device.ip,
                    port: device.port,
                    model: device.model,
                    description: device.description
                },
                status: 'online',
                deviceInfo: deviceInfo
            });
        } catch (connectionError) {
            res.json({
                success: false,
                timestamp: new Date().toISOString(),
                device: {
                    id: prefix,
                    name: device.name,
                    location: device.location,
                    country: device.country,
                    ip: device.ip,
                    port: device.port,
                    model: device.model,
                    description: device.description
                },
                status: 'offline',
                error: connectionError.message
            });
        }

    } catch (error) {
        console.error(`❌ [${prefix}] Device Info Error:`, error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            deviceId: prefix,
            error: error.message
        });
    } finally {
        await safeDisconnect(zkInstance);
    }
});

// Device health endpoint: /:prefix/health
router.get('/:prefix/health', async (req, res) => {
    const { prefix } = req.params;

    try {
        // Validate device prefix
        if (!isValidDeviceId(prefix)) {
            return res.status(404).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: `Device not found: ${prefix}`,
                availableDevices: ['pk01', 'us01', 'pk02', 'us02', 'uk01', 'ae01']
            });
        }

        const device = getDeviceConfig(prefix);
        let zkInstance = null;
        let status = 'offline';
        let deviceInfo = null;

        try {
            zkInstance = createZKInstance(prefix);
            await zkInstance.createSocket();
            deviceInfo = await zkInstance.getInfo();
            status = 'online';
        } catch (error) {
            status = 'offline';
        } finally {
            await safeDisconnect(zkInstance);
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            device: {
                id: prefix,
                name: device.name,
                location: device.location,
                country: device.country,
                ip: device.ip,
                port: device.port
            },
            status: status,
            deviceInfo: deviceInfo
        });

    } catch (error) {
        console.error(`❌ [${prefix}] Health Check Error:`, error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            deviceId: prefix,
            error: error.message
        });
    }
});

module.exports = router;
