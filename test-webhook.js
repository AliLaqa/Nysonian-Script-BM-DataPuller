// test-webhook.js - Test script for webhook functionality
const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.140:3000';

async function testWebhookEndpoints() {
    console.log('🧪 Testing Webhook Endpoints...\n');

    try {
        // Test 1: Test endpoint
        console.log('1️⃣ Testing /webhook/test endpoint...');
        const testResponse = await axios.get(`${API_BASE_URL}/webhook/test`);
        console.log('✅ Test endpoint working:', testResponse.data.message);
        console.log('📋 Instructions:', testResponse.data.instructions);
        console.log('');

        // Test 2: Test with invalid webhook URL
        console.log('2️⃣ Testing /webhook/today with invalid URL...');
        try {
            const invalidResponse = await axios.post(`${API_BASE_URL}/webhook/today`, {
                webhookUrl: 'invalid-url'
            });
            console.log('❌ Should have failed with invalid URL');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected invalid URL:', error.response.data.error);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log('');

        // Test 3: Test with missing webhook URL
        console.log('3️⃣ Testing /webhook/today with missing URL...');
        try {
            const missingResponse = await axios.post(`${API_BASE_URL}/webhook/today`, {});
            console.log('❌ Should have failed with missing URL');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected missing URL:', error.response.data.error);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log('');

        // Test 4: Test with your actual N8N webhook URL
        console.log('4️⃣ Testing /webhook/today with your N8N webhook URL...');
        try {
            const webhookResponse = await axios.post(`${API_BASE_URL}/webhook/today`, {
                webhookUrl: 'https://nysonian.app.n8n.cloud/webhook/today-bm'
            });
            console.log('✅ Webhook call successful:', webhookResponse.data.message);
            console.log('📊 Summary:', webhookResponse.data.summary);
        } catch (error) {
            if (error.response) {
                console.log('⚠️ Webhook call failed:', error.response.data.error);
                console.log('📋 Details:', error.response.data.details);
                console.log('💡 Make sure N8N webhook is configured for POST requests');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the API server is running on http://192.168.1.140:3000');
        }
    }
}

// Run the tests
testWebhookEndpoints().then(() => {
    console.log('\n🎯 Webhook testing completed!');
    console.log('\n📖 Next steps:');
    console.log('1. Set up N8N webhook node');
    console.log('2. Get your webhook URL from N8N');
    console.log('3. Test with the real webhook URL');
    console.log('4. Check the WEBHOOK-SETUP-GUIDE.md for detailed instructions');
}).catch(error => {
    console.error('💥 Test suite failed:', error);
});
