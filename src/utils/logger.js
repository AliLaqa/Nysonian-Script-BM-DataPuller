// src/utils/logger.js
// Structured logging service for better observability

const config = require('../config');

/**
 * Structured Logger
 * Provides consistent, structured logging across the application
 */
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.environment = process.env.NODE_ENV || 'development';
        this.serviceName = 'ZKTeco-API';
        this.version = '2.0.0';
        
        // Log levels hierarchy
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * Check if log level should be output
     * @param {string} level - Log level to check
     * @returns {boolean} Whether to output the log
     */
    shouldLog(level) {
        return this.logLevels[level] <= this.logLevels[this.logLevel];
    }

    /**
     * Format log message with structured data
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     * @returns {Object} Formatted log entry
     */
    formatLog(level, message, meta = {}, requestId = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            service: this.serviceName,
            version: this.version,
            environment: this.environment,
            message,
            ...meta
        };

        // Add request correlation if available
        if (requestId) {
            logEntry.requestId = requestId;
        }

        // Add device prefix if available
        if (meta.devicePrefix) {
            logEntry.devicePrefix = meta.devicePrefix;
        }

        // Add performance metrics if available
        if (meta.responseTime) {
            logEntry.responseTime = meta.responseTime;
        }

        return logEntry;
    }

    /**
     * Output log to console with appropriate formatting
     * @param {string} level - Log level
     * @param {Object} logEntry - Formatted log entry
     */
    outputLog(level, logEntry) {
        if (!this.shouldLog(level)) {
            return;
        }

        const emoji = config.LOGGING.LEVELS[level.toUpperCase()] || 'ℹ️';
        const prefix = `${emoji} [${logEntry.level}]`;
        
        if (this.environment === 'production') {
            // Production: JSON output for log aggregation
            console.log(JSON.stringify(logEntry));
        } else {
            // Development: Human-readable output
            const deviceInfo = logEntry.devicePrefix ? ` [Device: ${logEntry.devicePrefix}]` : '';
            const requestInfo = logEntry.requestId ? ` [Request: ${logEntry.requestId}]` : '';
            const timeInfo = logEntry.responseTime ? ` (${logEntry.responseTime}ms)` : '';
            
            console.log(`${prefix}${deviceInfo}${requestInfo}: ${logEntry.message}${timeInfo}`);
            
            // Log additional metadata if present
            if (Object.keys(logEntry).length > 8) { // More than basic fields
                const meta = { ...logEntry };
                delete meta.timestamp;
                delete meta.level;
                delete meta.service;
                delete meta.version;
                delete meta.environment;
                delete meta.message;
                delete meta.requestId;
                delete meta.devicePrefix;
                delete meta.responseTime;
                
                if (Object.keys(meta).length > 0) {
                    console.log(`   Metadata:`, meta);
                }
            }
        }
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    error(message, meta = {}, requestId = null) {
        const logEntry = this.formatLog('error', message, meta, requestId);
        this.outputLog('error', logEntry);
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    warn(message, meta = {}, requestId = null) {
        const logEntry = this.formatLog('warn', message, meta, requestId);
        this.outputLog('warn', logEntry);
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    info(message, meta = {}, requestId = null) {
        const logEntry = this.formatLog('info', message, meta, requestId);
        this.outputLog('info', logEntry);
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    debug(message, meta = {}, requestId = null) {
        const logEntry = this.formatLog('debug', message, meta, requestId);
        this.outputLog('debug', logEntry);
    }

    /**
     * Log request start
     * @param {Object} req - Express request object
     * @param {string} devicePrefix - Device prefix if applicable
     */
    logRequestStart(req, devicePrefix = null) {
        const meta = {
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            devicePrefix
        };

        this.info(`Request started: ${req.method} ${req.path}`, meta, req.headers['x-request-id']);
    }

    /**
     * Log request completion
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} responseTime - Response time in milliseconds
     * @param {string} devicePrefix - Device prefix if applicable
     */
    logRequestComplete(req, res, responseTime, devicePrefix = null) {
        const meta = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
            devicePrefix
        };

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        const message = `Request completed: ${req.method} ${req.path} - ${res.statusCode}`;
        
        this[level](message, meta, req.headers['x-request-id']);
    }

    /**
     * Log device operation
     * @param {string} operation - Operation being performed
     * @param {string} devicePrefix - Device prefix
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    logDeviceOperation(operation, devicePrefix, meta = {}, requestId = null) {
        const enhancedMeta = {
            ...meta,
            devicePrefix,
            operation
        };

        this.info(`Device operation: ${operation}`, enhancedMeta, requestId);
    }

    /**
     * Log webhook operation
     * @param {string} operation - Webhook operation
     * @param {string} devicePrefix - Device prefix if applicable
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    logWebhookOperation(operation, devicePrefix = null, meta = {}, requestId = null) {
        const enhancedMeta = {
            ...meta,
            devicePrefix,
            operation
        };

        this.info(`Webhook operation: ${operation}`, enhancedMeta, requestId);
    }

    /**
     * Log health check
     * @param {string} checkType - Type of health check
     * @param {string} status - Health status
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    logHealthCheck(checkType, status, meta = {}, requestId = null) {
        const enhancedMeta = {
            ...meta,
            checkType,
            status
        };

        const level = status === 'healthy' ? 'info' : 'warn';
        this[level](`Health check: ${checkType} - ${status}`, enhancedMeta, requestId);
    }

    /**
     * Log performance metric
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {string} unit - Metric unit
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    logPerformanceMetric(metric, value, unit, meta = {}, requestId = null) {
        const enhancedMeta = {
            ...meta,
            metric,
            value,
            unit
        };

        this.info(`Performance metric: ${metric} = ${value}${unit}`, enhancedMeta, requestId);
    }

    /**
     * Log error with stack trace
     * @param {Error} error - Error object
     * @param {string} context - Error context
     * @param {Object} meta - Additional metadata
     * @param {string} requestId - Request correlation ID
     */
    logError(error, context = '', meta = {}, requestId = null) {
        const enhancedMeta = {
            ...meta,
            context,
            errorName: error.name,
            errorMessage: error.message,
            stackTrace: error.stack
        };

        this.error(`Error in ${context}: ${error.message}`, enhancedMeta, requestId);
    }

    /**
     * Log scheduler operation
     * @param {string} operation - Scheduler operation
     * @param {Object} meta - Additional metadata
     */
    logSchedulerOperation(operation, meta = {}) {
        this.info(`Scheduler operation: ${operation}`, meta);
    }

    /**
     * Get logger statistics
     * @returns {Object} Logger statistics
     */
    getStats() {
        return {
            logLevel: this.logLevel,
            environment: this.environment,
            serviceName: this.serviceName,
            version: this.version,
            timestamp: new Date().toISOString()
        };
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
