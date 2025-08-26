const axios = require('axios');
require('dotenv').config();

/**
 * Webhook Scheduler
 * Handles automatic webhook calls on server start and scheduled intervals
 */
class WebhookScheduler {
    constructor() {
        // Use real .env variables directly for the webhook URL
        const apiHost = process.env.API_HOST === '0.0.0.0' ? '127.0.0.1' : process.env.API_HOST;
        const apiPort = process.env.API_PORT;
        this.webhookUrl = `http://${apiHost}:${apiPort}/attendance/webhook/todayShift`;
        this.intervalId = null;
    }

    /**
     * Initialize the webhook scheduler
     * Triggers initial webhook call and sets up scheduled intervals
     */
    init() {
        console.log('\n🚀 Initializing Webhook Scheduler...');
        console.log(`🔗 Webhook URL: ${this.webhookUrl}`);
        console.log(`🌐 API Host: ${process.env.API_HOST}`);
        console.log(`🔌 API Port: ${process.env.API_PORT}`);
        
        // Call /webhook/todayShift automatically on server start
        this.triggerInitialWebhook();
        
        // Set up scheduled webhook calls every 15 minutes
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
                console.log('✅ Initial /attendance/webhook/todayShift call succeeded:', response.data.message || response.data);
            })
            .catch(error => {
                if (error.response) {
                    console.error('❌ Initial /attendance/webhook/todayShift call failed:', error.response.data);
                } else {
                    console.error('❌ Initial /attendance/webhook/todayShift call error:', error.message);
                }
            });
    }

    /**
     * Start scheduled webhook calls every 15 minutes
     */
    startScheduledWebhooks() {
        const intervalMs = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        this.intervalId = setInterval(() => {
            console.log(`\n🔔 Scheduled webhook: GET ${this.webhookUrl}`);
            
            axios.get(this.webhookUrl)
                .then(response => {
                    console.log('✅ Scheduled /attendance/webhook/todayShift call succeeded:', response.data.message || response.data);
                })
                .catch(error => {
                    if (error.response) {
                        console.error('❌ Scheduled /attendance/webhook/todayShift call failed:', error.response.data);
                    } else {
                        console.error('❌ Scheduled /attendance/webhook/todayShift call error:', error.message);
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
