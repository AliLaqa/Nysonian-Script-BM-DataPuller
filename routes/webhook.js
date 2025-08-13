// routes/webhook.js - Webhook integration endpoints for N8N
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Helper function to fetch attendance data from API
async function fetchAttendanceData(date = null) {
    try {
        let apiUrl;
        // Use 127.0.0.1 instead of localhost to avoid potential DNS issues
        const host = process.env.API_HOST === '0.0.0.0' ? '127.0.0.1' : (process.env.API_HOST || '127.0.0.1');
        const port = process.env.API_PORT || 3000;
        
        if (date) {
            apiUrl = `http://${host}:${port}/attendance/date/${date}`;
            console.log(`🔄 Fetching data from date API: ${apiUrl}`);
        } else {
            apiUrl = `http://${host}:${port}/attendance/today`;
            console.log(`🔄 Fetching data from today's API: ${apiUrl}`);
        }
        
        const response = await axios.get(apiUrl, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data,
            sourceUrl: apiUrl
        };
    } catch (error) {
        console.error(`❌ Error fetching attendance data${date ? ` for ${date}` : ' for today'}:`, error.message);
        return {
            success: false,
            error: error.message,
            sourceUrl: apiUrl
        };
    }
}

// Helper function to fetch today's data (for backward compatibility)
async function fetchTodayData() {
    return await fetchAttendanceData();
}

// Helper function to send data to N8N webhook
async function sendToN8NWebhook(data, webhookUrl) {
    try {
        console.log(`🔄 Sending data to N8N webhook: ${webhookUrl}`);
        
        const payload = {
            timestamp: new Date().toISOString(),
            source: 'ZKTeco-MB460-API',
            data: data
        };
        
        const response = await axios.post(webhookUrl, payload, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ZKTeco-MB460-API/1.0'
            }
        });
        
        return {
            success: true,
            webhookResponse: response.data,
            statusCode: response.status,
            webhookUrl: webhookUrl
        };
    } catch (error) {
        console.error('❌ Error sending to N8N webhook:', error.message);
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status || 'N/A',
            webhookUrl: webhookUrl
        };
    }
}

// Helper function to process webhook request (DRY principle)
async function processWebhookRequest(date = null, webhookUrl = 'https://nysonian.app.n8n.cloud/webhook/today-bm') {
    const MAX_ATTEMPTS = 5;
    const DELAY_MS = 30000; // 30 seconds
    let attempt = 0;
    let dataResult;
    while (attempt < MAX_ATTEMPTS) {
        dataResult = await fetchAttendanceData(date);
        // Check if data is not empty
        if (
            dataResult.success &&
            dataResult.data &&
            Array.isArray(dataResult.data.data) &&
            dataResult.data.data.length > 0
        ) {
            break;
        }
        attempt++;
        if (attempt < MAX_ATTEMPTS) {
            console.log(`🔁 No data retrieved, retrying in 10 seconds... (Attempt ${attempt + 1} of ${MAX_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }
    // After retries, if still no data
    if (
        !dataResult.success ||
        !dataResult.data ||
        !Array.isArray(dataResult.data.data) ||
        dataResult.data.data.length === 0
    ) {
        return {
            success: false,
            error: 'No data could be retrieved',
            details: dataResult.error || 'Empty data after 3 attempts',
            statusCode: 500
        };
    }
    try {
        const dateLabel = date ? ` for ${date}` : ' for today';
        console.log(`🚀 Starting webhook process${dateLabel}...`);
        
        // Step 2: Send data to N8N webhook
        const webhookResult = await sendToN8NWebhook(dataResult.data, webhookUrl);
        
        if (!webhookResult.success) {
            return {
                success: false,
                error: 'Failed to send data to N8N webhook',
                details: webhookResult.error,
                statusCode: webhookResult.statusCode,
                dataFetched: true,
                dataSummary: {
                    totalRecords: dataResult.data.totalRecordsForDate || 0,
                    uniqueEmployees: dataResult.data.uniqueEmployeesForDate || 0
                }
            };
        }
        
        // Success response
        return {
            success: true,
            message: `Data successfully sent to N8N webhook${dateLabel}`,
            process: {
                step1: {
                    status: 'completed',
                    action: `Fetched attendance data${dateLabel}`,
                    recordCount: dataResult.data.totalRecordsForDate || 0,
                    employeeCount: dataResult.data.uniqueEmployeesForDate || 0
                },
                step2: {
                    status: 'completed',
                    action: 'Sent data to N8N webhook',
                    webhookUrl: webhookResult.webhookUrl,
                    statusCode: webhookResult.statusCode
                }
            },
            summary: {
                totalRecords: dataResult.data.totalRecordsForDate || 0,
                uniqueEmployees: dataResult.data.uniqueEmployeesForDate || 0,
                webhookResponse: webhookResult.webhookResponse
            }
        };
        
    } catch (error) {
        console.error(`❌ Webhook process error${date ? ` for ${date}` : ''}:`, error);
        return {
            success: false,
            error: error.message,
            statusCode: 500
        };
    }
}

// POST /webhook/today - Fetch today's data and send to N8N webhook
router.post('/today', async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        
        // Validate webhook URL
        if (!webhookUrl) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'webhookUrl is required in request body',
                example: {
                    webhookUrl: 'https://your-n8n-instance.com/webhook/your-webhook-id'
                }
            });
        }
        
        // Validate URL format
        try {
            new URL(webhookUrl);
        } catch (urlError) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Invalid webhook URL format',
                providedUrl: webhookUrl
            });
        }
        
        console.log('🚀 Starting webhook process...');
        
        // Step 1: Fetch data from today's API
        const todayDataResult = await fetchTodayData();
        
        if (!todayDataResult.success) {
            return res.status(500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Failed to fetch today\'s data',
                details: todayDataResult.error
            });
        }
        
        // Step 2: Send data to N8N webhook
        const webhookResult = await sendToN8NWebhook(todayDataResult.data, webhookUrl);
        
        if (!webhookResult.success) {
            return res.status(500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Failed to send data to N8N webhook',
                details: webhookResult.error,
                statusCode: webhookResult.statusCode,
                todayDataFetched: true,
                todayDataSummary: {
                    totalRecordsToday: todayDataResult.data.totalRecordsToday,
                    uniqueEmployeesToday: todayDataResult.data.uniqueEmployeesToday
                }
            });
        }
        
        // Success response
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Data successfully sent to N8N webhook',
            process: {
                step1: {
                    status: 'completed',
                    action: 'Fetched today\'s attendance data',
                    recordCount: todayDataResult.data.totalRecordsToday,
                    employeeCount: todayDataResult.data.uniqueEmployeesToday
                },
                step2: {
                    status: 'completed',
                    action: 'Sent data to N8N webhook',
                    webhookUrl: webhookResult.webhookUrl,
                    statusCode: webhookResult.statusCode
                }
            },
            summary: {
                totalRecordsToday: todayDataResult.data.totalRecordsToday,
                uniqueEmployeesToday: todayDataResult.data.uniqueEmployeesToday,
                webhookResponse: webhookResult.webhookResponse
            }
        });
        
    } catch (error) {
        console.error('❌ Webhook API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /webhook/test - Test endpoint to verify webhook functionality
router.get('/test', async (req, res) => {
    try {
        const testData = {
            message: 'Webhook test successful',
            timestamp: new Date().toISOString(),
            source: 'ZKTeco-MB460-API',
            testPayload: {
                testField: 'testValue',
                numbers: [1, 2, 3, 4, 5],
                nested: {
                    key: 'value'
                }
            }
        };
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Webhook test endpoint is working',
            testData: testData,
            instructions: {
                toTestWebhook: 'GET /webhook/today to trigger webhook with today\'s data',
                example: {
                    method: 'GET',
                    url: '/webhook/today'
                },
                dateEndpoint: 'GET /webhook/date/:date to trigger webhook with specific date data',
                dateExample: {
                    method: 'GET',
                    url: '/webhook/date/2025-08-04'
                },
                webhookType: 'POST (receives data in request body)',
                dataStructure: {
                    timestamp: 'ISO timestamp',
                    source: 'ZKTeco-MB460-API',
                    data: 'Complete attendance data object'
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Webhook test error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /webhook/today - Trigger webhook with today's data (for POST webhooks)
router.get('/today', async (req, res) => {
    try {
        // This will fetch from /attendance/today, which now does NOT include allRecords in its data
        const result = await processWebhookRequest();
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: result.error,
                details: result.details,
                ...(result.dataSummary && { todayDataSummary: result.dataSummary })
            });
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: result.message,
            process: result.process,
            summary: {
                totalRecordsForDate: result.summary.totalRecords,
                uniqueEmployeesForDate: result.summary.uniqueEmployees,
                webhookResponse: result.summary.webhookResponse
            }
        });
        
    } catch (error) {
        console.error('❌ Webhook API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// GET /webhook/date/:date - Trigger webhook with data from a specific date
router.get('/date/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: 'Invalid date format',
                details: 'Date must be in YYYY-MM-DD format (e.g., 2025-08-04)',
                providedDate: date,
                example: '2025-08-04'
            });
        }
        
        const result = await processWebhookRequest(date);
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                timestamp: new Date().toISOString(),
                error: result.error,
                details: result.details,
                requestedDate: date,
                ...(result.dataSummary && { dataSummary: result.dataSummary })
            });
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: result.message,
            requestedDate: date,
            process: result.process,
            summary: {
                totalRecordsForDate: result.summary.totalRecords,
                uniqueEmployeesForDate: result.summary.uniqueEmployees,
                webhookResponse: result.summary.webhookResponse
            }
        });
        
    } catch (error) {
        console.error('❌ Date Webhook API Error:', error);
        res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
