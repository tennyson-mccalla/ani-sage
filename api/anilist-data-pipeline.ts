/**
 * AniList Data Pipeline
 * 
 * This script fetches the top 1000 anime from AniList and stores them locally
 * for use in the recommendation engine. This helps reduce API dependencies
 * and improves system performance.
 */

import fs from 'fs';
import path from 'path';
import { AniListClient, AnimeDetails } from '../app/lib/providers/anilist/client';
import { AnimeTitle } from '../data-models';
import { AnimeApiAdapter, ApiProvider } from '../app/lib/anime-api-adapter';
import malSyncClient from '../app/lib/utils/malsync/client';
import { manualMappings, hasManualMapping } from '../app/lib/utils/malsync/manual-mappings';
import { MALClient } from '../app/lib/providers/mal/client';
import { TMDbClient } from '../app/lib/providers/tmdb/client';

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'top-anime.json');
const PAGE_SIZE = 50; // AniList max page size
const TOTAL_ANIME = 1000; // Total anime to fetch
const DELAY_MS = 3000; // Increased delay between API calls to avoid rate limiting
const RATE_LIMIT_BACKOFF_MS = 45000; // Wait 45 seconds when we hit a rate limit

// Interface for anime with psychological attributes
interface EnrichedAnimeTitle extends AnimeTitle {
  // Additional fields from mapping process
  attributes: {
    visualComplexity: number;
    narrativeComplexity: number;
    emotionalValence: number;
    characterComplexity: number;
    narrativePace: number;
    [key: string]: number;
  };
}

/**
 * Fetch anime data from AniList with pagination
 */
async function fetchTopAnimeFromAniList(): Promise<AnimeDetails[]> {
  const client = new AniListClient();
  const totalPages = Math.ceil(TOTAL_ANIME / PAGE_SIZE);
  const allAnime: AnimeDetails[] = [];

  console.log(`Fetching ${TOTAL_ANIME} anime from AniList in ${totalPages} pages...`);

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Fetching page ${page} of ${totalPages}...`);
    
    try {
      // First try popularity sort
      const response = await client.getPopularAnime(PAGE_SIZE, page);
      
      if (response.data && response.data.length > 0) {
        allAnime.push(...response.data);
      }
      
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      // If we hit an error, check if it's rate limiting
      if (error?.statusCode === 429) {
        console.log(`Rate limit reached. Waiting ${RATE_LIMIT_BACKOFF_MS/1000} seconds before continuing...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_BACKOFF_MS));
      } else {
        // For other errors, wait a bit less
        await new Promise(resolve => setTimeout(resolve, DELAY_MS * 2));
      }
    }
  }

  console.log(`Successfully fetched ${allAnime.length} anime from AniList`);
  return allAnime;
}

/**
 * Fetch top rated anime for better variety
 */
async function fetchTopRatedAnime(): Promise<AnimeDetails[]> {
  const client = new AniListClient();
  const totalPages = 5; // Get 250 top rated anime (5 pages of 50)
  const allAnime: AnimeDetails[] = [];

  console.log(`Fetching top rated anime from AniList in ${totalPages} pages...`);

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Fetching top rated page ${page} of ${totalPages}...`);
    
    try {
      const response = await client.getTopAnime(PAGE_SIZE, page);
      
      if (response.data && response.data.length > 0) {
        allAnime.push(...response.data);
      }
      
      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    } catch (error) {
      console.error(`Error fetching top rated page ${page}:`, error);
      // If we hit an error, check if it's rate limiting
      if (error?.statusCode === 429) {
        console.log(`Rate limit reached. Waiting ${RATE_LIMIT_BACKOFF_MS/1000} seconds before continuing...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_BACKOFF_MS));
      } else {
        // For other errors, wait a bit less
        await new Promise(resolve => setTimeout(resolve, DELAY_MS * 2));
      }
    }
  }

  console.log(`Successfully fetched ${allAnime.length} top rated anime`);
  return allAnime;
}

/**
 * Fetch additional IDs from other providers 
 * 
 * @param anilistId AniList ID to look up
 * @returns Object with IDs from different providers
 */
async function fetchCrossPlatformIds(anilistId: number): Promise<{
  malId?: number;
  tmdbId?: number;
}> {
  const result: { malId?: number; tmdbId?: number } = {};
  
  // Check if we have a manual mapping
  if (hasManualMapping(String(anilistId))) {
    const manualMapping = manualMappings[String(anilistId)];
    if (manualMapping) {
      result.malId = manualMapping.mal;
      result.tmdbId = manualMapping.tmdb;
      return result;
    }
  }
  
  // We no longer try the MALSync API since it consistently returns 404 errors
  
  return result;
}

/**
 * Convert AniList anime to our system's format
 * 
 * @param animeList List of AniList anime to convert
 * @returns Promise with list of converted anime
 */
async function convertAnimeToSystemFormat(animeList: AnimeDetails[]): Promise<AnimeTitle[]> {
  const apiAdapter = new AnimeApiAdapter({}, ApiProvider.ANILIST);
  const results: AnimeTitle[] = [];
  
  // Process in batches
  const batchSize = 20; // Increased batch size since we're no longer calling external mapping APIs
  
  for (let i = 0; i < animeList.length; i += batchSize) {
    const batch = animeList.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(animeList.length/batchSize)} (${i+1} to ${Math.min(i+batchSize, animeList.length)} of ${animeList.length} anime)`);
    
    const batchPromises = batch.map(async (anime) => {
      const converted = apiAdapter.convertAniListAnime(anime);
      
      // Get additional IDs from manual mappings
      const additionalIds = await fetchCrossPlatformIds(anime.id);
      
      // Map IDs explicitly
      return {
        ...converted,
        episodeCount: anime.episodes || 0,
        year: anime.seasonYear || 0,
        season: anime.season || '',
        genres: anime.genres || [],
        popularity: anime.popularity || 0,
        rating: (anime.averageScore || 0) / 10, // Convert to 0-10 scale
        externalIds: {
          anilistId: anime.id,
          malId: anime.idMal || additionalIds.malId,
          tmdbId: additionalIds.tmdbId
        },
        imageUrls: {
          poster: anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium,
          thumbnail: anime.coverImage?.medium,
        },
        synopsis: anime.description || '',
        alternativeTitles: [
          anime.title.english,
          anime.title.native
        ].filter((t): t is string => !!t),
      } as AnimeTitle;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a delay between batches to avoid overwhelming any systems
    if (i + batchSize < animeList.length) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay since we're not calling external APIs
    }
  }
  
  return results;
}

/**
 * Basic mapping of anime attributes based on genres and other metadata
 * This is a placeholder - we'll improve this with more sophisticated mapping later
 */
function inferAnimeAttributes(anime: AnimeTitle): EnrichedAnimeTitle {
  const attributes = {
    visualComplexity: 5, // Default middle value
    narrativeComplexity: 5,
    emotionalValence: 0, // Default neutral value
    characterComplexity: 5,
    narrativePace: 5,
  };

  // Genre-based mapping (very basic)
  if (anime.genres) {
    // Visual complexity
    if (anime.genres.includes('Avant Garde') || anime.genres.includes('Fantasy')) {
      attributes.visualComplexity += 2;
    }
    if (anime.genres.includes('Slice of Life') || anime.genres.includes('Sports')) {
      attributes.visualComplexity -= 1;
    }
    
    // Narrative complexity
    if (anime.genres.includes('Mystery') || anime.genres.includes('Psychological') || 
        anime.genres.includes('Thriller') || anime.genres.includes('Sci-Fi')) {
      attributes.narrativeComplexity += 2;
    }
    if (anime.genres.includes('Comedy') || anime.genres.includes('Kids')) {
      attributes.narrativeComplexity -= 1;
    }
    
    // Emotional valence
    if (anime.genres.includes('Comedy') || anime.genres.includes('Adventure')) {
      attributes.emotionalValence += 3;
    }
    if (anime.genres.includes('Horror') || anime.genres.includes('Psychological') ||
        anime.genres.includes('Thriller') || anime.genres.includes('Drama')) {
      attributes.emotionalValence -= 3;
    }
    
    // Character complexity
    if (anime.genres.includes('Drama') || anime.genres.includes('Psychological')) {
      attributes.characterComplexity += 2;
    }
    if (anime.genres.includes('Kids') || anime.genres.includes('Sports')) {
      attributes.characterComplexity -= 1;
    }
    
    // Narrative pace
    if (anime.genres.includes('Action') || anime.genres.includes('Sports')) {
      attributes.narrativePace += 2;
    }
    if (anime.genres.includes('Slice of Life') || anime.genres.includes('Mystery')) {
      attributes.narrativePace -= 2;
    }
  }
  
  // Format based adjustments
  if (anime.episodeCount && anime.episodeCount > 50) {
    // Long anime tend to have more character development
    attributes.characterComplexity += 1;
  }
  
  // Rating-based adjustments - higher ratings may correlate with complexity
  if (anime.rating && anime.rating > 8.5) {
    attributes.narrativeComplexity += 1;
  }

  // Clamp values to valid ranges
  Object.keys(attributes).forEach(key => {
    const k = key as keyof typeof attributes;
    if (k === 'emotionalValence') {
      // Emotional valence is -5 to +5
      attributes[k] = Math.max(-5, Math.min(5, attributes[k]));
    } else {
      // Other attributes are 1-10
      attributes[k] = Math.max(1, Math.min(10, attributes[k]));
    }
  });

  return {
    ...anime,
    attributes,
  };
}

/**
 * Remove duplicate anime based on ID
 */
function removeDuplicates(animeList: AnimeTitle[]): AnimeTitle[] {
  const seen = new Map<string, boolean>();
  return animeList.filter(anime => {
    if (seen.has(anime.id)) {
      return false;
    }
    seen.set(anime.id, true);
    return true;
  });
}

/**
 * Save ID mappings for future use
 */
function saveIdMappings(animeList: AnimeTitle[]) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const mappings = animeList
    .filter(anime => anime.externalIds && 
      (anime.externalIds.malId || anime.externalIds.tmdbId)
    )
    .map(anime => ({
      anilistId: anime.externalIds?.anilistId,
      malId: anime.externalIds?.malId,
      tmdbId: anime.externalIds?.tmdbId,
      title: anime.title
    }));
  
  const mappingsFile = path.join(OUTPUT_DIR, 'id-mappings.json');
  fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));
  console.log(`Saved ${mappings.length} ID mappings to ${mappingsFile}`);
}

/**
 * Main function to run the data pipeline
 */
async function main() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Fetch anime data from AniList
    const popularAnime = await fetchTopAnimeFromAniList();
    const topRatedAnime = await fetchTopRatedAnime();
    
    // Combine the lists
    const combinedAnime = [...popularAnime, ...topRatedAnime];
    console.log(`Combined anime list has ${combinedAnime.length} titles (with duplicates)`);
    
    // Convert to our system format and enrich with cross-platform IDs
    console.log("Converting to system format and enriching with cross-platform IDs...");
    let convertedAnime = await convertAnimeToSystemFormat(combinedAnime);
    
    // Remove duplicates
    const originalCount = convertedAnime.length;
    convertedAnime = removeDuplicates(convertedAnime);
    console.log(`Removed ${originalCount - convertedAnime.length} duplicate anime, ${convertedAnime.length} remain`);
    
    // Save ID mappings for future use
    saveIdMappings(convertedAnime);
    
    // Enrich with inferred attributes
    console.log("Inferring psychological attributes for all anime...");
    const enrichedAnime = convertedAnime.map(inferAnimeAttributes);
    
    // Take the top anime (or less if we don't have that many)
    const finalAnime = enrichedAnime.slice(0, TOTAL_ANIME);
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalAnime, null, 2));
    
    console.log(`Successfully wrote ${finalAnime.length} anime to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error in data pipeline:', error);
    throw error;
  }
}

// The ESM equivalent of 'if this file is being run directly'
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(err => {
    console.error('Fatal error in data pipeline:', err);
    process.exit(1);
  });
}

// Export for CommonJS
module.exports = { runAniListPipeline: main };