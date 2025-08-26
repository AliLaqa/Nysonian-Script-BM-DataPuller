// shift_routes/shiftCheckout.js - Shift check-out endpoint (GET /todayShift/checkout)
const express = require('express');
const router = express.Router();
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

// Helper to get check-out record based on new criteria
function getCheckOutRecord(records, now) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hour = now.getHours();
    const minute = now.getMinutes();
    let checkOut = null;
    // Treat exactly 12:00am as before 12pm
    if (hour < 12 || (hour === 0 && minute === 0)) {
        // 12am-12pm: use today's entry after 12am and before 12pm
        const todaysRecords = records.filter(r => {
            const recDate = new Date(r.recordTime);
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
            const recDate = new Date(r.recordTime);
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

// GET /attendance/todayShift/checkout - Get shift check-out data (buffered logic)
router.get('/checkout', async (req, res) => {
    // Reset error tracker for new request
    errorTracker.reset();
    
    try {
        console.log('🔄 Fetching today\'s shift check-out data (buffered)...');
        
        // Retry mechanism for getting valid check-out data
        const maxRetries = 5;
        let retryCount = 0;
        let checkOutData = [];
        let hasValidData = false;
        
        while (retryCount < maxRetries && !hasValidData) {
            retryCount++;
            console.log(`📥 Attempt ${retryCount}/${maxRetries}: Fetching fresh attendance data for check-outs...`);
            
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
                throw errorTracker.setError(ERROR_STEPS.SHIFT_CHECKOUT_PROCESSING, `Failed to process employee records: ${error.message}`, { originalError: error.message });
            }
            
            checkOutData = Object.entries(employeeRecords).map(([deviceUserId, records]) => {
                records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
                const checkOut = getCheckOutRecord(records, now);
                let checkOutObj;
                if (checkOut) {
                    checkOutObj = toUSDate(checkOut);
                } else {
                    checkOutObj = {
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
                    checkOut: checkOutObj
                };
            });
            
            // Check if we have valid check-out data (at least some check-outs with actual times)
            const validRecords = checkOutData.filter(emp => 
                emp.checkOut && emp.checkOut.recordTime
            );
            
            if (validRecords.length > 0) {
                hasValidData = true;
                console.log(`✅ Found ${validRecords.length} employees with valid check-out data on attempt ${retryCount}`);
            } else {
                console.log(`⚠️ Attempt ${retryCount}: No valid check-out data found. Total employees: ${checkOutData.length}, Valid records: ${validRecords.length}`);
                
                if (retryCount < maxRetries) {
                    const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 10000); // Exponential backoff, max 10s
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // Log final result
        if (hasValidData) {
            console.log(`🎉 Successfully retrieved check-out data after ${retryCount} attempt(s)`);
        } else {
            console.log(`❌ Failed to get valid check-out data after ${maxRetries} attempts. Returning available data.`);
        }
        
        try {
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: hasValidData ? 
                    `Today's shift check-out data (buffered) retrieved successfully after ${retryCount} attempt(s)` :
                    `Today's shift check-out data retrieved but no valid check-out times found after ${maxRetries} attempts`,
                totalEmployeesInShift: checkOutData.length,
                retryAttempts: retryCount,
                hasValidData: hasValidData,
                validRecordsCount: checkOutData.filter(emp => 
                    emp.checkOut && emp.checkOut.recordTime
                ).length,
                data: checkOutData //final checkout data that is also being passed to todayShift
            });
        } catch (error) {
            throw errorTracker.setError(ERROR_STEPS.SHIFT_CHECKOUT_RESPONSE, `Failed to send response: ${error.message}`, { originalError: error.message });
        }
    } catch (error) {
        console.error('❌ Today Shift Check-out API Error:', error);
        
        // If error tracker has error info, use it; otherwise create generic error
        const errorResponse = errorTracker.hasError() ? 
            errorTracker.getErrorResponse() : 
            {
                success: false,
                timestamp: new Date().toISOString(),
                failedAt: ERROR_STEPS.SHIFT_CHECKOUT,
                failedBecause: error.message,
                requestId: errorTracker.requestId,
                error: error.message,
                message: 'Failed to retrieve today\'s shift check-out data'
            };
        
        res.status(500).json(errorResponse);
    }
});

module.exports = router;
