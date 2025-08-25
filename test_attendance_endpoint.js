// test_attendance_endpoint.js - Test script to verify /attendance endpoint consistency
const axios = require('axios');
const config = require('./config');

async function testAttendanceEndpoint() {
    const baseUrl = `http://${config.ENV.API_HOST}:${config.ENV.API_PORT}`;
    
    console.log('🧪 Testing /attendance endpoint consistency...');
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log('📅 Testing with 1-month data limitation');
    console.log('');
    
    const results = [];
    const numTests = 5;
    
    for (let i = 1; i <= numTests; i++) {
        try {
            console.log(`📊 Test ${i}/${numTests}...`);
            const startTime = Date.now();
            
            const response = await axios.get(`${baseUrl}/attendance`, {
                timeout: 120000 // 2 minute timeout for large data
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (response.data.success) {
                const data = response.data;
                const firstRecord = data.data.length > 0 ? new Date(data.data[0].recordTime) : null;
                const lastRecord = data.data.length > 0 ? new Date(data.data[data.data.length - 1].recordTime) : null;
                
                const result = {
                    testNumber: i,
                    success: true,
                    duration: `${duration}ms`,
                    recordCount: data.recordCount,
                    uniqueEmployees: data.uniqueEmployees,
                    firstRecordDate: firstRecord ? firstRecord.toISOString().split('T')[0] : 'N/A',
                    lastRecordDate: lastRecord ? lastRecord.toISOString().split('T')[0] : 'N/A',
                    dataRange: data.dataRange,
                    dataRetrievalInfo: data.dataRetrievalInfo
                };
                
                results.push(result);
                
                console.log(`✅ Test ${i} completed in ${duration}ms`);
                console.log(`   📈 Records: ${data.recordCount}`);
                console.log(`   👥 Employees: ${data.uniqueEmployees}`);
                console.log(`   📅 Range: ${result.firstRecordDate} to ${result.lastRecordDate}`);
                console.log(`   🔄 Attempts: ${data.dataRetrievalInfo.attempts}/${data.dataRetrievalInfo.maxRetries}`);
                console.log(`   ✅ Completeness: ${data.dataRetrievalInfo.dataCompleteness}`);
                console.log('');
            } else {
                console.log(`❌ Test ${i} failed: ${response.data.error}`);
                results.push({
                    testNumber: i,
                    success: false,
                    error: response.data.error
                });
            }
        } catch (error) {
            console.log(`❌ Test ${i} failed: ${error.message}`);
            results.push({
                testNumber: i,
                success: false,
                error: error.message
            });
        }
        
        // Wait between tests
        if (i < numTests) {
            console.log('⏳ Waiting 5 seconds before next test...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    // Analyze results
    console.log('📊 CONSISTENCY ANALYSIS:');
    console.log('========================');
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successfulTests.length}/${numTests}`);
    console.log(`❌ Failed tests: ${failedTests.length}/${numTests}`);
    
    if (successfulTests.length > 0) {
        const recordCounts = successfulTests.map(r => r.recordCount);
        const uniqueRecordCounts = [...new Set(recordCounts)];
        
        console.log(`\n📈 Record count consistency:`);
        console.log(`   - Unique record counts: ${uniqueRecordCounts.length}`);
        console.log(`   - Record counts: ${uniqueRecordCounts.join(', ')}`);
        
        if (uniqueRecordCounts.length === 1) {
            console.log('   ✅ PERFECT CONSISTENCY - All tests returned the same number of records!');
        } else {
            console.log('   ⚠️ INCONSISTENCY DETECTED - Different record counts across tests');
        }
        
        const lastRecordDates = successfulTests.map(r => r.lastRecordDate);
        const uniqueLastDates = [...new Set(lastRecordDates)];
        
        console.log(`\n📅 Last record date consistency:`);
        console.log(`   - Unique last dates: ${uniqueLastDates.length}`);
        console.log(`   - Last dates: ${uniqueLastDates.join(', ')}`);
        
        if (uniqueLastDates.length === 1) {
            console.log('   ✅ PERFECT CONSISTENCY - All tests returned the same last record date!');
        } else {
            console.log('   ⚠️ INCONSISTENCY DETECTED - Different last record dates across tests');
        }
        
        // Check data range consistency
        const dataRanges = successfulTests.map(r => r.dataRange);
        const uniqueRanges = [...new Set(dataRanges.map(r => `${r.actualStartDate} to ${r.actualEndDate}`))];
        
        console.log(`\n📅 Data range consistency:`);
        console.log(`   - Unique ranges: ${uniqueRanges.length}`);
        console.log(`   - Ranges: ${uniqueRanges.join(', ')}`);
        
        if (uniqueRanges.length === 1) {
            console.log('   ✅ PERFECT CONSISTENCY - All tests returned the same data range!');
        } else {
            console.log('   ⚠️ INCONSISTENCY DETECTED - Different data ranges across tests');
        }
        
        // Show detailed results
        console.log('\n📋 DETAILED RESULTS:');
        console.log('===================');
        successfulTests.forEach(test => {
            console.log(`Test ${test.testNumber}: ${test.recordCount} records, range: ${test.firstRecordDate} to ${test.lastRecordDate}, duration: ${test.duration}`);
        });
        
        // Show device info if available
        const deviceInfo = successfulTests[0]?.dataRetrievalInfo?.deviceInfo;
        if (deviceInfo) {
            console.log('\n📱 DEVICE INFORMATION:');
            console.log('=====================');
            console.log(`Users: ${deviceInfo.userCounts}`);
            console.log(`Logs: ${deviceInfo.logCounts}`);
            console.log(`Capacity: ${deviceInfo.logCapacity}`);
        }
    }
    
    if (failedTests.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        console.log('================');
        failedTests.forEach(test => {
            console.log(`Test ${test.testNumber}: ${test.error}`);
        });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('===================');
    
    if (successfulTests.length === numTests) {
        const uniqueRecordCounts = [...new Set(successfulTests.map(r => r.recordCount))];
        const uniqueLastDates = [...new Set(successfulTests.map(r => r.lastRecordDate))];
        const uniqueRanges = [...new Set(successfulTests.map(r => `${r.dataRange.actualStartDate} to ${r.dataRange.actualEndDate}`))];
        
        if (uniqueRecordCounts.length === 1 && uniqueLastDates.length === 1 && uniqueRanges.length === 1) {
            console.log('✅ EXCELLENT! /attendance endpoint is now working consistently.');
            console.log('✅ The 1-month limitation and improvements have resolved the issues.');
            console.log('✅ All dependent endpoints should now work reliably.');
        } else {
            console.log('⚠️ Some inconsistency still exists. Consider:');
            console.log('   - Increasing timeout further');
            console.log('   - Adding more retry attempts');
            console.log('   - Implementing connection pooling');
        }
    } else {
        console.log('❌ Multiple test failures detected. Check:');
        console.log('   - Server is running');
        console.log('   - Biometric device is connected');
        console.log('   - Network connectivity');
        console.log('   - Device timeout settings');
    }
    
    // Performance analysis
    if (successfulTests.length > 0) {
        const durations = successfulTests.map(r => parseInt(r.duration.replace('ms', '')));
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        console.log('=======================');
        console.log(`Average response time: ${Math.round(avgDuration)}ms`);
        console.log(`Fastest response: ${minDuration}ms`);
        console.log(`Slowest response: ${maxDuration}ms`);
        
        if (avgDuration > 30000) {
            console.log('⚠️ Response times are slow. Consider optimizing data retrieval.');
        } else if (avgDuration > 15000) {
            console.log('ℹ️ Response times are acceptable but could be improved.');
        } else {
            console.log('✅ Response times are good!');
        }
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAttendanceEndpoint()
        .then(() => {
            console.log('\n🏁 Test completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testAttendanceEndpoint };
