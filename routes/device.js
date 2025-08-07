// routes/device.js - Device information endpoints
const express = require('express');
const router = express.Router();
const { createZKInstance, safeDisconnect, getDeviceConfig } = require('../utils/zkHelper');

// Get device info endpoint
router.get('/info', async (req, res) => {
    let zkInstance = null;

    try {
        console.log('🔄 Fetching device information...');
        zkInstance = createZKInstance();
        await zkInstance.createSocket();
        
        const info = await zkInstance.getInfo();
        
        const config = getDeviceConfig();
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                ip: config.ip,
                port: config.port,
                userCounts: info.userCounts,
                logCounts: info.logCounts,
                logCapacity: info.logCapacity
            }
        });
    } catch (error) {
        console.error('❌ Device info API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    } finally {
        await safeDisconnect(zkInstance);
    }
});

// Get device status endpoint
router.get('/status', async (req, res) => {
    let zkInstance = null;

    try {
        console.log('🔄 Checking device status...');
        zkInstance = createZKInstance();
        await zkInstance.createSocket();
        
        // Try to get basic info to verify connection
        const info = await zkInstance.getInfo();
        
        const config = getDeviceConfig();
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            status: 'connected',
            deviceInfo: {
                ip: config.ip,
                port: config.port,
                userCounts: info.userCounts,
                logCounts: info.logCounts,
                logCapacity: info.logCapacity
            }
        });
    } catch (error) {
        console.error('❌ Device status check failed:', error);
        const config = getDeviceConfig();
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            status: 'disconnected',
            error: error.message,
            deviceInfo: {
                ip: config.ip,
                port: config.port
            }
        });
    } finally {
        await safeDisconnect(zkInstance);
    }
});

module.exports = router;
