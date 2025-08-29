// src/routes/rootRoutes.js
// Express routes for root and documentation

const express = require('express');
const router = express.Router();
const deviceService = require('../services/deviceService');
const config = require('../config');

// GET / - API documentation
router.get('/', (req, res) => {
    res.json({
        service: 'ZKTeco Multi-Device Attendance API',
        version: '2.0.0',
        description: 'Scalable biometric device management with device-scoped endpoints',
        timestamp: new Date().toISOString(),
        architecture: 'Layered (Controllers → Services → Device Adapters)',
        endpoints: {
            // Device management
            'GET /:prefix/health': 'Device health check',
            'GET /:prefix/device/info': 'Device information',
            'GET /devices': 'List all configured devices',
            'GET /country/:code/devices': 'Devices by country',
            
            // Attendance endpoints
            'GET /:prefix/attendance': 'Latest attendance for device',
            'GET /:prefix/attendance/date/:date': 'Date-specific attendance',
            'GET /:prefix/attendance/filter/:start/:end': 'Filtered attendance',
            'GET /:prefix/attendance/today': 'Today\'s attendance',
            'GET /attendance/all-devices': 'Attendance from all devices',
            'GET /country/:code/attendance': 'Attendance by country',
            
            // Shift endpoints
            'GET /:prefix/attendance/todayShift': 'Today\'s shift data (spanning midnight)',
            'GET /:prefix/attendance/todayShift/checkin': 'Shift check-in data',
            'GET /:prefix/attendance/todayShift/checkout': 'Shift check-out data',
            'GET /attendance/all-devices/todayShift': 'Shift data from all devices',
            'POST /:prefix/attendance/todayShift/process': 'Process shift data with custom config',
            
            // Webhook endpoints
            'GET /:prefix/attendance/webhook/todayShift': 'Trigger webhook with shift data',
            'POST /:prefix/attendance/webhook/today': 'Trigger webhook with today\'s data',
            'POST /:prefix/attendance/webhook/date': 'Trigger webhook with specific date',
            'POST /devices/webhook/todayShift': 'Trigger webhook for all devices',
            'POST /devices/webhook/today': 'Trigger webhook for all devices with today\'s data',
            'GET /webhook/test': 'Test webhook functionality',
            'POST /webhook/validate': 'Validate webhook URL',
            'POST /webhook/send': 'Send data to custom webhook'
        },
        configuration: {
            apiHost: config.ENV.API_HOST,
            apiPort: config.ENV.API_PORT,
            totalDevices: config.ENV.DEVICES.length,
            deviceTypes: [...new Set(config.ENV.DEVICES.map(d => d.model))],
            countries: [...new Set(config.ENV.DEVICES.map(d => d.country))]
        },
        examples: {
            deviceScoped: '/pk01/attendance/today',
            fleetLevel: '/attendance/all-devices',
            countryFilter: '/country/PK/attendance',
            webhookTrigger: 'POST /pk01/attendance/webhook/todayShift'
        }
    });
});

// Health check is now handled by healthRoutes.js
// GET /health - Overall health check (moved to healthRoutes)

// GET /api-docs - Detailed API documentation
router.get('/api-docs', (req, res) => {
    res.json({
        title: 'ZKTeco Multi-Device Attendance API Documentation',
        version: '2.0.0',
        description: 'Complete API reference for the new device-scoped architecture',
        timestamp: new Date().toISOString(),
        
        // Device Management
        deviceManagement: {
            description: 'Device configuration and health management',
            endpoints: {
                'GET /:prefix/health': {
                    description: 'Check device health status',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Device health information with status'
                },
                'GET /:prefix/device/info': {
                    description: 'Get device configuration information',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Device details including IP, port, location, model'
                },
                'GET /devices': {
                    description: 'List all configured devices',
                    parameters: 'None',
                    response: 'Array of all device configurations with summary'
                },
                'GET /country/:code/devices': {
                    description: 'Get devices filtered by country',
                    parameters: { code: 'Country code (e.g., PK, US)' },
                    response: 'Devices in the specified country'
                }
            }
        },
        
        // Attendance Management
        attendanceManagement: {
            description: 'Attendance data retrieval with device-scoped operations',
            endpoints: {
                'GET /:prefix/attendance': {
                    description: 'Get latest attendance data from device',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Latest attendance records with summary'
                },
                'GET /:prefix/attendance/date/:date': {
                    description: 'Get attendance for specific date',
                    parameters: { 
                        prefix: 'Device prefix (e.g., pk01, us01)',
                        date: 'Date in YYYY-MM-DD format'
                    },
                    response: 'Date-specific attendance data'
                },
                'GET /:prefix/attendance/filter/:start/:end': {
                    description: 'Get attendance for date range',
                    parameters: { 
                        prefix: 'Device prefix (e.g., pk01, us01)',
                        start: 'Start date in YYYY-MM-DD format',
                        end: 'End date in YYYY-MM-DD format'
                    },
                    response: 'Filtered attendance data for date range'
                },
                'GET /:prefix/attendance/today': {
                    description: 'Get today\'s attendance data',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Today\'s attendance records'
                },
                'GET /attendance/all-devices': {
                    description: 'Get attendance from all devices',
                    parameters: 'None',
                    response: 'Combined attendance data from all devices'
                },
                'GET /country/:code/attendance': {
                    description: 'Get attendance by country',
                    parameters: { code: 'Country code (e.g., PK, US)' },
                    response: 'Attendance data from devices in the country'
                }
            }
        },
        
        // Shift Management
        shiftManagement: {
            description: 'Shift data management spanning midnight boundaries',
            endpoints: {
                'GET /:prefix/attendance/todayShift': {
                    description: 'Get today\'s shift data (spanning midnight)',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Shift data with check-in/check-out times'
                },
                'GET /:prefix/attendance/todayShift/checkin': {
                    description: 'Get shift check-in data',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Check-in records for the shift period'
                },
                'GET /:prefix/attendance/todayShift/checkout': {
                    description: 'Get shift check-out data',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Check-out records for the shift period'
                },
                'GET /attendance/all-devices/todayShift': {
                    description: 'Get shift data from all devices',
                    parameters: 'None',
                    response: 'Combined shift data from all devices'
                },
                'POST /:prefix/attendance/todayShift/process': {
                    description: 'Process shift data with custom configuration',
                    parameters: { 
                        prefix: 'Device prefix (e.g., pk01, us01)',
                        body: { records: 'Array of attendance records', shiftConfig: 'Optional shift configuration' }
                    },
                    response: 'Processed shift data with custom settings'
                }
            }
        },
        
        // Webhook Management
        webhookManagement: {
            description: 'N8N webhook integration and management',
            endpoints: {
                'GET /:prefix/attendance/webhook/todayShift': {
                    description: 'Trigger webhook with today\'s shift data',
                    parameters: { prefix: 'Device prefix (e.g., pk01, us01)' },
                    response: 'Webhook trigger result with delivery status'
                },
                'POST /:prefix/attendance/webhook/today': {
                    description: 'Trigger webhook with today\'s data',
                    parameters: { 
                        prefix: 'Device prefix (e.g., pk01, us01)',
                        body: { webhookUrl: 'Optional custom webhook URL' }
                    },
                    response: 'Webhook trigger result'
                },
                'POST /:prefix/attendance/webhook/date': {
                    description: 'Trigger webhook with specific date data',
                    parameters: { 
                        prefix: 'Device prefix (e.g., pk01, us01)',
                        body: { date: 'Date in YYYY-MM-DD format', webhookUrl: 'Optional custom webhook URL' }
                    },
                    response: 'Webhook trigger result for specific date'
                },
                'POST /devices/webhook/todayShift': {
                    description: 'Trigger webhook for all devices with shift data',
                    parameters: { 
                        body: { country: 'Optional country filter', deviceIds: 'Optional array of device IDs' }
                    },
                    response: 'Fleet webhook result with per-device status'
                },
                'POST /devices/webhook/today': {
                    description: 'Trigger webhook for all devices with today\'s data',
                    parameters: { 
                        body: { country: 'Optional country filter', deviceIds: 'Optional array of device IDs' }
                    },
                    response: 'Fleet webhook result with per-device status'
                },
                'GET /webhook/test': {
                    description: 'Test webhook functionality',
                    parameters: 'None',
                    response: 'Webhook service status and capabilities'
                },
                'POST /webhook/validate': {
                    description: 'Validate webhook URL format',
                    parameters: { body: { url: 'URL to validate' } },
                    response: 'URL validation result'
                },
                'POST /webhook/send': {
                    description: 'Send data to custom webhook',
                    parameters: { 
                        body: { data: 'Data to send', webhookUrl: 'Target webhook URL' }
                    },
                    response: 'Webhook delivery result'
                }
            }
        },
        
        // Response Format
        responseFormat: {
            success: 'All successful responses include success: true, timestamp, and data',
            error: 'All error responses include success: false, error message, and requestId',
            standard: {
                success: 'boolean - Operation success status',
                timestamp: 'ISO string - Response timestamp',
                data: 'object - Response data payload',
                summary: 'object - Optional summary information',
                error: 'string - Error message (only on failure)',
                requestId: 'string - Unique request identifier for tracking'
            }
        },
        
        // Examples
        examples: {
            deviceScoped: {
                url: '/pk01/attendance/today',
                description: 'Get today\'s attendance from Pakistan device 01'
            },
            fleetLevel: {
                url: '/attendance/all-devices',
                description: 'Get attendance data from all configured devices'
            },
            countryFilter: {
                url: '/country/PK/attendance',
                description: 'Get attendance data from all Pakistan devices'
            },
            webhookTrigger: {
                url: 'POST /pk01/attendance/webhook/todayShift',
                description: 'Trigger webhook with shift data from Pakistan device 01'
            }
        }
    });
});

module.exports = router;
