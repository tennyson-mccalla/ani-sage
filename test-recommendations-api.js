// Script to test the recommendations API
require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');

// Helper function to use Node's built-in http/https modules instead of fetch
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testRecommendationsAPI() {
  console.log('Testing recommendations API with validated TMDb image URLs...');
  
  // Create a mock session ID
  const sessionId = 'mock-session-123';
  
  try {
    // Call the recommendations API - force useRealApi=true
    const url = `http://localhost:3000/api/v1/recommendations?sessionId=${sessionId}&count=10&useRealApi=true`;
    console.log(`Fetching from: ${url}`);
    
    const response = await httpGet(url);
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      console.error(await response.text());
      return;
    }
    
    const data = await response.json();
    const recommendations = data.recommendations || [];
    
    console.log(`\nReceived ${recommendations.length} recommendations:`);
    
    // Check all recommendations
    for (const rec of recommendations) {
      console.log(`\n${rec.title} (ID: ${rec.id}):`);
      console.log(`Image URL: ${rec.image}`);
      console.log(`Trailer: ${rec.trailer || 'None'}`);
      console.log(`Match Score: ${rec.match}%`);
      
      // Validate image URL by making a HEAD request
      if (rec.image && rec.image.startsWith('http')) {
        try {
          // Using custom httpHead function
          const checkImageUrl = (url) => {
            return new Promise((resolve) => {
              const protocol = url.startsWith('https') ? https : http;
              const req = protocol.request(url, { method: 'HEAD' }, (res) => {
                resolve({
                  status: res.statusCode,
                  ok: res.statusCode >= 200 && res.statusCode < 300,
                  statusText: res.statusMessage
                });
              });
              req.on('error', (err) => {
                resolve({
                  status: 'error',
                  ok: false,
                  statusText: String(err)
                });
              });
              req.end();
            });
          };
          
          const imgResponse = await checkImageUrl(rec.image);
          console.log(`Image Status: ${imgResponse.status} (${imgResponse.ok ? 'Valid' : 'Invalid'})`);
        } catch (imgError) {
          console.log(`Image Error: ${String(imgError)}`);
        }
      } else {
        console.log('No valid image URL to test');
      }
    }
    
    // Write results to a file for inspection
    fs.writeFileSync('recommendations-test-result.json', JSON.stringify(data, null, 2));
    console.log('\nTest results saved to recommendations-test-result.json');
    
  } catch (error) {
    console.error('Error testing recommendations API:', error);
  }
}

// Run the test
testRecommendationsAPI();