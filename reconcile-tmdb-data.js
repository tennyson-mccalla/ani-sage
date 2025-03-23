// Tool to reconcile TMDb data and validate image URLs
require('dotenv').config();
const fs = require('fs');

// Define the anime IDs we want to check
const animeToCheck = [
  { anilistId: 5114, name: "Fullmetal Alchemist: Brotherhood", tmdbId: 31911 },
  { anilistId: 1535, name: "Death Note", tmdbId: 13916 },
  { anilistId: 16498, name: "Attack on Titan", tmdbId: 1429 },
  { anilistId: 20583, name: "Tokyo Ghoul", tmdbId: 61374 },
  { anilistId: 97940, name: "Made in Abyss", tmdbId: 76669 },
  { anilistId: 11757, name: "Sword Art Online", tmdbId: 45782 },
  { anilistId: 20, name: "Naruto", tmdbId: 30983 },
  { anilistId: 21, name: "One Piece", tmdbId: 46260 },
  { anilistId: 269, name: "Bleach", tmdbId: 30984 },
  { anilistId: 101922, name: "Demon Slayer", tmdbId: 85937 }
];

// Function to fetch TMDb data
async function fetchTMDbData(tmdbId) {
  const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { error: `API request failed with status: ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

// Function to test if an image URL is valid
async function testImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      status: 'error',
      ok: false,
      statusText: String(error)
    };
  }
}

// Main function
async function reconcileTMDbData() {
  console.log('Reconciling TMDb data for anime...\n');
  
  if (!process.env.TMDB_API_KEY) {
    console.error('Error: TMDB_API_KEY environment variable not set');
    return;
  }
  
  const results = [];
  
  for (const anime of animeToCheck) {
    console.log(`Processing: ${anime.name} (AniList ID: ${anime.anilistId}, TMDb ID: ${anime.tmdbId})`);
    
    // Fetch TMDb data
    const tmdbData = await fetchTMDbData(anime.tmdbId);
    
    if (tmdbData.error) {
      console.log(`  Error fetching TMDb data: ${tmdbData.error}`);
      results.push({
        ...anime,
        success: false,
        error: tmdbData.error
      });
      continue;
    }
    
    // Extract image URL
    const posterPath = tmdbData.poster_path;
    const imageUrl = posterPath ? `https://image.tmdb.org/t/p/original${posterPath}` : null;
    
    console.log(`  Poster path: ${posterPath || 'None'}`);
    console.log(`  Image URL: ${imageUrl || 'None'}`);
    
    // Test image URL if available
    let imageTest = { ok: false, status: 'no_image' };
    if (imageUrl) {
      console.log(`  Testing image URL...`);
      imageTest = await testImageUrl(imageUrl);
      console.log(`  Image test result: ${imageTest.ok ? 'SUCCESS' : 'FAILED'} (${imageTest.status} ${imageTest.statusText})`);
    }
    
    results.push({
      ...anime,
      success: true,
      posterPath,
      imageUrl,
      imageTest,
      trailerUrl: tmdbData.videos?.results?.[0]?.key ? 
                   `https://www.youtube.com/watch?v=${tmdbData.videos.results[0].key}` : null
    });
  }
  
  // Create a mapping object
  const imageMapping = {};
  const trailerMapping = {};
  
  results.forEach(result => {
    if (result.success && result.imageUrl && result.imageTest.ok) {
      imageMapping[result.anilistId] = result.imageUrl;
    }
    
    if (result.success && result.trailerUrl) {
      trailerMapping[result.anilistId] = result.trailerUrl;
    }
  });
  
  // Output the results
  console.log('\nResults:');
  console.log('----------------------------------------');
  
  results.forEach(result => {
    console.log(`${result.name} (AniList ID: ${result.anilistId}):`);
    console.log(`  TMDb ID: ${result.tmdbId}`);
    console.log(`  Success: ${result.success ? 'YES' : 'NO'}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else {
      console.log(`  Image URL: ${result.imageUrl || 'None'}`);
      console.log(`  Image Status: ${result.imageTest.ok ? 'Valid' : 'Invalid'} (${result.imageTest.status})`);
      console.log(`  Trailer URL: ${result.trailerUrl || 'None'}`);
    }
    console.log('----------------------------------------');
  });
  
  console.log('\nImage mapping object for manual-mappings.ts:');
  console.log(JSON.stringify(imageMapping, null, 2).replace(/"/g, "'"));
  
  console.log('\nTrailer mapping object for recommendations/route.ts:');
  console.log(JSON.stringify(trailerMapping, null, 2).replace(/"/g, "'"));
}

// Run the reconciliation
reconcileTMDbData().catch(error => {
  console.error('Error:', error);
});