// Script to test the mock data in recommendations
require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');

// Function to make HTTP requests without fetch API
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

// Function to check image URLs
function checkImageUrl(url) {
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
}

async function testMockData() {
  console.log('Testing mock data in recommendations API...');
  
  try {
    // Force useRealApi=false to use our mock data
    const url = `http://localhost:3000/api/v1/recommendations?sessionId=mock-session-123&count=10&useRealApi=false`;
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
    
    // Track which anime we're finding
    const animeFound = {
      '5114': false, // FMA:B
      '16498': false, // AoT
      '1535': false, // Death Note
      '97940': false, // Made in Abyss
    };
    
    // Check all recommendations
    for (const rec of recommendations) {
      console.log(`\n${rec.title} (ID: ${rec.id}):`);
      console.log(`Image URL: ${rec.image}`);
      console.log(`Trailer: ${rec.trailer || 'None'}`);
      console.log(`Match Score: ${rec.match}%`);
      
      // Check if this is one of our anime with validated URLs
      if (['5114', '16498', '1535', '97940'].includes(rec.id)) {
        animeFound[rec.id] = true;
        console.log(`✅ Found anime with validated TMDb image URL`);
      }
      
      // Validate image URL by making a HEAD request
      if (rec.image && rec.image.startsWith('http')) {
        try {
          const imgResponse = await checkImageUrl(rec.image);
          console.log(`Image Status: ${imgResponse.status} (${imgResponse.ok ? 'Valid' : 'Invalid'})`);
          
          // Check if it's a TMDb URL
          if (rec.image.includes('tmdb.org')) {
            console.log(`✅ Using TMDb image URL as expected`);
          }
        } catch (imgError) {
          console.log(`Image Error: ${String(imgError)}`);
        }
      } else {
        console.log('No valid image URL to test');
      }
    }
    
    // Report on which anime we found
    console.log('\n=== Summary ===');
    for (const [id, found] of Object.entries(animeFound)) {
      console.log(`Anime ID ${id}: ${found ? 'Found ✅' : 'Not found ❌'}`);
    }
    
    // Write results to a file for inspection
    fs.writeFileSync('mock-data-test-result.json', JSON.stringify(data, null, 2));
    console.log('\nTest results saved to mock-data-test-result.json');
    
  } catch (error) {
    console.error('Error testing mock data:', error);
  }
}

// Run the test
testMockData();