// test-n8n-webhook.js - Test script for the specific N8N webhook URL
const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.140:3000';
const N8N_WEBHOOK_URL = 'https://nysonian.app.n8n.cloud/webhook/today-bm';

async function testN8NWebhook() {
    console.log('🧪 Testing N8N Webhook Integration...\n');
    console.log(`📍 API Server: ${API_BASE_URL}`);
    console.log(`🔗 N8N Webhook: ${N8N_WEBHOOK_URL}\n`);

    try {
        // Test 1: Check if API server is running
        console.log('1️⃣ Checking API server status...');
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ API server is running');
        console.log('📊 Server info:', healthResponse.data);
        console.log('');

        // Test 2: Test the webhook endpoint
        console.log('2️⃣ Testing webhook integration...');
        const webhookResponse = await axios.get(`${API_BASE_URL}/webhook/today`);
        
        console.log('✅ Webhook call successful!');
        console.log('📋 Response:', webhookResponse.data.message);
        console.log('📊 Process Summary:');
        console.log(`   - Step 1: ${webhookResponse.data.process.step1.action}`);
        console.log(`   - Step 2: ${webhookResponse.data.process.step2.action}`);
        console.log(`   - Records: ${webhookResponse.data.summary.totalRecordsToday}`);
        console.log(`   - Employees: ${webhookResponse.data.summary.uniqueEmployeesToday}`);
        console.log(`   - N8N Response: ${JSON.stringify(webhookResponse.data.summary.webhookResponse)}`);
        
        console.log('\n📋 Data Structure Sent to N8N:');
        console.log('   - timestamp: ISO timestamp');
        console.log('   - source: "ZKTeco-MB460-API"');
        console.log('   - data: Complete attendance data object');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the API server is running:');
            console.log('   npm start');
        } else if (error.response) {
            console.log('\n📋 Error details:');
            console.log('   Status:', error.response.status);
            console.log('   Error:', error.response.data.error);
            console.log('   Details:', error.response.data.details);
            
            if (error.response.status === 400) {
                console.log('\n💡 Check the webhook URL format');
            } else if (error.response.status === 500) {
                console.log('\n💡 Possible issues:');
                console.log('   1. N8N webhook is not configured for POST requests');
                console.log('   2. N8N webhook is not active');
                console.log('   3. Network connectivity issues');
            }
        }
    }
}

// Run the test
testN8NWebhook().then(() => {
    console.log('\n🎯 Test completed!');
    console.log('\n📖 Next steps:');
    console.log('1. Check N8N to see if data was received');
    console.log('2. If not working, change N8N webhook HTTP method to POST');
    console.log('3. Make sure N8N webhook is active and listening');
}).catch(error => {
    console.error('💥 Test suite failed:', error);
});
