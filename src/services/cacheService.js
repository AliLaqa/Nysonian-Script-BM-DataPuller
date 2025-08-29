// src/services/cacheService.js
// Caching service for performance optimization

const logger = require('../utils/logger');

/**
 * Cache Service
 * Provides in-memory caching for frequently accessed data
 */
class CacheService {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            totalRequests: 0
        };
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
        this.maxSize = 1000; // Maximum cache entries
        this.cleanupInterval = 60 * 1000; // 1 minute cleanup interval
        
        // Start cleanup timer
        this.startCleanupTimer();
        
        logger.info('Cache service initialized', {
            maxSize: this.maxSize,
            defaultTTL: this.defaultTTL,
            cleanupInterval: this.cleanupInterval
        });
    }

    /**
     * Set cache entry
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     * @returns {boolean} Success status
     */
    set(key, value, ttl = this.defaultTTL) {
        try {
            // Check if cache is full
            if (this.cache.size >= this.maxSize) {
                this.evictOldest();
            }
            
            const expiry = Date.now() + ttl;
            this.cache.set(key, {
                value,
                expiry,
                createdAt: Date.now(),
                accessCount: 0
            });
            
            this.stats.sets++;
            this.stats.totalRequests++;
            
            logger.debug(`Cache set: ${key}`, {
                key,
                ttl,
                expiry: new Date(expiry).toISOString(),
                cacheSize: this.cache.size
            });
            
            return true;
        } catch (error) {
            logger.error(`Failed to set cache entry: ${key}`, {
                key,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Get cache entry
     * @param {string} key - Cache key
     * @returns {any} Cached value or null if not found/expired
     */
    get(key) {
        try {
            this.stats.totalRequests++;
            
            const entry = this.cache.get(key);
            if (!entry) {
                this.stats.misses++;
                return null;
            }
            
            // Check if expired
            if (Date.now() > entry.expiry) {
                this.cache.delete(key);
                this.stats.misses++;
                return null;
            }
            
            // Update access count and last access time
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            
            this.stats.hits++;
            
            logger.debug(`Cache hit: ${key}`, {
                key,
                accessCount: entry.accessCount,
                age: Date.now() - entry.createdAt
            });
            
            return entry.value;
        } catch (error) {
            logger.error(`Failed to get cache entry: ${key}`, {
                key,
                error: error.message
            });
            this.stats.misses++;
            return null;
        }
    }

    /**
     * Check if key exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean} Whether key exists and is valid
     */
    has(key) {
        try {
            const entry = this.cache.get(key);
            if (!entry) {
                return false;
            }
            
            // Check if expired
            if (Date.now() > entry.expiry) {
                this.cache.delete(key);
                return false;
            }
            
            return true;
        } catch (error) {
            logger.error(`Failed to check cache entry: ${key}`, {
                key,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Delete cache entry
     * @param {string} key - Cache key
     * @returns {boolean} Success status
     */
    delete(key) {
        try {
            const deleted = this.cache.delete(key);
            if (deleted) {
                this.stats.deletes++;
                logger.debug(`Cache delete: ${key}`);
            }
            return deleted;
        } catch (error) {
            logger.error(`Failed to delete cache entry: ${key}`, {
                key,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        try {
            const size = this.cache.size;
            this.cache.clear();
            logger.info(`Cache cleared`, { previousSize: size });
        } catch (error) {
            logger.error(`Failed to clear cache`, { error: error.message });
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const hitRate = this.stats.totalRequests > 0 
            ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            maxSize: this.maxSize,
            utilization: `${((this.cache.size / this.maxSize) * 100).toFixed(2)}%`,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get cache keys
     * @returns {Array} Array of cache keys
     */
    getKeys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache entry info
     * @param {string} key - Cache key
     * @returns {Object|null} Cache entry info or null if not found
     */
    getEntryInfo(key) {
        try {
            const entry = this.cache.get(key);
            if (!entry) {
                return null;
            }
            
            const now = Date.now();
            const isExpired = now > entry.expiry;
            const age = now - entry.createdAt;
            const ttl = Math.max(0, entry.expiry - now);
            
            return {
                key,
                value: entry.value,
                isExpired,
                age,
                ttl,
                expiry: new Date(entry.expiry).toISOString(),
                createdAt: new Date(entry.createdAt).toISOString(),
                lastAccessed: entry.lastAccessed ? new Date(entry.lastAccessed).toISOString() : null,
                accessCount: entry.accessCount
            };
        } catch (error) {
            logger.error(`Failed to get cache entry info: ${key}`, {
                key,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Set multiple cache entries
     * @param {Object} entries - Object with key-value pairs
     * @param {number} ttl - Time to live in milliseconds
     * @returns {number} Number of successfully set entries
     */
    setMultiple(entries, ttl = this.defaultTTL) {
        let successCount = 0;
        
        for (const [key, value] of Object.entries(entries)) {
            if (this.set(key, value, ttl)) {
                successCount++;
            }
        }
        
        logger.info(`Bulk cache set completed`, {
            total: Object.keys(entries).length,
            successful: successCount,
            failed: Object.keys(entries).length - successCount
        });
        
        return successCount;
    }

    /**
     * Get multiple cache entries
     * @param {Array} keys - Array of cache keys
     * @returns {Object} Object with key-value pairs for found entries
     */
    getMultiple(keys) {
        const result = {};
        let foundCount = 0;
        
        for (const key of keys) {
            const value = this.get(key);
            if (value !== null) {
                result[key] = value;
                foundCount++;
            }
        }
        
        logger.debug(`Bulk cache get completed`, {
            requested: keys.length,
            found: foundCount,
            missing: keys.length - foundCount
        });
        
        return result;
    }

    /**
     * Evict oldest cache entries
     * @param {number} count - Number of entries to evict
     */
    evictOldest(count = 1) {
        try {
            const entries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].createdAt - b[1].createdAt)
                .slice(0, count);
            
            for (const [key] of entries) {
                this.cache.delete(key);
            }
            
            logger.debug(`Evicted ${entries.length} oldest cache entries`);
        } catch (error) {
            logger.error(`Failed to evict oldest cache entries`, { error: error.message });
        }
    }

    /**
     * Evict expired cache entries
     * @returns {number} Number of expired entries removed
     */
    evictExpired() {
        try {
            const now = Date.now();
            let expiredCount = 0;
            
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiry) {
                    this.cache.delete(key);
                    expiredCount++;
                }
            }
            
            if (expiredCount > 0) {
                logger.debug(`Evicted ${expiredCount} expired cache entries`);
            }
            
            return expiredCount;
        } catch (error) {
            logger.error(`Failed to evict expired cache entries`, { error: error.message });
            return 0;
        }
    }

    /**
     * Start cleanup timer
     */
    startCleanupTimer() {
        setInterval(() => {
            this.evictExpired();
        }, this.cleanupInterval);
        
        logger.info(`Cache cleanup timer started`, { interval: this.cleanupInterval });
    }

    /**
     * Stop cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            logger.info('Cache cleanup timer stopped');
        }
    }

    /**
     * Generate cache key from parameters
     * @param {string} prefix - Key prefix
     * @param {Object} params - Parameters to include in key
     * @returns {string} Generated cache key
     */
    generateKey(prefix, params = {}) {
        if (Object.keys(params).length === 0) {
            return prefix;
        }
        
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
        
        return `${prefix}:${sortedParams}`;
    }

    /**
     * Cache function result
     * @param {string} key - Cache key
     * @param {Function} fn - Function to cache
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Promise<any>} Cached or fresh result
     */
    async cacheFunction(key, fn, ttl = this.defaultTTL) {
        try {
            // Try to get from cache first
            const cached = this.get(key);
            if (cached !== null) {
                return cached;
            }
            
            // Execute function and cache result
            const result = await fn();
            this.set(key, result, ttl);
            
            return result;
        } catch (error) {
            logger.error(`Failed to cache function result: ${key}`, {
                key,
                error: error.message
            });
            
            // Try to execute function without caching
            return await fn();
        }
    }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
