/**
 * Anime API Adapter
 *
 * This module provides a unified interface for interacting with various anime API providers.
 * It abstracts away the specifics of each provider, allowing the application to seamlessly
 * work with different data sources.
 */

import { AniListClient, AnimeDetails as AniListAnimeDetails } from './providers/anilist/client';
import { MALClient, AnimeDetails as MALAnimeDetails } from './providers/mal/client';
import { YouTubeClient } from './providers/youtube/client';
import { TMDbClient, TVDetails as TMDbTVDetails } from './providers/tmdb/client';
import { BaseAPIClient } from './core/client';

// Unified anime model that works across different providers
export interface AnimeTitle {
  id: string;
  title: string;
  description?: string;
  genres?: string[];
  imageUrl?: string;
  score?: number;
  popularity?: number;
  alternativeTitles?: string[];
  image?: {
    medium?: string;
    large?: string;
    extraLarge?: string;
    color?: string;
  };
  synopsis?: string;
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

export interface AnimeAttributes {
  [key: string]: number;
}

export interface RecommendationParams {
  dimensions: Record<string, number>;
  count?: number;
}

export interface TVSearchResult {
  id: number;
  name: string;
  overview: string;
  poster_path?: string;
  first_air_date: string | null;
  vote_average: number;
  popularity: number;
}

export interface AnimeApiAdapter {
  getClient(provider?: ApiProvider): AniListClient | MALClient | TMDbClient;
  convertAniListAnime(anime: AniListAnimeDetails): AnimeTitle;
  convertMALAnime(anime: MALAnimeDetails): AnimeTitle;
  convertTMDbShow(show: TMDbTVDetails): AnimeTitle;
  mapAniListToAnime(anime: AniListAnimeDetails): AnimeTitle;
  mapMALToAnime(anime: MALAnimeDetails): AnimeTitle;
  getAnimeDetails(animeId: number): Promise<AnimeTitle | null>;
  searchAnime(query: string): Promise<AnimeTitle[]>;
  getRecommendations(params: RecommendationParams): Promise<AnimeTitle[]>;
  enrichWithTrailer(anime: AnimeTitle): Promise<AnimeTitle>;
  inferAnimeAttributes(anime: AnimeTitle): Promise<AnimeAttributes>;
  getAnimeRecommendations(animeId: number): Promise<AnimeTitle[]>;
  getSeasonalAnime(year: number, season: string, limit?: number): Promise<AnimeTitle[]>;
  getCurrentlyAiring(limit?: number): Promise<AnimeTitle[]>;
  getPopularAnime(limit?: number, page?: number): Promise<AnimeTitle[]>;
  getTopRatedAnime(limit?: number, page?: number): Promise<AnimeTitle[]>;
  getCurrentSeason(): string;
  extractYouTubeId(url: string): string | null;
  getAnimeTrailer(title: string): Promise<string | null>;
}

/**
 * Create an API adapter with environmental configuration
 */
export function createApiAdapter(): AnimeApiAdapter {
  const config: ApiConfig = {
    anilist: {},
    mal: {
      clientId: process.env.MAL_CLIENT_ID || '',
    },
    tmdb: {
      apiKey: process.env.TMDB_API_KEY || '',
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY || '',
    }
  };
  
  return new AnimeApiAdapter(config, ApiProvider.ANILIST);
}

export class AniListAdapter implements AnimeApiAdapter {
  public readonly defaultProvider: ApiProvider = ApiProvider.ANILIST;
  private readonly anilistClient: AniListClient;
  private readonly malClient: MALClient;
  private readonly tmdbClient: TMDbClient;

  constructor() {
    this.anilistClient = new AniListClient();
    this.malClient = new MALClient(process.env.MAL_CLIENT_ID || '');
    this.tmdbClient = new TMDbClient(process.env.TMDB_API_KEY || '');
  }

  public getClient(provider?: ApiProvider): AniListClient | MALClient | TMDbClient {
    switch (provider || this.defaultProvider) {
      case ApiProvider.MAL:
        return this.malClient;
      case ApiProvider.TMDB:
        return this.tmdbClient;
      case ApiProvider.ANILIST:
      default:
        return this.anilistClient;
    }
  }

  public async getAnimeDetails(animeId: number, provider?: ApiProvider): Promise<AnimeTitle | null> {
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
      } else {
        const response = await client.getTVDetails(animeId);
        if (!response.data) return null;
        return this.convertTMDbShow(response.data);
      }
    } catch (error) {
      console.error('Error getting anime details:', error);
      return null;
    }
  }

  public async searchAnime(query: string): Promise<AnimeTitle[]> {
    const client = this.getClient();
    try {
      if (client instanceof AniListClient) {
        const response = await client.searchAnime(query);
        if (!response.data) return [];
        return response.data.map(anime => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.searchAnime(query);
        if (!response.data) return [];
        return response.data.map(anime => this.convertMALAnime(anime));
      } else {
        const response = await client.searchTV(query);
        if (!response.data?.results) return [];
        // Get detailed information for each search result
        const detailedResults = await Promise.all(
          response.data.results.map(async (result: TVSearchResult) => {
            const detailsResponse = await client.getTVDetails(result.id);
            if (!detailsResponse.data) return null;
            return this.convertTMDbShow(detailsResponse.data);
          })
        );
        return detailedResults.filter((anime): anime is AnimeTitle => anime !== null);
      }
    } catch (error) {
      console.error('Error searching anime:', error);
      return [];
    }
  }

  public async getRecommendations(params: RecommendationParams): Promise<AnimeTitle[]> {
    return this.getPopularAnime(params.count || 10);
  }

  public async enrichWithTrailer(anime: AnimeTitle): Promise<AnimeTitle> {
    if (anime.externalIds?.tmdb) {
      const client = this.getClient(ApiProvider.TMDB);
      if (client instanceof TMDbClient) {
        const trailer = await client.getTrailerUrl(anime.externalIds.tmdb);
        if (trailer) {
          anime.trailer = trailer;
        }
      }
    }
    return anime;
  }

  public async inferAnimeAttributes(anime: AnimeTitle): Promise<AnimeAttributes> {
    return {};
  }

  public async getAnimeRecommendations(animeId: number): Promise<AnimeTitle[]> {
    const client = this.getClient();
    try {
      if (client instanceof AniListClient) {
        const response = await client.getAnimeRecommendations(animeId);
        if (!response.data) return [];
        return response.data.map((anime: AniListAnimeDetails) => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.getSuggestedAnime();
        if (!response.data) return [];
        return response.data.map((anime: MALAnimeDetails) => this.convertMALAnime(anime));
      } else {
        const response = await client.discoverAnime(1);
        if (!response.data?.results) return [];
        const detailedResults = await Promise.all(
          response.data.results.map(async (result: TVSearchResult) => {
            const detailsResponse = await client.getTVDetails(result.id);
            if (!detailsResponse.data) return null;
            return this.convertTMDbShow(detailsResponse.data);
          })
        );
        return detailedResults.filter((anime: AnimeTitle | null): anime is AnimeTitle => anime !== null);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  public async getSeasonalAnime(year: number, season: string, limit?: number): Promise<AnimeTitle[]> {
    const client = this.getClient();
    try {
      if (client instanceof AniListClient) {
        const response = await client.getSeasonAnime(year, season, "POPULARITY_DESC", limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.getSeasonalAnime(year, season, "anime_score", limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertMALAnime(anime));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting seasonal anime:', error);
      return [];
    }
  }

  public async getCurrentlyAiring(limit?: number): Promise<AnimeTitle[]> {
    const client = this.getClient();
    try {
      if (client instanceof AniListClient) {
        const response = await client.getCurrentlyAiring(limit);
        if (!response.data) return [];
        return response.data.map(anime => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        let season;
        if (month >= 1 && month <= 3) season = 'winter';
        else if (month >= 4 && month <= 6) season = 'spring';
        else if (month >= 7 && month <= 9) season = 'summer';
        else season = 'fall';

        return this.getSeasonalAnime(currentYear, season, limit);
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting currently airing anime:', error);
      return [];
    }
  }

  public async getPopularAnime(limit?: number, page?: number): Promise<AnimeTitle[]> {
    const client = this.getClient();
    try {
      if (client instanceof AniListClient) {
        const response = await client.getPopularAnime(limit, page);
        if (!response.data) return [];
        return response.data.map((anime: AniListAnimeDetails) => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.getSeasonalAnime(
          new Date().getFullYear(),
          this.getCurrentSeason(),
          'popularity',
          limit
        );
        if (!response.data) return [];
        return response.data.map((anime: MALAnimeDetails) => this.convertMALAnime(anime));
      } else {
        const response = await client.discoverAnime(1);
        if (!response.data?.results) return [];
        const detailedResults = await Promise.all(
          response.data.results.map(async (result: TVSearchResult) => {
            const detailsResponse = await client.getTVDetails(result.id);
            if (!detailsResponse.data) return null;
            return this.convertTMDbShow(detailsResponse.data);
          })
        );
        return detailedResults.filter((anime: AnimeTitle | null): anime is AnimeTitle => anime !== null);
      }
    } catch (error) {
      console.error('Error getting popular anime:', error);
      return [];
    }
  }

  public async getTopRatedAnime(limit?: number, page?: number): Promise<AnimeTitle[]> {
    const client = this.getClient();
    try {
      if (client instanceof AniListClient) {
        const response = await client.getTopAnime(limit, page);
        if (!response.data) return [];
        return response.data.map((anime: AniListAnimeDetails) => this.convertAniListAnime(anime));
      } else if (client instanceof MALClient) {
        const response = await client.getSeasonalAnime(
          new Date().getFullYear(),
          this.getCurrentSeason(),
          'anime_score',
          limit
        );
        if (!response.data) return [];
        return response.data.map((anime: MALAnimeDetails) => this.convertMALAnime(anime));
      } else {
        const response = await client.discoverAnime(1);
        if (!response.data?.results) return [];
        const detailedResults = await Promise.all(
          response.data.results.map(async (result: TVSearchResult) => {
            const detailsResponse = await client.getTVDetails(result.id);
            if (!detailsResponse.data) return null;
            return this.convertTMDbShow(detailsResponse.data);
          })
        );
        return detailedResults.filter((anime: AnimeTitle | null): anime is AnimeTitle => anime !== null);
      }
    } catch (error) {
      console.error('Error getting top rated anime:', error);
      return [];
    }
  }

  public convertAniListAnime(anime: AniListAnimeDetails): AnimeTitle {
    return {
      id: String(anime.id),
      title: anime.title.romaji || '',
      alternativeTitles: [anime.title.native, anime.title.english].filter((t): t is string => !!t),
      synopsis: anime.description,
      score: (anime.averageScore || 0) / 10,
      genres: anime.genres,
      image: {
        medium: anime.coverImage?.medium,
        large: anime.coverImage?.large,
        extraLarge: anime.coverImage?.extraLarge,
        color: anime.coverImage?.color
      }
    };
  }

  public convertMALAnime(anime: MALAnimeDetails): AnimeTitle {
    const alternativeTitles: string[] = [];
    if (anime.alternative_titles?.en) alternativeTitles.push(anime.alternative_titles.en);
    if (anime.alternative_titles?.ja) alternativeTitles.push(anime.alternative_titles.ja);

    return {
      id: String(anime.id),
      title: anime.title,
      alternativeTitles,
      image: {
        medium: anime.main_picture?.medium || '',
        large: anime.main_picture?.large || ''
      },
      synopsis: anime.synopsis,
      score: anime.mean,
      genres: anime.genres?.map(g => g.name) || [],
      popularity: anime.popularity
    };
  }

  public convertTMDbShow(show: TMDbTVDetails): AnimeTitle {
    return {
      id: String(show.id),
      title: show.name,
      alternativeTitles: [],
      synopsis: show.overview,
      score: show.vote_average,
      genres: show.genres.map(g => g.name),
      image: {
        medium: show.poster_path ?
          `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
        large: show.poster_path ?
          `https://image.tmdb.org/t/p/original${show.poster_path}` : undefined
      }
    };
  }

  public mapAniListToAnime(anime: AniListAnimeDetails): AnimeTitle {
    return this.convertAniListAnime(anime);
  }

  public mapMALToAnime(anime: MALAnimeDetails): AnimeTitle {
    return this.convertMALAnime(anime);
  }

  public getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  public extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }

  public async getAnimeTrailer(title: string): Promise<string | null> {
    // TODO: Implement trailer search
    return null;
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
  public defaultProvider: ApiProvider;

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
  public getClient(provider?: ApiProvider): AniListClient | MALClient | TMDbClient {
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
  public convertAniListAnime(anime: AniListAnimeDetails): AnimeTitle {
    const alternativeTitles = [];
    if (anime.title.romaji) alternativeTitles.push(anime.title.romaji);
    if (anime.title.english) alternativeTitles.push(anime.title.english);
    if (anime.title.native) alternativeTitles.push(anime.title.native);

    // Get the primary title (prefer English, then Romaji, then Native)
    const primaryTitle = anime.title.english || anime.title.romaji || anime.title.native || '';

    // Create external IDs object if MAL ID is available
    const externalIds = {} as Record<string, any>;
    
    if (anime.idMal) {
      externalIds.mal = anime.idMal;
    }
    
    return {
      id: anime.id.toString(),
      title: primaryTitle,
      description: anime.description,
      genres: anime.genres,
      imageUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium,
      score: anime.averageScore,
      popularity: anime.popularity,
      externalIds: Object.keys(externalIds).length > 0 ? externalIds : undefined
    };
  }

  /**
   * Convert MAL anime details to unified model
   *
   * @param anime MAL anime details
   * @returns Unified anime model
   */
  public convertMALAnime(anime: MALAnimeDetails): AnimeTitle {
    const alternativeTitles: string[] = [];
    if (anime.alternative_titles?.en) alternativeTitles.push(anime.alternative_titles.en);
    if (anime.alternative_titles?.ja) alternativeTitles.push(anime.alternative_titles.ja);

    return {
      id: String(anime.id),
      title: anime.title,
      alternativeTitles,
      image: {
        medium: anime.main_picture?.medium || '',
        large: anime.main_picture?.large || ''
      },
      synopsis: anime.synopsis,
      score: anime.mean,
      genres: anime.genres?.map(g => g.name) || [],
      popularity: anime.popularity
    };
  }

  /**
   * Convert TMDb TV details to unified model
   *
   * @param show TMDb TV details
   * @returns Unified anime model
   */
  public convertTMDbShow(show: TMDbTVDetails): AnimeTitle {
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
      id: show.id.toString(),
      title: show.name,
      description: show.overview,
      genres: show.genres?.map(g => g.name) || [],
      imageUrl: show.poster_path ?
        `https://image.tmdb.org/t/p/w780${show.poster_path}` : undefined,
      image: {
        medium: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
        large: show.poster_path ? `https://image.tmdb.org/t/p/w780${show.poster_path}` : undefined,
        extraLarge: show.poster_path ? `https://image.tmdb.org/t/p/original${show.poster_path}` : undefined,
      },
      score: show.vote_average,
      popularity: show.popularity
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
  public mapAniListToAnime(anime: AniListAnimeDetails): AnimeTitle {
    return this.convertAniListAnime(anime);
  }

  /**
   * Maps MAL anime details to unified format
   *
   * @param anime MAL anime details
   * @returns Unified anime format
   */
  public mapMALToAnime(anime: MALAnimeDetails): AnimeTitle {
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
}
