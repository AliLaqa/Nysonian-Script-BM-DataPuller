// src/controllers/webhookController.js
// HTTP controllers for webhook-related endpoints

const webhookService = require('../services/webhookService');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

/**
 * Trigger webhook for a specific device
 * @param {string} prefix - Device prefix
 * @param {string} type - Webhook type ('today', 'todayShift', 'date')
 * @param {Object} options - Additional options
 * @returns {Object} Webhook trigger response
 */
async function triggerDeviceWebhook(prefix, type, options = {}) {
    try {
        errorTracker.reset();
        
        if (!prefix || !type) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_CONTROLLER, 'Device prefix and webhook type are required');
        }
        
        const result = await webhookService.triggerDeviceWebhook(prefix, type, options);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: {
                deviceId: result.deviceId,
                webhookType: result.webhookType,
                dataFetched: result.dataFetched,
                webhookResult: result.webhookResult
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
 * Trigger webhook for all devices or by selector
 * @param {string} type - Webhook type ('today', 'todayShift')
 * @param {Object} selector - Device selector (country, deviceIds)
 * @returns {Object} Fleet webhook response
 */
async function triggerFleetWebhook(type, selector = {}) {
    try {
        errorTracker.reset();
        
        if (!type) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_CONTROLLER, 'Webhook type is required');
        }
        
        const result = await webhookService.triggerFleetWebhook(type, selector);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
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
 * Test webhook functionality
 * @returns {Object} Webhook test response
 */
function testWebhook() {
    try {
        errorTracker.reset();
        
        const result = webhookService.testWebhook();
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: {
                message: result.message,
                capabilities: result.capabilities
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
 * Trigger enriched attendance data webhook for a specific device
 * @param {string} prefix - Device prefix (e.g., 'pk01', 'us01')
 * @param {string} webhookUrl - Custom N8N webhook URL (optional)
 * @returns {Object} Enriched data webhook response
 */
async function triggerEnrichedAttendanceWebhook(prefix, webhookUrl = null) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_CONTROLLER, 'Device prefix is required');
        }
        
        console.log(`🎯 [${prefix}] Triggering enriched attendance data webhook...`);
        
        const result = await webhookService.triggerEnrichedAttendanceWebhook(prefix, webhookUrl);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: {
                deviceId: result.deviceId,
                webhookType: result.webhookType,
                dataFetched: result.dataFetched,
                recordCount: result.recordCount,
                uniqueEmployees: result.uniqueEmployees,
                webhookResult: result.webhookResult,
                webhookUrl: result.webhookUrl
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
 * Validate webhook URL format
 * @param {string} url - URL to validate
 * @returns {Object} URL validation response
 */
function validateWebhookUrl(url) {
    try {
        errorTracker.reset();
        
        if (!url) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_CONTROLLER, 'URL is required');
        }
        
        const result = webhookService.validateWebhookUrl(url);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: {
                url: result.url,
                isValid: result.isValid
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
 * Send data to a custom N8N webhook
 * @param {Object} data - Data to send
 * @param {string} webhookUrl - Custom webhook URL
 * @returns {Object} Webhook delivery response
 */
async function sendToCustomWebhook(data, webhookUrl) {
    try {
        errorTracker.reset();
        
        if (!data) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_CONTROLLER, 'Data is required');
        }
        
        if (!webhookUrl) {
            throw errorTracker.setError(ERROR_STEPS.WEBHOOK_CONTROLLER, 'Webhook URL is required');
        }
        
        const result = await webhookService.sendToN8N(data, webhookUrl);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: {
                webhookResponse: result.webhookResponse,
                statusCode: result.statusCode,
                webhookUrl: result.webhookUrl
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
    triggerDeviceWebhook,
    triggerFleetWebhook,
    triggerEnrichedAttendanceWebhook,
    testWebhook,
    validateWebhookUrl,
    sendToCustomWebhook
};
