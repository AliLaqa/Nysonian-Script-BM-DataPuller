// shift_routes/shiftCheckout.js - Shift check-out endpoint (GET /todayShift/checkout)
const express = require('express');
const router = express.Router();
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');

// Helper to get check-out record based on new criteria
function getCheckOutRecord(records, now) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hour = now.getHours();
    let checkOut = null;
    if (hour < 12) {
        // 12am-12pm: use today's entry after 12am and before 12pm
        const todaysRecords = records.filter(r => {
            const [d, m, y] = r.recordDate.split('/');
            const recDate = new Date(y, m - 1, d);
            return recDate.getFullYear() === today.getFullYear() &&
                   recDate.getMonth() === today.getMonth() &&
                   recDate.getDate() === today.getDate();
        });
        const filtered = todaysRecords.filter(r => {
            const recTime = new Date(r.recordTime);
            const h = recTime.getHours();
            return h >= 0 && h < 12;
        });
        if (filtered.length > 0) {
            checkOut = filtered[0];
        }
    } else {
        // 12pm-12am: use tomorrow's entry after 12am and before 12pm
        const tomorrowsRecords = records.filter(r => {
            const [d, m, y] = r.recordDate.split('/');
            const recDate = new Date(y, m - 1, d);
            return recDate.getFullYear() === tomorrow.getFullYear() &&
                   recDate.getMonth() === tomorrow.getMonth() &&
                   recDate.getDate() === tomorrow.getDate();
        });
        const filtered = tomorrowsRecords.filter(r => {
            const recTime = new Date(r.recordTime);
            const h = recTime.getHours();
            return h >= 0 && h < 12;
        });
        if (filtered.length > 0) {
            checkOut = filtered[0];
        }
    }
    return checkOut;
}

// GET /attendance/todayShift/checkout - Get shift check-out data (buffered logic)
router.get('/checkout', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift check-out data (buffered)...');
        const result = await getEnrichedAttendanceData();
        if (!result.success) throw new Error(result.error);
        const now = new Date();
        const employeeRecords = {};
        result.data.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeRecords[key]) employeeRecords[key] = [];
            employeeRecords[key].push(record);
        });
        const checkOutData = Object.entries(employeeRecords).map(([deviceUserId, records]) => {
            records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            const checkOut = getCheckOutRecord(records, now);
            return {
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                checkOut
            };
        });
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Today\'s shift check-out data (buffered) retrieved successfully',
            totalEmployeesInShift: checkOutData.length,
            data: checkOutData
        });
    } catch (error) {
        console.error('❌ Today Shift Check-out API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift check-out data'
        });
    }
});

module.exports = router;
