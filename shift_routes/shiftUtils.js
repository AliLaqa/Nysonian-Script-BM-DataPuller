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
    
    // Calculate date boundaries for the shift
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Start of today (midnight)
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // Start of yesterday
    
    // Define shift boundaries (5 PM to 3 AM next day)
    const shiftStartHour = config.SHIFT.START_HOUR; // 5 PM
    const shiftEndHour = config.SHIFT.END_HOUR;    // 3 AM
    
    // Create shift start and end times
    const shiftStart = new Date(yesterday);
    shiftStart.setHours(shiftStartHour, 0, 0, 0); // Yesterday 5 PM
    
    const shiftEnd = new Date(today);
    shiftEnd.setHours(shiftEndHour, 0, 0, 0); // Today 3 AM
    
    console.log(`🔄 Processing shift from ${shiftStart.toISOString()} to ${shiftEnd.toISOString()}`);
    
    // Filter logs within the shift period
    const shiftLogs = result.data.filter(record => {
        const recordTime = new Date(record.recordTime);
        return recordTime >= shiftStart && recordTime <= shiftEnd;
    });
    
    // Group by employee for shift summary
    const employeeShiftSummary = {};
    
    shiftLogs.forEach(record => {
        const key = record.deviceUserId;
        if (!employeeShiftSummary[key]) {
            employeeShiftSummary[key] = {
                deviceUserId: record.deviceUserId,
                employeeName: record.employeeName,
                employeeRole: record.employeeRole,
                totalRecords: 0,
                shiftCheckIn: null,  // Will be yesterday's last entry
                shiftCheckOut: null, // Will be today's first entry
                allRecords: []
            };
        }
        
        employeeShiftSummary[key].totalRecords++;
        employeeShiftSummary[key].allRecords.push({
            userSn: record.userSn,
            deviceUserId: record.deviceUserId,
            recordTime: record.recordTime,
            recordDate: new Date(record.recordTime).toLocaleDateString(config.SHIFT.DATE_FORMAT),
            recordTimeFormatted: new Date(record.recordTime).toLocaleString(config.SHIFT.TIME_FORMAT),
            timeOnly: new Date(record.recordTime).toLocaleTimeString(config.SHIFT.TIME_FORMAT),
            ip: record.ip
        });
    });
    
    // Process each employee's shift data
    Object.values(employeeShiftSummary).forEach(employee => {
        if (employee.allRecords.length > 0) {
            // Sort records by time
            employee.allRecords.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            
            // First record in shift period becomes shift check-in
            employee.shiftCheckIn = {
                ...employee.allRecords[0],
                employeeName: employee.employeeName
            };
            
            // Last record in shift period becomes shift check-out
            employee.shiftCheckOut = {
                ...employee.allRecords[employee.allRecords.length - 1],
                employeeName: employee.employeeName
            };
            
            // Remove allRecords from final output to keep it clean
            delete employee.allRecords;
        }
    });
    
    return {
        shiftPeriod: {
            start: shiftStart.toISOString(),
            end: shiftEnd.toISOString(),
            startFormatted: shiftStart.toLocaleString(config.SHIFT.TIME_FORMAT),
            endFormatted: shiftEnd.toLocaleString(config.SHIFT.TIME_FORMAT),
            description: config.SHIFT.DESCRIPTION
        },
        employeeShiftSummary: Object.values(employeeShiftSummary)
    };
}

module.exports = {
    processTodayShift
};
