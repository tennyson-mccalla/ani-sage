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
    super('https://api.themoviedb.org/3', {
      ...options,
      providerName: 'tmdb' // Explicitly set provider name for rate limiting
    });
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
   * @param isMovie Whether the anime is a movie or TV show
   * @returns TV search results filtered for likely anime content
   */
  public async searchAnime(
    query: string, 
    page: number = 1, 
    isMovie: boolean = false
  ): Promise<APIResponse<SearchResult>> {
    // Create multiple search variants to increase chances of finding the right match
    const searchQueries = [
      // Original title alone (lowest weight but sometimes needed)
      query,
      // Add "anime" qualifier (common strategy)
      `${query} anime`,
      // Add Japanese qualifier (helps for Japanese-only titles)
      `${query} japanese`,
      // Combined qualifiers for highest specificity
      `${query} japanese ${isMovie ? 'movie' : 'series'}`
    ];
    
    // For movies, include specific movie search
    if (isMovie) {
      // If it's a movie, try specifically searching for it as a movie
      try {
        const movieResponse = await this.request<SearchResult>({
          method: 'GET',
          endpoint: 'search/movie',
          params: {
            api_key: this.apiKey,
            query: `${query} anime`,
            language: this.language,
            page: page.toString(),
            include_adult: this.includeAdult.toString()
          }
        });
        
        if (movieResponse.data?.results && movieResponse.data.results.length > 0) {
          // If we found movie results, try to map them to the TV search result format
          const adaptedResults = movieResponse.data.results.map(movie => ({
            id: movie.id,
            name: movie.title,
            original_name: movie.original_title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            first_air_date: movie.release_date,
            genre_ids: movie.genre_ids,
            origin_country: ['JP'], // Assume JP for anime movies
            original_language: movie.original_language,
            popularity: movie.popularity,
            vote_average: movie.vote_average,
            vote_count: movie.vote_count
          }));
          
          return {
            ...movieResponse,
            data: {
              ...movieResponse.data,
              results: adaptedResults
            }
          };
        }
      } catch (error) {
        console.warn(`Movie search failed for "${query}":`, error);
        // Continue with TV search as fallback
      }
    }
    
    // Try each query variant until we find something promising
    let bestResponse: APIResponse<SearchResult> | null = null;
    let bestResults: TVSearchResult[] = [];
    
    for (const searchQuery of searchQueries) {
      // Do a general search with this query variant
      const response = await this.searchTV(searchQuery, page);

      if (!response.data?.results || response.data.results.length === 0) {
        continue; // Try next query if no results
      }

      // Filter results to likely anime
      const animeResults = response.data.results.filter(show => {
        // Check if show is from Japan
        if (show.origin_country && show.origin_country.includes('JP')) {
          return true;
        }

        // Check for anime-related terms in title or overview
        const overview = show.overview?.toLowerCase() || '';
        const name = show.name?.toLowerCase() || '';
        const originalName = show.original_name?.toLowerCase() || '';
        
        // If the original name exactly matches our query, high chance it's right
        if (originalName === query.toLowerCase() || name === query.toLowerCase()) {
          return true;
        }

        const animeTerms = ['anime', 'manga', 'japanese animation'];
        return animeTerms.some(term =>
          overview.includes(term) || name.includes(term) || originalName.includes(term)
        );
      });

      // Sort results to prioritize Japanese content and exact title matches
      animeResults.sort((a, b) => {
        // Priority 1: Japanese origin country
        const aIsJapanese = a.origin_country?.includes('JP') || false;
        const bIsJapanese = b.origin_country?.includes('JP') || false;
        
        if (aIsJapanese && !bIsJapanese) return -1;
        if (!aIsJapanese && bIsJapanese) return 1;
        
        // Priority 2: Title match closeness
        const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
        const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Priority 3: Popularity (TMDB's default sort)
        return b.popularity - a.popularity;
      });
      
      // If we found results, keep track of the best ones
      if (animeResults.length > 0) {
        // If this query provided more results than previous ones, use it
        if (animeResults.length > bestResults.length) {
          bestResults = animeResults;
          bestResponse = response;
        }
        
        // If we got a perfect JP match with exactly matching title, stop searching
        const perfectMatch = animeResults.find(show => 
          show.origin_country?.includes('JP') && 
          (show.name.toLowerCase() === query.toLowerCase() || 
           show.original_name?.toLowerCase() === query.toLowerCase())
        );
        
        if (perfectMatch) {
          bestResults = [perfectMatch, ...animeResults.filter(r => r.id !== perfectMatch.id)];
          bestResponse = response;
          break; // Stop searching, we found an ideal match
        }
      }
    }

    // Return the best results we found, or empty if none
    if (bestResponse) {
      return {
        ...bestResponse,
        data: {
          ...bestResponse.data!,
          results: bestResults
        }
      };
    }

    // If all searches failed, return the original empty response
    return await this.searchTV(query, page);
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
      'air_date.gte': new Date().toISOString().split('T')[0], // Current date
      sort_by: 'popularity.desc'
    };

    return this.request<SearchResult>({
      method: 'GET',
      endpoint: 'discover/tv',
      params
    });
  }
}
