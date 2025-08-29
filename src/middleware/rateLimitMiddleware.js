// src/middleware/rateLimitMiddleware.js
// Rate limiting middleware for API security

const logger = require('../utils/logger');

/**
 * Rate Limiter Class
 * Provides rate limiting functionality with configurable windows and limits
 */
class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.defaultLimit = 100; // requests per window
        this.defaultWindow = 15 * 60 * 1000; // 15 minutes
        this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
        
        // Start cleanup timer
        this.startCleanupTimer();
        
        logger.info('Rate limiter initialized', {
            defaultLimit: this.defaultLimit,
            defaultWindow: this.defaultWindow,
            cleanupInterval: this.cleanupInterval
        });
    }

    /**
     * Check if request is allowed
     * @param {string} identifier - Request identifier (IP, user ID, etc.)
     * @param {number} limit - Request limit per window
     * @param {number} window - Time window in milliseconds
     * @returns {Object} Rate limit status
     */
    checkLimit(identifier, limit = this.defaultLimit, window = this.defaultWindow) {
        try {
            const now = Date.now();
            const windowStart = now - window;
            
            // Get or create request record
            if (!this.requests.has(identifier)) {
                this.requests.set(identifier, []);
            }
            
            const requests = this.requests.get(identifier);
            
            // Remove old requests outside the window
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            this.requests.set(identifier, validRequests);
            
            // Check if limit exceeded
            const currentCount = validRequests.length;
            const isAllowed = currentCount < limit;
            
            if (isAllowed) {
                // Add current request
                validRequests.push(now);
                this.requests.set(identifier, validRequests);
            }
            
            const remaining = Math.max(0, limit - currentCount);
            const resetTime = new Date(now + window).toISOString();
            
            const result = {
                isAllowed,
                currentCount,
                limit,
                remaining,
                resetTime,
                window
            };
            
            // Log rate limit events
            if (!isAllowed) {
                logger.warn(`Rate limit exceeded`, {
                    identifier,
                    currentCount,
                    limit,
                    window,
                    resetTime
                });
            } else if (currentCount > limit * 0.8) {
                logger.info(`Rate limit warning`, {
                    identifier,
                    currentCount,
                    limit,
                    remaining
                });
            }
            
            return result;
        } catch (error) {
            logger.error(`Rate limit check failed`, {
                identifier,
                error: error.message
            });
            
            // Fail open - allow request if rate limiting fails
            return {
                isAllowed: true,
                currentCount: 0,
                limit,
                remaining: limit,
                resetTime: new Date(Date.now() + window).toISOString(),
                window
            };
        }
    }

    /**
     * Get rate limit info for identifier
     * @param {string} identifier - Request identifier
     * @param {number} limit - Request limit per window
     * @param {number} window - Time window in milliseconds
     * @returns {Object} Rate limit information
     */
    getLimitInfo(identifier, limit = this.defaultLimit, window = this.defaultWindow) {
        try {
            const now = Date.now();
            const windowStart = now - window;
            
            if (!this.requests.has(identifier)) {
                return {
                    identifier,
                    currentCount: 0,
                    limit,
                    remaining: limit,
                    resetTime: new Date(now + window).toISOString(),
                    window
                };
            }
            
            const requests = this.requests.get(identifier);
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            const currentCount = validRequests.length;
            const remaining = Math.max(0, limit - currentCount);
            
            return {
                identifier,
                currentCount,
                limit,
                remaining,
                resetTime: new Date(now + window).toISOString(),
                window
            };
        } catch (error) {
            logger.error(`Failed to get rate limit info`, {
                identifier,
                error: error.message
            });
            
            return {
                identifier,
                currentCount: 0,
                limit,
                remaining: limit,
                resetTime: new Date(Date.now() + window).toISOString(),
                window
            };
        }
    }

    /**
     * Reset rate limit for identifier
     * @param {string} identifier - Request identifier
     * @returns {boolean} Success status
     */
    resetLimit(identifier) {
        try {
            const deleted = this.requests.delete(identifier);
            if (deleted) {
                logger.info(`Rate limit reset for ${identifier}`);
            }
            return deleted;
        } catch (error) {
            logger.error(`Failed to reset rate limit`, {
                identifier,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Get all rate limit records
     * @returns {Object} All rate limit records
     */
    getAllRecords() {
        const records = {};
        
        for (const [identifier, requests] of this.requests.entries()) {
            records[identifier] = {
                identifier,
                requestCount: requests.length,
                lastRequest: requests.length > 0 ? new Date(Math.max(...requests)).toISOString() : null
            };
        }
        
        return records;
    }

    /**
     * Clean up old rate limit records
     */
    cleanup() {
        try {
            const now = Date.now();
            const maxAge = Math.max(this.defaultWindow * 2, 60 * 60 * 1000); // 2x window or 1 hour
            let cleanedCount = 0;
            
            for (const [identifier, requests] of this.requests.entries()) {
                if (requests.length === 0 || (now - Math.max(...requests)) > maxAge) {
                    this.requests.delete(identifier);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                logger.debug(`Cleaned up ${cleanedCount} old rate limit records`);
            }
        } catch (error) {
            logger.error(`Rate limit cleanup failed`, { error: error.message });
        }
    }

    /**
     * Start cleanup timer
     */
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
        
        logger.info(`Rate limit cleanup timer started`, { interval: this.cleanupInterval });
    }

    /**
     * Stop cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            logger.info('Rate limit cleanup timer stopped');
        }
    }

    /**
     * Get rate limiter statistics
     * @returns {Object} Rate limiter statistics
     */
    getStats() {
        const totalIdentifiers = this.requests.size;
        let totalRequests = 0;
        
        for (const requests of this.requests.values()) {
            totalRequests += requests.length;
        }
        
        return {
            totalIdentifiers,
            totalRequests,
            timestamp: new Date().toISOString()
        };
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware factory
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
function createRateLimitMiddleware(options = {}) {
    const {
        limit = 100,
        window = 15 * 60 * 1000, // 15 minutes
        identifier = 'ip', // 'ip', 'user', 'device', or custom function
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        errorMessage = 'Rate limit exceeded',
        errorCode = 429
    } = options;

    return function rateLimitMiddleware(req, res, next) {
        try {
            // Generate identifier based on configuration
            let requestIdentifier;
            
            switch (identifier) {
                case 'ip':
                    requestIdentifier = req.ip || req.connection.remoteAddress || 'unknown';
                    break;
                case 'user':
                    requestIdentifier = req.headers['authorization'] || req.headers['x-user-id'] || 'anonymous';
                    break;
                case 'device':
                    requestIdentifier = req.params.prefix || req.headers['x-device-id'] || 'unknown';
                    break;
                case 'custom':
                    requestIdentifier = options.getIdentifier ? options.getIdentifier(req) : 'custom';
                    break;
                default:
                    requestIdentifier = req.ip || req.connection.remoteAddress || 'unknown';
            }
            
            // Check rate limit
            const limitInfo = rateLimiter.checkLimit(requestIdentifier, limit, window);
            
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
            res.setHeader('X-RateLimit-Reset', limitInfo.resetTime);
            res.setHeader('X-RateLimit-Reset-Timestamp', new Date(limitInfo.resetTime).getTime());
            
            if (!limitInfo.isAllowed) {
                // Rate limit exceeded
                logger.warn(`Rate limit exceeded for ${requestIdentifier}`, {
                    identifier: requestIdentifier,
                    path: req.path,
                    method: req.method,
                    limit,
                    currentCount: limitInfo.currentCount
                });
                
                return res.status(errorCode).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    error: errorMessage,
                    rateLimit: {
                        limit,
                        remaining: 0,
                        resetTime: limitInfo.resetTime,
                        retryAfter: Math.ceil(window / 1000)
                    }
                });
            }
            
            // Rate limit check passed
            if (limitInfo.remaining < limit * 0.2) {
                logger.info(`Rate limit warning for ${requestIdentifier}`, {
                    identifier: requestIdentifier,
                    remaining: limitInfo.remaining,
                    limit
                });
            }
            
            next();
            
        } catch (error) {
            logger.error(`Rate limiting middleware error`, {
                error: error.message,
                path: req.path,
                method: req.method
            });
            
            // Fail open - allow request if rate limiting fails
            next();
        }
    };
}

/**
 * Device-specific rate limiting middleware
 * Different limits for different device types
 */
function createDeviceRateLimitMiddleware() {
    return function deviceRateLimitMiddleware(req, res, next) {
        try {
            const devicePrefix = req.params.prefix;
            
            if (!devicePrefix) {
                return next();
            }
            
            // Different rate limits for different device types
            let limit, window;
            
            if (devicePrefix.startsWith('pk')) {
                // Pakistan devices - higher limit
                limit = 200;
                window = 15 * 60 * 1000; // 15 minutes
            } else if (devicePrefix.startsWith('us')) {
                // US devices - medium limit
                limit = 150;
                window = 15 * 60 * 1000; // 15 minutes
            } else {
                // Other devices - standard limit
                limit = 100;
                window = 15 * 60 * 1000; // 15 minutes
            }
            
            const requestIdentifier = `device:${devicePrefix}`;
            const limitInfo = rateLimiter.checkLimit(requestIdentifier, limit, window);
            
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
            res.setHeader('X-RateLimit-Reset', limitInfo.resetTime);
            
            if (!limitInfo.isAllowed) {
                logger.warn(`Device rate limit exceeded for ${devicePrefix}`, {
                    devicePrefix,
                    limit,
                    currentCount: limitInfo.currentCount
                });
                
                return res.status(429).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    error: 'Device rate limit exceeded',
                    rateLimit: {
                        limit,
                        remaining: 0,
                        resetTime: limitInfo.resetTime,
                        retryAfter: Math.ceil(window / 1000)
                    }
                });
            }
            
            next();
            
        } catch (error) {
            logger.error(`Device rate limiting middleware error`, {
                error: error.message,
                devicePrefix: req.params.prefix
            });
            
            // Fail open
            next();
        }
    };
}

/**
 * Admin rate limiting middleware
 * Higher limits for admin operations
 */
function createAdminRateLimitMiddleware() {
    return function adminRateLimitMiddleware(req, res, next) {
        try {
            // Check if this is an admin operation
            const isAdminOperation = req.path.includes('/admin') || 
                                   req.path.includes('/health/report') ||
                                   req.path.includes('/health/metrics');
            
            if (!isAdminOperation) {
                return next();
            }
            
            // Higher limits for admin operations
            const limit = 50;
            const window = 5 * 60 * 1000; // 5 minutes
            
            const requestIdentifier = `admin:${req.ip || 'unknown'}`;
            const limitInfo = rateLimiter.checkLimit(requestIdentifier, limit, window);
            
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
            res.setHeader('X-RateLimit-Reset', limitInfo.resetTime);
            
            if (!limitInfo.isAllowed) {
                logger.warn(`Admin rate limit exceeded`, {
                    ip: req.ip,
                    path: req.path,
                    limit,
                    currentCount: limitInfo.currentCount
                });
                
                return res.status(429).json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    error: 'Admin rate limit exceeded',
                    rateLimit: {
                        limit,
                        remaining: 0,
                        resetTime: limitInfo.resetTime,
                        retryAfter: Math.ceil(window / 1000)
                    }
                });
            }
            
            next();
            
        } catch (error) {
            logger.error(`Admin rate limiting middleware error`, {
                error: error.message,
                path: req.path
            });
            
            // Fail open
            next();
        }
    };
}

module.exports = {
    rateLimiter,
    createRateLimitMiddleware,
    createDeviceRateLimitMiddleware,
    createAdminRateLimitMiddleware
};
