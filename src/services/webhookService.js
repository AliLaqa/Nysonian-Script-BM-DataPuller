// src/services/webhookService.js
// Business logic for webhook operations

const axios = require('axios');
const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');
const deviceService = require('./deviceService');
const attendanceService = require('./attendanceService');
const shiftService = require('./shiftService');

/**
 * Send data to N8N webhook
 * @param {Object} data - Data to send
 * @param {string} webhookUrl - N8N webhook URL
 * @returns {Promise<Object>} Webhook delivery result
 */
async function sendToN8N(data, webhookUrl) {
    try {
        errorTracker.reset();
        
        if (!data) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, 'Data is required');
        }
        
        if (!webhookUrl) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, 'Webhook URL is required');
        }
        
        // Validate URL format
        try {
            new URL(webhookUrl);
        } catch (urlError) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, `Invalid webhook URL format: ${webhookUrl}`);
        }
        
        const payload = {
            timestamp: new Date().toISOString(),
            source: config.N8N.PAYLOAD.SOURCE,
            version: config.N8N.PAYLOAD.VERSION,
            data: data
        };
        
        console.log(`🔄 Sending data to N8N webhook: ${webhookUrl}`);
        
        const response = await axios.post(webhookUrl, payload, {
            timeout: config.API.TIMEOUT,
            headers: config.API.HEADERS
        });
        
        return {
            success: true,
            webhookResponse: response.data,
            statusCode: response.status,
            webhookUrl: webhookUrl,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status || 'N/A',
            webhookUrl: webhookUrl,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Trigger webhook for a specific device
 * @param {string} prefix - Device prefix
 * @param {string} type - Webhook type ('today', 'todayShift', 'date')
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Webhook trigger result
 */
async function triggerDeviceWebhook(prefix, type, options = {}) {
    try {
        errorTracker.reset();
        
        if (!prefix || !type) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, 'Device prefix and webhook type are required');
        }
        
        // Validate device exists
        const deviceConfig = deviceService.getDeviceConfig(prefix);
        if (!deviceConfig) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, `Device not found: ${prefix}`);
        }
        
        let data;
        let webhookUrl;
        
        // Get data based on type
        switch (type) {
            case 'today':
                data = await attendanceService.getToday(prefix);
                webhookUrl = options.webhookUrl || config.N8N.WEBHOOKS.TODAY_BM;
                break;
                
            case 'todayShift':
                data = await shiftService.getTodayShift(prefix);
                webhookUrl = options.webhookUrl || config.N8N.WEBHOOKS.TODAY_SHIFT_BM;
                break;
                
            case 'date':
                if (!options.date) {
                    throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, 'Date is required for date webhook type');
                }
                data = await attendanceService.getByDate(prefix, options.date);
                webhookUrl = options.webhookUrl || config.N8N.WEBHOOKS.TODAY_BM;
                break;
                
            default:
                throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, `Invalid webhook type: ${type}`);
        }
        
        if (!data.success) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, `Failed to fetch data: ${data.error}`);
        }
        
        // Send to N8N
        const webhookResult = await sendToN8N(data, webhookUrl);
        
        return {
            success: true,
            deviceId: prefix,
            webhookType: type,
            dataFetched: true,
            webhookResult: webhookResult,
            requestId: errorTracker.requestId
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
 * Trigger webhook for all devices or by selector
 * @param {string} type - Webhook type ('today', 'todayShift')
 * @param {Object} selector - Device selector (country, deviceIds)
 * @returns {Promise<Object>} Fleet webhook result
 */
async function triggerFleetWebhook(type, selector = {}) {
    try {
        errorTracker.reset();
        
        if (!type) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, 'Webhook type is required');
        }
        
        let devices;
        
        // Determine which devices to process
        if (selector.country) {
            devices = deviceService.getDevicesByCountry(selector.country);
        } else if (selector.deviceIds && Array.isArray(selector.deviceIds)) {
            devices = selector.deviceIds
                .map(id => deviceService.getDeviceConfig(id))
                .filter(Boolean);
        } else {
            // Process all devices
            devices = deviceService.getAllDevices();
        }
        
        if (devices.length === 0) {
            return {
                success: true,
                message: 'No devices to process',
                devices: [],
                summary: {
                    totalDevices: 0,
                    successfulDevices: 0,
                    failedDevices: 0
                },
                requestId: errorTracker.requestId
            };
        }
        
        const results = {
            success: true,
            timestamp: new Date().toISOString(),
            webhookType: type,
            devices: {},
            summary: {
                totalDevices: devices.length,
                successfulDevices: 0,
                failedDevices: 0
            }
        };
        
        // Process each device
        for (const device of devices) {
            try {
                const deviceResult = await triggerDeviceWebhook(device.id, type, selector);
                
                if (deviceResult.success) {
                    results.devices[device.id] = {
                        success: true,
                        webhookResult: deviceResult.webhookResult
                    };
                    results.summary.successfulDevices++;
                } else {
                    results.devices[device.id] = {
                        success: false,
                        error: deviceResult.error
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
 * Trigger enriched attendance data webhook for a specific device
 * @param {string} prefix - Device prefix (e.g., 'pk01', 'us01')
 * @param {string} webhookUrl - Custom N8N webhook URL (optional)
 * @returns {Promise<Object>} Enriched data webhook result
 */
async function triggerEnrichedAttendanceWebhook(prefix, webhookUrl = null) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, 'Device prefix is required');
        }
        
        // Validate device exists
        const deviceConfig = deviceService.getDeviceConfig(prefix);
        if (!deviceConfig) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, `Device not found: ${prefix}`);
        }
        
        console.log(`🔗 [${prefix}] Fetching enriched attendance data for webhook...`);
        
        // Get enriched attendance data (includes employee names)
        const attendanceData = await attendanceService.getLatest(prefix);
        
        if (!attendanceData.success) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_SERVICE, `Failed to fetch attendance data: ${attendanceData.error}`);
        }
        
        // Use custom webhook URL or default to enriched data webhook
        const targetWebhookUrl = webhookUrl || 'https://nysonian.app.n8n.cloud/webhook/enriched-data-all-origin';
        
        console.log(`📡 [${prefix}] Sending enriched attendance data to N8N webhook: ${targetWebhookUrl}`);
        
        // Send enriched data to N8N
        const webhookResult = await sendToN8N(attendanceData, targetWebhookUrl);
        
        return {
            success: true,
            deviceId: prefix,
            webhookType: 'enrichedAttendance',
            dataFetched: true,
            recordCount: attendanceData.data?.recordCount || 0,
            uniqueEmployees: attendanceData.data?.uniqueEmployees || 0,
            webhookResult: webhookResult,
            webhookUrl: targetWebhookUrl,
            requestId: errorTracker.requestId
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
 * Validate webhook URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
function validateWebhookUrl(url) {
    try {
        if (!url || typeof url !== 'string') {
            return {
                success: false,
                error: 'URL must be a non-empty string'
            };
        }
        
        new URL(url);
        
        return {
            success: true,
            url: url,
            isValid: true
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Invalid URL format: ${error.message}`,
            url: url,
            isValid: false
        };
    }
}

/**
 * Test webhook functionality
 * @returns {Object} Test result
 */
function testWebhook() {
    return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Webhook service is working correctly',
        capabilities: {
            deviceWebhooks: ['today', 'todayShift', 'date'],
            fleetWebhooks: ['today', 'todayShift'],
            selectors: ['country', 'deviceIds'],
            validation: ['webhookUrl']
        },
        requestId: errorTracker.requestId
    };
}

module.exports = {
    sendToN8N,
    triggerDeviceWebhook,
    triggerFleetWebhook,
    triggerEnrichedAttendanceWebhook,
    validateWebhookUrl,
    testWebhook
};
