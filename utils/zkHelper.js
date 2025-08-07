// utils/zkHelper.js - Shared ZK device helper functions
const ZKLib = require('node-zklib');

/**
 * Create a new ZK instance with environment configuration
 * @returns {ZKLib} ZK instance
 */
function createZKInstance() {
    const ip = process.env.MB460_IP || '192.168.1.201';
    const port = parseInt(process.env.MB460_PORT) || 4370;
    const timeout = parseInt(process.env.MB460_TIMEOUT) || 10000;
    const inport = parseInt(process.env.MB460_INPORT) || 4000;
    
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
        ip: process.env.MB460_IP || '192.168.1.201',
        port: parseInt(process.env.MB460_PORT) || 4370,
        timeout: parseInt(process.env.MB460_TIMEOUT) || 10000,
        inport: parseInt(process.env.MB460_INPORT) || 4000
    };
}

module.exports = {
    createZKInstance,
    safeDisconnect,
    getDeviceConfig
};
