// shift_routes/shiftData.js - Main shift data endpoint (GET /todayShift)
const express = require('express');
const router = express.Router();
const { processTodayShift } = require('./shiftUtils');
const axios = require('axios');

// GET /todayShift - Get today's shift data (combines check-in and check-out)
// This route will be mounted at /attendance, so the full path is /attendance/todayShift
router.get('/todayShift', async (req, res) => {
    try {
        console.log('🔄 Fetching today\'s shift data (combined check-in & check-out)...');
        const baseUrl = 'http://127.0.0.1:3000/attendance/todayShift';
        // Fetch check-in and check-out data in parallel from their respective files.
        const [checkinRes, checkoutRes] = await Promise.all([
            axios.get(baseUrl + '/checkin'),
            axios.get(baseUrl + '/checkout')
        ]);
        const checkinData = checkinRes.data.data || [];
        const checkoutData = checkoutRes.data.data || [];
        // Merge by deviceUserId
        const merged = {};
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
        const shiftData = Object.values(merged);
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
        console.error('❌ Today Shift API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Failed to retrieve today\'s shift data'
        });
    }
});

module.exports = router;
