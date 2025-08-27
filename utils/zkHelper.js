// utils/zkHelper.js - Shared ZK device helper functions for multi-device support
const ZKLib = require('node-zklib');
const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('./errorTracker');

/**
 * Create a new ZK instance for a specific device
 * @param {string} deviceId - Device ID (e.g., 'pk01', 'us01')
 * @returns {ZKLib} ZK instance
 */
function createZKInstance(deviceId = 'pk01') {
    try {
        const device = getDeviceConfig(deviceId);
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        
        console.log(`🔗 Creating ZK instance for device ${deviceId} (${device.ip}:${device.port})`);
        return new ZKLib(device.ip, device.port, device.timeout, device.inport);
    } catch (error) {
        throw errorTracker.setError(ERROR_STEPS.ZK_HELPER, `Failed to create ZK instance for ${deviceId}: ${error.message}`, { deviceId, error: error.message });
    }
}

/**
 * Create a new ZK instance with explicit parameters (for testing alternate endpoints)
 * @param {string} ip
 * @param {number} port
 * @param {number} timeout
 * @param {number} inport
 * @returns {ZKLib}
 */
function createZKInstanceWith(ip, port, timeout, inport) {
    try {
        return new ZKLib(ip, port, timeout || config.DEVICE_MANAGEMENT.CONNECTION_TIMEOUT, inport || config.DEVICE_MANAGEMENT.DEFAULT_INPORT);
    } catch (error) {
        throw errorTracker.setError(ERROR_STEPS.ZK_HELPER, `Failed to create ZK instance (custom): ${error.message}`, { ip, port, timeout, inport });
    }
}

/**
 * Get device configuration by ID
 * @param {string} deviceId - Device ID (e.g., 'pk01', 'us01')
 * @returns {Object|null} Device configuration
 */
function getDeviceConfig(deviceId) {
    return config.ENV.DEVICES.find(device => device.id === deviceId) || null;
}

/**
 * Get all device configurations
 * @returns {Array} Array of device configurations
 */
function getAllDeviceConfigs() {
    return config.ENV.DEVICES;
}

/**
 * Get devices by country
 * @param {string} country - Country code (e.g., 'PK', 'US')
 * @returns {Array} Array of device configurations for the country
 */
function getDevicesByCountry(country) {
    return config.ENV.DEVICES.filter(device => device.country === country);
}

/**
 * Validate device ID
 * @param {string} deviceId - Device ID to validate
 * @returns {boolean} True if valid device ID
 */
function isValidDeviceId(deviceId) {
    return config.ENV.DEVICES.some(device => device.id === deviceId);
}

/**
 * Safely disconnect from ZK device
 * @param {ZKLib} zkInstance - ZK instance to disconnect
 */
async function safeDisconnect(zkInstance) {
    if (zkInstance) {
        try {
            await zkInstance.disconnect();
            console.log('✅ ZKTeco connection closed safely');
        } catch (e) {
            // Log disconnect errors but don't throw or track them (non-critical)
            console.log('⚠️ Warning: Could not disconnect cleanly');
            // Don't track disconnect errors as they're not critical
            // errorTracker.setError(ERROR_STEPS.ZK_DISCONNECT, `ZK disconnect failed: ${e.message}`, { originalError: e.message });
        }
    }
}

/**
 * Get attendance data with retry mechanism and validation for specific device
 * @param {ZKLib} zkInstance - ZK instance
 * @param {string} deviceId - Device ID for logging
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Attendance data
 */
async function getAttendanceDataWithRetry(zkInstance, deviceId = 'unknown', maxRetries = 3) {
    let retryCount = 0;
    let lastError = null;
    let bestResult = null;
    
    while (retryCount < maxRetries) {
        try {
            console.log(`📥 [${deviceId}] Attempting to fetch attendance logs (attempt ${retryCount + 1}/${maxRetries})...`);
            const logs = await zkInstance.getAttendances();
            
            // Validate that we got complete data
            if (logs && logs.data && logs.data.length > 0) {
                // For new devices, accept any data we get (even if less than 100 records)
                if (logs.data.length >= 50) {
                    console.log(`✅ [${deviceId}] Successfully retrieved ${logs.data.length} attendance records`);
                    return logs;
                } else if (logs.data.length >= 10) {
                    // Accept smaller amounts of data for new devices
                    console.log(`✅ [${deviceId}] Retrieved ${logs.data.length} attendance records (new device - accepting smaller dataset)`);
                    return logs;
                } else {
                    console.log(`⚠️ [${deviceId}] Warning: Retrieved only ${logs.data.length} records, which seems very low. Retrying...`);
                    lastError = new Error(`Very low data: only ${logs.data.length} records retrieved`);
                    // Store the best result we've seen so far
                    if (!bestResult || logs.data.length > bestResult.data.length) {
                        bestResult = logs;
                    }
                }
            } else {
                console.log(`⚠️ [${deviceId}] Warning: No attendance data received. Retrying...`);
                lastError = new Error('No attendance data received');
            }
        } catch (error) {
            console.log(`❌ [${deviceId}] Error fetching attendance logs (attempt ${retryCount + 1}): ${error.message}`);
            lastError = error;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
            // Wait before retry with exponential backoff
            const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 10000); // Max 10 seconds
            console.log(`⏳ [${deviceId}] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    // If we have some data but not enough, return what we have
    if (bestResult && bestResult.data.length > 0) {
        console.log(`⚠️ [${deviceId}] Returning best available data: ${bestResult.data.length} records`);
        return bestResult;
    }
    
    // If we get here, all retries failed
    throw new Error(`[${deviceId}] Failed to fetch attendance logs after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get attendance data from multiple devices in parallel
 * @param {Array<string>} deviceIds - Array of device IDs to fetch from
 * @param {number} maxConcurrent - Maximum concurrent connections
 * @returns {Promise<Object>} Combined attendance data from all devices
 */
async function getAttendanceDataFromMultipleDevices(deviceIds, maxConcurrent = 3) {
    const results = {
        success: true,
        timestamp: new Date().toISOString(),
        devices: {},
        summary: {
            totalDevices: deviceIds.length,
            successfulDevices: 0,
            failedDevices: 0,
            totalRecords: 0
        }
    };

    // Process devices in batches to avoid overwhelming the system
    for (let i = 0; i < deviceIds.length; i += maxConcurrent) {
        const batch = deviceIds.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (deviceId) => {
            let zkInstance = null;
            try {
                zkInstance = createZKInstance(deviceId);
                await zkInstance.createSocket();
                
                const logs = await getAttendanceDataWithRetry(zkInstance, deviceId, 3);
                
                results.devices[deviceId] = {
                    success: true,
                    recordCount: logs.data.length,
                    data: logs.data,
                    deviceInfo: getDeviceConfig(deviceId)
                };
                
                results.summary.successfulDevices++;
                results.summary.totalRecords += logs.data.length;
                
            } catch (error) {
                results.devices[deviceId] = {
                    success: false,
                    error: error.message,
                    deviceInfo: getDeviceConfig(deviceId)
                };
                results.summary.failedDevices++;
            } finally {
                await safeDisconnect(zkInstance);
            }
        });
        
        await Promise.all(batchPromises);
    }
    
    return results;
}

/**
 * Get device health status
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} Device health information
 */
async function getDeviceHealth(deviceId) {
    let zkInstance = null;
    try {
        const device = getDeviceConfig(deviceId);
        if (!device) {
            return {
                success: false,
                error: `Device not found: ${deviceId}`,
                deviceId
            };
        }
        
        zkInstance = createZKInstance(deviceId);
        await zkInstance.createSocket();
        
        // Try to get basic device info
        const deviceInfo = await zkInstance.getInfo();
        
        return {
            success: true,
            deviceId,
            deviceInfo: device,
            status: 'online',
            timestamp: new Date().toISOString(),
            deviceData: deviceInfo
        };
        
    } catch (error) {
        return {
            success: false,
            deviceId,
            error: error.message,
            status: 'offline',
            timestamp: new Date().toISOString()
        };
    } finally {
        await safeDisconnect(zkInstance);
    }
}

module.exports = {
    createZKInstance,
    createZKInstanceWith,
    safeDisconnect,
    getDeviceConfig,
    getAllDeviceConfigs,
    getDevicesByCountry,
    isValidDeviceId,
    getAttendanceDataWithRetry,
    getAttendanceDataFromMultipleDevices,
    getDeviceHealth
};
