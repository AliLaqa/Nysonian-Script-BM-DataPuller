// src/triggers/webhookScheduler.js
// Multi-device webhook scheduler for the new architecture

const axios = require('axios');
const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

/**
 * Multi-Device Webhook Scheduler
 * Handles automatic webhook calls for all configured devices
 */
class WebhookScheduler {
    constructor() {
        this.apiHost = config.ENV.API_HOST === '0.0.0.0' ? '127.0.0.1' : config.ENV.API_HOST;
        this.apiPort = config.ENV.API_PORT;
        this.baseUrl = `http://${this.apiHost}:${this.apiPort}`;
        this.intervalId = null;
        this.isRunning = false;
        this.lastRunTime = null;
        this.deviceResults = new Map(); // Track results per device
        
        // Configuration
        this.intervalMinutes = parseInt(process.env.WEBHOOK_INTERVAL_MINUTES || '15', 10);
        this.maxConcurrentDevices = parseInt(process.env.MAX_CONCURRENT_DEVICES || '3', 10);
        this.retryAttempts = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10);
        this.retryDelayMs = parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '5000', 10);
    }

    /**
     * Initialize the webhook scheduler
     * Triggers initial webhook calls and sets up scheduled intervals
     */
    async init() {
        console.log('\n🚀 Initializing Multi-Device Webhook Scheduler...');
        console.log(`🔗 Base URL: ${this.baseUrl}`);
        console.log(`🌐 API Host: ${this.apiHost}`);
        console.log(`🔌 API Port: ${this.apiPort}`);
        console.log(`📱 Total Devices: ${config.ENV.DEVICES.length}`);
        console.log(`⏰ Interval: ${this.intervalMinutes} minutes`);
        console.log(`🔄 Max Concurrent: ${this.maxConcurrentDevices}`);
        
        // Call webhooks for all devices on server start
        await this.triggerInitialWebhooks();
        
        // Set up scheduled webhook calls
        this.startScheduledWebhooks();
        
        console.log('✅ Multi-Device Webhook Scheduler initialized successfully');
    }

    /**
     * Trigger initial webhook calls for all devices on server start
     */
    async triggerInitialWebhooks() {
        console.log('\n🔔 Triggering initial webhooks for all devices...');
        
        try {
            const results = await this.triggerWebhooksForAllDevices('todayShift');
            this.logWebhookResults('Initial', results);
        } catch (error) {
            console.error('❌ Initial webhook trigger failed:', error.message);
        }
    }

    /**
     * Start scheduled webhook calls for all devices
     */
    startScheduledWebhooks() {
        const intervalMs = this.intervalMinutes * 60 * 1000;
        
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                console.log('⚠️  Previous webhook run still in progress, skipping...');
                return;
            }
            
            console.log(`\n🔔 Scheduled webhook run for all devices (${this.intervalMinutes} min interval)`);
            
            try {
                const results = await this.triggerWebhooksForAllDevices('todayShift');
                this.logWebhookResults('Scheduled', results);
            } catch (error) {
                console.error('❌ Scheduled webhook run failed:', error.message);
            }
        }, intervalMs);
        
        console.log(`⏰ Scheduled webhook calls every ${this.intervalMinutes} minutes`);
    }

    /**
     * Trigger webhooks for all configured devices
     * @param {string} webhookType - Type of webhook ('today', 'todayShift', 'date')
     * @param {Object} options - Additional options
     * @returns {Object} Results summary
     */
    async triggerWebhooksForAllDevices(webhookType = 'todayShift', options = {}) {
        this.isRunning = true;
        this.lastRunTime = new Date();
        
        const startTime = Date.now();
        const devices = config.ENV.DEVICES;
        const results = {
            totalDevices: devices.length,
            successful: 0,
            failed: 0,
            skipped: 0,
            deviceResults: [],
            summary: {
                startTime: new Date(startTime).toISOString(),
                endTime: null,
                durationMs: 0,
                webhookType,
                options
            }
        };

        console.log(`📱 Processing ${devices.length} devices for webhook type: ${webhookType}`);

        try {
            // Process devices in batches to control concurrency
            const batches = this.chunkArray(devices, this.maxConcurrentDevices);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} devices)`);
                
                const batchPromises = batch.map(device => 
                    this.triggerDeviceWebhook(device.prefix, webhookType, options)
                );
                
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Process batch results
                batchResults.forEach((result, index) => {
                    const device = batch[index];
                    const deviceResult = {
                        deviceId: device.prefix,
                        deviceName: device.name,
                        country: device.country,
                        location: device.location,
                        status: result.status,
                        success: result.status === 'fulfilled' && result.value.success,
                        error: result.status === 'rejected' ? result.reason.message : 
                               (result.value.success ? null : result.value.error),
                        responseTime: result.status === 'fulfilled' ? result.value.responseTime : null,
                        timestamp: new Date().toISOString()
                    };
                    
                    results.deviceResults.push(deviceResult);
                    
                    if (deviceResult.success) {
                        results.successful++;
                    } else if (deviceResult.error) {
                        results.failed++;
                    } else {
                        results.skipped++;
                    }
                });
                
                // Small delay between batches to prevent overwhelming
                if (i < batches.length - 1) {
                    await this.delay(1000);
                }
            }
            
        } catch (error) {
            console.error('❌ Error during webhook processing:', error.message);
            results.error = error.message;
        } finally {
            this.isRunning = false;
            results.summary.endTime = new Date().toISOString();
            results.summary.durationMs = Date.now() - startTime;
        }

        return results;
    }

    /**
     * Trigger webhook for a specific device
     * @param {string} prefix - Device prefix
     * @param {string} webhookType - Type of webhook
     * @param {Object} options - Additional options
     * @returns {Object} Webhook result
     */
    async triggerDeviceWebhook(prefix, webhookType = 'todayShift', options = {}) {
        const startTime = Date.now();
        const device = config.ENV.DEVICES.find(d => d.prefix === prefix);
        
        if (!device) {
            throw new Error(`Device with prefix '${prefix}' not found`);
        }

        const webhookUrl = `${this.baseUrl}/${prefix}/attendance/webhook/${webhookType}`;
        
        try {
            console.log(`📡 Triggering webhook for ${prefix} (${device.name})`);
            
            const response = await this.makeWebhookRequest(webhookUrl, options);
            
            const result = {
                success: true,
                deviceId: prefix,
                deviceName: device.name,
                webhookType,
                webhookUrl,
                response: response.data,
                statusCode: response.status,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Webhook for ${prefix} succeeded (${result.responseTime}ms)`);
            return result;
            
        } catch (error) {
            const result = {
                success: false,
                deviceId: prefix,
                deviceName: device.name,
                webhookType,
                webhookUrl,
                error: error.message,
                statusCode: error.response?.status || null,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            console.error(`❌ Webhook for ${prefix} failed: ${error.message}`);
            return result;
        }
    }

    /**
     * Make webhook HTTP request with retry logic
     * @param {string} url - Webhook URL
     * @param {Object} options - Request options
     * @returns {Object} Axios response
     */
    async makeWebhookRequest(url, options = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await axios.get(url, {
                    timeout: 30000, // 30 second timeout
                    ...options
                });
                
                if (attempt > 1) {
                    console.log(`🔄 Webhook succeeded on attempt ${attempt}`);
                }
                
                return response;
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryAttempts) {
                    const delay = this.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`🔄 Webhook attempt ${attempt} failed, retrying in ${delay}ms...`);
                    await this.delay(delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Log webhook results in a formatted way
     * @param {string} runType - Type of run ('Initial' or 'Scheduled')
     * @param {Object} results - Results object
     */
    logWebhookResults(runType, results) {
        console.log(`\n📊 ${runType} Webhook Run Results:`);
        console.log(`   📱 Total Devices: ${results.totalDevices}`);
        console.log(`   ✅ Successful: ${results.successful}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   ⏭️  Skipped: ${results.skipped}`);
        console.log(`   ⏱️  Duration: ${results.summary.durationMs}ms`);
        
        if (results.deviceResults.length > 0) {
            console.log('\n📋 Device Results:');
            results.deviceResults.forEach(result => {
                const status = result.success ? '✅' : '❌';
                const time = result.responseTime ? `(${result.responseTime}ms)` : '';
                console.log(`   ${status} ${result.deviceId} - ${result.deviceName} ${time}`);
                
                if (result.error) {
                    console.log(`      Error: ${result.error}`);
                }
            });
        }
        
        if (results.error) {
            console.log(`\n❌ Run Error: ${results.error}`);
        }
        
        console.log(''); // Empty line for readability
    }

    /**
     * Trigger webhook for devices by country
     * @param {string} countryCode - Country code (e.g., 'PK', 'US')
     * @param {string} webhookType - Type of webhook
     * @param {Object} options - Additional options
     * @returns {Object} Results summary
     */
    async triggerWebhooksByCountry(countryCode, webhookType = 'todayShift', options = {}) {
        const countryDevices = config.ENV.DEVICES.filter(d => d.country === countryCode);
        
        if (countryDevices.length === 0) {
            throw new Error(`No devices found for country: ${countryCode}`);
        }
        
        console.log(`🌍 Triggering webhooks for ${countryDevices.length} devices in ${countryCode}`);
        
        const results = await this.triggerWebhooksForAllDevices(webhookType, {
            ...options,
            countryFilter: countryCode
        });
        
        return results;
    }

    /**
     * Trigger webhook for specific device IDs
     * @param {Array} deviceIds - Array of device prefixes
     * @param {string} webhookType - Type of webhook
     * @param {Object} options - Additional options
     * @returns {Object} Results summary
     */
    async triggerWebhooksForDevices(deviceIds, webhookType = 'todayShift', options = {}) {
        const devices = config.ENV.DEVICES.filter(d => deviceIds.includes(d.prefix));
        
        if (devices.length === 0) {
            throw new Error(`No devices found for IDs: ${deviceIds.join(', ')}`);
        }
        
        console.log(`🎯 Triggering webhooks for ${devices.length} specific devices: ${deviceIds.join(', ')}`);
        
        const results = await this.triggerWebhooksForAllDevices(webhookType, {
            ...options,
            deviceFilter: deviceIds
        });
        
        return results;
    }

    /**
     * Stop scheduled webhook calls
     */
    stopScheduledWebhooks() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('🛑 Scheduled webhook calls stopped');
        }
    }

    /**
     * Get scheduler status and statistics
     * @returns {Object} Scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isScheduled: this.intervalId !== null,
            lastRunTime: this.lastRunTime,
            intervalMinutes: this.intervalMinutes,
            maxConcurrentDevices: this.maxConcurrentDevices,
            totalDevices: config.ENV.DEVICES.length,
            deviceResults: Array.from(this.deviceResults.values())
        };
    }

    /**
     * Utility: Split array into chunks
     * @param {Array} array - Array to chunk
     * @param {number} chunkSize - Size of each chunk
     * @returns {Array} Array of chunks
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Utility: Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = WebhookScheduler;
