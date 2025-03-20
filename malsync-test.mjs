// Simple test script to verify MALSync API functionality using ES modules
import fetch from 'node-fetch';

// List of popular anime to test with their AniList IDs
const animeList = [
  { title: 'Your Name', anilistId: 21519 },  // Kimi no Na wa
  { title: 'A Silent Voice', anilistId: 20954 },
  { title: 'My Hero Academia', anilistId: 21856 },
  { title: 'JUJUTSU KAISEN', anilistId: 113415 },
  { title: 'Sword Art Online', anilistId: 11757 },
  { title: 'Demon Slayer', anilistId: 101922 },
  { title: 'Attack on Titan', anilistId: 16498 },
  { title: 'Fullmetal Alchemist: Brotherhood', anilistId: 5114 },
  { title: 'Death Note', anilistId: 1535 }
];

// Manual fallback mapping for popular anime that might fail
const manualMappings = {
  '21519': { tmdb: 372058, mal: 32281 },   // Your Name
  '20954': { tmdb: 378064, mal: 28851 },   // A Silent Voice
  '21856': { tmdb: 65930, mal: 31964 },    // My Hero Academia
  '113415': { tmdb: 94605, mal: 40748 },   // JUJUTSU KAISEN
  '101922': { tmdb: 85937, mal: 38000 }    // Demon Slayer
};

// Test direct MALSync API calls
async function testMalSyncApi() {
  console.log('Testing MALSync API...');
  console.log('======================');
  
  for (const anime of animeList) {
    console.log(`\nTesting ${anime.title} (AniList ID: ${anime.anilistId})`);
    
    try {
      // Test the MALSync API endpoint
      const response = await fetch(`https://api.malsync.moe/anilist/anime/${anime.anilistId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('SUCCESS! MALSync data:', JSON.stringify(data, null, 2));
        
        if (data.tmdb_id) {
          console.log(`✓ TMDB ID: ${data.tmdb_id}`);
        } else {
          console.log('✗ No TMDB ID found in MALSync response');
        }
        
        if (data.malId) {
          console.log(`✓ MAL ID: ${data.malId}`);
        } else {
          console.log('✗ No MAL ID found in MALSync response');
        }
      } else {
        console.log(`✗ Error ${response.status}: ${response.statusText}`);
        
        // Check if we have a manual mapping
        if (manualMappings[anime.anilistId]) {
          console.log('  But we have a manual mapping:');
          console.log(`  TMDB ID: ${manualMappings[anime.anilistId].tmdb}`);
          console.log(`  MAL ID: ${manualMappings[anime.anilistId].mal}`);
        }
      }
    } catch (error) {
      console.error(`✗ Exception when testing ${anime.title}:`, error);
    }
  }
}

// Search TMDb directly to verify we can find these anime
async function testTmdbSearch() {
  // This would require TMDb API key, so we're just outlining how it would work
  console.log('\n\nTMDb search functionality would test:');
  console.log('1. Direct ID-based lookup when we have mappings');
  console.log('2. Search behavior with different query formats:');
  console.log('   - Exact title (e.g., "Your Name")');
  console.log('   - Title + "anime" (e.g., "Your Name anime")');
  console.log('   - Title + "movie" for anime films');
  console.log('   - Japanese title when available');
}

// Run tests
(async () => {
  await testMalSyncApi();
  console.log('\n-----------------------------------');
  testTmdbSearch();
  
  console.log('\n\nRecommendations:');
  console.log('1. Implement the manual mapping table as fallback (Done)');
  console.log('2. Improve TMDb search logic to add "anime" or "movie" keywords (Done)');
  console.log('3. Consider trying Japanese titles for better matches (Done)');
})();