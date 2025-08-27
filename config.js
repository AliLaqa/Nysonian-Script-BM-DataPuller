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

// Multi-device configuration with location-based prefixes
function getDeviceConfigs() {
    const devices = [];
    
    // Legacy single device support (for backward compatibility)
    if (process.env.MB460_IP) {
        devices.push({
            id: 'pk01',
            prefix: 'pk01',
            name: 'ZKTeco MB460 (Pakistan Primary)',
            model: 'MB460',
            ip: requireEnvVar('MB460_IP'),
            port: requireIntEnvVar('MB460_PORT'),
            timeout: requireIntEnvVar('MB460_TIMEOUT'),
            inport: requireEnvVar('MB460_INPORT'),
            location: 'Pakistan',
            country: 'PK',
            description: 'Primary biometric device in Pakistan'
        });
    }
    
    // Location-based device configuration
    const deviceConfigs = [
        // Pakistan Devices
        { prefix: 'pk01', country: 'PK', location: 'Pakistan' },
        { prefix: 'pk02', country: 'PK', location: 'Pakistan' },
        { prefix: 'pk03', country: 'PK', location: 'Pakistan' },
        
        // USA Devices
        { prefix: 'us01', country: 'US', location: 'USA' },
        { prefix: 'us02', country: 'US', location: 'USA' },
        { prefix: 'us03', country: 'US', location: 'USA' },
        
        // UK Devices (if needed)
        { prefix: 'uk01', country: 'UK', location: 'United Kingdom' },
        { prefix: 'uk02', country: 'UK', location: 'United Kingdom' },
        
        // UAE Devices (if needed)
        { prefix: 'ae01', country: 'AE', location: 'UAE' },
        { prefix: 'ae02', country: 'AE', location: 'UAE' }
    ];
    
    deviceConfigs.forEach(config => {
        const ip = process.env[`${config.prefix.toUpperCase()}_IP`];
        const port = process.env[`${config.prefix.toUpperCase()}_PORT`];
        
        if (ip && port) {
            devices.push({
                id: config.prefix,
                prefix: config.prefix,
                name: process.env[`${config.prefix.toUpperCase()}_NAME`] || `ZKTeco Device ${config.prefix.toUpperCase()}`,
                model: process.env[`${config.prefix.toUpperCase()}_MODEL`] || 'MB460',
                ip: ip,
                port: parseInt(port, 10),
                timeout: parseInt(process.env[`${config.prefix.toUpperCase()}_TIMEOUT`] || '10000', 10),
                inport: process.env[`${config.prefix.toUpperCase()}_INPORT`] || '4000',
                location: config.location,
                country: config.country,
                description: process.env[`${config.prefix.toUpperCase()}_DESCRIPTION`] || `${config.location} Device ${config.prefix}`
            });
        }
    });
    
    if (devices.length === 0) {
        throw new Error('No biometric devices configured. Please set at least one device configuration.');
    }
    
    return devices;
}

// Environment Variables (from .env file)
const ENV = {
    // API Server Configuration
    API_HOST: requireEnvVar('API_HOST'),
    API_PORT: requireIntEnvVar('API_PORT'),
    
    // Multi-device configuration
    DEVICES: getDeviceConfigs()
};

// Detect if running on Fly.io (when API_HOST is 0.0.0.0)
const IS_DEPLOYED = ENV.API_HOST === '0.0.0.0';

// API Configuration
const API = {
    // Base URLs
    BASE_URL: `http://${ENV.API_HOST === '0.0.0.0' ? '127.0.0.1' : ENV.API_HOST}:${ENV.API_PORT}`,
    LOCAL_URL: `http://127.0.0.1:${ENV.API_PORT}`,
    
    // Endpoints
    ENDPOINTS: {
        HEALTH: '/health',
        ATTENDANCE: '/attendance', // Legacy endpoint (maps to pk01)
        ATTENDANCE_TODAY: '/attendance/today',
        ATTENDANCE_WITH_NAMES: '/attendanceWithNames',
        TODAY_SHIFT: '/todayShift',
        WEBHOOK: '/attendance/webhook',
        WEBHOOK_TODAY: '/attendance/webhook/today',
        WEBHOOK_TODAY_SHIFT: '/attendance/webhook/todayShift',
        DEVICE: '/device',
        
        // Multi-device endpoints (location-based)
        DEVICES: '/devices',
        DEVICE_ATTENDANCE: '/:prefix/attendance',
        DEVICE_INFO: '/:prefix/device/info',
        DEVICE_HEALTH: '/:prefix/health',
        ALL_DEVICES_ATTENDANCE: '/attendance/all-devices',
        
        // Legacy compatibility endpoints
        LEGACY_ATTENDANCE: '/attendance' // Maps to pk01/attendance
    },
    
    // Timeouts
    TIMEOUT: 30000, // 30 seconds
    
    // Headers
    HEADERS: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZKTeco-Multi-Location-API/1.0'
    }
};

// N8N Webhook Configuration
const N8N = {
    WEBHOOKS: {
        TODAY_BM: 'https://nysonian.app.n8n.cloud/webhook/today-bm',
        TODAY_SHIFT_BM: 'https://nysonian.app.n8n.cloud/webhook/today-shift-bm',
        ALL_DEVICES: 'https://nysonian.app.n8n.cloud/webhook/all-devices',
        PAKISTAN_DEVICES: 'https://nysonian.app.n8n.cloud/webhook/pakistan-devices',
        USA_DEVICES: 'https://nysonian.app.n8n.cloud/webhook/usa-devices'
    },
    
    // Webhook payload structure
    PAYLOAD: {
        SOURCE: 'ZKTeco-Multi-Location-API',
        VERSION: '1.0'
    }
};

// Shift Configuration
const SHIFT = {
    // Shift time boundaries (24-hour format)
    START_HOUR: 18, // 6 PM
    END_HOUR: 2,    // 2 AM
    
    // Shift description
    DESCRIPTION: 'Shift spanning from 6 PM yesterday to 2 AM today',
    
    // Time formatting
    TIME_FORMAT: 'en-US',
    DATE_FORMAT: 'en-US'
};

// Device Management Configuration
const DEVICE_MANAGEMENT = {
    // Connection settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    CONNECTION_TIMEOUT: 10000, // 10 seconds
    
    // Device identification
    DEFAULT_MODEL: 'MB460',
    DEFAULT_INPORT: '4000',
    
    // Parallel processing
    MAX_CONCURRENT_DEVICES: 3, // Process max 3 devices simultaneously
    
    // Health check settings
    HEALTH_CHECK_INTERVAL: 300000, // 5 minutes
    DEVICE_OFFLINE_THRESHOLD: 3, // Mark device offline after 3 failed attempts
    
    // Location prefixes
    LOCATION_PREFIXES: {
        'PK': 'pk', // Pakistan
        'US': 'us', // USA
        'UK': 'uk', // United Kingdom
        'AE': 'ae'  // UAE
    }
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
    UNKNOWN: 'An unknown error occurred',
    DEVICE_NOT_FOUND: 'Device not found',
    DEVICE_OFFLINE: 'Device is offline or unreachable',
    INVALID_PREFIX: 'Invalid device prefix'
};

// Success Messages
const SUCCESS = {
    DEVICE_CONNECTION: 'Successfully connected to ZKTeco device',
    DATA_FETCH: 'Attendance data retrieved successfully',
    WEBHOOK_DELIVERY: 'Data sent to N8N webhook successfully',
    SERVICE_START: 'ZKTeco Multi-Location Attendance Server started successfully'
};

// Export all configurations
module.exports = {
    ENV,
    API,
    N8N,
    SHIFT,
    DEVICE_MANAGEMENT,
    LOGGING,
    ERRORS,
    SUCCESS
};
