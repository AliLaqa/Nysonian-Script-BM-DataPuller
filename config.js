// config.js - Centralized configuration for the ZKTeco Attendance Data Puller
// This file centralizes all important variables and constants to avoid duplication

// Environment Variables (from .env file)
const ENV = {
    // ZKTeco Device Configuration
    MB460_IP: process.env.MB460_IP || '192.168.1.113',
    MB460_PORT: parseInt(process.env.MB460_PORT) || 4370,
    MB460_TIMEOUT: parseInt(process.env.MB460_TIMEOUT) || 10000,
    MB460_INPORT: parseInt(process.env.MB460_INPORT) || 4000,
    
    // API Server Configuration
    API_HOST: process.env.API_HOST || '0.0.0.0',
    API_PORT: parseInt(process.env.API_PORT) || 3000
};

// API Configuration
const API = {
    // Base URLs
    BASE_URL: `http://${ENV.API_HOST === '0.0.0.0' ? '127.0.0.1' : ENV.API_HOST}:${ENV.API_PORT}`,
    LOCAL_URL: `http://127.0.0.1:${ENV.API_PORT}`,
    
    // Endpoints
    ENDPOINTS: {
        HEALTH: '/health',
        ATTENDANCE: '/attendance',
        ATTENDANCE_TODAY: '/attendance/today',
        ATTENDANCE_WITH_NAMES: '/attendanceWithNames',
        TODAY_SHIFT: '/todayShift',
        WEBHOOK: '/webhook',
        WEBHOOK_TODAY: '/webhook/today',
        WEBHOOK_TODAY_SHIFT: '/webhook/todayShift',
        DEVICE: '/device'
    },
    
    // Timeouts
    TIMEOUT: 30000, // 30 seconds
    
    // Headers
    HEADERS: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZKTeco-MB460-API/1.0'
    }
};

// N8N Webhook Configuration
const N8N = {
    WEBHOOKS: {
        TODAY_BM: 'https://nysonian.app.n8n.cloud/webhook/today-bm',
        TODAY_SHIFT_BM: 'https://nysonian.app.n8n.cloud/webhook/today-shift-bm'
    },
    
    // Webhook payload structure
    PAYLOAD: {
        SOURCE: 'ZKTeco-MB460-API',
        VERSION: '1.0'
    }
};

// Shift Configuration
const SHIFT = {
    // Shift time boundaries (24-hour format)
    START_HOUR: 17, // 5 PM
    END_HOUR: 3,    // 3 AM
    
    // Shift description
    DESCRIPTION: 'Shift spanning from 5 PM yesterday to 3 AM today',
    
    // Time formatting
    TIME_FORMAT: 'en-GB',
    DATE_FORMAT: 'en-GB'
};

// ZKTeco Device Configuration
const DEVICE = {
    // Connection settings
    IP: ENV.MB460_IP,
    PORT: ENV.MB460_PORT,
    TIMEOUT: ENV.MB460_TIMEOUT,
    INPORT: ENV.MB460_INPORT,
    
    // Device identification
    NAME: 'ZKTeco MB460',
    MODEL: 'MB460',
    
    // Connection retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // 1 second
};

// Logging Configuration
const LOGGING = {
    // Log levels
    LEVELS: {
        INFO: 'ℹ️',
        SUCCESS: '✅',
        WARNING: '⚠️',
        ERROR: '❌',
        PROCESSING: '🔄',
        STARTING: '🚀',
        COMPLETED: '🎉'
    },
    
    // Console colors (for future use)
    COLORS: {
        RESET: '\x1b[0m',
        BRIGHT: '\x1b[1m',
        RED: '\x1b[31m',
        GREEN: '\x1b[32m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        MAGENTA: '\x1b[35m',
        CYAN: '\x1b[36m'
    }
};

// Error Messages
const ERRORS = {
    DEVICE_CONNECTION: 'Failed to connect to ZKTeco device',
    DATA_FETCH: 'Failed to fetch attendance data',
    WEBHOOK_DELIVERY: 'Failed to send data to N8N webhook',
    INVALID_DATE: 'Invalid date format provided',
    TIMEOUT: 'Request timed out',
    UNKNOWN: 'An unknown error occurred'
};

// Success Messages
const SUCCESS = {
    DEVICE_CONNECTION: 'Successfully connected to ZKTeco device',
    DATA_FETCH: 'Attendance data retrieved successfully',
    WEBHOOK_DELIVERY: 'Data sent to N8N webhook successfully',
    SERVICE_START: 'ZKTeco Attendance Server started successfully'
};

// Export all configurations
module.exports = {
    ENV,
    API,
    N8N,
    SHIFT,
    DEVICE,
    LOGGING,
    ERRORS,
    SUCCESS
};
