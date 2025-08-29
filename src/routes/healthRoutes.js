// src/routes/healthRoutes.js
// Health monitoring routes for system and device health

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * Health Routes
 * Provides comprehensive health monitoring endpoints
 */

// Basic health check (lightweight)
router.get('/health', healthController.getBasicHealth);

// Comprehensive system health
router.get('/health/system', healthController.getSystemHealth);

// Device health overview
router.get('/health/devices', healthController.getDeviceHealth);

// Specific device health
router.get('/:prefix/health', healthController.getDeviceHealthById);

// Detailed health report with recommendations
router.get('/health/report', healthController.getDetailedHealthReport);

// System metrics
router.get('/health/metrics', healthController.getSystemMetrics);

// System information
router.get('/health/info', healthController.getSystemInfo);

module.exports = router;
