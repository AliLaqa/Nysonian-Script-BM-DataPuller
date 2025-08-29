// src/controllers/deviceController.js
// HTTP controllers for device management endpoints

const deviceService = require('../services/deviceService');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

/**
 * Get device information by prefix
 * @param {string} prefix - Device prefix (e.g., 'pk01', 'us01')
 * @returns {Object} Device information response
 */
function getDeviceInfo(prefix) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.DEVICE_CONTROLLER, 'Device prefix is required');
        }
        
        const deviceConfig = deviceService.getDeviceConfig(prefix);
        if (!deviceConfig) {
            throw errorTracker.setError(ERROR_STEPS.DEVICE_CONTROLLER, `Device not found: ${prefix}`);
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                id: deviceConfig.id,
                prefix: deviceConfig.prefix,
                name: deviceConfig.name,
                model: deviceConfig.model,
                location: deviceConfig.location,
                country: deviceConfig.country,
                description: deviceConfig.description,
                ip: deviceConfig.ip,
                port: deviceConfig.port,
                timeout: deviceConfig.timeout,
                inport: deviceConfig.inport
            },
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get all devices with summary
 * @returns {Object} All devices response
 */
function getAllDevices() {
    try {
        errorTracker.reset();
        
        const devices = deviceService.getAllDevices();
        const summary = deviceService.getDeviceSummary();
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: devices,
            summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get devices by country
 * @param {string} countryCode - Country code (e.g., 'PK', 'US')
 * @returns {Object} Devices by country response
 */
function getDevicesByCountry(countryCode) {
    try {
        errorTracker.reset();
        
        if (!countryCode) {
            throw errorTracker.setError(ERROR_STEPS.DEVICE_CONTROLLER, 'Country code is required');
        }
        
        const devices = deviceService.getDevicesByCountry(countryCode);
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: devices,
            summary: {
                country: countryCode.toUpperCase(),
                count: devices.length,
                devices: devices.map(d => d.id)
            },
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Validate device prefix
 * @param {string} prefix - Device prefix to validate
 * @returns {Object} Validation response
 */
function validateDevicePrefix(prefix) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.DEVICE_CONTROLLER, 'Device prefix is required');
        }
        
        const isValid = deviceService.validateDeviceId(prefix);
        const deviceConfig = isValid ? deviceService.getDeviceConfig(prefix) : null;
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                prefix,
                isValid,
                device: deviceConfig ? {
                    id: deviceConfig.id,
                    name: deviceConfig.name,
                    location: deviceConfig.location,
                    country: deviceConfig.country
                } : null
            },
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

module.exports = {
    getDeviceInfo,
    getAllDevices,
    getDevicesByCountry,
    validateDevicePrefix
};
