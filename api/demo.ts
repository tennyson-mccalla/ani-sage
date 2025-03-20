/**
 * API Integration Demo
 *
 * This file demonstrates how to use the anime API integration with AniList, MyAnimeList,
 * and YouTube to fetch anime data and map it to psychological dimensions.
 */

import { AnimeApiAdapter, ApiProvider, AnimeTitle } from '../app/lib/anime-api-adapter';
import { mapAnimeToDimensions, calculateMatchScore, getMatchExplanations } from '../app/lib/anime-attribute-mapper';
import { fileURLToPath } from 'url';

/**
 * Main demo function
 *
 * @param apiConfig API configuration
 * @returns Promise that resolves when demo completes
 */
export async function runApiDemo(apiConfig: {
  anilist?: { accessToken?: string },
  mal?: { clientId: string, clientSecret?: string, accessToken?: string },
  youtube?: { apiKey: string }
}) {
  console.log('=== Anime API Integration Demo ===');

  // Initialize the API adapter
  const apiAdapter = new AnimeApiAdapter(apiConfig);

  // Demo 1: Search for anime
  console.log('\n== Demo 1: Searching for Anime ==');
  const searchResults = await apiAdapter.searchAnime('Fullmetal Alchemist', 5);

  console.log(`Found ${searchResults.length} anime:`);
  searchResults.forEach((anime, index) => {
    console.log(`${index + 1}. ${anime.title} (${anime.id})`);
    console.log(`   Genres: ${anime.genres?.join(', ') || 'N/A'}`);
    console.log(`   Score: ${anime.score || 'N/A'}`);
  });

  // Demo 2: Get anime details
  if (searchResults.length > 0) {
    console.log('\n== Demo 2: Getting Anime Details ==');
    const animeId = searchResults[0].id;
    console.log(`Getting details for: ${searchResults[0].title} (ID: ${animeId})`);

    const animeDetails = await apiAdapter.getAnimeDetails(parseInt(animeId, 10));
    if (animeDetails) {
      console.log('Title:', animeDetails.title);
      if (animeDetails.alternativeTitles && animeDetails.alternativeTitles.length > 0) {
        console.log('Alternative Titles:', animeDetails.alternativeTitles.join(', '));
      }
      console.log('Score:', animeDetails.score);
      console.log('Genres:', animeDetails.genres?.join(', '));

      // Demo 3: Enrich with trailer
      if (apiConfig.youtube) {
        console.log('\n== Demo 3: Getting Anime Trailer ==');
        const enrichedAnime = await apiAdapter.enrichWithTrailer(animeDetails);
        console.log('Trailer URL:', enrichedAnime.trailer || 'No trailer found');
      }

      // Demo 4: Map anime to psychological dimensions
      console.log('\n== Demo 4: Mapping to Psychological Dimensions ==');
      const psychologicalDimensions = mapAnimeToDimensions(animeDetails);

      console.log('Psychological Dimension Mapping:');
      Object.entries(psychologicalDimensions).forEach(([dimension, value]) => {
        console.log(`${dimension.padEnd(20)}: ${value.toFixed(2)}`);
      });

      // Demo 5: Calculate match score with sample user profile
      console.log('\n== Demo 5: Calculating Match Score ==');

      // Sample user profile - this would come from the user's preferences
      const sampleUserProfile = {
        visualComplexity: 7,
        colorSaturation: 6,
        visualPace: 5,
        narrativeComplexity: 8,
        narrativePace: 7,
        plotPredictability: 4,
        characterComplexity: 8,
        characterGrowth: 9,
        emotionalIntensity: 7,
        emotionalValence: 1,
        moralAmbiguity: 7,
        fantasyRealism: 2,
        intellectualEmotional: 1,
        noveltyFamiliarity: 0
      };

      const matchScore = calculateMatchScore(psychologicalDimensions, sampleUserProfile);
      console.log(`Match Score: ${matchScore}%`);

      // Get match explanations
      const matchExplanations = getMatchExplanations(animeDetails, sampleUserProfile);
      console.log('\nWhy this matches your profile:');
      matchExplanations.forEach(({ explanation, strength }) => {
        console.log(`- ${explanation} (${(strength * 100).toFixed(0)}%)`);
      });
    }
  }

  // Demo 6: Get seasonal anime
  console.log('\n== Demo 6: Getting Seasonal Anime ==');
  const currentDate = new Date();
  const year = currentDate.getFullYear();

  // Determine current season
  const month = currentDate.getMonth() + 1;
  let season;
  if (month >= 1 && month <= 3) season = 'winter';
  else if (month >= 4 && month <= 6) season = 'spring';
  else if (month >= 7 && month <= 9) season = 'summer';
  else season = 'fall';

  console.log(`Getting anime for ${season} ${year}...`);

  const seasonalAnime = await apiAdapter.getSeasonalAnime(year, season, 10);
  console.log(`Found ${seasonalAnime.length} seasonal anime:`);

  seasonalAnime.slice(0, 5).forEach((anime, index) => {
    console.log(`${index + 1}. ${anime.title}`);
    console.log(`   Genres: ${anime.genres?.join(', ') || 'N/A'}`);
    console.log(`   Score: ${anime.score || 'N/A'}`);
  });

  console.log('\nDemo completed!');
}

// For running the demo directly
if (import.meta.url === fileURLToPath(import.meta.url)) {
  // API keys would be loaded from environment variables in a real app
  const apiConfig = {
    anilist: {
      // No API key needed for public AniList API
    },
    mal: {
      clientId: process.env.MAL_CLIENT_ID || 'YOUR_MAL_CLIENT_ID',
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY',
    }
  };

  runApiDemo(apiConfig).catch(error => {
    console.error('Demo error:', error);
  });
}

export async function getAnimeDetails(animeId: string): Promise<AnimeTitle | null> {
  try {
    const apiAdapter = new AnimeApiAdapter({
      anilist: {},
      mal: {
        clientId: process.env.MAL_CLIENT_ID || ''
      }
    });
    const details = await apiAdapter.getAnimeDetails(parseInt(animeId, 10));
    if (!details) return null;

    // Get alternative titles if available
    if (details.alternativeTitles && details.alternativeTitles.length > 0) {
      console.log('Alternative titles:', details.alternativeTitles);
    }

    return details;
  } catch (error) {
    console.error('Error getting anime details:', error);
    return null;
  }
}
