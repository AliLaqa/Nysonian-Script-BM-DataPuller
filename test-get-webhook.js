// test-get-webhook.js - Simple test for GET webhook endpoint
const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.140:3000';

async function testGetWebhook() {
    console.log('🧪 Testing GET Webhook Endpoint...\n');
    console.log(`📍 API Server: ${API_BASE_URL}`);
    console.log(`🔗 Endpoint: ${API_BASE_URL}/webhook/today\n`);

    try {
        console.log('🚀 Calling GET /webhook/today...');
        const response = await axios.get(`${API_BASE_URL}/webhook/today`);
        
        console.log('✅ Success!');
        console.log('📋 Response:', response.data.message);
        console.log('📊 Summary:');
        console.log(`   - Records: ${response.data.summary.totalRecordsToday}`);
        console.log(`   - Employees: ${response.data.summary.uniqueEmployeesToday}`);
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
        }
    }
}

// Run the test
testGetWebhook().then(() => {
    console.log('\n🎯 Test completed!');
    console.log('\n📖 Check your N8N workflow to see if it received the data');
}).catch(error => {
    console.error('💥 Test failed:', error);
});
