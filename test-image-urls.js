// Simple script to validate TMDb image URLs
const https = require('https');

// The validated TMDb image URLs to check
const imageUrls = [
  'https://image.tmdb.org/t/p/original/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg', // Fullmetal Alchemist: Brotherhood
  'https://image.tmdb.org/t/p/original/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg', // Death Note
  'https://image.tmdb.org/t/p/original/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg', // Attack on Titan
  'https://image.tmdb.org/t/p/original/1m4RlC9BTCbyY549TOdVQ5NRPcR.jpg', // Tokyo Ghoul
  'https://image.tmdb.org/t/p/original/3NTAbAiao4JLzFQw6YxP1YZppM8.jpg', // Made in Abyss
  'https://image.tmdb.org/t/p/original/9m8bFIXPg26taNrFSXGwEORVACD.jpg', // Sword Art Online
  'https://image.tmdb.org/t/p/original/27vgjGbN5SrupkudTyBFXxp6Lic.jpg', // Naruto
  'https://image.tmdb.org/t/p/original/2NLyAAM2mcupCaC5giCMr83LfAq.jpg', // One Piece
  'https://image.tmdb.org/t/p/original/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg', // Bleach
  'https://image.tmdb.org/t/p/original/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg'  // Demon Slayer
];

// Function to check a URL using HEAD request
function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 300,
        statusText: res.statusMessage
      });
    });
    req.on('error', (err) => {
      resolve({
        url,
        status: 'error',
        success: false,
        statusText: String(err)
      });
    });
    req.end();
  });
}

// Check all URLs
async function validateAllUrls() {
  console.log('Validating TMDb image URLs...\n');
  
  const results = [];
  for (const url of imageUrls) {
    const result = await checkUrl(url);
    results.push(result);
    
    // Print the result
    console.log(`${result.url.split('/').pop()}:`);
    console.log(`  Status: ${result.status} (${result.success ? 'Success ✅' : 'Failed ❌'})`);
    if (!result.success) {
      console.log(`  Error: ${result.statusText}`);
    }
    console.log('');
  }
  
  // Print summary
  const successCount = results.filter(r => r.success).length;
  console.log(`=== Summary ===`);
  console.log(`${successCount} of ${imageUrls.length} URLs are valid`);
  
  if (successCount === imageUrls.length) {
    console.log('\n✅ All TMDb image URLs are valid and working!');
  } else {
    console.log('\n❌ Some TMDb image URLs are not working.');
  }
}

// Run the validation
validateAllUrls();