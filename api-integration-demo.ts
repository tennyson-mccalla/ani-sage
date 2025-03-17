/**
 * API Integration Demo
 * 
 * This script demonstrates how to use the TMDb API to fetch posters
 * and the YouTube API to fetch trailers for anime recommendations.
 * 
 * Simplified version for development, avoiding any API calls that might fail.
 */

import { AnimeApiAdapter, ApiProvider } from './api/anime-api-adapter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function apiIntegrationDemo() {
  console.log('=== API Integration Demo ===');
  
  // Create API adapter with manual configuration
  const apiAdapter = new AnimeApiAdapter({
    tmdb: {
      apiKey: process.env.TMDB_API_KEY || '6bda6769781de560f1015ef410d50ab3'
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY || 'AIzaSyAVCnOWZvoVMYWm059ZqHGCySH4xlIMXCI'
    }
  });
  
  try {
    // Search for some popular anime using TMDb
    console.log('\n=== TMDb Poster Demo ===');
    console.log('\nSearching for popular anime from TMDb...');
    const animeSearchResults = await apiAdapter.searchAnime('Demon Slayer', 3, ApiProvider.TMDB);
    
    console.log(`Found ${animeSearchResults.length} results from TMDb`);
    
    // Display the anime with their poster URLs
    animeSearchResults.forEach((anime, index) => {
      console.log(`\n${index + 1}. ${anime.title}`);
      console.log(`   Medium poster: ${anime.image.medium || 'N/A'}`);
      console.log(`   Large poster: ${anime.image.large || 'N/A'}`);
      
      // Log other useful details
      console.log(`   Genres: ${anime.genres?.join(', ') || 'N/A'}`);
      console.log(`   Score: ${anime.score}/10`);
      if (anime.trailer) {
        console.log(`   Trailer: ${anime.trailer}`);
      }
    });
  } catch (error) {
    console.error('Error in TMDb demo:', error);
  }
  
  try {
    // YouTube Trailer Demo - just one example
    console.log('\n=== YouTube Trailer Demo ===');
    console.log('Fetching trailer for popular anime...');
    
    const animeTitle = 'Attack on Titan';
    console.log(`\nSearching for trailer: ${animeTitle}`);
    const trailerUrl = await apiAdapter.getAnimeTrailer(animeTitle);
    console.log(`   Trailer URL: ${trailerUrl || 'Not found'}`);
  } catch (error) {
    console.error('Error in YouTube demo:', error);
  }
  
  // Show how to use posters and trailers in recommendations
  console.log('\n\nExample of using posters and trailers in recommendations:');
  console.log(`
  function renderRecommendation(anime) {
    return \`
      <div class="anime-card">
        <div class="poster-container">
          <img src="\${anime.image.medium}" alt="\${anime.title}" class="anime-poster">
          \${anime.trailer ? \`
            <div class="trailer-overlay">
              <a href="\${anime.trailer}" class="play-button" aria-label="Watch trailer">
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </a>
            </div>
          \` : ''}
        </div>
        <div class="anime-info">
          <h3>\${anime.title}</h3>
          <p>\${anime.synopsis?.substring(0, 100)}...</p>
          <div class="anime-meta">
            <span class="score">\${anime.score}/10</span>
            <span class="genres">\${anime.genres?.join(', ')}</span>
          </div>
        </div>
      </div>
    \`;
  }

  // CSS for the component
  const styles = \`
    .anime-card {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s;
      width: 260px;
      margin: 1rem;
      background: white;
    }
    
    .anime-card:hover {
      transform: translateY(-5px);
    }
    
    .poster-container {
      position: relative;
      width: 100%;
      aspect-ratio: 2/3;
      overflow: hidden;
    }
    
    .anime-poster {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .trailer-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .poster-container:hover .trailer-overlay {
      opacity: 1;
    }
    
    .play-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s;
    }
    
    .play-button:hover {
      transform: scale(1.1);
    }
    
    .play-button svg {
      width: 30px;
      height: 30px;
      fill: white;
      margin-left: 5px;
    }
    
    .anime-info {
      padding: 1rem;
    }
    
    .anime-meta {
      display: flex;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      justify-content: space-between;
    }
    
    .score {
      color: #e50914;
      font-weight: bold;
    }
  \`;
  `);
  
  console.log('\nDemo completed!');
}

// Run the demo
apiIntegrationDemo().catch(error => {
  console.error('Demo error:', error);
});