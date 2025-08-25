// shift_routes/shiftData.js - Main shift data endpoint (GET /todayShift)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

// GET /todayShift - Get today's shift data (combines check-in and check-out)
// This route will be mounted at /attendance, so the full path is /attendance/todayShift
router.get('/todayShift', async (req, res) => {
    // Reset error tracker for new request
    errorTracker.reset();
    
    try {
        console.log('🔄 Fetching today\'s shift data (combined check-in & check-out)...');
        
        // Get enriched attendance data once and compute both check-in and check-out
        const result = await getEnrichedAttendanceData();
        if (!result.success) {
            if (errorTracker.hasError()) {
                throw errorTracker.getErrorResponse();
            } else {
                throw new Error(result.error || 'Failed to get enriched attendance data');
            }
        }
        
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        function isSameDay(dateObj, refDate) {
            return dateObj.getFullYear() === refDate.getFullYear() &&
                   dateObj.getMonth() === refDate.getMonth() &&
                   dateObj.getDate() === refDate.getDate();
        }

        function getCheckInRecord(records) {
            const hour = now.getHours();
            const minute = now.getMinutes();
            let checkIn = null;
            if (hour < 12 || (hour === 0 && minute === 0)) {
                const yrecs = records.filter(r => isSameDay(new Date(r.recordTime), yesterday));
                const filtered = yrecs.filter(r => {
                    const h = new Date(r.recordTime).getHours();
                    return h >= 12 && h < 24;
                });
                if (filtered.length > 0) checkIn = filtered[filtered.length - 1];
            } else {
                const trecs = records.filter(r => isSameDay(new Date(r.recordTime), today));
                const filtered = trecs.filter(r => {
                    const h = new Date(r.recordTime).getHours();
                    return h >= 12 && h < 24;
                });
                if (filtered.length > 0) checkIn = filtered[filtered.length - 1];
            }
            return checkIn;
        }

        function getCheckOutRecord(records) {
            const hour = now.getHours();
            const minute = now.getMinutes();
            let checkOut = null;
            if (hour < 12 || (hour === 0 && minute === 0)) {
                const trecs = records.filter(r => isSameDay(new Date(r.recordTime), today));
                const filtered = trecs.filter(r => {
                    const h = new Date(r.recordTime).getHours();
                    return h >= 0 && h < 12;
                });
                if (filtered.length > 0) checkOut = filtered[0];
            } else {
                const tmrecs = records.filter(r => isSameDay(new Date(r.recordTime), tomorrow));
                const filtered = tmrecs.filter(r => {
                    const h = new Date(r.recordTime).getHours();
                    return h >= 0 && h < 12;
                });
                if (filtered.length > 0) checkOut = filtered[0];
            }
            return checkOut;
        }

        // Group by employee
        const employeeRecords = {};
        result.data.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeRecords[key]) employeeRecords[key] = [];
            employeeRecords[key].push(record);
        });

        // Build combined data
        const checkinData = [];
        const checkoutData = [];
        Object.entries(employeeRecords).forEach(([deviceUserId, records]) => {
            records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            const checkIn = getCheckInRecord(records);
            const checkOut = getCheckOutRecord(records);
            checkinData.push({
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                checkIn: (checkIn ? { ...checkIn, recordDate: new Date(checkIn.recordTime).toLocaleDateString('en-US') } : null) || {
                    userSn: null,
                    deviceUserId,
                    employeeName: records[0].employeeName,
                    employeeRole: records[0].employeeRole,
                    recordTime: null,
                    recordDate: null,
                    recordTimeFormatted: null,
                    timeOnly: null,
                    ip: (records[0] && records[0].ip) ? records[0].ip : null
                }
            });
            checkoutData.push({
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                checkOut: (checkOut ? { ...checkOut, recordDate: new Date(checkOut.recordTime).toLocaleDateString('en-US') } : null) || {
                    userSn: null,
                    deviceUserId,
                    employeeName: records[0].employeeName,
                    employeeRole: records[0].employeeRole,
                    recordTime: null,
                    recordDate: null,
                    recordTimeFormatted: null,
                    timeOnly: null,
                    ip: (records[0] && records[0].ip) ? records[0].ip : null
                }
            });
        });
        // Merge by deviceUserId
        let merged;
        try {
            merged = {};
            checkinData.forEach(emp => {
                merged[emp.deviceUserId] = {
                    deviceUserId: emp.deviceUserId,
                    employeeName: emp.employeeName ?? null,
                    employeeRole: emp.employeeRole ?? null,
                    checkIn: emp.checkIn ?? null,
                    checkOut: null
                };
            });
            checkoutData.forEach(emp => {
                if (!merged[emp.deviceUserId]) {
                    merged[emp.deviceUserId] = {
                        deviceUserId: emp.deviceUserId,
                        employeeName: emp.employeeName ?? null,
                        employeeRole: emp.employeeRole ?? null,
                        checkIn: null,
                        checkOut: emp.checkOut ?? null
                    };
                } else {
                    merged[emp.deviceUserId].checkOut = emp.checkOut ?? null;
                }
            });
        } catch (error) {
            throw errorTracker.setError(ERROR_STEPS.SHIFT_DATA_MERGE, `Failed to merge check-in and check-out data: ${error.message}`, { originalError: error.message });
        }
        
        const shiftData = Object.values(merged);
        try {
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: 'Today\'s shift data (combined) retrieved successfully',
                data: shiftData,
                summary: {
                    totalEmployeesInShift: shiftData.length
                }
            });
        } catch (error) {
            throw errorTracker.setError(ERROR_STEPS.SHIFT_DATA_RESPONSE, `Failed to send response: ${error.message}`, { originalError: error.message });
        }
    } catch (error) {
        console.error('❌ Today Shift API Error:', error);
        
        // If error tracker has error info, use it; otherwise create generic error
        const errorResponse = errorTracker.hasError() ? 
            errorTracker.getErrorResponse() : 
            {
                success: false,
                timestamp: new Date().toISOString(),
                failedAt: ERROR_STEPS.SHIFT_DATA,
                failedBecause: error.message,
                requestId: errorTracker.requestId,
                error: error.message,
                message: 'Failed to retrieve today\'s shift data'
            };
        
        res.status(500).json(errorResponse);
    }
});

module.exports = router;
