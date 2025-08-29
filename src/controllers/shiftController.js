// src/controllers/shiftController.js
// Enhanced shift controller with device-specific configurations and preserved business logic

const ShiftService = require('../services/shiftService');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');
const logger = require('../utils/logger');

// Create shift service instance
const shiftService = new ShiftService();

/**
 * Get today's shift data for a specific device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTodayShift(req, res) {
    const startTime = Date.now();
    const { prefix } = req.params;
    
    try {
        if (!prefix) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Device prefix is required'
            });
        }
        
        logger.info(`Getting today's shift data for device: ${prefix}`);
        
        const shiftData = await shiftService.getTodayShift(prefix);
        const responseTime = Date.now() - startTime;
        
        res.status(200).json({
            ...shiftData,
            responseTime,
            requestId: req.headers['x-request-id']
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        errorTracker.trackError(ERROR_STEPS.SHIFT_CONTROLLER, 'getTodayShift', error.message);
        
        logger.error(`Failed to get today's shift data for ${prefix}`, {
            devicePrefix: prefix,
            error: error.message,
            responseTime
        });
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            devicePrefix: prefix,
            responseTime,
            requestId: req.headers['x-request-id']
        });
    }
}

/**
 * Get shift check-in data for a specific device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getShiftCheckin(req, res) {
    const startTime = Date.now();
    const { prefix } = req.params;
    
    try {
        if (!prefix) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Device prefix is required'
            });
        }
        
        logger.info(`Getting shift check-in data for device: ${prefix}`);
        
        const checkinData = await shiftService.getShiftCheckin(prefix);
        const responseTime = Date.now() - startTime;
        
        res.status(200).json({
            ...checkinData,
            responseTime,
            requestId: req.headers['x-request-id']
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        errorTracker.trackError(ERROR_STEPS.SHIFT_CONTROLLER, 'getShiftCheckin', error.message);
        
        logger.error(`Failed to get shift check-in data for ${prefix}`, {
            devicePrefix: prefix,
            error: error.message,
            responseTime
        });
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            devicePrefix: prefix,
            responseTime,
            requestId: req.headers['x-request-id']
        });
    }
}

/**
 * Get shift check-out data for a specific device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getShiftCheckout(req, res) {
    const startTime = Date.now();
    const { prefix } = req.params;
    
    try {
        if (!prefix) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Device prefix is required'
            });
        }
        
        logger.info(`Getting shift check-out data for device: ${prefix}`);
        
        const checkoutData = await shiftService.getShiftCheckout(prefix);
        const responseTime = Date.now() - startTime;
        
        res.status(200).json({
            ...checkoutData,
            responseTime,
            requestId: req.headers['x-request-id']
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        errorTracker.trackError(ERROR_STEPS.SHIFT_CONTROLLER, 'getShiftCheckout', error.message);
        
        logger.error(`Failed to get shift check-out data for ${prefix}`, {
            devicePrefix: prefix,
            error: error.message,
            responseTime
        });
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            devicePrefix: prefix,
            responseTime,
            requestId: req.headers['x-request-id']
        });
    }
}

/**
 * Process shift data for a specific device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function processShiftData(req, res) {
    const startTime = Date.now();
    const { prefix } = req.params;
    
    try {
        if (!prefix) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Device prefix is required'
            });
        }
        
        logger.info(`Processing shift data for device: ${prefix}`);
        
        // This endpoint would process raw attendance data into shift format
        // For now, we'll return the processed shift data
        const shiftData = await shiftService.getTodayShift(prefix);
        const responseTime = Date.now() - startTime;
        
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            devicePrefix: prefix,
            message: 'Shift data processed successfully',
            data: shiftData.data,
            shiftConfig: shiftData.shiftConfig,
            responseTime,
            requestId: req.headers['x-request-id']
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        errorTracker.trackError(ERROR_STEPS.SHIFT_CONTROLLER, 'processShiftData', error.message);
        
        logger.error(`Failed to process shift data for ${prefix}`, {
            devicePrefix: prefix,
            error: error.message,
            responseTime
        });
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            devicePrefix: prefix,
            responseTime,
            requestId: req.headers['x-request-id']
        });
    }
}

/**
 * Get shift data from all devices (fleet-level)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllDevicesShift(req, res) {
    const startTime = Date.now();
    
    try {
        logger.info('Getting shift data from all devices');
        
        const allDevicesData = await shiftService.getAllDevicesShift();
        const responseTime = Date.now() - startTime;
        
        res.status(200).json({
            ...allDevicesData,
            responseTime,
            requestId: req.headers['x-request-id']
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        errorTracker.trackError(ERROR_STEPS.SHIFT_CONTROLLER, 'getAllDevicesShift', error.message);
        
        logger.error('Failed to get shift data from all devices', {
            error: error.message,
            responseTime
        });
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            responseTime,
            requestId: req.headers['x-request-id']
        });
    }
}

/**
 * Get shift configuration for a specific device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getShiftConfig(req, res) {
    const startTime = Date.now();
    const { prefix } = req.params;
    
    try {
        if (!prefix) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Device prefix is required'
            });
        }
        
        logger.info(`Getting shift configuration for device: ${prefix}`);
        
        const shiftConfig = shiftService.getShiftConfig(prefix);
        const responseTime = Date.now() - startTime;
        
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            devicePrefix: prefix,
            data: shiftConfig,
            responseTime,
            requestId: req.headers['x-request-id']
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        errorTracker.trackError(ERROR_STEPS.SHIFT_CONTROLLER, 'getShiftConfig', error.message);
        
        logger.error(`Failed to get shift configuration for ${prefix}`, {
            devicePrefix: prefix,
            error: error.message,
            responseTime
        });
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            devicePrefix: prefix,
            responseTime,
            requestId: req.headers['x-request-id']
        });
    }
}

module.exports = {
    getTodayShift,
    getShiftCheckin,
    getShiftCheckout,
    processShiftData,
    getAllDevicesShift,
    getShiftConfig
};
