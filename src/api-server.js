// src/api-server.js - Express API server for the new multi-device architecture
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import configuration
const config = require('./config');

// Import new route modules
const rootRoutes = require('./routes/rootRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Import new webhook scheduler (disabled per request)
// const WebhookScheduler = require('./triggers/webhookScheduler');

// Import middleware
const { 
    performanceMiddleware, 
    correlationMiddleware, 
    devicePrefixMiddleware, 
    responseTimeHeaderMiddleware 
} = require('./middleware/performanceMiddleware');

const app = express();
const PORT = config.ENV.API_PORT;
const HOST = config.ENV.API_HOST;
// const PORT = process.env.API_PORT || 3000;
// const HOST = process.env.API_HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Performance and observability middleware
app.use(correlationMiddleware);
app.use(devicePrefixMiddleware);
app.use(responseTimeHeaderMiddleware);
app.use(performanceMiddleware);

// Route mounting for new architecture
app.use('/', rootRoutes);                    // Root and health endpoints
app.use('/', deviceRoutes);                  // Device management endpoints
app.use('/', attendanceRoutes);              // Attendance endpoints
app.use('/', shiftRoutes);                   // Shift endpoints
app.use('/', webhookRoutes);                 // Webhook endpoints
app.use('/', healthRoutes);                  // Health monitoring endpoints


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
        requestId: req.headers['x-request-id'] || 'unknown'
    });
});

// 404 handler for undefined routes // Causing the regex error when uncommented.
// app.use('*', (req, res) => {
//     res.status(404).json({
//         success: false,
//         timestamp: new Date().toISOString(),
//         error: 'Route not found',
//         path: req.originalUrl,
//         availableRoutes: [
//             'GET / - API documentation',
//             'GET /health - Health check',
//             'GET /api-docs - Detailed API documentation',
//             'GET /:prefix/health - Device health',
//             'GET /:prefix/device/info - Device information',
//             'GET /devices - All devices',
//             'GET /country/:code/devices - Devices by country',
//             'GET /:prefix/attendance - Latest attendance',
//             'GET /:prefix/attendance/today - Today\'s attendance',
//             'GET /:prefix/attendance/todayShift - Today\'s shift',
//             'GET /attendance/all-devices - All devices attendance',
//             'GET /country/:code/attendance - Attendance by country',
//             'GET /:prefix/attendance/webhook/todayShift - Trigger webhook',
//             'POST /devices/webhook/todayShift - Fleet webhook'
//         ]
//     });
// });


// Start server
const server = app.listen(PORT, HOST, () => {
    
    console.log(`\n🚀 ZKTeco Multi-Device API Server (New Architecture) Started!`);
    console.log(`📍 Server: http://${HOST}:${PORT}`);
    console.log(`🔗 Basic Health: http://${HOST}:${PORT}/health`);
    console.log(`🏥 System Health: http://${HOST}:${PORT}/health/system`);
    console.log(`📊 Device Health: http://${HOST}:${PORT}/health/devices`);
    console.log(`📈 System Metrics: http://${HOST}:${PORT}/health/metrics`);
    console.log(`📋 API Documentation: http://${HOST}:${PORT}/`);
    console.log(`📚 Detailed Docs: http://${HOST}:${PORT}/api-docs`);
    
    // Multi-device endpoints
    console.log(`\n🌍 Multi-Device Endpoints:`);
    console.log(`   📋 All Devices: http://${HOST}:${PORT}/devices`);
    console.log(`   🔍 Device Health: http://${HOST}:${PORT}/:prefix/health`);
    console.log(`   📊 All Devices Attendance: http://${HOST}:${PORT}/attendance/all-devices`);
    console.log(`   🕐 All Devices Shift: http://${HOST}:${PORT}/attendance/all-devices/todayShift`);
    
    // Device-specific endpoints
    const devices = config.ENV.DEVICES;
    console.log(`\n📱 Device-Specific Endpoints:`);
    devices.forEach(device => {
        console.log(`   ${device.location} (${device.id}):`);
        console.log(`     📊 Attendance: http://${HOST}:${PORT}/${device.id}/attendance`);
        console.log(`     🕐 Shift: http://${HOST}:${PORT}/${device.id}/attendance/todayShift`);
        console.log(`     🔗 Webhook: http://${HOST}:${PORT}/${device.id}/attendance/webhook/todayShift`);
        console.log(`     📡 All Data Webhook: http://${HOST}:${PORT}/${device.id}/attendance/webhook/all`);
    });
    
    // Webhook endpoints
    console.log(`\n🔗 Webhook Endpoints:`);
    console.log(`   📡 Fleet Webhook: http://${HOST}:${PORT}/devices/webhook/todayShift`);
    console.log(`   🧪 Test Webhook: http://${HOST}:${PORT}/webhook/test`);
    
    console.log(`\n⚙️ Configuration:`);
    console.log(`   Total Devices: ${devices.length}`);
    devices.forEach(device => {
        console.log(`   ${device.id}: ${device.ip}:${device.port} (${device.location})`);
    });
    
    console.log(`\n🎯 New Architecture Features:`);
    console.log(`   ✅ Device-scoped endpoints with :prefix parameter`);
    console.log(`   ✅ Fleet-level aggregation endpoints`);
    console.log(`   ✅ Layered architecture (Controllers → Services → Device Adapters)`);
    console.log(`   ✅ Consistent error handling and response formatting`);
    console.log(`   ✅ Multi-device webhook scheduler`);
    
    console.log(`\n🎯 Ready for scalable multi-device operations!`);

    // Initialize the new multi-device webhook scheduler (disabled per request)
    // console.log('\n🚀 Initializing Multi-Device Webhook Scheduler...');
    // const webhookScheduler = new WebhookScheduler();
    // webhookScheduler.init().then(() => {
    //     console.log('✅ Webhook Scheduler initialized successfully');
    //     global.webhookScheduler = webhookScheduler;
    //     const status = webhookScheduler.getStatus();
    //     console.log(`📊 Scheduler Status: ${status.isScheduled ? 'Running' : 'Stopped'}`);
    //     console.log(`⏰ Interval: ${status.intervalMinutes} minutes`);
    //     console.log(`🔄 Max Concurrent: ${status.maxConcurrentDevices}`);
    // }).catch(error => {
    //     console.error('❌ Failed to initialize webhook scheduler:', error.message);
    //     console.log('⚠️  Server will continue without webhook automation');
    // });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server gracefully...');
    
    // Stop webhook scheduler if it exists
    // if (global.webhookScheduler) {
    //     console.log('🛑 Stopping webhook scheduler...');
    //     global.webhookScheduler.stopScheduledWebhooks();
        
    //     // Wait a moment for any running webhooks to complete
    //     await new Promise(resolve => setTimeout(resolve, 2000));
    // }
    
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;
