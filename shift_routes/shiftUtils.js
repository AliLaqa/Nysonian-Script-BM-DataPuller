// shift_routes/shiftUtils.js - Shared utility functions for shift processing
const config = require('../config');
const { getEnrichedAttendanceData } = require('../utils/attendanceHelper');

// Helper function to process shift data spanning midnight
async function processTodayShift() {
    // Get enriched attendance data from the attendance API
    const result = await getEnrichedAttendanceData();
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    // Calculate date boundaries for today and yesterday
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Start of today (midnight)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // Start of yesterday

    // Helper to check if a date is on a given day
    function isSameDay(dateObj, refDate) {
        return dateObj.getFullYear() === refDate.getFullYear() &&
               dateObj.getMonth() === refDate.getMonth() &&
               dateObj.getDate() === refDate.getDate();
    }

    // Helper to parse record date (format: DD/MM/YYYY)
    function parseRecordDate(recordDateStr) {
        if (!recordDateStr) return null;
        const parts = recordDateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }

    // Helper to check if a record is from a specific date
    function isRecordFromDate(record, targetDate) {
        const recordDate = parseRecordDate(record.recordDate);
        if (!recordDate) return false;
        return isSameDay(recordDate, targetDate);
    }

    // Group records by employee
    const employeeRecords = {};
    result.data.forEach(record => {
        const key = record.deviceUserId;
        if (!employeeRecords[key]) {
            employeeRecords[key] = [];
        }
        employeeRecords[key].push(record);
    });

    // Build shift summary for each employee
    const employeeShiftSummary = Object.entries(employeeRecords).map(([deviceUserId, records]) => {
        // Sort all records by time
        records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
        
        // Get yesterday's and today's records using recordDate field
        const yesterdaysRecords = records.filter(r => isRecordFromDate(r, yesterday));
        const todaysRecords = records.filter(r => isRecordFromDate(r, today));
        
        // CheckIn: last record from yesterday (after 12 PM)
        let shiftCheckIn = null;
        if (yesterdaysRecords.length > 0) {
            // Get the last record from yesterday
            const lastYesterdayRecord = yesterdaysRecords[yesterdaysRecords.length - 1];
            const recordTime = new Date(lastYesterdayRecord.recordTime);
            const recordHour = recordTime.getHours();
            
            // Only consider it as check-in if it's after 12 PM (noon)
            if (recordHour >= 12) {
                shiftCheckIn = {
                    ...lastYesterdayRecord,
                    employeeName: records[0].employeeName
                };
            }
        }
        
        // CheckOut: first record from today (before 12 PM)
        let shiftCheckOut = null;
        if (todaysRecords.length > 0) {
            // Get the first record from today
            const firstTodayRecord = todaysRecords[0];
            const recordTime = new Date(firstTodayRecord.recordTime);
            const recordHour = recordTime.getHours();
            
            // Only consider it as check-out if it's before 12 PM (noon)
            if (recordHour < 12) {
                shiftCheckOut = {
                    ...firstTodayRecord,
                    employeeName: records[0].employeeName
                };
            }
        }
        
        return {
            deviceUserId,
            employeeName: records[0].employeeName,
            employeeRole: records[0].employeeRole,
            totalRecords: records.length,
            shiftCheckIn,
            shiftCheckOut
        };
    });

    return {
        shiftPeriod: {
            start: yesterday.toISOString(),
            end: today.toISOString(),
            startFormatted: yesterday.toLocaleString(config.SHIFT.TIME_FORMAT),
            endFormatted: today.toLocaleString(config.SHIFT.TIME_FORMAT),
            description: 'Shift CheckIn is yesterday\'s last record (after 12 PM), CheckOut is today\'s first record (before 12 PM).'
        },
        employeeShiftSummary
    };
}

module.exports = {
    processTodayShift
};
