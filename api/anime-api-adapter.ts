/**
 * Anime API Adapter
 *
 * This module provides a unified interface for interacting with various anime API providers.
 * It abstracts away the specifics of each provider, allowing the application to seamlessly
 * work with different data sources.
 */

import { AniListClient, AnimeDetails as AniListAnimeDetails } from './providers/anilist/client.js';
import { MALClient, AnimeDetails as MALAnimeDetails } from './providers/mal/client.js';
import { YouTubeClient } from './providers/youtube/client.js';
import { TMDbClient, TVDetails } from './providers/tmdb/client.js';
import { BaseAPIClient } from './core/client';

// Unified anime model that works across different providers
export interface AnimeTitle {
  id: number;
  title: string;
  alternativeTitles: string[];
  image: {
    medium?: string;
    large?: string;
  };
  synopsis?: string;
  score?: number;
  popularity?: number;
  genres?: string[];
  episodeCount?: number;
  format?: string;
  status?: string;
  seasonYear?: number;
  season?: string;
  studios?: string[];
  source?: string;
  trailer?: string;
  externalIds?: {
    youtubeTrailerId?: string | null;
    mal?: number;
    anilist?: number;
    tmdb?: number;
    [key: string]: any;
  };
}

export interface ApiConfig {
  anilist?: {
    accessToken?: string;
  };
  mal?: {
    clientId: string;
    clientSecret?: string;
    accessToken?: string;
  };
  tmdb?: {
    apiKey: string;
  };
  youtube?: {
    apiKey: string;
  };
}

export enum ApiProvider {
  ANILIST = 'anilist',
  MAL = 'mal',
  TMDB = 'tmdb'
}

export interface AnimeApiAdapter {
  searchAnime(query: string): Promise<any[]>;
  getAnimeDetails(id: string): Promise<any>;
  getAnimeRecommendations(id: string): Promise<any[]>;
}

export class AniListAdapter extends BaseAPIClient implements AnimeApiAdapter {
  constructor() {
    super('https://graphql.anilist.co', {
      enableCache: true,
      enableRateLimit: true,
      maxRetries: 3,
      providerName: 'anilist'
    });
  }

  async searchAnime(query: string): Promise<any[]> {
    // TODO: Implement AniList search
    return [];
  }

  async getAnimeDetails(id: string): Promise<any> {
    // TODO: Implement AniList details
    return {};
  }

  async getAnimeRecommendations(id: string): Promise<any[]> {
    // TODO: Implement AniList recommendations
    return [];
  }
}

/**
 * Unified anime API adapter that works with multiple providers
 */
export class AnimeApiAdapter {
  private anilist?: AniListClient;
  private mal?: MALClient;
  private tmdb?: TMDbClient;
  private youtube?: YouTubeClient;
  private defaultProvider: ApiProvider;

  /**
   * Initialize the API adapter with available clients
   *
   * @param config Configuration for various API providers
   * @param defaultProvider Default provider to use when not specified
   */
  constructor(config: ApiConfig, defaultProvider: ApiProvider = ApiProvider.ANILIST) {
    // Initialize AniList client if config provided
    if (config.anilist) {
      this.anilist = new AniListClient(
        config.anilist.accessToken
      );
    }

    // Initialize MAL client if config provided
    if (config.mal) {
      this.mal = new MALClient(
        config.mal.clientId,
        config.mal.clientSecret,
        config.mal.accessToken
      );
    }

    // Initialize TMDb client if config provided
    if (config.tmdb) {
      this.tmdb = new TMDbClient(
        config.tmdb.apiKey,
        { language: 'en-US', includeAdult: false }
      );
    }

    // Initialize YouTube client if config provided
    if (config.youtube) {
      this.youtube = new YouTubeClient(
        config.youtube.apiKey
      );
    }

    this.defaultProvider = defaultProvider;
  }

  /**
   * Get the client for the specified provider
   *
   * @param provider API provider to use
   * @returns The client for the specified provider
   * @throws Error if the client is not configured
   */
  private getClient(provider?: ApiProvider): AniListClient | MALClient | TMDbClient {
    const selectedProvider = provider || this.defaultProvider;

    if (selectedProvider === ApiProvider.ANILIST) {
      if (!this.anilist) throw new Error('AniList client is not configured');
      return this.anilist;
    } else if (selectedProvider === ApiProvider.MAL) {
      if (!this.mal) throw new Error('MyAnimeList client is not configured');
      return this.mal;
    } else if (selectedProvider === ApiProvider.TMDB) {
      if (!this.tmdb) throw new Error('TMDb client is not configured');
      return this.tmdb;
    }

    throw new Error(`Unknown provider: ${selectedProvider}`);
  }

  /**
   * Convert AniList anime details to unified model
   *
   * @param anime AniList anime details
   * @returns Unified anime model
   */
  private convertAniListAnime(anime: AniListAnimeDetails): AnimeTitle {
    const alternativeTitles = [];
    if (anime.title.romaji) alternativeTitles.push(anime.title.romaji);
    if (anime.title.english) alternativeTitles.push(anime.title.english);
    if (anime.title.native) alternativeTitles.push(anime.title.native);

    // Get the primary title (prefer English, then Romaji, then Native)
    const primaryTitle = anime.title.english || anime.title.romaji || anime.title.native || '';

    return {
      id: anime.id,
      title: primaryTitle,
      alternativeTitles: [...new Set(alternativeTitles)].filter(t => t !== primaryTitle),
      image: {
        medium: anime.coverImage?.medium,
        large: anime.coverImage?.large
      },
      synopsis: anime.description,
      score: anime.averageScore,
      popularity: anime.popularity,
      genres: anime.genres,
      episodeCount: anime.episodes,
      format: anime.format,
      status: anime.status,
      seasonYear: anime.seasonYear,
      season: anime.season,
      studios: anime.studios?.nodes.map(studio => studio.name)
    };
  }

  /**
   * Convert MAL anime details to unified model
   *
   * @param anime MAL anime details
   * @returns Unified anime model
   */
  private convertMALAnime(anime: MALAnimeDetails): AnimeTitle {
    const alternativeTitles = [];
    if (anime.alternative_titles?.en) alternativeTitles.push(anime.alternative_titles.en);
    if (anime.alternative_titles?.ja) alternativeTitles.push(anime.alternative_titles.ja);
    if (anime.alternative_titles?.synonyms) alternativeTitles.push(...anime.alternative_titles.synonyms);

    return {
      id: anime.id,
      title: anime.title,
      alternativeTitles: [...new Set(alternativeTitles)],
      image: {
        medium: anime.main_picture?.medium,
        large: anime.main_picture?.large
      },
      synopsis: anime.synopsis,
      score: anime.mean,
      popularity: anime.rank,
      genres: anime.genres?.map(g => g.name),
      episodeCount: anime.num_episodes,
      format: anime.media_type,
      status: anime.status,
      seasonYear: anime.start_season?.year,
      season: anime.start_season?.season,
      studios: anime.studios?.map(s => s.name),
      source: anime.source
    };
  }

  /**
   * Convert TMDb TV details to unified model
   *
   * @param show TMDb TV details
   * @returns Unified anime model
   */
  private convertTMDbShow(show: TVDetails): AnimeTitle {
    // Extract the year from first_air_date
    const seasonYear = show.first_air_date ?
      parseInt(show.first_air_date.split('-')[0]) : undefined;

    // Determine season based on first air date month (approximate)
    let season: string | undefined;
    if (show.first_air_date) {
      const month = parseInt(show.first_air_date.split('-')[1]);
      if (month >= 1 && month <= 3) season = 'WINTER';
      else if (month >= 4 && month <= 6) season = 'SPRING';
      else if (month >= 7 && month <= 9) season = 'SUMMER';
      else season = 'FALL';
    }

    return {
      id: show.id,
      title: show.name,
      alternativeTitles: [show.original_name].filter(t => t !== show.name),
      image: {
        medium: show.poster_path ?
          `https://image.tmdb.org/t/p/w300${show.poster_path}` : undefined,
        large: show.poster_path ?
          `https://image.tmdb.org/t/p/w780${show.poster_path}` : undefined
      },
      synopsis: show.overview,
      score: show.vote_average,
      popularity: show.popularity,
      genres: show.genres?.map(g => g.name),
      episodeCount: show.number_of_episodes,
      format: 'TV', // TMDb doesn't distinguish anime formats precisely
      status: show.in_production ? 'RELEASING' : 'FINISHED',
      seasonYear,
      season,
      studios: show.production_companies?.map(c => c.name)
    };
  }

  /**
   * Search for anime by title
   *
   * @param query Search query
   * @param limit Maximum number of results
   * @param provider API provider to use
   * @returns Array of anime matching the search
   */
  public async searchAnime(
    query: string,
    limit: number = 10,
    provider?: ApiProvider
  ): Promise<AnimeTitle[]> {
    const client = this.getClient(provider);

    try {
      if (client instanceof AniListClient) {
        const response = await client.searchAnime(query, limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.searchAnime(query, limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertMALAnime(anime));
      } else if (client instanceof TMDbClient) {
        const response = await client.searchAnime(query, 1); // TMDb uses pagination
        if (!response.data || !response.data.results) return [];

        // For each search result, get detailed information
        const detailedResults = await Promise.all(
          response.data.results.slice(0, limit).map(async result => {
            const detailsResponse = await client.getTVDetails(result.id);
            if (!detailsResponse.data) return null;
            return this.convertTMDbShow(detailsResponse.data);
          })
        );

        // Filter out any null results
        return detailedResults.filter(anime => anime !== null) as AnimeTitle[];
      }
      return [];
    } catch (error) {
      console.error('Error searching anime:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific anime
   *
   * @param animeId Anime ID
   * @param provider API provider to use
   * @returns Detailed anime information
   */
  public async getAnimeDetails(
    animeId: number,
    provider?: ApiProvider
  ): Promise<AnimeTitle | null> {
    const client = this.getClient(provider);

    try {
      if (client instanceof AniListClient) {
        const response = await client.getAnimeDetails(animeId);
        if (!response.data) return null;
        return this.convertAniListAnime(response.data);
      } else if (client instanceof MALClient) {
        const response = await client.getAnimeDetails(animeId);
        if (!response.data) return null;
        return this.convertMALAnime(response.data);
      } else if (client instanceof TMDbClient) {
        const response = await client.getTVDetails(animeId);
        if (!response.data) return null;

        // Get the trailer URL for the show
        const animeData = this.convertTMDbShow(response.data);

        try {
          const trailerUrl = await client.getTrailerUrl(animeId);
          if (trailerUrl) {
            animeData.trailer = trailerUrl;
          }
        } catch (trailerError) {
          console.warn('Error getting trailer:', trailerError);
          // Continue without trailer
        }

        return animeData;
      }
      return null;
    } catch (error) {
      console.error('Error getting anime details:', error);
      return null;
    }
  }

  /**
   * Get seasonal anime
   *
   * @param year Year of the season
   * @param season Season (winter, spring, summer, fall)
   * @param limit Maximum number of results
   * @param provider API provider to use
   * @returns Array of seasonal anime
   */
  public async getSeasonalAnime(
    year: number,
    season: string,
    limit: number = 50,
    provider?: ApiProvider
  ): Promise<AnimeTitle[]> {
    const client = this.getClient(provider);

    try {
      if (client instanceof AniListClient) {
        const response = await client.getSeasonAnime(year, season, "POPULARITY_DESC", limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.getSeasonalAnime(year, season, "anime_score", limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertMALAnime(anime));
      } else if (client instanceof TMDbClient) {
        // TMDb doesn't have a direct seasonal anime endpoint, but we can use the discover method
        // and then filter by date range to approximate the season

        // Convert season to date range
        let startMonth, endMonth;
        switch (season.toLowerCase()) {
          case 'winter':
            startMonth = '01';
            endMonth = '03';
            break;
          case 'spring':
            startMonth = '04';
            endMonth = '06';
            break;
          case 'summer':
            startMonth = '07';
            endMonth = '09';
            break;
          case 'fall':
          case 'autumn':
            startMonth = '10';
            endMonth = '12';
            break;
          default:
            startMonth = '01';
            endMonth = '12';
        }

        // Discover anime with Japanese origin in the given season
        const response = await client.discoverAnime(1);
        if (!response.data || !response.data.results) return [];

        // Filter results to match the season and year
        const seasonalResults = response.data.results.filter(show => {
          if (!show.first_air_date) return false;

          const [showYear, showMonth] = show.first_air_date.split('-');
          return (
            parseInt(showYear) === year &&
            parseInt(showMonth) >= parseInt(startMonth) &&
            parseInt(showMonth) <= parseInt(endMonth)
          );
        });

        // Get detailed information for top matches
        const detailedResults = await Promise.all(
          seasonalResults.slice(0, limit).map(async result => {
            const detailsResponse = await client.getTVDetails(result.id);
            if (!detailsResponse.data) return null;
            const animeData = this.convertTMDbShow(detailsResponse.data);

            // Try to get trailer
            try {
              const trailerUrl = await client.getTrailerUrl(result.id);
              if (trailerUrl) {
                animeData.trailer = trailerUrl;
              }
            } catch (error) {
              // Continue without trailer
            }

            return animeData;
          })
        );

        // Filter out nulls and return results
        return detailedResults.filter(anime => anime !== null) as AnimeTitle[];
      }
      return [];
    } catch (error) {
      console.error('Error getting seasonal anime:', error);
      return [];
    }
  }

  /**
   * Get currently airing anime
   *
   * @param limit Maximum number of results
   * @param provider API provider to use
   * @returns Array of currently airing anime
   */
  public async getCurrentlyAiring(
    limit: number = 50,
    provider?: ApiProvider
  ): Promise<AnimeTitle[]> {
    // For MAL, we don't have a direct endpoint for currently airing anime,
    // so we'll use the current season as a fallback
    if ((provider === ApiProvider.MAL || (!provider && this.defaultProvider === ApiProvider.MAL)) && this.mal) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      // Determine current season
      const month = currentDate.getMonth() + 1;
      let season;
      if (month >= 1 && month <= 3) season = 'winter';
      else if (month >= 4 && month <= 6) season = 'spring';
      else if (month >= 7 && month <= 9) season = 'summer';
      else season = 'fall';

      return this.getSeasonalAnime(currentYear, season, limit, ApiProvider.MAL);
    }

    // If we're using AniList, we have a direct endpoint
    if ((provider === ApiProvider.ANILIST || (!provider && this.defaultProvider === ApiProvider.ANILIST)) && this.anilist) {
      const response = await this.anilist.getCurrentlyAiring(limit);
      if (!response.data) return [];
      return response.data.map(anime => this.convertAniListAnime(anime));
    }

    // For TMDb, we can use the currently airing endpoint
    if ((provider === ApiProvider.TMDB || (!provider && this.defaultProvider === ApiProvider.TMDB)) && this.tmdb) {
      const response = await this.tmdb.getCurrentlyAiring();

      if (!response.data || !response.data.results) return [];

      // Get detailed information for top matches
      const detailedResults = await Promise.all(
        response.data.results.slice(0, limit).map(async result => {
          // Make sure tmdb is defined
          if (!this.tmdb) return null;

          const detailsResponse = await this.tmdb.getTVDetails(result.id);
          if (!detailsResponse.data) return null;
          const animeData = this.convertTMDbShow(detailsResponse.data);

          // Try to get trailer
          try {
            // Extra null check for TypeScript
            if (this.tmdb) {
              const trailerUrl = await this.tmdb.getTrailerUrl(result.id);
              if (trailerUrl) {
                animeData.trailer = trailerUrl;
              }
            }
          } catch (error) {
            // Continue without trailer
          }

          return animeData;
        })
      );

      // Filter out nulls and return results
      return detailedResults.filter(anime => anime !== null) as AnimeTitle[];
    }

    return [];
  }

  /**
   * Maps AniList anime details to unified format
   *
   * @param anime AniList anime details
   * @returns Unified anime format
   */
  private mapAniListToAnime(anime: AniListAnimeDetails): AnimeTitle {
    return this.convertAniListAnime(anime);
  }

  /**
   * Maps MAL anime details to unified format
   *
   * @param anime MAL anime details
   * @returns Unified anime format
   */
  private mapMALToAnime(anime: MALAnimeDetails): AnimeTitle {
    return this.convertMALAnime(anime);
  }

  /**
   * Get popular anime with pagination
   *
   * @param limit Maximum number of anime to return
   * @param page Page number for pagination
   * @returns Array of popular anime
   */
  public async getPopularAnime(limit: number = 50, page: number = 1): Promise<AnimeTitle[]> {
    try {
      switch (this.defaultProvider) {
        case ApiProvider.ANILIST:
          if (this.anilist) {
            const response = await this.anilist.getPopularAnime(limit, page);
            if (response.data) {
              return response.data.map(anime => this.mapAniListToAnime(anime));
            }
          }
          break;

        case ApiProvider.MAL:
          if (this.mal) {
            const response = await this.mal.getSeasonalAnime(
              new Date().getFullYear(),
              this.getCurrentSeason(),
              'popularity',
              limit
            );
            if (response.data) {
              return response.data.map(anime => this.mapMALToAnime(anime));
            }
          }
          break;
      }

      // Fallback to secondary provider
      for (const provider of Object.values(ApiProvider)) {
        if (provider === this.defaultProvider) continue;

        if (provider === ApiProvider.ANILIST && this.anilist) {
          const response = await this.anilist.getPopularAnime(limit, page);
          if (response.data) {
            return response.data.map(anime => this.mapAniListToAnime(anime));
          }
        }

        if (provider === ApiProvider.MAL && this.mal) {
          const response = await this.mal.getSeasonalAnime(
            new Date().getFullYear(),
            this.getCurrentSeason(),
            'popularity',
            limit
          );
          if (response.data) {
            return response.data.map(anime => this.mapMALToAnime(anime));
          }
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting popular anime:', error);
      return [];
    }
  }

  /**
   * Get top rated anime with pagination
   *
   * @param limit Maximum number of anime to return
   * @param page Page number for pagination
   * @returns Array of top rated anime
   */
  public async getTopRatedAnime(limit: number = 50, page: number = 1): Promise<AnimeTitle[]> {
    try {
      switch (this.defaultProvider) {
        case ApiProvider.ANILIST:
          if (this.anilist) {
            const response = await this.anilist.getTopAnime(limit, page);
            if (response.data) {
              return response.data.map(anime => this.mapAniListToAnime(anime));
            }
          }
          break;

        case ApiProvider.MAL:
          if (this.mal) {
            const response = await this.mal.getSeasonalAnime(
              new Date().getFullYear(),
              this.getCurrentSeason(),
              'anime_score',
              limit
            );
            if (response.data) {
              return response.data.map(anime => this.mapMALToAnime(anime));
            }
          }
          break;
      }

      // Fallback to secondary provider
      for (const provider of Object.values(ApiProvider)) {
        if (provider === this.defaultProvider) continue;

        if (provider === ApiProvider.ANILIST && this.anilist) {
          const response = await this.anilist.getTopAnime(limit, page);
          if (response.data) {
            return response.data.map(anime => this.mapAniListToAnime(anime));
          }
        }

        if (provider === ApiProvider.MAL && this.mal) {
          const response = await this.mal.getSeasonalAnime(
            new Date().getFullYear(),
            this.getCurrentSeason(),
            'anime_score',
            limit
          );
          if (response.data) {
            return response.data.map(anime => this.mapMALToAnime(anime));
          }
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting top rated anime:', error);
      return [];
    }
  }

  /**
   * Infer psychological attributes for an anime based on metadata
   *
   * @param anime Anime title to infer attributes for
   * @returns Inferred psychological attributes
   */
  public inferAnimeAttributes(anime: AnimeTitle): { [dimension: string]: number } {
    const attributes: { [dimension: string]: number } = {};

    // Default middle values
    attributes.visualComplexity = 5;
    attributes.narrativeComplexity = 5;
    attributes.emotionalIntensity = 5;
    attributes.characterComplexity = 5;
    attributes.moralAmbiguity = 5;
    attributes.emotionalValence = 0;
    attributes.intellectualEmotional = 0;
    attributes.visualPace = 5; // Added missing attribute
    attributes.plotPredictability = 5; // Added missing attribute

    // Make sure genres exists before trying to use it
    const genres = anime.genres || [];

    // Infer from genres
    if (genres.includes('Slice of Life')) {
      attributes.visualComplexity = 4;
      attributes.narrativeComplexity = 3;
      attributes.emotionalIntensity = 4;
      attributes.emotionalValence = 2;
    }

    if (genres.includes('Action')) {
      attributes.visualComplexity = 7;
      attributes.visualPace = 8;
      attributes.emotionalIntensity = 7;
    }

    if (genres.includes('Mystery') || genres.includes('Thriller')) {
      attributes.narrativeComplexity = 8;
      attributes.plotPredictability = 3;
      attributes.emotionalIntensity = 7;
    }

    if (genres.includes('Psychological')) {
      attributes.narrativeComplexity = 8;
      attributes.characterComplexity = 8;
      attributes.moralAmbiguity = 8;
      attributes.intellectualEmotional = 3;
    }

    if (genres.includes('Comedy')) {
      attributes.emotionalValence = 3;
    }

    if (genres.includes('Horror')) {
      attributes.emotionalValence = -4;
      attributes.emotionalIntensity = 8;
    }

    if (genres.includes('Drama')) {
      attributes.characterComplexity = 7;
      attributes.emotionalIntensity = 7;
    }

    if (genres.includes('Romance')) {
      attributes.characterComplexity = 6;
      attributes.emotionalIntensity = 6;
      attributes.emotionalValence = 2;
    }

    // Episode count can hint at narrative complexity
    const episodeCount = anime.episodeCount || 0;
    if (episodeCount > 50) {
      attributes.narrativeComplexity = Math.min(10, attributes.narrativeComplexity + 1);
    } else if (episodeCount <= 13) {
      attributes.narrativeComplexity = Math.max(1, attributes.narrativeComplexity - 1);
    }

    // Use score instead of rating since rating property doesn't exist in AnimeTitle interface
    const score = anime.score || 0;
    if (score > 8.5) {
      attributes.narrativeComplexity = Math.min(10, attributes.narrativeComplexity + 1);
      attributes.characterComplexity = Math.min(10, attributes.characterComplexity + 1);
    }

    return attributes;
  }

  /**
   * Get the current anime season as a string
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();

    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  /**
   * Extract YouTube video ID from a URL
   *
   * @param url YouTube URL
   * @returns Video ID or null if not found
   */
  private extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }

  /**
   * Search for an anime trailer on YouTube
   *
   * @param animeTitle Anime title
   * @returns YouTube trailer URL if found, null otherwise
   */
  public async getAnimeTrailer(animeTitle: string): Promise<string | null> {
    if (!this.youtube) {
      console.warn('YouTube API client is not configured');
      return null;
    }

    try {
      const response = await this.youtube.searchAnimeTrailer(animeTitle);
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }

      // Extract video ID from the first result
      const video = response.data[0];

      if (typeof video.id === 'string') {
        return `https://youtube.com/watch?v=${video.id}`;
      } else if (video.id && 'videoId' in video.id) {
        return `https://youtube.com/watch?v=${video.id.videoId}`;
      }

      return null;
    } catch (error) {
      console.error('Error finding anime trailer:', error);
      return null;
    }
  }

  /**
   * Enrich anime details with trailer information from YouTube
   *
   * @param anime Anime details to enrich
   * @returns Enriched anime details with trailer URL if found
   */
  public async enrichWithTrailer(anime: AnimeTitle): Promise<AnimeTitle> {
    if (!this.youtube) {
      return anime;
    }

    try {
      // Get trailer URL
      const trailerUrl = await this.getAnimeTrailer(anime.title);

      // Create new anime object with trailer information
      return {
        ...anime,
        trailer: trailerUrl || undefined
      };
    } catch (error) {
      console.error('Error enriching anime with trailer:', error);
      return anime;
    }
  }
}
