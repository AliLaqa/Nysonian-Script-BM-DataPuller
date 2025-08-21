// shift_routes/shiftCheckin.js - Shift check-in endpoint (GET /todayShift/checkin)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');

// Helper to get check-in record based on new criteria
function getCheckInRecord(records, now) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hour = now.getHours();
    const minute = now.getMinutes();
    let checkIn = null;
    // Treat exactly 12:00am as before 12pm
    if (hour < 12 || (hour === 0 && minute === 0)) {
        // 12am-12pm: use yesterday's entry after 12pm and before 12am
        const yesterdaysRecords = records.filter(r => {
            const [d, m, y] = r.recordDate.split('/');
            const recDate = new Date(y, m - 1, d);
            return recDate.getFullYear() === yesterday.getFullYear() &&
                   recDate.getMonth() === yesterday.getMonth() &&
                   recDate.getDate() === yesterday.getDate();
        });
        const filtered = yesterdaysRecords.filter(r => {
            const recTime = new Date(r.recordTime);
            const h = recTime.getHours();
            return h >= 12 && h < 24;
        });
        if (filtered.length > 0) {
            checkIn = filtered[filtered.length - 1];
        }
    } else {
        // 12pm-12am: use today's entry after 12pm and before 12am
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
            return h >= 12 && h < 24;
        });
        if (filtered.length > 0) {
            checkIn = filtered[filtered.length - 1];
        }
    }
    return checkIn;
}

// GET /attendance/todayShift/checkin - Get shift check-in data (buffered logic)
router.get('/checkin', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift check-in data (buffered)...');
        const result = await getEnrichedAttendanceData();
        if (!result.success) throw new Error(result.error);
        const now = new Date();
        const employeeRecords = {};
        result.data.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeRecords[key]) employeeRecords[key] = [];
            employeeRecords[key].push(record);
        });
        const checkInData = Object.entries(employeeRecords).map(([deviceUserId, records]) => {
            records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            const checkIn = getCheckInRecord(records, now);
            let checkInObj;
            if (checkIn) {
                checkInObj = checkIn;
            } else {
                checkInObj = {
                    userSn: null,
                    deviceUserId,
                    employeeName: records[0].employeeName,
                    employeeRole: records[0].employeeRole,
                    recordTime: null,
                    recordDate: null,
                    recordTimeFormatted: null,
                    timeOnly: null,
                    ip: (records[0] && records[0].ip) ? records[0].ip : null
                };
            }
            return {
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                checkIn: checkInObj
            };
        });
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Today\'s shift check-in data (buffered) retrieved successfully',
            totalEmployeesInShift: checkInData.length,
            data: checkInData //final checkin data that is also being passed to todayShift
        });
    } catch (error) {
        console.error('❌ Today Shift Check-in API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift check-in data'
        });
    }
});

module.exports = router;
