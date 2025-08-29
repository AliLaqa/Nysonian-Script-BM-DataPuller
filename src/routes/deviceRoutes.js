// src/routes/deviceRoutes.js
// Express routes for device management

const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// GET /:prefix/device/info - Get device information by prefix
router.get('/:prefix/device/info', (req, res) => {
    const { prefix } = req.params;
    const result = deviceController.getDeviceInfo(prefix);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// GET /devices - List all configured devices
router.get('/devices', (req, res) => {
    const result = deviceController.getAllDevices();
    res.json(result);
});

// GET /country/:code/devices - Get devices by country
router.get('/country/:code/devices', (req, res) => {
    const { code } = req.params;
    const result = deviceController.getDevicesByCountry(code);
    res.json(result);
});

// GET /:prefix/validate - Validate device prefix (for testing)
router.get('/:prefix/validate', (req, res) => {
    const { prefix } = req.params;
    const result = deviceController.validateDevicePrefix(prefix);
    res.json(result);
});

module.exports = router;
