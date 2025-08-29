// src/services/shiftService.js
// Enhanced shift service with device-specific configurations and preserved business logic

const config = require('../config');
const { errorTracker, ERROR_STEPS } = require('../utils/errorTracker');
const logger = require('../utils/logger');

/**
 * Enhanced Shift Service
 * Supports device-specific shift configurations while preserving sophisticated business logic
 */
class ShiftService {
    constructor() {
        this.shiftConfigs = this.buildShiftConfigs();
        logger.info('Enhanced Shift Service initialized', {
            totalDevices: Object.keys(this.shiftConfigs).length,
            devices: Object.keys(this.shiftConfigs)
        });
    }

    /**
     * Build device-specific shift configurations from environment variables
     * @returns {Object} Device shift configurations
     */
    buildShiftConfigs() {
        const configs = {};
        
        config.ENV.DEVICES.forEach(device => {
            const prefix = device.prefix;
            
            // Default configuration (preserves pk01 logic)
            let shiftConfig = {
                startHour: 18,        // 6 PM
                endHour: 2,           // 2 AM next day
                checkInBufferStart: 12, // 12 PM (noon)
                checkInBufferEnd: 24,   // 12 AM (midnight)
                checkOutBufferStart: 0,  // 12 AM (midnight)
                checkOutBufferEnd: 12,   // 12 PM (noon)
                description: 'Overnight shift (6 PM - 2 AM) with buffer zones',
                timezone: 'local'
            };
            
            // Override with device-specific configurations if available
            if (process.env[`${prefix.toUpperCase()}_SHIFT_START_HOUR`]) {
                shiftConfig.startHour = parseInt(process.env[`${prefix.toUpperCase()}_SHIFT_START_HOUR`]);
            }
            if (process.env[`${prefix.toUpperCase()}_SHIFT_END_HOUR`]) {
                shiftConfig.endHour = parseInt(process.env[`${prefix.toUpperCase()}_SHIFT_END_HOUR`]);
            }
            if (process.env[`${prefix.toUpperCase()}_CHECKIN_BUFFER_START`]) {
                shiftConfig.checkInBufferStart = parseInt(process.env[`${prefix.toUpperCase()}_CHECKIN_BUFFER_START`]);
            }
            if (process.env[`${prefix.toUpperCase()}_CHECKIN_BUFFER_END`]) {
                shiftConfig.checkInBufferEnd = parseInt(process.env[`${prefix.toUpperCase()}_CHECKIN_BUFFER_END`]);
            }
            if (process.env[`${prefix.toUpperCase()}_CHECKOUT_BUFFER_START`]) {
                shiftConfig.checkOutBufferStart = parseInt(process.env[`${prefix.toUpperCase()}_CHECKOUT_BUFFER_START`]);
            }
            if (process.env[`${prefix.toUpperCase()}_CHECKOUT_BUFFER_END`]) {
                shiftConfig.checkOutBufferEnd = parseInt(process.env[`${prefix.toUpperCase()}_CHECKOUT_BUFFER_END`]);
            }
            if (process.env[`${prefix.toUpperCase()}_SHIFT_DESCRIPTION`]) {
                shiftConfig.description = process.env[`${prefix.toUpperCase()}_SHIFT_DESCRIPTION`];
            }
            if (process.env[`${prefix.toUpperCase()}_TIMEZONE`]) {
                shiftConfig.timezone = process.env[`${prefix.toUpperCase()}_TIMEZONE`];
            }
            
            configs[prefix] = shiftConfig;
            
            logger.info(`Shift configuration for ${prefix}`, {
                device: prefix,
                config: shiftConfig
            });
        });
        
        return configs;
    }

    /**
     * Get shift configuration for a specific device
     * @param {string} prefix - Device prefix
     * @returns {Object} Shift configuration
     */
    getShiftConfig(prefix) {
        const config = this.shiftConfigs[prefix];
        if (!config) {
            throw new Error(`No shift configuration found for device: ${prefix}`);
        }
        return config;
    }

    /**
     * Get today's shift data for a specific device (preserves original logic)
     * @param {string} prefix - Device prefix
     * @returns {Object} Today's shift data
     */
    async getTodayShift(prefix) {
        try {
            const shiftConfig = this.getShiftConfig(prefix);
            const now = new Date();
            
            // Calculate date boundaries based on shift configuration
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Get attendance data for the device
            const attendanceData = await this.getDeviceAttendanceData(prefix);
            
            // Process shift data using device-specific configuration
            const shiftData = this.processShiftData(attendanceData, shiftConfig, now);
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                devicePrefix: prefix,
                shiftConfig: {
                    ...shiftConfig,
                    currentTime: now.toISOString(),
                    currentHour: now.getHours()
                },
                shiftPeriod: {
                    start: yesterday.toISOString(),
                    end: tomorrow.toISOString(),
                    description: shiftConfig.description
                },
                data: shiftData
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.SHIFT_SERVICE, 'getTodayShift', error.message);
            throw error;
        }
    }

    /**
     * Get shift check-in data for a specific device
     * @param {string} prefix - Device prefix
     * @returns {Object} Shift check-in data
     */
    async getShiftCheckin(prefix) {
        try {
            const shiftConfig = this.getShiftConfig(prefix);
            const now = new Date();
            
            // Get attendance data for the device
            const attendanceData = await this.getDeviceAttendanceData(prefix);
            
            // Process check-in data using device-specific configuration
            const checkInData = this.processCheckInData(attendanceData, shiftConfig, now);
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                devicePrefix: prefix,
                shiftConfig: {
                    checkInBufferStart: shiftConfig.checkInBufferStart,
                    checkInBufferEnd: shiftConfig.checkInBufferEnd,
                    currentTime: now.toISOString(),
                    currentHour: now.getHours()
                },
                data: checkInData
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.SHIFT_SERVICE, 'getShiftCheckin', error.message);
            throw error;
        }
    }

    /**
     * Get shift check-out data for a specific device
     * @param {string} prefix - Device prefix
     * @returns {Object} Shift check-out data
     */
    async getShiftCheckout(prefix) {
        try {
            const shiftConfig = this.getShiftConfig(prefix);
            const now = new Date();
            
            // Get attendance data for the device
            const attendanceData = await this.getDeviceAttendanceData(prefix);
            
            // Process check-out data using device-specific configuration
            const checkOutData = this.processCheckOutData(attendanceData, shiftConfig, now);
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                devicePrefix: prefix,
                shiftConfig: {
                    checkOutBufferStart: shiftConfig.checkOutBufferStart,
                    checkOutBufferEnd: shiftConfig.checkOutBufferEnd,
                    currentTime: now.toISOString(),
                    currentHour: now.getHours()
                },
                data: checkOutData
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.SHIFT_SERVICE, 'getShiftCheckout', error.message);
            throw error;
        }
    }

    /**
     * Process shift data using device-specific configuration (preserves original logic)
     * @param {Array} attendanceData - Raw attendance data
     * @param {Object} shiftConfig - Device shift configuration
     * @param {Date} now - Current time
     * @returns {Array} Processed shift data
     */
    processShiftData(attendanceData, shiftConfig, now) {
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Group records by employee
        const employeeRecords = {};
        attendanceData.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeRecords[key]) {
                employeeRecords[key] = [];
            }
            employeeRecords[key].push(record);
        });
        
        // Process each employee's shift data
        return Object.entries(employeeRecords).map(([deviceUserId, records]) => {
            records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            
            // Get check-in and check-out based on current time and shift configuration
            const checkIn = this.getCheckInRecord(records, shiftConfig, now);
            const checkOut = this.getCheckOutRecord(records, shiftConfig, now);
            
            return {
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                totalRecords: records.length,
                shiftCheckIn: checkIn ? this.formatRecord(checkIn) : null,
                shiftCheckOut: checkOut ? this.formatRecord(checkOut) : null,
                shiftStatus: this.determineShiftStatus(checkIn, checkOut, shiftConfig)
            };
        });
    }

    /**
     * Process check-in data using device-specific configuration
     * @param {Array} attendanceData - Raw attendance data
     * @param {Object} shiftConfig - Device shift configuration
     * @param {Date} now - Current time
     * @returns {Array} Processed check-in data
     */
    processCheckInData(attendanceData, shiftConfig, now) {
        const employeeRecords = {};
        attendanceData.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeRecords[key]) {
                employeeRecords[key] = [];
            }
            employeeRecords[key].push(record);
        });
        
        return Object.entries(employeeRecords).map(([deviceUserId, records]) => {
            records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            const checkIn = this.getCheckInRecord(records, shiftConfig, now);
            
            return {
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                checkIn: checkIn ? this.formatRecord(checkIn) : this.createEmptyRecord(records[0])
            };
        });
    }

    /**
     * Process check-out data using device-specific configuration
     * @param {Array} attendanceData - Raw attendance data
     * @param {Object} shiftConfig - Device shift configuration
     * @param {Date} now - Current time
     * @returns {Array} Processed check-out data
     */
    processCheckOutData(attendanceData, shiftConfig, now) {
        const employeeRecords = {};
        attendanceData.forEach(record => {
            const key = record.deviceUserId;
            if (!employeeRecords[key]) {
                employeeRecords[key] = [];
            }
            employeeRecords[key].push(record);
        });
        
        return Object.entries(employeeRecords).map(([deviceUserId, records]) => {
            records.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));
            const checkOut = this.getCheckOutRecord(records, shiftConfig, now);
            
            return {
                deviceUserId,
                employeeName: records[0].employeeName,
                employeeRole: records[0].employeeRole,
                checkOut: checkOut ? this.formatRecord(checkOut) : this.createEmptyRecord(records[0])
            };
        });
    }

    /**
     * Get check-in record based on device-specific configuration (preserves original logic)
     * @param {Array} records - Employee records
     * @param {Object} shiftConfig - Device shift configuration
     * @param {Date} now - Current time
     * @returns {Object|null} Check-in record
     */
    getCheckInRecord(records, shiftConfig, now) {
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Determine which day's records to use for check-in
        let targetDate, targetRecords;
        
        if (hour < shiftConfig.checkOutBufferEnd || (hour === 0 && minute === 0)) {
            // Use yesterday's records for check-in
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = yesterday;
            targetRecords = records.filter(r => this.isRecordFromDate(r, targetDate));
        } else {
            // Use today's records for check-in
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            targetDate = today;
            targetRecords = records.filter(r => this.isRecordFromDate(r, targetDate));
        }
        
        // Filter records within check-in buffer zone
        const filtered = targetRecords.filter(r => {
            const recTime = new Date(r.recordTime);
            const h = recTime.getHours();
            return h >= shiftConfig.checkInBufferStart && h < shiftConfig.checkInBufferEnd;
        });
        
        // Return the last record (most recent check-in)
        return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }

    /**
     * Get check-out record based on device-specific configuration (preserves original logic)
     * @param {Array} records - Employee records
     * @param {Object} shiftConfig - Device shift configuration
     * @param {Date} now - Current time
     * @returns {Object|null} Check-out record
     */
    getCheckOutRecord(records, shiftConfig, now) {
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Determine which day's records to use for check-out
        let targetDate, targetRecords;
        
        if (hour < shiftConfig.checkOutBufferEnd || (hour === 0 && minute === 0)) {
            // Use today's records for check-out
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            targetDate = today;
            targetRecords = records.filter(r => this.isRecordFromDate(r, targetDate));
        } else {
            // Use tomorrow's records for check-out
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow;
            targetRecords = records.filter(r => this.isRecordFromDate(r, targetDate));
        }
        
        // Filter records within check-out buffer zone
        const filtered = targetRecords.filter(r => {
            const recTime = new Date(r.recordTime);
            const h = recTime.getHours();
            return h >= shiftConfig.checkOutBufferStart && h < shiftConfig.checkOutBufferEnd;
        });
        
        // Return the first record (earliest check-out)
        return filtered.length > 0 ? filtered[0] : null;
    }

    /**
     * Check if a record is from a specific date
     * @param {Object} record - Attendance record
     * @param {Date} targetDate - Target date
     * @returns {boolean} Whether record is from target date
     */
    isRecordFromDate(record, targetDate) {
        if (!record.recordTime) return false;
        
        const recordDate = new Date(record.recordTime);
        return recordDate.getFullYear() === targetDate.getFullYear() &&
               recordDate.getMonth() === targetDate.getMonth() &&
               recordDate.getDate() === targetDate.getDate();
    }

    /**
     * Format a record for consistent output
     * @param {Object} record - Raw record
     * @returns {Object} Formatted record
     */
    formatRecord(record) {
        if (!record) return null;
        
        try {
            const dt = new Date(record.recordTime);
            return {
                ...record,
                recordDate: dt.toLocaleDateString('en-US'),
                recordTimeFormatted: dt.toLocaleString('en-US'),
                timeOnly: dt.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                })
            };
        } catch (error) {
            logger.error('Failed to format record', { error: error.message, record });
            return record;
        }
    }

    /**
     * Create empty record for missing data
     * @param {Object} baseRecord - Base record for employee info
     * @returns {Object} Empty record structure
     */
    createEmptyRecord(baseRecord) {
        return {
            userSn: null,
            deviceUserId: baseRecord.deviceUserId,
            employeeName: baseRecord.employeeName,
            employeeRole: baseRecord.employeeRole,
            recordTime: null,
            recordDate: null,
            recordTimeFormatted: null,
            timeOnly: null,
            ip: baseRecord.ip || null
        };
    }

    /**
     * Determine shift status based on check-in and check-out
     * @param {Object} checkIn - Check-in record
     * @param {Object} checkOut - Check-out record
     * @param {Object} shiftConfig - Shift configuration
     * @returns {string} Shift status
     */
    determineShiftStatus(checkIn, checkOut, shiftConfig) {
        if (checkIn && checkOut) {
            return 'completed';
        } else if (checkIn && !checkOut) {
            return 'checked-in';
        } else if (!checkIn && checkOut) {
            return 'checked-out';
        } else {
            return 'not-started';
        }
    }

    /**
     * Get all devices shift data (fleet-level)
     * @returns {Object} All devices shift data
     */
    async getAllDevicesShift() {
        try {
            const results = {};
            
            for (const prefix of Object.keys(this.shiftConfigs)) {
                try {
                    const shiftData = await this.getTodayShift(prefix);
                    results[prefix] = shiftData;
                } catch (error) {
                    logger.error(`Failed to get shift data for ${prefix}`, { error: error.message });
                    results[prefix] = {
                        success: false,
                        error: error.message,
                        devicePrefix: prefix
                    };
                }
            }
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                totalDevices: Object.keys(this.shiftConfigs).length,
                results
            };
            
        } catch (error) {
            errorTracker.trackError(ERROR_STEPS.SHIFT_SERVICE, 'getAllDevicesShift', error.message);
            throw error;
        }
    }

    /**
     * Get device attendance data (placeholder - to be implemented with actual device connection)
     * @param {string} prefix - Device prefix
     * @returns {Array} Attendance data
     */
    async getDeviceAttendanceData(prefix) {
        // TODO: Implement actual device connection and data retrieval
        // For now, return mock data structure
        logger.info(`Getting attendance data for device: ${prefix}`);
        
        // This would normally connect to the actual device and retrieve data
        // For now, return empty array - actual implementation will be in device adapters
        return [];
    }
}

module.exports = ShiftService;
