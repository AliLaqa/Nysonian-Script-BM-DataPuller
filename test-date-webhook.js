// test-date-webhook.js - Test script for date-specific webhook endpoint
const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.140:3000';
const TEST_DATE = '2025-08-04';

async function testDateWebhook() {
    console.log('🧪 Testing Date-Specific Webhook Endpoint...\n');
    console.log(`📍 API Server: ${API_BASE_URL}`);
    console.log(`🔗 Endpoint: ${API_BASE_URL}/webhook/date/${TEST_DATE}\n`);

    try {
        console.log('🚀 Calling GET /webhook/date/' + TEST_DATE + '...');
        const response = await axios.get(`${API_BASE_URL}/webhook/date/${TEST_DATE}`);
        
        console.log('✅ Success!');
        console.log('📋 Response:', response.data.message);
        console.log('📊 Summary:');
        console.log(`   - Requested Date: ${response.data.requestedDate}`);
        console.log(`   - Records: ${response.data.summary.totalRecordsForDate}`);
        console.log(`   - Employees: ${response.data.summary.uniqueEmployeesForDate}`);
        console.log(`   - N8N Response: ${JSON.stringify(response.data.summary.webhookResponse)}`);
        
        console.log('\n🔗 N8N Webhook URL called:');
        console.log(response.data.process.step2.webhookUrl);

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
                console.log('\n💡 Check the date format (should be YYYY-MM-DD)');
            } else if (error.response.status === 500) {
                console.log('\n💡 Possible issues:');
                console.log('   1. No data available for the specified date');
                console.log('   2. N8N webhook is not active');
                console.log('   3. Network connectivity issues');
            }
        }
    }
}

// Run the test
testDateWebhook().then(() => {
    console.log('\n🎯 Test completed!');
    console.log('\n📖 Check your N8N workflow to see if it received the data');
    console.log('\n💡 You can test with different dates by changing TEST_DATE in the script');
}).catch(error => {
    console.error('💥 Test failed:', error);
});
