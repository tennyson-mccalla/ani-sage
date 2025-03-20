/**
 * API Integration Test Demo
 * 
 * This script demonstrates the API functionality of the Ani-Sage system.
 * To run this script:
 * 1. Make sure the application is running locally on port 3000
 * 2. Execute with: ts-node api-integration-demo.ts
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/v1';

async function testApiEndpoints() {
  console.log('=== Ani-Sage API Integration Test ===\n');

  try {
    // 1. Create a session
    console.log('1. Creating a session...');
    const sessionResponse = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const sessionData = await sessionResponse.json();
    console.log('Session created:', sessionData);
    const sessionId = sessionData.sessionId;

    // 2. Get some questions
    console.log('\n2. Fetching questions...');
    const questionsResponse = await fetch(`${API_BASE}/questions?sessionId=${sessionId}&count=3`);
    const questionsData = await questionsResponse.json();
    console.log(`Received ${questionsData.questions?.length || 0} questions`);
    console.log('First question:', questionsData.questions?.[0]);

    // 3. Answer a question
    console.log('\n3. Answering questions to build profile...');
    // For each question, pick the first option
    for (const question of questionsData.questions || []) {
      const firstOption = question.options[0];
      console.log(`Answering question ${question.id} with option ${firstOption.id}`);

      const answerResponse = await fetch(`${API_BASE}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          optionId: firstOption.id,
          sessionId
        })
      });
      const answerData = await answerResponse.json();
      if (answerData.success) {
        console.log(`Answer accepted. Updated profile dimensions:`, answerData.profile.dimensions);
      } else {
        console.log('Failed to submit answer:', answerData);
      }
    }

    // 4. Get profile
    console.log('\n4. Fetching user profile...');
    const profileResponse = await fetch(`${API_BASE}/profile?sessionId=${sessionId}`);
    const profileData = await profileResponse.json();
    console.log('Profile:', profileData);

    // 5. Get mock recommendations
    console.log('\n5. Fetching recommendations with mock data...');
    const recommendationsResponse = await fetch(`${API_BASE}/recommendations?sessionId=${sessionId}&useRealApi=false`);
    const recommendationsData = await recommendationsResponse.json();
    console.log(`Received ${recommendationsData.recommendations?.length || 0} recommendations`);
    if (recommendationsData.recommendations?.length > 0) {
      console.log('First recommendation:', {
        title: recommendationsData.recommendations[0].title,
        match: recommendationsData.recommendations[0].match,
        reasons: recommendationsData.recommendations[0].reasons,
      });
    }

    // 6. Get real API recommendations
    console.log('\n6. Fetching recommendations with real API...');
    const realRecommendationsResponse = await fetch(`${API_BASE}/recommendations?sessionId=${sessionId}&useRealApi=true`);
    const realRecommendationsData = await realRecommendationsResponse.json();
    console.log(`Received ${realRecommendationsData.recommendations?.length || 0} recommendations`);
    if (realRecommendationsData.recommendations?.length > 0) {
      console.log('First real API recommendation:', {
        title: realRecommendationsData.recommendations[0].title,
        match: realRecommendationsData.recommendations[0].match,
        reasons: realRecommendationsData.recommendations[0].reasons,
      });
    }

    console.log('\nAPI Integration Test completed successfully!');
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

// Run the test
testApiEndpoints();