// test_attendance_consistency.js - Test script to verify attendance data consistency
const axios = require('axios');
const config = require('./config');

async function testAttendanceConsistency() {
    const baseUrl = `http://${config.ENV.API_HOST}:${config.ENV.API_PORT}`;
    const testDateRange = '2025-06-20&2025-07-28';
    
    console.log('🧪 Testing attendance data consistency...');
    console.log(`📍 Testing endpoint: ${baseUrl}/attendance/filter/${testDateRange}`);
    console.log('⏳ Making multiple requests to check consistency...\n');
    
    const results = [];
    const numTests = 5;
    
    for (let i = 1; i <= numTests; i++) {
        try {
            console.log(`📊 Test ${i}/${numTests}...`);
            const startTime = Date.now();
            
            const response = await axios.get(`${baseUrl}/attendance/filter/${testDateRange}`, {
                timeout: 60000 // 60 second timeout
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
                    totalRecords: data.totalRecords,
                    filteredRecords: data.filteredRecords,
                    uniqueEmployees: data.uniqueEmployees,
                    firstRecordDate: firstRecord ? firstRecord.toLocaleDateString('en-US') : 'N/A',
                    lastRecordDate: lastRecord ? lastRecord.toLocaleDateString('en-US') : 'N/A',
                    dataRange: data.dataRange
                };
                
                results.push(result);
                
                console.log(`✅ Test ${i} completed in ${duration}ms`);
                console.log(`   📈 Records: ${data.filteredRecords}/${data.totalRecords}`);
                console.log(`   👥 Employees: ${data.uniqueEmployees}`);
                console.log(`   📅 Range: ${result.firstRecordDate} to ${result.lastRecordDate}`);
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
            console.log('⏳ Waiting 3 seconds before next test...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
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
        const recordCounts = successfulTests.map(r => r.filteredRecords);
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
        
        // Show detailed results
        console.log('\n📋 DETAILED RESULTS:');
        console.log('===================');
        successfulTests.forEach(test => {
            console.log(`Test ${test.testNumber}: ${test.filteredRecords} records, last date: ${test.lastRecordDate}, duration: ${test.duration}`);
        });
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
        const uniqueRecordCounts = [...new Set(successfulTests.map(r => r.filteredRecords))];
        const uniqueLastDates = [...new Set(successfulTests.map(r => r.lastRecordDate))];
        
        if (uniqueRecordCounts.length === 1 && uniqueLastDates.length === 1) {
            console.log('✅ EXCELLENT! Data retrieval is now consistent.');
            console.log('✅ The improvements have resolved the inconsistency issues.');
        } else {
            console.log('⚠️ Some inconsistency still exists. Consider:');
            console.log('   - Increasing timeout further');
            console.log('   - Adding more retry attempts');
            console.log('   - Implementing data chunking');
        }
    } else {
        console.log('❌ Multiple test failures detected. Check:');
        console.log('   - Server is running');
        console.log('   - Biometric device is connected');
        console.log('   - Network connectivity');
        console.log('   - Device timeout settings');
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAttendanceConsistency()
        .then(() => {
            console.log('\n🏁 Test completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testAttendanceConsistency };
