/**
 * Recommendation Service
 * 
 * Provides high-level recommendation services that integrate the recommendation
 * engine with the anime API adapter. This creates a complete end-to-end flow
 * from user profiles to concrete anime recommendations.
 */

import type { UserProfile, AnimeTitle, RecommendationResult } from './data-models';
import { AnimeApiAdapter } from './api/anime-api-adapter';
import { recommendAnime } from './recommendation-engine';
import { applyFilters, FilterOptions } from './recommendation-filters';
import { 
  RecommendationConfig,
  getRecommendationConfig
} from './recommendation-config';

/**
 * Service that handles the complete recommendation flow
 */
export class RecommendationService {
  private apiAdapter: AnimeApiAdapter;
  private animeCache: Map<string, AnimeTitle> = new Map();
  private config: RecommendationConfig;
  
  /**
   * Creates a new recommendation service
   * 
   * @param apiAdapter The anime API adapter to use
   * @param config Optional custom configuration
   */
  constructor(
    apiAdapter: AnimeApiAdapter,
    config?: Partial<RecommendationConfig>
  ) {
    this.apiAdapter = apiAdapter;
    this.config = getRecommendationConfig(config);
  }
  
  /**
   * Update the recommendation configuration
   * 
   * @param config New configuration to apply
   */
  public updateConfig(config: Partial<RecommendationConfig>): void {
    this.config = getRecommendationConfig(config);
  }
  
  /**
   * Generate recommendations for a user
   * 
   * @param userProfile User's psychological profile
   * @param options Additional recommendation options
   * @returns Generated recommendations
   */
  public async getRecommendations(
    userProfile: UserProfile,
    options: {
      count?: number;
      excludeIds?: string[];
      filterOptions?: FilterOptions;
    } = {}
  ): Promise<RecommendationResult[]> {
    // Merge options with config
    const mergedOptions = {
      count: options.count || this.config.general.count,
      minScore: this.config.general.minMatchScore,
      excludeIds: options.excludeIds || [],
      includeClusters: [],
      excludeClusters: []
    };
    
    try {
      // Fetch or use cached anime database
      const animeDatabase = await this.getAnimeDatabase();
      
      if (animeDatabase.length === 0) {
        throw new Error('Failed to retrieve anime database');
      }
      
      // Generate initial recommendations
      const recommendations = recommendAnime(
        userProfile,
        animeDatabase,
        mergedOptions
      );
      
      // Apply additional filters
      const filterOptions = {
        ...this.config.filtering,
        ...options.filterOptions
      };
      
      const filteredRecommendations = applyFilters(
        recommendations,
        filterOptions
      );
      
      // Enrich recommendations with additional data like trailers
      return await this.enrichRecommendations(filteredRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
  
  /**
   * Get similar anime to a specific anime
   * 
   * @param animeId ID of the anime to find similar titles for
   * @param count Number of similar titles to return
   * @returns Array of similar anime with similarity scores
   */
  public async getSimilarAnime(
    animeId: string,
    count: number = 5
  ): Promise<RecommendationResult[]> {
    try {
      // Get the source anime
      const sourceAnime = await this.getAnimeById(animeId);
      if (!sourceAnime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      // Create a pseudo profile from this anime's attributes
      const pseudoProfile: UserProfile = {
        userId: 'temp-similar-search',
        dimensions: { ...sourceAnime.attributes },
        confidences: Object.keys(sourceAnime.attributes).reduce((conf, key) => {
          conf[key] = 0.9; // High confidence for searching similar items
          return conf;
        }, {} as Record<string, number>),
        answeredQuestions: [],
        lastUpdated: new Date().toISOString(),
        interactionCount: 0
      };
      
      // Fetch anime database
      const animeDatabase = await this.getAnimeDatabase();
      
      // Exclude the source anime itself
      const recommendations = recommendAnime(
        pseudoProfile,
        animeDatabase,
        {
          count,
          excludeIds: [animeId],
          minScore: 0.7
        }
      );
      
      return recommendations;
    } catch (error) {
      console.error('Error finding similar anime:', error);
      return [];
    }
  }
  
  /**
   * Get season recommendations that match a user's profile
   * 
   * @param userProfile User's psychological profile
   * @param season Season to get recommendations for (eg. "winter", "spring")
   * @param year Year to get recommendations for
   * @param count Number of recommendations to return
   * @returns Recommendations from the specified season
   */
  public async getSeasonalRecommendations(
    userProfile: UserProfile,
    season?: string,
    year?: number,
    count: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Get current season anime
      const seasonalAnime = await this.apiAdapter.getSeasonalAnime(season, year);
      
      if (!seasonalAnime || seasonalAnime.length === 0) {
        return [];
      }
      
      // Get psychological attributes for these anime
      const enrichedAnime = await Promise.all(
        seasonalAnime.map(async (anime) => {
          // If we already have attributes, use them
          if (Object.keys(anime.attributes || {}).length > 0) {
            return anime;
          }
          
          try {
            // Otherwise fetch details and map attributes
            const details = await this.apiAdapter.getAnimeDetails(anime.id);
            return {
              ...anime,
              attributes: details?.attributes || {}
            };
          } catch (error) {
            // If we can't get attributes, return the original
            return anime;
          }
        })
      );
      
      // Generate recommendations from just these seasonal anime
      const recommendations = recommendAnime(
        userProfile,
        enrichedAnime.filter(a => Object.keys(a.attributes || {}).length > 0),
        { count }
      );
      
      return recommendations;
    } catch (error) {
      console.error('Error getting seasonal recommendations:', error);
      return [];
    }
  }
  
  /**
   * Get or refresh the anime database for recommendations
   * 
   * @returns Array of anime with attributes
   */
  private async getAnimeDatabase(): Promise<AnimeTitle[]> {
    try {
      // Check if we already have a sufficient cache
      if (this.animeCache.size >= 1000) {
        return Array.from(this.animeCache.values());
      }
      
      // Otherwise fetch from API
      const popularAnime = await this.apiAdapter.getPopularAnime(500);
      const topAnime = await this.apiAdapter.getTopRatedAnime(500);
      
      // Combine and deduplicate
      const uniqueAnimeMap = new Map<string, AnimeTitle>();
      
      // Add popular anime to map
      popularAnime.forEach(anime => {
        uniqueAnimeMap.set(anime.id, anime);
      });
      
      // Add top anime to map, avoiding duplicates
      topAnime.forEach(anime => {
        if (!uniqueAnimeMap.has(anime.id)) {
          uniqueAnimeMap.set(anime.id, anime);
        }
      });
      
      // Get anime with missing psychological attributes
      const animeToEnrich = Array.from(uniqueAnimeMap.values()).filter(
        anime => Object.keys(anime.attributes || {}).length === 0
      );
      
      // Batch process anime that need attributes
      const enrichedAnime = await this.batchGetAttributes(animeToEnrich);
      
      // Update the anime in our map with the enriched versions
      enrichedAnime.forEach(anime => {
        uniqueAnimeMap.set(anime.id, anime);
      });
      
      // Update cache
      this.animeCache = uniqueAnimeMap;
      
      return Array.from(uniqueAnimeMap.values());
    } catch (error) {
      console.error('Error building anime database:', error);
      return Array.from(this.animeCache.values());
    }
  }
  
  /**
   * Batch process anime to get psychological attributes
   * 
   * @param animeList List of anime to process
   * @returns Enriched anime list
   */
  private async batchGetAttributes(
    animeList: AnimeTitle[]
  ): Promise<AnimeTitle[]> {
    // Process in small batches to avoid overwhelming the API
    const batchSize = 10;
    const results: AnimeTitle[] = [];
    
    for (let i = 0; i < animeList.length; i += batchSize) {
      const batch = animeList.slice(i, i + batchSize);
      
      try {
        // Process batch in parallel
        const promises = batch.map(async (anime) => {
          try {
            // Get anime details to map attributes
            const details = await this.apiAdapter.getAnimeDetails(anime.id);
            
            // Map attributes if we got them
            if (details && Object.keys(details.attributes || {}).length > 0) {
              return {
                ...anime,
                attributes: details.attributes
              };
            }
            
            // Otherwise infer attributes from genres and other metadata
            const inferredAttributes = this.apiAdapter.inferAnimeAttributes(anime);
            return {
              ...anime,
              attributes: inferredAttributes
            };
          } catch (error) {
            console.warn(`Failed to get attributes for anime ${anime.id}:`, error);
            return anime;
          }
        });
        
        // Wait for all promises to resolve
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Add the original anime to results
        results.push(...batch);
      }
    }
    
    return results;
  }
  
  /**
   * Get an anime by its ID
   * 
   * @param animeId ID of the anime
   * @returns Anime details or null if not found
   */
  private async getAnimeById(animeId: string): Promise<AnimeTitle | null> {
    // Check cache first
    if (this.animeCache.has(animeId)) {
      return this.animeCache.get(animeId)!;
    }
    
    try {
      // Fetch from API
      const anime = await this.apiAdapter.getAnimeDetails(animeId);
      
      if (anime) {
        // Update cache
        this.animeCache.set(animeId, anime);
        return anime;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting anime ${animeId}:`, error);
      return null;
    }
  }
  
  /**
   * Enrich recommendations with additional data like trailers and posters
   * 
   * @param recommendations Base recommendations
   * @returns Enriched recommendations
   */
  private async enrichRecommendations(
    recommendations: RecommendationResult[]
  ): Promise<RecommendationResult[]> {
    const enriched = [];
    
    for (const rec of recommendations) {
      try {
        // Try to get trailer if missing
        if (!rec.anime.externalIds?.youtubeTrailerId) {
          const enrichedAnime = await this.apiAdapter.enrichWithTrailer(rec.anime);
          enriched.push({
            ...rec,
            anime: enrichedAnime
          });
        } else {
          enriched.push(rec);
        }
      } catch (error) {
        // If enrichment fails, keep the original
        enriched.push(rec);
      }
    }
    
    return enriched;
  }
}