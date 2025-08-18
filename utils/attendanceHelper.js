// utils/attendanceHelper.js - Shared utility for getting enriched attendance data
const axios = require('axios');
const config = require('../config');

// Get enriched attendance data using the attendance API
async function getEnrichedAttendanceData() {
    try {
        const baseUrl = `http://${config.ENV.API_HOST}:${config.ENV.API_PORT}`;
        const response = await axios.get(`${baseUrl}/attendance`);
        
        if (response.data.success) {
            return {
                success: true,
                data: response.data.data,
                count: response.data.recordCount,
                uniqueEmployees: response.data.uniqueEmployees
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Failed to fetch attendance data'
            };
        }
    } catch (error) {
        console.error('❌ Error fetching enriched attendance data:', error.message);
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
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await axios.get(`${baseUrl}/attendance/filter`, { params });
        
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
