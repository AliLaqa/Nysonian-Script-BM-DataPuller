// utils/attendanceHelper.js - Shared utility for getting enriched attendance data
const axios = require('axios');
const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('./errorTracker');

// Get enriched attendance data using the attendance API
async function getEnrichedAttendanceData() {
    try {
        const baseUrl = `http://${config.ENV.API_HOST}:${config.ENV.API_PORT}`;
        let response;
        
        try {
            response = await axios.get(`${baseUrl}/attendance`);
        } catch (error) {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_HELPER, `HTTP request failed: ${error.message}`, { 
                baseUrl, 
                originalError: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
        }
        
        if (response.data.success) {
            return {
                success: true,
                data: response.data.data,
                count: response.data.recordCount,
                uniqueEmployees: response.data.uniqueEmployees
            };
        } else {
            throw errorTracker.setError(ERROR_STEPS.ATTENDANCE_HELPER_RESPONSE, `API returned error: ${response.data.error || 'Unknown error'}`, { 
                apiResponse: response.data,
                status: response.status
            });
        }
    } catch (error) {
        console.error('❌ Error fetching enriched attendance data:', error.message);
        
        // If error tracker has error info, return it; otherwise return generic error
        if (errorTracker.hasError()) {
            return errorTracker.getErrorResponse();
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Get filtered attendance data using the attendance/filter API
async function getFilteredAttendanceData(startDate, endDate) {
    try {
        const baseUrl = `http://${config.ENV.API_HOST}:${config.ENV.API_PORT}`;
        
        // Use new path parameter format
        const response = await axios.get(`${baseUrl}/attendance/filter/${startDate}&${endDate}`);
        
        if (response.data.success) {
            return {
                success: true,
                data: response.data.data,
                totalRecords: response.data.totalRecords,
                filteredRecords: response.data.filteredRecords,
                uniqueEmployees: response.data.uniqueEmployees,
                filters: response.data.filters
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Failed to fetch filtered attendance data'
            };
        }
    } catch (error) {
        console.error('❌ Error fetching filtered attendance data:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    getEnrichedAttendanceData,
    getFilteredAttendanceData
};
