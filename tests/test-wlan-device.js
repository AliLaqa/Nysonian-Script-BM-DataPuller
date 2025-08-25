// tests/test-wlan-device.js - One-off test for WLAN-forwarded ZK device
const { createZKInstanceWith, safeDisconnect } = require('../utils/zkHelper');

(async () => {
    const ip = '45.115.86.64';
    const port = 4370;
    const timeout = 60000;
    const inport = 4000;
    let zk = null;
    try {
        console.log(`🔌 Testing connection to ZK device at ${ip}:${port} ...`);
        zk = createZKInstanceWith(ip, port, timeout, inport);
        await zk.createSocket();
        console.log('✅ Socket created');

        const deviceInfo = await zk.getInfo();
        console.log('📟 Device Info:', deviceInfo);

        const users = await zk.getUsers();
        console.log(`👤 Users count: ${users?.data?.length ?? 0}`);

        const logs = await zk.getAttendances();
        console.log(`🕒 Attendance logs: ${logs?.data?.length ?? 0}`);

        console.log('🎉 WLAN device test completed successfully');
    } catch (e) {
        console.error('❌ WLAN device test failed:', e?.message || e);
        process.exitCode = 1;
    } finally {
        await safeDisconnect(zk);
    }
})();


