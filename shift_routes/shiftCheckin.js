// shift_routes/shiftCheckin.js - Shift check-in endpoint (GET /todayShift/checkin)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

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
            const recDate = new Date(r.recordTime);
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
            const recDate = new Date(r.recordTime);
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

// Format a record's recordDate to MM/DD/YYYY based on recordTime
function toUSDate(record) {
    if (!record) return record;
    try {
        if (record.recordTime) {
            const dt = new Date(record.recordTime);
            return { ...record, recordDate: dt.toLocaleDateString('en-US') };
        }
    } catch (_) {}
    return record;
}

// GET /attendance/todayShift/checkin - Get shift check-in data (buffered logic)
router.get('/checkin', async (req, res) => {
    // Reset error tracker for new request
    errorTracker.reset();
    
    try {
        console.log('🔄 Fetching today\'s shift check-in data (buffered)...');
        
        // Retry mechanism for getting valid check-in data
        const maxRetries = 5;
        let retryCount = 0;
        let checkInData = [];
        let hasValidData = false;
        
        while (retryCount < maxRetries && !hasValidData) {
            retryCount++;
            console.log(`📥 Attempt ${retryCount}/${maxRetries}: Fetching fresh attendance data for check-ins...`);
            
            const result = await getEnrichedAttendanceData();
            if (!result.success) {
                // If error tracker has error info, use it; otherwise create generic error
                if (errorTracker.hasError()) {
                    throw errorTracker.getErrorResponse();
                } else {
                    throw new Error(result.error || 'Failed to get enriched attendance data');
                }
            }
            
            const now = new Date();
            const employeeRecords = {};
            
            try {
                result.data.forEach(record => {
                    const key = record.deviceUserId;
                    if (!employeeRecords[key]) employeeRecords[key] = [];
                    employeeRecords[key].push(record);
                });
            } catch (error) {
                throw errorTracker.setError(ERROR_STEPS.SHIFT_CHECKIN_PROCESSING, `Failed to process employee records: ${error.message}`, { originalError: error.message });
            }
            
            checkInData = Object.entries(employeeRecords).map(([deviceUserId, records]) => {
                records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
                const checkIn = getCheckInRecord(records, now);
                let checkInObj;
                if (checkIn) {
                    checkInObj = toUSDate(checkIn);
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
            
            // Check if we have valid check-in data (at least some check-ins with actual times)
            const validRecords = checkInData.filter(emp => 
                emp.checkIn && emp.checkIn.recordTime
            );
            
            if (validRecords.length > 0) {
                hasValidData = true;
                console.log(`✅ Found ${validRecords.length} employees with valid check-in data on attempt ${retryCount}`);
            } else {
                console.log(`⚠️ Attempt ${retryCount}: No valid check-in data found. Total employees: ${checkInData.length}, Valid records: ${validRecords.length}`);
                
                if (retryCount < maxRetries) {
                    const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 10000); // Exponential backoff, max 10s
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // Log final result
        if (hasValidData) {
            console.log(`🎉 Successfully retrieved check-in data after ${retryCount} attempt(s)`);
        } else {
            console.log(`❌ Failed to get valid check-in data after ${maxRetries} attempts. Returning available data.`);
        }
        
        try {
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: hasValidData ? 
                    `Today's shift check-in data (buffered) retrieved successfully after ${retryCount} attempt(s)` :
                    `Today's shift check-in data retrieved but no valid check-in times found after ${maxRetries} attempts`,
                totalEmployeesInShift: checkInData.length,
                retryAttempts: retryCount,
                hasValidData: hasValidData,
                validRecordsCount: checkInData.filter(emp => 
                    emp.checkIn && emp.checkIn.recordTime
                ).length,
                data: checkInData //final checkin data that is also being passed to todayShift
            });
        } catch (error) {
            throw errorTracker.setError(ERROR_STEPS.SHIFT_CHECKIN_RESPONSE, `Failed to send response: ${error.message}`, { originalError: error.message });
        }
    } catch (error) {
        console.error('❌ Today Shift Check-in API Error:', error);
        
        // If error tracker has error info, use it; otherwise create generic error
        const errorResponse = errorTracker.hasError() ? 
            errorTracker.getErrorResponse() : 
            {
                success: false,
                timestamp: new Date().toISOString(),
                failedAt: ERROR_STEPS.SHIFT_CHECKIN,
                failedBecause: error.message,
                requestId: errorTracker.requestId,
                error: error.message,
                message: 'Failed to retrieve today\'s shift check-in data'
            };
        
        res.status(500).json(errorResponse);
    }
});

module.exports = router;
