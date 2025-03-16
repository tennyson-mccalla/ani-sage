/**
 * TMDb API client implementation
 * 
 * Provides access to The Movie Database API for anime/TV show data
 */

import { BaseAPIClient, APIResponse } from '../../core/client';

// TMDb Models
export interface TMDbImage {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
}

export interface TVDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  genres: Genre[];
  homepage: string;
  first_air_date: string;
  last_air_date: string;
  in_production: boolean;
  languages: string[];
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  popularity: number;
  production_companies: ProductionCompany[];
  status: string;
  vote_average: number;
  vote_count: number;
  seasons: Season[];
}

export interface SearchResult {
  page: number;
  results: TVSearchResult[];
  total_results: number;
  total_pages: number;
}

export interface TVSearchResult {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date: string;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface VideoResult {
  id: string;
  name: string;
  site: string; // YouTube, Vimeo, etc.
  key: string; // Video identifier (e.g., YouTube video ID)
  type: string; // Trailer, Teaser, etc.
  published_at: string;
}

export interface VideosResponse {
  id: number;
  results: VideoResult[];
}

/**
 * TMDb API client implementation
 */
export class TMDbClient extends BaseAPIClient {
  private apiKey: string;
  private language: string;
  private includeAdult: boolean;

  /**
   * Initialize TMDb client
   * 
   * @param apiKey TMDb API key (v3 auth)
   * @param options Client options
   */
  constructor(
    apiKey: string,
    options?: {
      language?: string;
      includeAdult?: boolean;
      enableCache?: boolean;
      enableRateLimit?: boolean;
      maxRetries?: number;
    }
  ) {
    super('https://api.themoviedb.org/3', options);
    this.apiKey = apiKey;
    this.language = options?.language || 'en-US';
    this.includeAdult = options?.includeAdult ?? false;
  }

  /**
   * Search for TV shows including anime
   * 
   * @param query Search query
   * @param page Results page (default 1)
   * @returns TV search results
   */
  public async searchTV(query: string, page: number = 1): Promise<APIResponse<SearchResult>> {
    if (!query) {
      throw new Error('Search query cannot be empty');
    }

    const params = {
      api_key: this.apiKey,
      query,
      language: this.language,
      page: page.toString(),
      include_adult: this.includeAdult.toString()
    };

    return this.request<SearchResult>({
      method: 'GET',
      endpoint: 'search/tv',
      params
    });
  }

  /**
   * Search for anime using TMDb
   * This is a specialized search that tries to filter for anime content
   * 
   * @param query Search query
   * @param page Results page (default 1)
   * @returns TV search results filtered for likely anime content
   */
  public async searchAnime(query: string, page: number = 1): Promise<APIResponse<SearchResult>> {
    // First, do a general search
    const response = await this.searchTV(`${query} anime`, page);
    
    if (!response.data || !response.data.results) {
      return response;
    }

    // Filter results to likely anime (this is an approximation since TMDb doesn't 
    // have a dedicated anime filter)
    // We look for Japanese origin or specific keywords in the overview
    const animeResults = response.data.results.filter(show => {
      // Check if show is from Japan
      if (show.origin_country.includes('JP')) {
        return true;
      }
      
      // Check for anime-related terms in title or overview
      const overview = show.overview.toLowerCase();
      const name = show.name.toLowerCase();
      const originalName = show.original_name.toLowerCase();
      
      const animeTerms = ['anime', 'manga', 'japanese animation'];
      
      return animeTerms.some(term => 
        overview.includes(term) || name.includes(term) || originalName.includes(term)
      );
    });
    
    // Return filtered results
    return {
      ...response,
      data: {
        ...response.data,
        results: animeResults
      }
    };
  }

  /**
   * Get detailed information about a TV show
   * 
   * @param tvId TMDb TV show ID
   * @returns Detailed TV show data
   */
  public async getTVDetails(tvId: number): Promise<APIResponse<TVDetails>> {
    if (!tvId) {
      throw new Error('TV ID is required');
    }

    const params = {
      api_key: this.apiKey,
      language: this.language,
      append_to_response: 'videos,credits,images'
    };

    return this.request<TVDetails>({
      method: 'GET',
      endpoint: `tv/${tvId}`,
      params
    });
  }

  /**
   * Get videos (trailers, etc.) for a TV show
   * 
   * @param tvId TMDb TV show ID
   * @returns Videos data including trailers
   */
  public async getVideos(tvId: number): Promise<APIResponse<VideosResponse>> {
    if (!tvId) {
      throw new Error('TV ID is required');
    }

    const params = {
      api_key: this.apiKey,
      language: this.language
    };

    return this.request<VideosResponse>({
      method: 'GET',
      endpoint: `tv/${tvId}/videos`,
      params
    });
  }

  /**
   * Get a direct link to the trailer for a TV show
   * 
   * @param tvId TMDb TV show ID
   * @returns URL to the trailer (YouTube) if available, null otherwise
   */
  public async getTrailerUrl(tvId: number): Promise<string | null> {
    try {
      const response = await this.getVideos(tvId);
      
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        return null;
      }
      
      // Find trailer videos (prefer official trailers first)
      const videos = response.data.results;
      
      // Only look at YouTube videos since that's what we can embed easily
      const youtubeVideos = videos.filter(video => video.site.toLowerCase() === 'youtube');
      
      if (youtubeVideos.length === 0) {
        return null;
      }
      
      // Find official trailers first
      const trailers = youtubeVideos.filter(video => 
        video.type.toLowerCase() === 'trailer' || video.name.toLowerCase().includes('trailer')
      );
      
      // If we have trailers, return the first one, otherwise just return the first video
      const video = trailers.length > 0 ? trailers[0] : youtubeVideos[0];
      
      return `https://www.youtube.com/watch?v=${video.key}`;
    } catch (error) {
      console.error('Error getting trailer:', error);
      return null;
    }
  }

  /**
   * Discover top-rated anime TV shows
   * 
   * @param page Results page (default 1)
   * @returns Discover results filtered for likely anime content
   */
  public async discoverAnime(page: number = 1): Promise<APIResponse<SearchResult>> {
    const params = {
      api_key: this.apiKey,
      language: this.language,
      page: page.toString(),
      sort_by: 'popularity.desc',
      with_original_language: 'ja', // Japanese language content
      with_keywords: '210024|283' // Anime keyword IDs
    };

    const response = await this.request<SearchResult>({
      method: 'GET',
      endpoint: 'discover/tv',
      params
    });

    return response;
  }

  /**
   * Get TV shows currently airing
   * 
   * @param page Results page (default 1)
   * @returns Currently airing TV shows
   */
  public async getCurrentlyAiring(page: number = 1): Promise<APIResponse<SearchResult>> {
    const params = {
      api_key: this.apiKey,
      language: this.language,
      page: page.toString(),
      with_original_language: 'ja', // Filter for Japanese shows to increase anime likelihood
      air_date.gte: new Date().toISOString().split('T')[0], // Current date
      sort_by: 'popularity.desc'
    };

    return this.request<SearchResult>({
      method: 'GET',
      endpoint: 'discover/tv',
      params
    });
  }
}