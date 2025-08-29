// src/services/attendanceService.js
// Business logic for attendance operations

const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');
const deviceService = require('./deviceService');
const zkClient = require('../devices/zk/zkClient');

/**
 * Get latest attendance data from a specific device
 * @param {string} prefix - Device prefix (e.g., 'pk01', 'us01')
 * @returns {Promise<Object>} Latest attendance data
 */
async function getLatest(prefix) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Device prefix is required');
        }
        
        // Validate device exists
        const deviceConfig = deviceService.getDeviceConfig(prefix);
        if (!deviceConfig) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, `Device not found: ${prefix}`);
        }
        
        // Connect to ZK device and fetch real attendance data
        let zkInstance = null;
        try {
            console.log(`🔗 [${prefix}] Connecting to ZK device ${deviceConfig.ip}:${deviceConfig.port}...`);
            
            // Create ZK instance with better error handling
            try {
                zkInstance = zkClient.createZKInstance(prefix);
            } catch (zkError) {
                console.error(`❌ [${prefix}] Failed to create ZK instance:`, zkError);
                throw new Error(`Failed to create ZK instance: ${zkError.message || 'Unknown error'}`);
            }
            
            // Connect to socket with better error handling
            try {
                await zkInstance.createSocket();
                console.log(`✅ [${prefix}] Connected to ZK device successfully`);
            } catch (socketError) {
                console.error(`❌ [${prefix}] Failed to connect socket:`, socketError);
                throw new Error(`Failed to connect socket: ${socketError.message || 'Unknown error'}`);
            }
            
            // Fetch attendance data with retry mechanism
            const attendanceLogs = await zkClient.getAttendanceDataWithRetry(zkInstance, prefix, 3);
            
            // Process the attendance data
            const realData = {
                deviceId: prefix,
                deviceName: deviceConfig.name,
                location: deviceConfig.location,
                country: deviceConfig.country,
                lastFetch: new Date().toISOString(),
                recordCount: attendanceLogs.data.length,
                uniqueEmployees: new Set(attendanceLogs.data.map(log => log.uid)).size,
                data: attendanceLogs.data
            };
            
            console.log(`📊 [${prefix}] Retrieved ${realData.recordCount} attendance records`);
            
            return {
                success: true,
                data: realData,
                summary: {
                    deviceId: prefix,
                    recordCount: realData.recordCount,
                    uniqueEmployees: realData.uniqueEmployees,
                    lastFetch: realData.lastFetch
                }
            };
            
        } catch (error) {
            console.error(`❌ [${prefix}] Failed to fetch attendance data: ${error.message}`);
            
            // Provide more specific error messages
            let errorMessage = error.message || 'Unknown error occurred';
            if (errorMessage === 'undefined') {
                errorMessage = 'Connection lost or device unreachable';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'Device connection timeout';
            } else if (errorMessage.includes('connection')) {
                errorMessage = 'Failed to establish connection with device';
            }
            
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, `Failed to fetch attendance data from device ${prefix}: ${errorMessage}`);
        } finally {
            // Always disconnect safely
            if (zkInstance) {
                await zkClient.safeDisconnect(zkInstance);
            }
        }
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data for a specific date from a device
 * @param {string} prefix - Device prefix
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Date-specific attendance data
 */
async function getByDate(prefix, date) {
    try {
        errorTracker.reset();
        
        if (!prefix || !date) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Device prefix and date are required');
        }
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Invalid date format. Use YYYY-MM-DD');
        }
        
        // Validate device exists
        const deviceConfig = deviceService.getDeviceConfig(prefix);
        if (!deviceConfig) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, `Device not found: ${prefix}`);
        }
        
        // TODO: Implement actual date-specific data fetch
        const mockData = {
            deviceId: prefix,
            deviceName: deviceConfig.name,
            date: date,
            recordCount: 0,
            uniqueEmployees: 0,
            data: []
        };
        
        return {
            success: true,
            data: mockData,
            summary: {
                deviceId: prefix,
                date: date,
                recordCount: mockData.recordCount,
                uniqueEmployees: mockData.uniqueEmployees
            }
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data for a date range from a device
 * @param {string} prefix - Device prefix
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Date range attendance data
 */
async function getByRange(prefix, startDate, endDate) {
    try {
        errorTracker.reset();
        
        if (!prefix || !startDate || !endDate) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Device prefix, start date, and end date are required');
        }
        
        // Validate date formats
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Invalid date format. Use YYYY-MM-DD');
        }
        
        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Start date must be before or equal to end date');
        }
        
        // Validate device exists
        const deviceConfig = deviceService.getDeviceConfig(prefix);
        if (!deviceConfig) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, `Device not found: ${prefix}`);
        }
        
        // TODO: Implement actual date range data fetch
        const mockData = {
            deviceId: prefix,
            deviceName: deviceConfig.name,
            startDate: startDate,
            endDate: endDate,
            recordCount: 0,
            uniqueEmployees: 0,
            data: []
        };
        
        return {
            success: true,
            data: mockData,
            summary: {
                deviceId: prefix,
                startDate: startDate,
                endDate: endDate,
                recordCount: mockData.recordCount,
                uniqueEmployees: mockData.uniqueEmployees
            }
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get today's attendance data from a device
 * @param {string} prefix - Device prefix
 * @returns {Promise<Object>} Today's attendance data
 */
async function getToday(prefix) {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return await getByDate(prefix, today);
    } catch (error) {
        return {
            success: false,
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data from all devices
 * @returns {Promise<Object>} Combined attendance data from all devices
 */
async function getAllDevices() {
    try {
        errorTracker.reset();
        
        const devices = deviceService.getAllDevices();
        const results = {
            success: true,
            timestamp: new Date().toISOString(),
            devices: {},
            summary: {
                totalDevices: devices.length,
                successfulDevices: 0,
                failedDevices: 0,
                totalRecords: 0,
                totalUniqueEmployees: 0
            }
        };
        
        // Process each device
        for (const device of devices) {
            try {
                const deviceData = await getLatest(device.id);
                
                if (deviceData.success) {
                    results.devices[device.id] = {
                        success: true,
                        data: deviceData.data,
                        summary: deviceData.summary
                    };
                    results.summary.successfulDevices++;
                    results.summary.totalRecords += deviceData.summary.recordCount || 0;
                    results.summary.totalUniqueEmployees += deviceData.summary.uniqueEmployees || 0;
                } else {
                    results.devices[device.id] = {
                        success: false,
                        error: deviceData.error
                    };
                    results.summary.failedDevices++;
                }
            } catch (error) {
                results.devices[device.id] = {
                    success: false,
                    error: error.message
                };
                results.summary.failedDevices++;
            }
        }
        
        return results;
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data by country
 * @param {string} countryCode - Country code (e.g., 'PK', 'US')
 * @returns {Promise<Object>} Attendance data from devices in the country
 */
async function getByCountry(countryCode) {
    try {
        errorTracker.reset();
        
        if (!countryCode) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_SERVICE, 'Country code is required');
        }
        
        const devices = deviceService.getDevicesByCountry(countryCode);
        if (devices.length === 0) {
            return {
                success: true,
                data: [],
                summary: {
                    country: countryCode.toUpperCase(),
                    deviceCount: 0,
                    totalRecords: 0,
                    totalUniqueEmployees: 0
                }
            };
        }
        
        const results = {
            success: true,
            timestamp: new Date().toISOString(),
            country: countryCode.toUpperCase(),
            devices: {},
            summary: {
                deviceCount: devices.length,
                successfulDevices: 0,
                failedDevices: 0,
                totalRecords: 0,
                totalUniqueEmployees: 0
            }
        };
        
        // Process devices in the country
        for (const device of devices) {
            try {
                const deviceData = await getLatest(device.id);
                
                if (deviceData.success) {
                    results.devices[device.id] = {
                        success: true,
                        data: deviceData.data,
                        summary: deviceData.summary
                    };
                    results.summary.successfulDevices++;
                    results.summary.totalRecords += deviceData.summary.recordCount || 0;
                    results.summary.totalUniqueEmployees += deviceData.summary.uniqueEmployees || 0;
                } else {
                    results.devices[device.id] = {
                        success: false,
                        error: deviceData.error
                    };
                    results.summary.failedDevices++;
                }
            } catch (error) {
                results.devices[device.id] = {
                    success: false,
                    error: error.message
                };
                results.summary.failedDevices++;
            }
        }
        
        return results;
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

module.exports = {
    getLatest,
    getByDate,
    getByRange,
    getToday,
    getAllDevices,
    getByCountry
};
