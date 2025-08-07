// test-connection.js - Simple connection test for MB460
require('dotenv').config();
const { pullAttendanceLogs } = require('./pull-logs');

console.log('🧪 Testing MB460 Connection...\n');

console.log('Configuration:');
console.log(`  IP: ${process.env.MB460_IP || '192.168.1.201'}`);
console.log(`  Port: ${process.env.MB460_PORT || '4370'}`);
console.log(`  Timeout: ${process.env.MB460_TIMEOUT || '10000'}ms\n`);

pullAttendanceLogs()
    .then(result => {
        if (result.success) {
            console.log('\n✅ Connection Test PASSED!');
            console.log(`📊 Found ${result.count} attendance records`);
            console.log('\n🎉 Your setup is ready for n8n integration!');
        } else {
            console.log('\n❌ Connection Test FAILED!');
            console.log(`💥 Error: ${result.error}`);
            console.log('\n🔧 Please check:');
            console.log('  1. MB460 IP address in .env file');
            console.log('  2. Device is powered on and connected to network');
            console.log('  3. No firewall blocking port 4370');
            console.log('  4. Device is not in use by other software');
        }
    })
    .catch(err => {
        console.log('\n💥 Test script error:', err.message);
    });