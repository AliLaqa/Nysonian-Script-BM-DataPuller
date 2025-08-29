// src/middleware/performanceMiddleware.js
// Performance monitoring middleware for response time tracking

const logger = require('../utils/logger');

/**
 * Performance monitoring middleware
 * Tracks response times and logs performance metrics
 */
function performanceMiddleware(req, res, next) {
    const startTime = Date.now();
    
    // Generate request ID if not present
    if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Extract device prefix from URL if present
    const devicePrefix = req.params.prefix || null;
    
    // Log request start
    logger.logRequestStart(req, devicePrefix);
    
    // Override res.end to capture response completion
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Log request completion
        logger.logRequestComplete(req, res, responseTime, devicePrefix);
        
        // Log performance metrics for slow requests
        if (responseTime > 1000) { // Log requests taking more than 1 second
            logger.logPerformanceMetric('slow_request', responseTime, 'ms', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                devicePrefix
            }, req.headers['x-request-id']);
        }
        
        // Log performance metrics for very slow requests
        if (responseTime > 5000) { // Log requests taking more than 5 seconds
            logger.warn(`Very slow request detected: ${req.method} ${req.path} took ${responseTime}ms`, {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                responseTime,
                devicePrefix
            }, req.headers['x-request-id']);
        }
        
        // Call original res.end
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
}

/**
 * Request correlation middleware
 * Ensures all requests have a correlation ID
 */
function correlationMiddleware(req, res, next) {
    // Generate correlation ID if not present
    if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add correlation ID to response headers
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    
    next();
}

/**
 * Device prefix extraction middleware
 * Extracts device prefix from URL parameters
 */
function devicePrefixMiddleware(req, res, next) {
    // Extract device prefix from URL if present
    if (req.params.prefix) {
        req.devicePrefix = req.params.prefix;
    }
    
    next();
}

/**
 * Response time header middleware
 * Adds response time to response headers
 */
function responseTimeHeaderMiddleware(req, res, next) {
    const startTime = Date.now();
    
    // Set response time header before response is sent
    res.setHeader('X-Response-Time', '0ms');
    
    // Update header when response finishes
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        // Don't try to set headers after response is sent
        // Just log the response time instead
        console.log(`Response time for ${req.method} ${req.path}: ${responseTime}ms`);
    });
    
    next();
}

module.exports = {
    performanceMiddleware,
    correlationMiddleware,
    devicePrefixMiddleware,
    responseTimeHeaderMiddleware
};
