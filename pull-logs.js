// pull-logs.js - Basic script to pull attendance logs from ZKTeco MB460
require('dotenv').config();
const ZKLib = require('node-zklib');
const config = require('./config');

async function pullAttendanceLogs() {
    const ip = config.ENV.MB460_IP;
    const port = config.ENV.MB460_PORT;
    const timeout = config.ENV.MB460_TIMEOUT;
    const inport = config.ENV.MB460_INPORT;

    console.log(`Connecting to MB460 at ${ip}:${port}...`);

    // Create connection
    let zkInstance = new ZKLib(ip, port, timeout, inport);

    try {
        // Create socket connection
        await zkInstance.createSocket();
        console.log('✅ Connected to MB460 successfully!');

        // Get device info
        const info = await zkInstance.getInfo();
        console.log('📱 Device Info:', {
            userCounts: info.userCounts,
            logCounts: info.logCounts,
            logCapacity: info.logCapacity
        });

        // Get all attendance logs
        console.log('📥 Fetching attendance logs...');
        const logs = await zkInstance.getAttendances();
        
        if (logs && logs.data && logs.data.length > 0) {
            console.log(`✅ Retrieved ${logs.data.length} attendance records`);
            console.log('📋 Sample records (first 3):');
            console.log(JSON.stringify(logs.data.slice(0, 3), null, 2));
            return {
                success: true,
                count: logs.data.length,
                data: logs.data
            };
        } else {
            console.log('ℹ️ No attendance logs found');
            return {
                success: true,
                count: 0,
                data: []
            };
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        return {
            success: false,
            error: err.message,
            data: []
        };
    } finally {
        try {
            await zkInstance.disconnect();
            console.log('🔌 Disconnected from MB460');
        } catch (e) {
            console.log('⚠️ Warning: Could not disconnect cleanly');
        }
    }
}

// If this script is run directly (not imported)
if (require.main === module) {
    pullAttendanceLogs()
        .then(result => {
            console.log('\n📊 Final Result:', {
                success: result.success,
                recordCount: result.count
            });
            process.exit(result.success ? 0 : 1);
        })
        .catch(err => {
            console.error('💥 Unexpected error:', err);
            process.exit(1);
        });
}

module.exports = { pullAttendanceLogs };