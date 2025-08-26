// config.js - Centralized configuration for the ZKTeco Attendance Data Puller
// This file centralizes all important variables and constants to avoid duplication
require('dotenv').config();

// Helper functions to enforce presence and type of required env vars
function requireEnvVar(name) {
    const value = process.env[name];
    if (value === undefined || value === null || String(value).trim() === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function requireIntEnvVar(name) {
    const raw = requireEnvVar(name);
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a valid integer. Received: ${raw}`);
    }
    return parsed;
}

// Environment Variables (from .env file)
const ENV = {
    // ZKTeco Device Configuration
    MB460_IP: requireEnvVar('MB460_IP'),
    MB460_PORT: requireIntEnvVar('MB460_PORT'),
    MB460_TIMEOUT: requireIntEnvVar('MB460_TIMEOUT'),
    MB460_INPORT: requireIntEnvVar('MB460_INPORT'),
    
    // API Server Configuration
    API_HOST: requireEnvVar('API_HOST'),
    API_PORT: requireIntEnvVar('API_PORT')
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
        WEBHOOK: '/attendance/webhook',
        WEBHOOK_TODAY: '/attendance/webhook/today',
        WEBHOOK_TODAY_SHIFT: '/attendance/webhook/todayShift',
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
    TIME_FORMAT: 'en-US',
    DATE_FORMAT: 'en-US'
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
