// src/controllers/attendanceController.js
// HTTP controllers for attendance-related endpoints

const attendanceService = require('../services/attendanceService');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');

/**
 * Get latest attendance data from a specific device
 * @param {string} prefix - Device prefix (e.g., 'pk01', 'us01')
 * @returns {Object} Latest attendance response
 */
async function getLatest(prefix) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_CONTROLLER, 'Device prefix is required');
        }
        
        const result = await attendanceService.getLatest(prefix);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data for a specific date from a device
 * @param {string} prefix - Device prefix
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Date-specific attendance response
 */
async function getByDate(prefix, date) {
    try {
        errorTracker.reset();
        
        if (!prefix || !date) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_CONTROLLER, 'Device prefix and date are required');
        }
        
        const result = await attendanceService.getByDate(prefix, date);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data for a date range from a device
 * @param {string} prefix - Device prefix
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} Date range attendance response
 */
async function getByRange(prefix, startDate, endDate) {
    try {
        errorTracker.reset();
        
        if (!prefix || !startDate || !endDate) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_CONTROLLER, 'Device prefix, start date, and end date are required');
        }
        
        const result = await attendanceService.getByRange(prefix, startDate, endDate);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get today's attendance data from a device
 * @param {string} prefix - Device prefix
 * @returns {Object} Today's attendance response
 */
async function getToday(prefix) {
    try {
        errorTracker.reset();
        
        if (!prefix) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_CONTROLLER, 'Device prefix is required');
        }
        
        const result = await attendanceService.getToday(prefix);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data from all devices
 * @returns {Object} All devices attendance response
 */
async function getAllDevices() {
    try {
        errorTracker.reset();
        
        const result = await attendanceService.getAllDevices();
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

/**
 * Get attendance data by country
 * @param {string} countryCode - Country code (e.g., 'PK', 'US')
 * @returns {Object} Country attendance response
 */
async function getByCountry(countryCode) {
    try {
        errorTracker.reset();
        
        if (!countryCode) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_CONTROLLER, 'Country code is required');
        }
        
        const result = await attendanceService.getByCountry(countryCode);
        
        if (!result.success) {
            return result; // Return service error response
        }
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            data: result.data,
            summary: result.summary,
            requestId: errorTracker.requestId
        };
        
    } catch (error) {
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: errorTracker.requestId
        };
    }
}

module.exports = {
    getLatest,
    getByDate,
    getByRange,
    getToday,
    getAllDevices,
    getByCountry
};
