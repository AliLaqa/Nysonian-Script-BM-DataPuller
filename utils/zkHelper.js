// utils/zkHelper.js - Shared ZK device helper functions
const ZKLib = require('node-zklib');
const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('./errorTracker');

/**
 * Create a new ZK instance with environment configuration
 * @returns {ZKLib} ZK instance
 */
function createZKInstance() {
    try {
        const ip = config.ENV.MB460_IP;
        const port = config.ENV.MB460_PORT;
        const timeout = config.ENV.MB460_TIMEOUT;
        const inport = config.ENV.MB460_INPORT;
        
        return new ZKLib(ip, port, timeout, inport);
    } catch (error) {
        throw errorTracker.setError(ERROR_STEPS.ZK_HELPER, `Failed to create ZK instance: ${error.message}`, { ip, port, timeout, inport });
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
        return new ZKLib(ip, port, timeout || config.ENV.MB460_TIMEOUT, inport || config.ENV.MB460_INPORT);
    } catch (error) {
        throw errorTracker.setError(ERROR_STEPS.ZK_HELPER, `Failed to create ZK instance (custom): ${error.message}`, { ip, port, timeout, inport });
    }
}

/**
 * Safely disconnect from ZK device
 * @param {ZKLib} zkInstance - ZK instance to disconnect
 */
async function safeDisconnect(zkInstance) {
    if (zkInstance) {
        try {
            await zkInstance.disconnect();
        } catch (e) {
            // Log disconnect errors but don't throw (non-critical)
            console.log('⚠️ Warning: Could not disconnect cleanly');
            errorTracker.setError(ERROR_STEPS.ZK_DISCONNECT, `ZK disconnect failed: ${e.message}`, { originalError: e.message });
        }
    }
}

/**
 * Get device configuration
 * @returns {Object} Device configuration
 */
function getDeviceConfig() {
    return {
        ip: config.ENV.MB460_IP,
        port: config.ENV.MB460_PORT,
        timeout: config.ENV.MB460_TIMEOUT,
        inport: config.ENV.MB460_INPORT
    };
}

/**
 * Get attendance data with retry mechanism and validation
 * @param {ZKLib} zkInstance - ZK instance
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Attendance data
 */
async function getAttendanceDataWithRetry(zkInstance, maxRetries = 3) {
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < maxRetries) {
        try {
            console.log(`📥 Attempting to fetch attendance logs (attempt ${retryCount + 1}/${maxRetries})...`);
            const logs = await zkInstance.getAttendances();
            
            // Validate that we got complete data
            if (logs && logs.data && logs.data.length > 0) {
                // Check if we have a reasonable amount of data (at least 100 records)
                if (logs.data.length >= 100) {
                    console.log(`✅ Successfully retrieved ${logs.data.length} attendance records`);
                    return logs;
                } else {
                    console.log(`⚠️ Warning: Retrieved only ${logs.data.length} records, which seems low. Retrying...`);
                    lastError = new Error(`Insufficient data: only ${logs.data.length} records retrieved`);
                }
            } else {
                console.log('⚠️ Warning: No attendance data received. Retrying...');
                lastError = new Error('No attendance data received');
            }
        } catch (error) {
            console.log(`❌ Error fetching attendance logs (attempt ${retryCount + 1}): ${error.message}`);
            lastError = error;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
            // Wait before retry with exponential backoff
            const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 10000); // Max 10 seconds
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    // If we get here, all retries failed
    throw new Error(`Failed to fetch attendance logs after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

module.exports = {
    createZKInstance,
    createZKInstanceWith,
    safeDisconnect,
    getDeviceConfig,
    getAttendanceDataWithRetry
};
