// api-server.js - Express API server for n8n integration (Multi-Device Version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Import route modules
const rootRoutes = require('./simple_routes/root');
const healthRoutes = require('./simple_routes/health');
const attendanceAllRoutes = require('./simple_routes/attendanceAll');
const attendanceFilterRoutes = require('./simple_routes/attendanceFilter');
const attendanceWithNamesRoutes = require('./simple_routes/attendanceWithNames');
const deviceRoutes = require('./simple_routes/device');
const devicesRoutes = require('./simple_routes/devices'); // New multi-device routes
const webhookRoutes = require('./webhook_routes/webhook');
const shiftDataRoutes = require('./shift_routes/shiftData');
const shiftCheckinRoutes = require('./shift_routes/shiftCheckin');
const shiftCheckoutRoutes = require('./shift_routes/shiftCheckout');
const config = require('./config');

// Import triggers
const WebhookScheduler = require('./triggers/webhookScheduler');

const app = express();
const PORT = config.ENV.API_PORT;
const HOST = config.ENV.API_HOST;

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Route mounting
app.use('/attendance/apiDocumentation', rootRoutes); // Root API documentation now under /attendance/apiDocumentation
app.use('/attendance/health', healthRoutes);        // Health check endpoints now under /attendance/health
app.use('/devices', devicesRoutes); // Multi-device management endpoints (must come before device-specific routes)

// Legacy attendance endpoint redirect
app.get('/attendance', (req, res) => {
    res.redirect('/pk01/attendance');
});

app.use('/', attendanceAllRoutes);    // Device-specific endpoints at root level (/:prefix/attendance)
app.use('/attendance/filter', attendanceFilterRoutes); // Get filtered attendance logs
app.use('/attendance', attendanceWithNamesRoutes); // Attendance with employee names
app.use('/attendance', deviceRoutes); // Device information endpoints now under /attendance/device
app.use('/attendance/webhook', webhookRoutes); // Webhook integration endpoints now under /attendance/webhook
app.use('/attendance', shiftDataRoutes); // Main shift data endpoint now under /attendance/todayShift
app.use('/attendance/todayShift', shiftCheckinRoutes);     // Shift check-in data now under /attendance/todayShift/checkin
app.use('/attendance/todayShift', shiftCheckoutRoutes);   // Shift check-out data now under /attendance/todayShift/checkout
// app.use('/attendance/logs', logEditorRoutes); // Removed logs endpoints

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
    });
});

// Start server The function you pass to app.listen runs once when the server is ready and listening for requests.
// So the function is executed immediately when the server is ready.
const server = app.listen(PORT, HOST, () => {
    console.log(`\n🚀 ZKTeco Multi-Device API Server started!`);
    console.log(`📍 Server: http://${HOST}:${PORT}`);
    console.log(`🔗 Health Check: http://${HOST}:${PORT}/attendance/health`);
    console.log(`📊 Attendance API: http://${HOST}:${PORT}/attendance`);
    console.log(`📋 API Documentation: http://${HOST}:${PORT}/attendance/apiDocumentation`);
    console.log(`📱 Device Info: http://${HOST}:${PORT}/attendance/device/info`);
    console.log(`🔗 Webhook API: http://${HOST}:${PORT}/attendance/webhook`);
    console.log(`🕐 Today Shift API: http://${HOST}:${PORT}/attendance/todayShift`);
    
    // Multi-device endpoints
    console.log(`\n🌍 Multi-Device Endpoints:`);
    console.log(`   📋 All Devices: http://${HOST}:${PORT}/devices`);
    console.log(`   🔍 Device Health: http://${HOST}:${PORT}/devices/health`);
    console.log(`   📊 All Devices Attendance: http://${HOST}:${PORT}/devices/attendance/all`);
    
    // Device-specific endpoints
    const devices = config.ENV.DEVICES;
    console.log(`\n📱 Device-Specific Endpoints:`);
    devices.forEach(device => {
        console.log(`   ${device.location} (${device.id}): http://${HOST}:${PORT}/${device.id}/attendance`);
    });
    
    console.log(`\n⚙️ Configuration:`);
    console.log(`   Total Devices: ${devices.length}`);
    devices.forEach(device => {
        console.log(`   ${device.id}: ${device.ip}:${device.port} (${device.location})`);
    });
    console.log(`\n🎯 Ready for multi-device n8n integration!`);

    // Initialize webhook scheduler
    const webhookScheduler = new WebhookScheduler();
    webhookScheduler.init();
    
    // Store globally for graceful shutdown
    global.webhookScheduler = webhookScheduler;
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    
    // Stop webhook scheduler if it exists
    if (global.webhookScheduler && global.webhookScheduler.isRunning()) {
        global.webhookScheduler.stopScheduledWebhooks();
    }
    
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});

module.exports = app;