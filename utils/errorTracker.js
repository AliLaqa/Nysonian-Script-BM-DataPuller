// utils/errorTracker.js - Global error tracking utility
class ErrorTracker {
    constructor() {
        this.failedAt = null;
        this.failedBecause = null;
        this.timestamp = null;
        this.requestId = null;
    }

    // Reset error state for new request
    reset(requestId = null) {
        this.failedAt = null;
        this.failedBecause = null;
        this.timestamp = null;
        this.requestId = requestId || this.generateRequestId();
    }

    // Set error with step and reason
    setError(step, reason, additionalInfo = {}) {
        this.failedAt = step;
        this.failedBecause = reason;
        this.timestamp = new Date().toISOString();
        
        console.error(`❌ Error at step "${step}": ${reason}`, additionalInfo);
        
        return this.getErrorResponse();
    }

    // Get formatted error response
    getErrorResponse() {
        return {
            success: false,
            timestamp: this.timestamp,
            failedAt: this.failedAt,
            failedBecause: this.failedBecause,
            requestId: this.requestId,
            message: `Process failed at: ${this.failedAt}. Reason: ${this.failedBecause}`
        };
    }

    // Check if there's an error
    hasError() {
        return this.failedAt !== null && this.failedBecause !== null;
    }

    // Generate unique request ID
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get current state
    getState() {
        return {
            failedAt: this.failedAt,
            failedBecause: this.failedBecause,
            timestamp: this.timestamp,
            requestId: this.requestId,
            hasError: this.hasError()
        };
    }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

// Define error steps for the complete flow
const ERROR_STEPS = {
    ZK_HELPER: 'zkHelper.js - ZK Instance Creation',
    ZK_CONNECTION: 'zkHelper.js - ZK Device Connection',
    ZK_USERS_FETCH: 'zkHelper.js - Users Fetch',
    ZK_ATTENDANCE_FETCH: 'zkHelper.js - Attendance Fetch',
    ZK_DISCONNECT: 'zkHelper.js - ZK Disconnect',
    
    ATTENDANCE_ALL: 'attendanceAll.js - Route Handler',
    ATTENDANCE_ENRICHMENT: 'attendanceAll.js - Data Enrichment',
    ATTENDANCE_RESPONSE: 'attendanceAll.js - Response Generation',
    
    ATTENDANCE_HELPER: 'attendanceHelper.js - HTTP Request',
    ATTENDANCE_HELPER_RESPONSE: 'attendanceHelper.js - Response Processing',
    
    SHIFT_CHECKIN: 'shiftCheckin.js - Route Handler',
    SHIFT_CHECKIN_PROCESSING: 'shiftCheckin.js - Data Processing',
    SHIFT_CHECKIN_RESPONSE: 'shiftCheckin.js - Response Generation',
    
    SHIFT_CHECKOUT: 'shiftCheckout.js - Route Handler',
    SHIFT_CHECKOUT_PROCESSING: 'shiftCheckout.js - Data Processing',
    SHIFT_CHECKOUT_RESPONSE: 'shiftCheckout.js - Response Generation',
    
    SHIFT_DATA: 'shiftData.js - Route Handler',
    SHIFT_DATA_CHECKIN_FETCH: 'shiftData.js - Check-in Data Fetch',
    SHIFT_DATA_CHECKOUT_FETCH: 'shiftData.js - Check-out Data Fetch',
    SHIFT_DATA_MERGE: 'shiftData.js - Data Merging',
    SHIFT_DATA_RESPONSE: 'shiftData.js - Response Generation',
    
    WEBHOOK_HANDLER: 'webhook.js - Route Handler',
    WEBHOOK_SHIFT_FETCH: 'webhook.js - Shift Data Fetch',
    WEBHOOK_N8N_SEND: 'webhook.js - N8N Webhook Send',
    WEBHOOK_RESPONSE: 'webhook.js - Response Generation',
    
    // Log Viewer Error Steps (removed)


};

module.exports = {
    errorTracker,
    ERROR_STEPS
};
