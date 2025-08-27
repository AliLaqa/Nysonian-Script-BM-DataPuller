// simple_routes/devices.js - Device management endpoints
const express = require('express');
const router = express.Router();
const { getAllDeviceConfigs, getDevicesByCountry, getAttendanceDataFromMultipleDevices, getDeviceHealth } = require('../utils/zkHelper');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

// GET /devices - List all configured devices
router.get('/', async (req, res) => {
    try {
        const devices = getAllDeviceConfigs();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            totalDevices: devices.length,
            devices: devices.map(device => ({
                id: device.id,
                prefix: device.prefix,
                name: device.name,
                location: device.location,
                country: device.country,
                ip: device.ip,
                port: device.port,
                model: device.model,
                description: device.description
            }))
        });
    } catch (error) {
        console.error('❌ Devices List Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /devices/country/:country - List devices by country
router.get('/country/:country', async (req, res) => {
    try {
        const { country } = req.params;
        const devices = getDevicesByCountry(country.toUpperCase());
        
        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: `No devices found for country: ${country}`,
                availableCountries: ['PK', 'US', 'UK', 'AE']
            });
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            country: country.toUpperCase(),
            totalDevices: devices.length,
            devices: devices.map(device => ({
                id: device.id,
                prefix: device.prefix,
                name: device.name,
                location: device.location,
                country: device.country,
                ip: device.ip,
                port: device.port,
                model: device.model,
                description: device.description
            }))
        });
    } catch (error) {
        console.error('❌ Devices by Country Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /devices/health - Health check for all devices
router.get('/health', async (req, res) => {
    try {
        const devices = getAllDeviceConfigs();
        const healthResults = {};
        let onlineDevices = 0;
        let offlineDevices = 0;
        
        // Check health for each device
        for (const device of devices) {
            const health = await getDeviceHealth(device.id);
            healthResults[device.id] = health;
            
            if (health.status === 'online') {
                onlineDevices++;
            } else {
                offlineDevices++;
            }
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                totalDevices: devices.length,
                onlineDevices: onlineDevices,
                offlineDevices: offlineDevices,
                uptime: `${onlineDevices}/${devices.length} devices online`
            },
            devices: healthResults
        });
    } catch (error) {
        console.error('❌ Devices Health Check Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /devices/attendance/all - Get attendance from all devices
router.get('/attendance/all', async (req, res) => {
    try {
        const devices = getAllDeviceConfigs();
        const deviceIds = devices.map(device => device.id);
        
        console.log(`🔄 Fetching attendance from all ${deviceIds.length} devices...`);
        
        const results = await getAttendanceDataFromMultipleDevices(deviceIds, 3);
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                totalDevices: results.summary.totalDevices,
                successfulDevices: results.summary.successfulDevices,
                failedDevices: results.summary.failedDevices,
                totalRecords: results.summary.totalRecords
            },
            devices: results.devices
        });
    } catch (error) {
        console.error('❌ All Devices Attendance Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /devices/attendance/country/:country - Get attendance from devices in specific country
router.get('/attendance/country/:country', async (req, res) => {
    try {
        const { country } = req.params;
        const devices = getDevicesByCountry(country.toUpperCase());
        
        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: `No devices found for country: ${country}`,
                availableCountries: ['PK', 'US', 'UK', 'AE']
            });
        }
        
        const deviceIds = devices.map(device => device.id);
        console.log(`🔄 Fetching attendance from ${deviceIds.length} devices in ${country}...`);
        
        const results = await getAttendanceDataFromMultipleDevices(deviceIds, 3);
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            country: country.toUpperCase(),
            summary: {
                totalDevices: results.summary.totalDevices,
                successfulDevices: results.summary.successfulDevices,
                failedDevices: results.summary.failedDevices,
                totalRecords: results.summary.totalRecords
            },
            devices: results.devices
        });
    } catch (error) {
        console.error('❌ Country Devices Attendance Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
