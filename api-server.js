// api-server.js - Express API server for n8n integration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pullAttendanceLogs } = require('./pull-logs');

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ZKTeco MB460 API',
        version: '1.0.0'
    });
});

// Get attendance logs endpoint
app.get('/attendance', async (req, res) => {
    try {
        console.log('🔄 Fetching attendance logs...');
        const result = await pullAttendanceLogs();
        
        if (result.success) {
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                recordCount: result.count,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: result.error,
                recordCount: 0,
                data: []
            });
        }
    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            recordCount: 0,
            data: []
        });
    }
});

// Get attendance logs with date filtering
app.get('/attendance/filter', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`🔄 Fetching filtered attendance logs (${startDate} to ${endDate})...`);
        
        const result = await pullAttendanceLogs();
        
        if (result.success) {
            let filteredData = result.data;
            
            // Apply date filtering if provided
            if (startDate || endDate) {
                filteredData = result.data.filter(record => {
                    const recordDate = new Date(record.recordTime);
                    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
                    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
                    
                    return recordDate >= start && recordDate <= end;
                });
            }
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                totalRecords: result.count,
                filteredRecords: filteredData.length,
                filters: { startDate, endDate },
                data: filteredData
            });
        } else {
            res.status(500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: result.error,
                recordCount: 0,
                data: []
            });
        }
    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            recordCount: 0,
            data: []
        });
    }
});

// Get attendance by date with employee names
app.get('/attendance/date/:date', async (req, res) => {
    const ZKLib = require('node-zklib');
    const ip = process.env.MB460_IP || '192.168.1.201';
    const port = parseInt(process.env.MB460_PORT) || 4370;
    const timeout = parseInt(process.env.MB460_TIMEOUT) || 10000;
    const inport = parseInt(process.env.MB460_INPORT) || 4000;

    let zkInstance = new ZKLib(ip, port, timeout, inport);
    const requestedDate = req.params.date; // Expected format: YYYY-MM-DD

    try {
        console.log(`🔄 Fetching attendance for ${requestedDate} with employee names...`);
        await zkInstance.createSocket();

        // Get all users first to map IDs to names
        const users = await zkInstance.getUsers();
        const userMap = {};
        users.data.forEach(user => {
            userMap[user.userId] = {
                name: user.name,
                role: user.role,
                uid: user.uid
            };
        });

        // Get all attendance logs
        const logs = await zkInstance.getAttendances();
        
        // Filter for requested date
        const dateLogsFiltered = logs.data.filter(record => {
            const recordDate = new Date(record.recordTime);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr === requestedDate;
        });

        // Enrich with employee names
        const enrichedLogs = dateLogsFiltered.map(record => ({
            userSn: record.userSn,
            deviceUserId: record.deviceUserId,
            employeeName: userMap[record.deviceUserId]?.name || 'Unknown Employee',
            employeeRole: userMap[record.deviceUserId]?.role || 0,
            recordTime: record.recordTime,
            recordDate: new Date(record.recordTime).toLocaleDateString('en-GB'),
            recordTimeFormatted: new Date(record.recordTime).toLocaleString('en-GB'),
            timeOnly: new Date(record.recordTime).toLocaleTimeString('en-GB'),
            ip: record.ip
        }));

        // Group by employee for summary
        const employeeSummary = {};
        enrichedLogs.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeSummary[key]) {
                employeeSummary[key] = {
                    deviceUserId: record.deviceUserId,
                    employeeName: record.employeeName,
                    employeeRole: record.employeeRole,
                    totalRecords: 0,
                    firstEntry: null,
                    lastEntry: null,
                    allRecords: []
                };
            }
            employeeSummary[key].totalRecords++;
            employeeSummary[key].allRecords.push(record);
            
            if (!employeeSummary[key].firstEntry || new Date(record.recordTime) < new Date(employeeSummary[key].firstEntry.recordTime)) {
                employeeSummary[key].firstEntry = record;
            }
            if (!employeeSummary[key].lastEntry || new Date(record.recordTime) > new Date(employeeSummary[key].lastEntry.recordTime)) {
                employeeSummary[key].lastEntry = record;
            }
        });

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            requestedDate: requestedDate,
            dateFormatted: new Date(requestedDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            totalRecordsForDate: enrichedLogs.length,
            uniqueEmployeesForDate: Object.keys(employeeSummary).length,
            summary: Object.values(employeeSummary),
            detailedRecords: enrichedLogs.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime))
        });

    } catch (error) {
        console.error(`❌ Date attendance API Error for ${requestedDate}:`, error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestedDate: requestedDate,
            totalRecordsForDate: 0,
            data: []
        });
    } finally {
        try {
            await zkInstance.disconnect();
        } catch (e) {
            // Ignore disconnect errors
        }
    }
});

// Get today's attendance with employee names (August 6, 2025)
app.get('/attendance/today', async (req, res) => {
    const ZKLib = require('node-zklib');
    const ip = process.env.MB460_IP || '192.168.1.201';
    const port = parseInt(process.env.MB460_PORT) || 4370;
    const timeout = parseInt(process.env.MB460_TIMEOUT) || 10000;
    const inport = parseInt(process.env.MB460_INPORT) || 4000;

    let zkInstance = new ZKLib(ip, port, timeout, inport);

    try {
        console.log('🔄 Fetching today\'s attendance with employee names...');
        await zkInstance.createSocket();

        // Get all users first to map IDs to names
        const users = await zkInstance.getUsers();
        const userMap = {};
        users.data.forEach(user => {
            userMap[user.userId] = {
                name: user.name,
                role: user.role,
                uid: user.uid
            };
        });

        // Get all attendance logs
        const logs = await zkInstance.getAttendances();
        
        // Filter for today's date (August 6, 2025)
        const today = new Date('2025-08-06');
        const todayStr = today.toISOString().split('T')[0]; // '2025-08-06'
        
        const todaysLogs = logs.data.filter(record => {
            const recordDate = new Date(record.recordTime);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr === todayStr;
        });

        // Enrich with employee names
        const enrichedLogs = todaysLogs.map(record => ({
            userSn: record.userSn,
            deviceUserId: record.deviceUserId,
            employeeName: userMap[record.deviceUserId]?.name || 'Unknown Employee',
            employeeRole: userMap[record.deviceUserId]?.role || 0,
            recordTime: record.recordTime,
            recordDate: new Date(record.recordTime).toLocaleDateString('en-GB'),
            recordTimeFormatted: new Date(record.recordTime).toLocaleString('en-GB'),
            ip: record.ip
        }));

        // Group by employee for summary
        const employeeSummary = {};
        enrichedLogs.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeSummary[key]) {
                employeeSummary[key] = {
                    deviceUserId: record.deviceUserId,
                    employeeName: record.employeeName,
                    employeeRole: record.employeeRole,
                    totalRecords: 0,
                    firstEntry: null,
                    lastEntry: null,
                    allRecords: []
                };
            }
            employeeSummary[key].totalRecords++;
            employeeSummary[key].allRecords.push(record);
            
            if (!employeeSummary[key].firstEntry || new Date(record.recordTime) < new Date(employeeSummary[key].firstEntry.recordTime)) {
                employeeSummary[key].firstEntry = record;
            }
            if (!employeeSummary[key].lastEntry || new Date(record.recordTime) > new Date(employeeSummary[key].lastEntry.recordTime)) {
                employeeSummary[key].lastEntry = record;
            }
        });

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            date: '2025-08-06',
            dateFormatted: 'Tuesday, August 6, 2025',
            totalRecordsToday: enrichedLogs.length,
            uniqueEmployeesToday: Object.keys(employeeSummary).length,
            summary: Object.values(employeeSummary),
            detailedRecords: enrichedLogs.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime))
        });

    } catch (error) {
        console.error('❌ Today\'s attendance API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            date: '2025-08-06',
            totalRecordsToday: 0,
            data: []
        });
    } finally {
        try {
            await zkInstance.disconnect();
        } catch (e) {
            // Ignore disconnect errors
        }
    }
});

// Get device info endpoint
app.get('/device/info', async (req, res) => {
    const ZKLib = require('node-zklib');
    const ip = process.env.MB460_IP || '192.168.1.201';
    const port = parseInt(process.env.MB460_PORT) || 4370;
    const timeout = parseInt(process.env.MB460_TIMEOUT) || 10000;
    const inport = parseInt(process.env.MB460_INPORT) || 4000;

    let zkInstance = new ZKLib(ip, port, timeout, inport);

    try {
        await zkInstance.createSocket();
        const info = await zkInstance.getInfo();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                ip: ip,
                port: port,
                userCounts: info.userCounts,
                logCounts: info.logCounts,
                logCapacity: info.logCapacity
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    } finally {
        try {
            await zkInstance.disconnect();
        } catch (e) {
            // Ignore disconnect errors
        }
    }
});

// API documentation endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'ZKTeco MB460 API for n8n Integration',
        version: '1.0.0',
        endpoints: {
            'GET /health': 'Health check',
            'GET /attendance': 'Get all attendance logs',
            'GET /attendance/filter?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD': 'Get filtered attendance logs',
            'GET /attendance/date/YYYY-MM-DD': 'Get attendance for specific date with employee names (e.g., /attendance/date/2025-05-28)',
            'GET /attendance/today': 'Get today\'s attendance with employee names (August 6, 2025)',
            'GET /device/info': 'Get device information',
            'GET /': 'This documentation'
        },
        configuration: {
            MB460_IP: process.env.MB460_IP,
            MB460_PORT: process.env.MB460_PORT,
            API_PORT: PORT,
            API_HOST: HOST
        }
    });
});

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