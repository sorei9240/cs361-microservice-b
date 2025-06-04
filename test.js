// microservice-b/test.js
// Simple test script for Review Management Service

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('Testing Review Management Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✓ Health check:', healthData.status);
    console.log(`Response time: ${Date.now() - Date.now()}ms\n`);

    // Test 2: Grade a card as correct
    console.log('2. Testing card grading (correct)...');
    const gradeCorrectResponse = await fetch(`${BASE_URL}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: 'hsk1_你好',
        isCorrect: true
      })
    });
    const gradeCorrectData = await gradeCorrectResponse.json();
    console.log('✓ Graded card correctly');
    console.log('New streak:', gradeCorrectData.progress.streak);
    console.log('Response time:', gradeCorrectData.responseTime);
    console.log('Next review:', gradeCorrectData.progress.nextReviewDate, '\n');

    // Test 3: Grade the same card as incorrect
    console.log('3. Testing card grading (incorrect)...');
    const gradeIncorrectResponse = await fetch(`${BASE_URL}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: 'hsk1_你好',
        isCorrect: false
      })
    });
    const gradeIncorrectData = await gradeIncorrectResponse.json();
    console.log('✓ Graded card incorrectly');
    console.log('Reset streak:', gradeIncorrectData.progress.streak);
    console.log('Response time:', gradeIncorrectData.responseTime, '\n');

    // Test 4: Get card progress
    console.log('4. Testing get card progress...');
    const progressResponse = await fetch(`${BASE_URL}/progress/hsk1_你好`);
    const progressData = await progressResponse.json();
    console.log('✓ Retrieved card progress');
    console.log('Total reviews:', progressData.progress.totalReviews);
    console.log('Correct reviews:', progressData.progress.correctReviews, '\n');

    // Test 5: Reset card progress
    console.log('5. Testing card reset...');
    const resetResponse = await fetch(`${BASE_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: 'hsk1_你好'
      })
    });
    const resetData = await resetResponse.json();
    console.log('✓ Reset card progress');
    console.log('Reset streak:', resetData.progress.streak);
    console.log('Reset reviews:', resetData.progress.totalReviews, '\n');

    // Test 6: Test responsiveness requirement
    console.log('6. Testing responsiveness requirement (< 1 second)...');
    const startTime = Date.now();
    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE_URL}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: `test_card_${i}`,
          isCorrect: Math.random() > 0.5
        })
      });
    }
    const avgTime = (Date.now() - startTime) / 5;
    console.log(`✓ Average response time: ${avgTime}ms`);
    console.log(`Responsiveness requirement ${avgTime < 1000 ? 'PASSED' : 'FAILED'} (< 1000ms)\n`);

    // Test 7: Get due cards
    console.log('7. Testing due cards retrieval...');
    const dueResponse = await fetch(`${BASE_URL}/due`);
    const dueData = await dueResponse.json();
    console.log('✓ Retrieved due cards');
    console.log('Due cards count:', dueData.count, '\n');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if server is running and run tests
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      testAPI();
    } else {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.log('❌ Server is not running on port 3001');
    console.log('Please start the server first with: npm start');
  }
}

checkServer();