// src/controllers/healthController.js
// Health monitoring controller for system and device health

const HealthService = require('../services/healthService');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

// Create health service instance
const healthService = new HealthService();

/**
 * Get basic health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBasicHealth(req, res) {
    const startTime = Date.now();
    
    try {
        // Simple health check - just verify the service is running
        const health = {
            success: true,
            timestamp: new Date().toISOString(),
            status: 'healthy',
            message: 'Service is running',
            uptime: healthService.getUptime(),
            version: '2.0.0'
        };
        
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(true, responseTime);
        
        res.status(200).json(health);
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getBasicHealth', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            status: 'error',
            error: error.message
        });
    }
}

/**
 * Get comprehensive system health
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSystemHealth(req, res) {
    const startTime = Date.now();
    
    try {
        const health = await healthService.getSystemHealth();
        const responseTime = Date.now() - startTime;
        
        healthService.updateMetrics(health.success, responseTime);
        
        if (health.success) {
            res.status(200).json(health);
        } else {
            res.status(500).json(health);
        }
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getSystemHealth', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            status: 'error',
            error: error.message
        });
    }
}

/**
 * Get device health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDeviceHealth(req, res) {
    const startTime = Date.now();
    
    try {
        const deviceHealth = await healthService.getDeviceHealth();
        const responseTime = Date.now() - startTime;
        
        healthService.updateMetrics(true, responseTime);
        
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: deviceHealth,
            responseTime
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getDeviceHealth', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

/**
 * Get specific device health
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDeviceHealthById(req, res) {
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
        
        const deviceHealth = await healthService.checkDeviceHealth(prefix);
        const responseTime = Date.now() - startTime;
        
        healthService.updateMetrics(deviceHealth.status !== 'error', responseTime);
        
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: deviceHealth,
            responseTime
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getDeviceHealthById', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

/**
 * Get detailed health report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDetailedHealthReport(req, res) {
    const startTime = Date.now();
    
    try {
        const report = await healthService.getDetailedHealthReport();
        const responseTime = Date.now() - startTime;
        
        healthService.updateMetrics(report.success, responseTime);
        
        if (report.success) {
            res.status(200).json(report);
        } else {
            res.status(500).json(report);
        }
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getDetailedHealthReport', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

/**
 * Get system metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSystemMetrics(req, res) {
    const startTime = Date.now();
    
    try {
        const metrics = healthService.getSystemMetrics();
        const responseTime = Date.now() - startTime;
        
        healthService.updateMetrics(true, responseTime);
        
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: metrics,
            responseTime
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getSystemMetrics', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

/**
 * Get system information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSystemInfo(req, res) {
    const startTime = Date.now();
    
    try {
        const systemInfo = {
            uptime: healthService.getUptime(),
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            platform: process.platform,
            memory: healthService.getMemoryUsage(),
            cpu: await healthService.getCPUUsage(),
            startTime: healthService.startTime.toISOString()
        };
        
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(true, responseTime);
        
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: systemInfo,
            responseTime
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        healthService.updateMetrics(false, responseTime);
        
        errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getSystemInfo', error.message);
        
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

module.exports = {
    getBasicHealth,
    getSystemHealth,
    getDeviceHealth,
    getDeviceHealthById,
    getDetailedHealthReport,
    getSystemMetrics,
    getSystemInfo
};
