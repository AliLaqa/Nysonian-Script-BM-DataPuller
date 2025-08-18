const axios = require('axios');
const config = require('../config');

/**
 * Webhook Scheduler
 * Handles automatic webhook calls on server start and scheduled intervals
 */
class WebhookScheduler {
    constructor() {
        this.webhookUrl = `${config.API.BASE_URL}${config.API.ENDPOINTS.WEBHOOK_TODAY}`;
        this.intervalId = null;
    }

    /**
     * Initialize the webhook scheduler
     * Triggers initial webhook call and sets up scheduled intervals
     */
    init() {
        console.log('\n🚀 Initializing Webhook Scheduler...');
        
        // Call /webhook/today automatically on server start
        this.triggerInitialWebhook();
        
        // Set up scheduled webhook calls every 30 minutes
        this.startScheduledWebhooks();
        
        console.log('✅ Webhook Scheduler initialized successfully');
    }

    /**
     * Trigger the initial webhook call on server start
     */
    triggerInitialWebhook() {
        console.log(`\n🔔 Triggering initial webhook: GET ${this.webhookUrl}`);
        
        axios.get(this.webhookUrl)
            .then(response => {
                console.log('✅ Initial /attendance/webhook/today call succeeded:', response.data.message || response.data);
            })
            .catch(error => {
                if (error.response) {
                    console.error('❌ Initial /attendance/webhook/today call failed:', error.response.data);
                } else {
                    console.error('❌ Initial /attendance/webhook/today call error:', error.message);
                }
            });
    }

    /**
     * Start scheduled webhook calls every 30 minutes
     */
    startScheduledWebhooks() {
        const intervalMs = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        this.intervalId = setInterval(() => {
            console.log(`\n🔔 Scheduled webhook: GET ${this.webhookUrl}`);
            
            axios.get(this.webhookUrl)
                .then(response => {
                    console.log('✅ Scheduled /attendance/webhook/today call succeeded:', response.data.message || response.data);
                })
                .catch(error => {
                    if (error.response) {
                        console.error('❌ Scheduled /attendance/webhook/today call failed:', error.response.data);
                    } else {
                        console.error('❌ Scheduled /attendance/webhook/today call error:', error.message);
                    }
                });
        }, intervalMs);
        
        console.log(`⏰ Scheduled webhook calls every ${intervalMs / 1000 / 60} minutes`);
    }

    /**
     * Stop scheduled webhook calls
     */
    stopScheduledWebhooks() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Scheduled webhook calls stopped');
        }
    }

    /**
     * Get the current webhook URL
     */
    getWebhookUrl() {
        return this.webhookUrl;
    }

    /**
     * Check if scheduler is running
     */
    isRunning() {
        return this.intervalId !== null;
    }
}

module.exports = WebhookScheduler;
