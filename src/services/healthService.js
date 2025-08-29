// src/services/healthService.js
// Comprehensive health monitoring service for the multi-device system

const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');
const deviceService = require('./deviceService');

/**
 * Health Service
 * Provides comprehensive health monitoring for devices and system
 */
class HealthService {
    constructor() {
        this.startTime = new Date();
        this.healthChecks = new Map();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            deviceHealth: {},
            lastUpdated: new Date()
        };
    }

    /**
     * Get overall system health status
     * @returns {Object} System health information
     */
    async getSystemHealth() {
        try {
            const startTime = Date.now();
            
            // Get device health status
            const deviceHealth = await this.getDeviceHealth();
            
            // Calculate system metrics
            const systemMetrics = this.getSystemMetrics();
            
            // Determine overall health
            const overallHealth = this.calculateOverallHealth(deviceHealth);
            
            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                status: overallHealth.status,
                message: overallHealth.message,
                data: {
                    system: {
                        uptime: this.getUptime(),
                        version: '2.0.0',
                        environment: process.env.NODE_ENV || 'development',
                        nodeVersion: process.version,
                        platform: process.platform,
                        memory: this.getMemoryUsage(),
                        cpu: await this.getCPUUsage()
                    },
                    devices: deviceHealth,
                    metrics: systemMetrics,
                    responseTime
                },
                summary: {
                    totalDevices: deviceHealth.totalDevices,
                    healthyDevices: deviceHealth.healthyDevices,
                    unhealthyDevices: deviceHealth.unhealthyDevices,
                    overallHealth: overallHealth.status
                }
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getSystemHealth', error.message);
            
            return {
                success: false,
                timestamp: new Date().toISOString(),
                status: 'error',
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Get health status for all devices
     * @returns {Object} Device health information
     */
    async getDeviceHealth() {
        try {
            const devices = config.ENV.DEVICES;
            const deviceHealthPromises = devices.map(device => 
                this.checkDeviceHealth(device.prefix)
            );
            
            const deviceResults = await Promise.allSettled(deviceHealthPromises);
            
            const deviceHealth = [];
            let healthyDevices = 0;
            let unhealthyDevices = 0;
            
            deviceResults.forEach((result, index) => {
                const device = devices[index];
                if (result.status === 'fulfilled') {
                    const health = result.value;
                    deviceHealth.push(health);
                    
                    if (health.status === 'healthy') {
                        healthyDevices++;
                    } else {
                        unhealthyDevices++;
                    }
                } else {
                    // Device health check failed
                    deviceHealth.push({
                        deviceId: device.prefix,
                        deviceName: device.name,
                        status: 'error',
                        message: 'Health check failed',
                        error: result.reason.message,
                        timestamp: new Date().toISOString(),
                        responseTime: null,
                        details: {
                            ip: device.ip,
                            port: device.port,
                            location: device.location,
                            country: device.country
                        }
                    });
                    unhealthyDevices++;
                }
            });
            
            return {
                totalDevices: devices.length,
                healthyDevices,
                unhealthyDevices,
                devices: deviceHealth,
                lastChecked: new Date().toISOString()
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getDeviceHealth', error.message);
            throw error;
        }
    }

    /**
     * Check health status for a specific device
     * @param {string} prefix - Device prefix
     * @returns {Object} Device health status
     */
    async checkDeviceHealth(prefix) {
        const startTime = Date.now();
        
        try {
            const device = config.ENV.DEVICES.find(d => d.prefix === prefix);
            if (!device) {
                throw new Error(`Device with prefix '${prefix}' not found`);
            }
            
            // Basic connectivity check (ping-like)
            const connectivity = await this.checkDeviceConnectivity(device);
            
            // Device info check
            const deviceInfo = await this.getDeviceInfo(device);
            
            const responseTime = Date.now() - startTime;
            
            // Determine health status
            let status = 'healthy';
            let message = 'Device is operational';
            
            if (!connectivity.reachable) {
                status = 'unhealthy';
                message = 'Device is unreachable';
            } else if (responseTime > 5000) {
                status = 'degraded';
                message = 'Device response time is slow';
            }
            
            return {
                deviceId: device.prefix,
                deviceName: device.name,
                status,
                message,
                timestamp: new Date().toISOString(),
                responseTime,
                details: {
                    ip: device.ip,
                    port: device.port,
                    location: device.location,
                    country: device.country,
                    model: device.model,
                    connectivity,
                    deviceInfo
                }
            };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            return {
                deviceId: prefix,
                deviceName: 'Unknown',
                status: 'error',
                message: 'Health check failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                responseTime,
                details: null
            };
        }
    }

    /**
     * Check basic device connectivity
     * @param {Object} device - Device configuration
     * @returns {Object} Connectivity status
     */
    async checkDeviceConnectivity(device) {
        try {
            // Simple TCP connection test
            const net = require('net');
            
            return new Promise((resolve) => {
                const socket = new net.Socket();
                const timeout = 5000; // 5 second timeout
                
                socket.setTimeout(timeout);
                
                socket.on('connect', () => {
                    socket.destroy();
                    resolve({
                        reachable: true,
                        latency: Date.now() - Date.now(), // Placeholder for actual latency
                        protocol: 'TCP',
                        port: device.port
                    });
                });
                
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve({
                        reachable: false,
                        error: 'Connection timeout',
                        protocol: 'TCP',
                        port: device.port
                    });
                });
                
                socket.on('error', (error) => {
                    resolve({
                        reachable: false,
                        error: error.message,
                        protocol: 'TCP',
                        port: device.port
                    });
                });
                
                socket.connect(device.port, device.ip);
            });
            
        } catch (error) {
            return {
                reachable: false,
                error: error.message,
                protocol: 'TCP',
                port: device.port
            };
        }
    }

    /**
     * Get basic device information
     * @param {Object} device - Device configuration
     * @returns {Object} Device information
     */
    async getDeviceInfo(device) {
        try {
            // This would typically call the actual device
            // For now, return configuration-based info
            return {
                model: device.model,
                firmware: 'Unknown', // Would come from device
                serialNumber: 'Unknown', // Would come from device
                lastSeen: new Date().toISOString(),
                configuration: {
                    ip: device.ip,
                    port: device.port,
                    timeout: device.timeout,
                    inport: device.inport
                }
            };
        } catch (error) {
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get system metrics
     * @returns {Object} System metrics
     */
    getSystemMetrics() {
        return {
            ...this.metrics,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Update request metrics
     * @param {boolean} success - Whether the request was successful
     * @param {number} responseTime - Response time in milliseconds
     */
    updateMetrics(success, responseTime) {
        this.metrics.totalRequests++;
        
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // Update average response time
        const currentAvg = this.metrics.averageResponseTime;
        const totalRequests = this.metrics.totalRequests;
        this.metrics.averageResponseTime = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
        
        this.metrics.lastUpdated = new Date();
    }

    /**
     * Get system uptime
     * @returns {string} Uptime string
     */
    getUptime() {
        const uptime = Date.now() - this.startTime.getTime();
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get memory usage information
     * @returns {Object} Memory usage stats
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        
        return {
            rss: this.formatBytes(usage.rss),
            heapTotal: this.formatBytes(usage.heapTotal),
            heapUsed: this.formatBytes(usage.heapUsed),
            external: this.formatBytes(usage.external),
            arrayBuffers: this.formatBytes(usage.arrayBuffers)
        };
    }

    /**
     * Get CPU usage information
     * @returns {Object} CPU usage stats
     */
    async getCPUUsage() {
        try {
            // Simple CPU usage calculation
            const startUsage = process.cpuUsage();
            
            // Wait a bit to calculate CPU usage
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const endUsage = process.cpuUsage(startUsage);
            
            return {
                user: endUsage.user,
                system: endUsage.system,
                total: endUsage.user + endUsage.system
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    /**
     * Calculate overall system health
     * @param {Object} deviceHealth - Device health information
     * @returns {Object} Overall health status
     */
    calculateOverallHealth(deviceHealth) {
        const { totalDevices, healthyDevices, unhealthyDevices } = deviceHealth;
        
        if (totalDevices === 0) {
            return {
                status: 'unknown',
                message: 'No devices configured'
            };
        }
        
        const healthPercentage = (healthyDevices / totalDevices) * 100;
        
        if (healthPercentage === 100) {
            return {
                status: 'healthy',
                message: 'All devices are operational'
            };
        } else if (healthPercentage >= 75) {
            return {
                status: 'degraded',
                message: 'Most devices are operational'
            };
        } else if (healthPercentage >= 50) {
            return {
                status: 'unhealthy',
                message: 'Many devices are experiencing issues'
            };
        } else {
            return {
                status: 'critical',
                message: 'Most devices are experiencing issues'
            };
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get detailed health report
     * @returns {Object} Detailed health report
     */
    async getDetailedHealthReport() {
        try {
            const systemHealth = await this.getSystemHealth();
            const deviceHealth = await this.getDeviceHealth();
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                report: {
                    system: systemHealth.data.system,
                    devices: deviceHealth,
                    metrics: this.getSystemMetrics(),
                    recommendations: this.generateRecommendations(deviceHealth)
                }
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.HEALTH_SERVICE, 'getDetailedHealthReport', error.message);
            
            return {
                success: false,
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Generate health recommendations
     * @param {Object} deviceHealth - Device health information
     * @returns {Array} List of recommendations
     */
    generateRecommendations(deviceHealth) {
        const recommendations = [];
        
        if (deviceHealth.unhealthyDevices > 0) {
            recommendations.push({
                type: 'warning',
                message: `${deviceHealth.unhealthyDevices} device(s) are experiencing issues`,
                action: 'Check device connectivity and configuration'
            });
        }
        
        if (deviceHealth.totalDevices === 0) {
            recommendations.push({
                type: 'critical',
                message: 'No devices are configured',
                action: 'Add device configurations to environment variables'
            });
        }
        
        if (this.metrics.failedRequests > this.metrics.successfulRequests * 0.1) {
            recommendations.push({
                type: 'warning',
                message: 'High failure rate detected',
                action: 'Review error logs and device connectivity'
            });
        }
        
        if (this.metrics.averageResponseTime > 5000) {
            recommendations.push({
                type: 'info',
                message: 'Slow response times detected',
                action: 'Consider optimizing device connections or increasing timeouts'
            });
        }
        
        return recommendations;
    }
}

module.exports = HealthService;
