// api-server.js - Express API server for n8n integration (Modular Version)
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
const webhookRoutes = require('./webhook_routes/webhook');
const shiftDataRoutes = require('./shift_routes/shiftData');
const shiftEmployeesRoutes = require('./shift_routes/shiftEmployees');
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
app.use('/', rootRoutes);                      // Root API documentation
app.use('/health', healthRoutes);              // Health check endpoints
app.use('/attendance', attendanceAllRoutes);    // Get all attendance logs
app.use('/attendance/filter', attendanceFilterRoutes); // Get filtered attendance logs
app.use('/attendance', attendanceWithNamesRoutes); // Attendance with employee names
app.use('/device', deviceRoutes);              // Device information endpoints
app.use('/webhook', webhookRoutes);            // Webhook integration endpoints
app.use('/todayShift', shiftDataRoutes);        // Main shift data endpoint
app.use('/todayShift/employees', shiftEmployeesRoutes); // Employee shift summary
app.use('/todayShift/checkin', shiftCheckinRoutes);     // Shift check-in data
app.use('/todayShift/checkout', shiftCheckoutRoutes);   // Shift check-out data

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
    console.log(`\n🚀 ZKTeco MB460 API Server started!`);
    console.log(`📍 Server: http://${HOST}:${PORT}`);
    console.log(`🔗 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`📊 Attendance API: http://${HOST}:${PORT}/attendance`);
    console.log(`📱 Device Info: http://${HOST}:${PORT}/device/info`);
    console.log(`🔗 Webhook API: http://${HOST}:${PORT}/webhook`);
    console.log(`🕐 Today Shift API: http://${HOST}:${PORT}/todayShift`);
    console.log(`\n⚙️ Configuration:`);
    console.log(`   MB460 Device: ${config.ENV.MB460_IP}:${config.ENV.MB460_PORT}`);
    console.log(`\n🎯 Ready for n8n integration!`);

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