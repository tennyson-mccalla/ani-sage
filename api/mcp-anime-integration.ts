/**
 * MCP Anime Integration
 * 
 * This module integrates the anime API with Model Context Protocol (MCP)
 * for storing user profiles, anime recommendations, and interaction history.
 */

import { AnimeApiAdapter, AnimeTitle as ApiAnimeTitle, ApiProvider } from './anime-api-adapter';
import { mapAnimeToDimensions, calculateMatchScore, getMatchExplanations } from './anime-attribute-mapper';
import type { MCPContext, UserProfile, RecommendationSet, RecommendationResult, AnimeTitle as ModelAnimeTitle } from '../data-models';

// Type adapter function to convert API AnimeTitle to data model AnimeTitle
function convertApiAnimeToModelAnime(apiAnime: ApiAnimeTitle): ModelAnimeTitle {
  return {
    id: apiAnime.id.toString(),
    title: apiAnime.title,
    alternativeTitles: apiAnime.alternativeTitles || [],
    synopsis: apiAnime.synopsis || '',
    genres: apiAnime.genres || [],
    year: apiAnime.seasonYear || new Date().getFullYear(),
    season: apiAnime.season,
    episodeCount: apiAnime.episodeCount || 0,
    attributes: mapAnimeToDimensions(apiAnime),
    popularity: apiAnime.popularity || 0,
    rating: apiAnime.score || 0,
    externalIds: {
      ...apiAnime.externalIds,
      youtubeTrailerId: apiAnime.trailer ? extractYoutubeId(apiAnime.trailer) : undefined
    },
    imageUrls: {
      poster: apiAnime.image?.large || apiAnime.image?.medium,
      thumbnail: apiAnime.image?.medium
    }
  };
}

// Extract YouTube ID from URL
function extractYoutubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : undefined;
}

/**
 * MCP Anime Integration class
 * 
 * Handles interactions between anime APIs and MCP context for user profiles,
 * recommendations, and interactions
 */
export class MCPAnimeIntegration {
  private apiAdapter: AnimeApiAdapter;
  
  /**
   * Initialize the MCP anime integration
   * 
   * @param apiAdapter Initialized AnimeApiAdapter instance
   */
  constructor(apiAdapter: AnimeApiAdapter) {
    this.apiAdapter = apiAdapter;
  }
  
  /**
   * Get recommendations for a user based on their profile
   * 
   * @param userProfile User's psychological profile
   * @param count Number of recommendations to generate
   * @returns Promise resolving to recommendation set
   */
  public async getRecommendations(
    userProfile: UserProfile,
    count: number = 10
  ): Promise<RecommendationSet> {
    // 1. Get seasonal anime to use as the base recommendation pool
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    
    // Determine current season
    const month = currentDate.getMonth() + 1;
    let season;
    if (month >= 1 && month <= 3) season = 'winter';
    else if (month >= 4 && month <= 6) season = 'spring';
    else if (month >= 7 && month <= 9) season = 'summer';
    else season = 'fall';
    
    // Get seasonal anime with a higher limit to ensure we have enough to filter
    const seasonalAnime = await this.apiAdapter.getSeasonalAnime(year, season, 50);
    
    // 2. Map each anime to psychological dimensions
    const animeWithDimensions = seasonalAnime.map(anime => {
      const dimensions = mapAnimeToDimensions(anime);
      return { anime, dimensions };
    });
    
    // 3. Calculate match scores
    const animeWithScores = animeWithDimensions.map(({ anime, dimensions }) => {
      const score = calculateMatchScore(dimensions, userProfile.dimensions);
      const matchReasons = getMatchExplanations(anime, userProfile.dimensions);
      
      return {
        anime,
        dimensions,
        score,
        matchReasons
      };
    });
    
    // 4. Sort by match score (highest first)
    animeWithScores.sort((a, b) => b.score - a.score);
    
    // 5. Take the top recommendations
    const topRecommendations = animeWithScores.slice(0, count);
    
    // 6. Enrich with trailers if possible
    const enrichedRecommendations = await Promise.all(
      topRecommendations.map(async ({ anime, score, matchReasons }) => {
        try {
          const enrichedAnime = await this.apiAdapter.enrichWithTrailer(anime);
          
          // Convert API anime to model anime
          const modelAnime = convertApiAnimeToModelAnime(enrichedAnime);
          
          // Format as RecommendationResult
          const recommendation: RecommendationResult = {
            anime: modelAnime,
            score,
            matchReasons: matchReasons.map(({ dimension, strength, explanation }) => ({
              dimension,
              strength,
              explanation
            }))
          };
          
          return recommendation;
        } catch (error) {
          // If trailer enrichment fails, return without trailer
          // Convert API anime to model anime
          const modelAnime = convertApiAnimeToModelAnime(anime);
          
          const recommendation: RecommendationResult = {
            anime: modelAnime,
            score,
            matchReasons: matchReasons.map(({ dimension, strength, explanation }) => ({
              dimension,
              strength,
              explanation
            }))
          };
          
          return recommendation;
        }
      })
    );
    
    // 7. Create and return the recommendation set
    const recommendationSet: RecommendationSet = {
      userId: userProfile.userId,
      timestamp: new Date().toISOString(),
      recommendations: enrichedRecommendations,
      profileSnapshot: { ...userProfile }
    };
    
    return recommendationSet;
  }
  
  /**
   * Store anime interaction in MCP context
   * 
   * @param mcpContext MCP context object
   * @param animeId Anime ID
   * @param interactionType Type of interaction (viewed, selected, watched, rated)
   * @param rating Optional rating (0-10)
   * @returns Updated MCP context
   */
  public storeAnimeInteraction(
    mcpContext: MCPContext,
    animeId: string,
    interactionType: 'viewed' | 'selected' | 'watched' | 'rated',
    rating?: number
  ): MCPContext {
    // Create a new interaction
    const newInteraction = {
      animeId,
      interactionType,
      rating: rating,
      timestamp: new Date().toISOString()
    };
    
    // Add to the recommendation history
    const updatedContext = {
      ...mcpContext,
      recommendationHistory: [
        ...mcpContext.recommendationHistory,
        newInteraction
      ]
    };
    
    return updatedContext;
  }
  
  /**
   * Get anime details from MCP context history or fetch if not found
   * 
   * @param mcpContext MCP context
   * @param animeId Anime ID
   * @returns Promise resolving to anime details
   */
  public async getAnimeDetails(
    mcpContext: MCPContext,
    animeId: string
  ): Promise<ModelAnimeTitle | null> {
    // If the recommendation history isn't available, fetch from API
    if (!mcpContext.recommendationHistory || mcpContext.recommendationHistory.length === 0) {
      try {
        const apiAnime = await this.apiAdapter.getAnimeDetails(parseInt(animeId));
        if (apiAnime) {
          return convertApiAnimeToModelAnime(apiAnime);
        }
        return null;
      } catch (error) {
        console.error('Error fetching anime details:', error);
        return null;
      }
    }
    
    // Look through recommendation history for this anime ID
    // Note: In the current MCPContext schema, we don't store the full anime details
    // in the recommendation history, so we'll need to fetch from the API
    
    // If not found in context, fetch from API
    try {
      const apiAnime = await this.apiAdapter.getAnimeDetails(parseInt(animeId));
      if (apiAnime) {
        return convertApiAnimeToModelAnime(apiAnime);
      }
      return null;
    } catch (error) {
      console.error('Error fetching anime details:', error);
      return null;
    }
  }
  
  /**
   * Get or initialize user profile from MCP context
   * 
   * @param mcpContext MCP context
   * @param userId User ID
   * @returns User profile, either existing or newly initialized
   */
  public getUserProfile(mcpContext: MCPContext, userId: string): UserProfile {
    if (mcpContext.userProfile && mcpContext.userProfile.userId === userId) {
      return mcpContext.userProfile;
    }
    
    // Initialize a new profile with default middle values
    const newProfile: UserProfile = {
      userId,
      dimensions: {
        visualComplexity: 5,
        colorSaturation: 5,
        visualPace: 5,
        narrativeComplexity: 5,
        narrativePace: 5,
        plotPredictability: 5,
        characterComplexity: 5,
        characterGrowth: 5,
        emotionalIntensity: 5,
        emotionalValence: 0, // -5 to 5 scale
        moralAmbiguity: 5,
        fantasyRealism: 0, // -5 to 5 scale
        intellectualEmotional: 0, // -5 to 5 scale
        noveltyFamiliarity: 0, // -5 to 5 scale
      },
      confidences: {
        visualComplexity: 0.1,
        colorSaturation: 0.1,
        visualPace: 0.1,
        narrativeComplexity: 0.1,
        narrativePace: 0.1,
        plotPredictability: 0.1,
        characterComplexity: 0.1,
        characterGrowth: 0.1,
        emotionalIntensity: 0.1,
        emotionalValence: 0.1,
        moralAmbiguity: 0.1,
        fantasyRealism: 0.1,
        intellectualEmotional: 0.1,
        noveltyFamiliarity: 0.1,
      },
      answeredQuestions: [],
      lastUpdated: new Date().toISOString(),
      interactionCount: 0
    };
    
    return newProfile;
  }
  
  /**
   * Create a completely new MCP context
   * 
   * @param userId User ID
   * @returns New MCP context
   */
  public createNewMCPContext(userId: string): MCPContext {
    const userProfile = this.getUserProfile({ userId } as MCPContext, userId);
    
    return {
      userId,
      userProfile,
      interactionHistory: [],
      recommendationHistory: []
    };
  }
}