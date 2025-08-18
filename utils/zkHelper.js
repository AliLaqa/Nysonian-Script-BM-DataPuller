// utils/zkHelper.js - Shared ZK device helper functions
const ZKLib = require('node-zklib');
const config = require('../config');

/**
 * Create a new ZK instance with environment configuration
 * @returns {ZKLib} ZK instance
 */
function createZKInstance() {
    const ip = config.ENV.MB460_IP;
    const port = config.ENV.MB460_PORT;
    const timeout = config.ENV.MB460_TIMEOUT;
    const inport = config.ENV.MB460_INPORT;
    
    return new ZKLib(ip, port, timeout, inport);
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
            // Ignore disconnect errors
            console.log('⚠️ Warning: Could not disconnect cleanly');
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

module.exports = {
    createZKInstance,
    safeDisconnect,
    getDeviceConfig
};
