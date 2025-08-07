// api-server.js - Express API server for n8n integration (Modular Version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import route modules
const healthRoutes = require('./routes/health');
const attendanceRoutes = require('./routes/attendance');
const attendanceWithNamesRoutes = require('./routes/attendanceWithNames');
const deviceRoutes = require('./routes/device');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Route mounting
app.use('/', healthRoutes);                    // Health check and documentation
app.use('/attendance', attendanceRoutes);      // Basic attendance endpoints
app.use('/attendance', attendanceWithNamesRoutes); // Attendance with employee names
app.use('/device', deviceRoutes);              // Device information endpoints
app.use('/webhook', webhookRoutes);            // Webhook integration endpoints

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
    });
});

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log(`\n🚀 ZKTeco MB460 API Server started!`);
    console.log(`📍 Server: http://${HOST}:${PORT}`);
    console.log(`🔗 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`📊 Attendance API: http://${HOST}:${PORT}/attendance`);
    console.log(`📱 Device Info: http://${HOST}:${PORT}/device/info`);
    console.log(`🔗 Webhook API: http://${HOST}:${PORT}/webhook`);
    console.log(`\n⚙️ Configuration:`);
    console.log(`   MB460 Device: ${process.env.MB460_IP}:${process.env.MB460_PORT}`);
    console.log(`\n🎯 Ready for n8n integration!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});

module.exports = app;