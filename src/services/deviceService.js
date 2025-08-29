// src/services/deviceService.js
// Business logic for device management

const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

/**
 * Validate if a device ID exists in configuration
 * @param {string} deviceId - Device ID to validate
 * @returns {boolean} True if valid device ID
 */
function validateDeviceId(deviceId) {
    if (!deviceId || typeof deviceId !== 'string') {
        return false;
    }
    return config.ENV.DEVICES.some(device => device.id === deviceId);
}

/**
 * Get device configuration by ID
 * @param {string} deviceId - Device ID (e.g., 'pk01', 'us01')
 * @returns {Object|null} Device configuration or null if not found
 */
function getDeviceConfig(deviceId) {
    if (!validateDeviceId(deviceId)) {
        return null;
    }
    return config.ENV.DEVICES.find(device => device.id === deviceId);
}

/**
 * Get all device configurations
 * @returns {Array} Array of device configurations
 */
function getAllDevices() {
    return config.ENV.DEVICES.map(device => ({
        id: device.id,
        prefix: device.prefix,
        name: device.name,
        model: device.model,
        location: device.location,
        country: device.country,
        description: device.description,
        ip: device.ip,
        port: device.port,
        timeout: device.timeout,
        inport: device.inport
    }));
}

/**
 * Get devices by country code
 * @param {string} countryCode - Country code (e.g., 'PK', 'US')
 * @returns {Array} Array of device configurations for the country
 */
function getDevicesByCountry(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') {
        return [];
    }
    
    const upperCountry = countryCode.toUpperCase();
    return config.ENV.DEVICES
        .filter(device => device.country === upperCountry)
        .map(device => ({
            id: device.id,
            prefix: device.prefix,
            name: device.name,
            model: device.model,
            location: device.location,
            country: device.country,
            description: device.description
        }));
}

/**
 * Get device summary statistics
 * @returns {Object} Summary of all devices
 */
function getDeviceSummary() {
    const devices = getAllDevices();
    const countries = [...new Set(devices.map(d => d.country))];
    
    return {
        totalDevices: devices.length,
        countries: countries.map(country => ({
            country,
            count: devices.filter(d => d.country === country).length,
            devices: devices.filter(d => d.country === country).map(d => d.id)
        })),
        models: [...new Set(devices.map(d => d.model))],
        locations: [...new Set(devices.map(d => d.location))]
    };
}

module.exports = {
    validateDeviceId,
    getDeviceConfig,
    getAllDevices,
    getDevicesByCountry,
    getDeviceSummary
};
