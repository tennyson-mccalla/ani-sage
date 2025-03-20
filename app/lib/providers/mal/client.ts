import { BaseAPIClient, APIResponse } from '../../core/client';
import axios from 'axios';

// MAL Models
export interface AlternativeTitles {
  synonyms?: string[];
  en?: string;
  ja?: string;
}

export interface MainPicture {
  medium?: string;
  large?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface UserPicture {
  medium?: string;
  large?: string;
}

export interface UserStatistics {
  anime?: Record<string, any>;
  manga?: Record<string, any>;
}

export interface UserInfo {
  id: number;
  name: string;
  picture?: UserPicture;
  gender?: string;
  birthday?: string;
  location?: string;
  joined_at?: string;
  statistics?: UserStatistics;
}

export interface AnimeDetails {
  id: number;
  title: string;
  main_picture: {
    medium: string;
    large: string;
  };
  alternative_titles: {
    synonyms: string[];
    en: string;
    ja: string;
  };
  synopsis: string;
  mean: number;
  popularity: number;
  num_episodes: number;
  media_type: string;
  status: string;
  start_season: {
    year: number;
    season: string;
  };
  studios: Array<{ id: number; name: string }>;
  source: string;
  genres: Array<{ id: number; name: string }>;
}

export interface AnimeStatus {
  status: string; // watching, completed, on_hold, dropped, plan_to_watch
  score?: number;
  num_episodes_watched?: number;
  is_rewatching?: boolean;
  updated_at?: string;
}

/**
 * MyAnimeList API client
 *
 * Provides access to the MyAnimeList API v2 for anime data
 */
export class MALClient extends BaseAPIClient {
  private readonly apiBaseUrl = 'https://api.myanimelist.net/v2';
  private readonly clientId: string;
  private clientSecret?: string;
  private accessToken?: string;

  /**
   * Initialize the MAL client
   *
   * @param clientId MAL API client ID
   * @param clientSecret Optional client secret
   * @param accessToken Optional OAuth access token
   * @param options Client configuration options
   */
  constructor(
    clientId: string,
    clientSecret?: string,
    accessToken?: string,
    options?: {
      enableCache?: boolean;
      enableRateLimit?: boolean;
      maxRetries?: number;
    }
  ) {
    super('https://api.myanimelist.net/v2', options);
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
  }

  private get headers() {
    const headers: Record<string, string> = {
      'X-MAL-CLIENT-ID': this.clientId
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Search for anime by title
   *
   * @param query Search query string
   * @param limit Maximum number of results (default 10, max 100)
   * @param fields Optional fields to include in the response
   * @returns API response with array of anime matching the search
   */
  public async searchAnime(
    query: string,
    limit: number = 10,
    fields?: string[]
  ): Promise<APIResponse<AnimeDetails[]>> {
    if (!query) {
      throw new Error('Search query cannot be empty');
    }

    const fieldList = fields || [
      'id', 'title', 'main_picture', 'alternative_titles',
      'synopsis', 'mean', 'popularity', 'num_episodes',
      'media_type', 'status', 'genres'
    ];

    const params: Record<string, string> = {
      q: query,
      limit: String(Math.min(limit, 100)),
      fields: fieldList.join(',')
    };

    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/anime?${new URLSearchParams(params)}`,
        { headers: this.headers }
      );

      return {
        statusCode: response.status,
        data: response.data.data.map((item: any) => item.node) as AnimeDetails[],
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      console.error('Error searching anime on MAL:', error);
      return { 
        statusCode: 500, 
        data: [], 
        headers: {} 
      };
    }
  }

  /**
   * Get detailed information about a specific anime
   *
   * @param animeId MAL anime ID
   * @returns API response with detailed anime information
   */
  public async getAnimeDetails(animeId: number): Promise<APIResponse<AnimeDetails>> {
    if (!animeId) {
      throw new Error('Anime ID is required');
    }

    const params: Record<string, string> = {
      fields: [
        'id', 'title', 'main_picture', 'alternative_titles',
        'synopsis', 'mean', 'popularity', 'num_episodes',
        'media_type', 'status', 'start_season', 'studios',
        'source', 'genres'
      ].join(',')
    };

    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/anime/${animeId}?${new URLSearchParams(params)}`,
        { headers: this.headers }
      );

      return {
        statusCode: response.status,
        data: response.data as AnimeDetails,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      console.error('Error fetching anime details from MAL:', error);
      return { 
        statusCode: 500, 
        data: undefined, 
        headers: {} 
      };
    }
  }

  /**
   * Set or update the OAuth access token
   *
   * @param accessToken OAuth access token
   */
  public setAuthToken(accessToken: string): void {
    if (!accessToken) {
      throw new Error('Access token cannot be empty');
    }
    this.accessToken = accessToken;
  }

  /**
   * Get user information
   *
   * @param username MAL username (use '@me' for authenticated user)
   * @returns API response with user information
   */
  public async getUserInfo(username: string = '@me'): Promise<APIResponse<UserInfo>> {
    if (!this.accessToken && username === '@me') {
      throw new Error('Access token required for personal info');
    }

    const params = {
      fields: 'id,name,picture,gender,birthday,location,joined_at,statistics'
    };

    return this.request<UserInfo>({
      method: 'GET',
      endpoint: `users/${username}`,
      params,
      headers: this.headers
    });
  }

  /**
   * Get a user's anime list
   *
   * @param username MAL username (use '@me' for authenticated user)
   * @param status Optional filter by status
   * @param sort Field to sort by (default 'list_score')
   * @param limit Maximum number of results (default 100, max 1000)
   * @param offset Pagination offset
   * @returns API response with the user's anime list
   */
  public async getUserAnimeList(
    username: string = '@me',
    status?: string,
    sort: string = 'list_score',
    limit: number = 100,
    offset: number = 0
  ): Promise<APIResponse<any>> {
    if (!this.accessToken && username === '@me') {
      throw new Error('Access token required for personal list');
    }

    const params: Record<string, any> = {
      fields: 'list_status,num_episodes,genres,mean,rank,popularity',
      limit: Math.min(limit, 1000),
      offset,
      sort
    };

    if (status) {
      params.status = status;
    }

    return this.request({
      method: 'GET',
      endpoint: `users/${username}/animelist`,
      params,
      headers: this.headers
    });
  }

  /**
   * Update anime status in user's list
   *
   * @param animeId MAL anime ID
   * @param status Status to set
   * @param score Optional score (0-10)
   * @param numWatchedEpisodes Optional number of episodes watched
   * @returns API response with the updated status
   */
  public async updateAnimeStatus(
    animeId: number,
    status: string,
    score?: number,
    numWatchedEpisodes?: number
  ): Promise<APIResponse<AnimeStatus>> {
    if (!this.accessToken) {
      throw new Error('Access token required');
    }

    const data: Record<string, any> = {
      status,
    };

    if (score !== undefined) data.score = score;
    if (numWatchedEpisodes !== undefined) data.num_watched_episodes = numWatchedEpisodes;

    return this.request<AnimeStatus>({
      method: 'PATCH',
      endpoint: `anime/${animeId}/my_list_status`,
      data,
      headers: this.headers
    });
  }

  /**
   * Get seasonal anime list
   *
   * @param year Year of the season
   * @param season Season (winter, spring, summer, fall)
   * @param sort Sort order (default 'anime_score')
   * @param limit Maximum number of results (default 100, max 500)
   * @param offset Pagination offset
   * @returns API response with seasonal anime
   */
  public async getSeasonalAnime(
    year: number,
    season: string,
    sort: string = 'anime_score',
    limit: number = 100,
    offset: number = 0
  ): Promise<APIResponse<AnimeDetails[]>> {
    const params: Record<string, string> = {
      sort,
      limit: String(Math.min(limit, 500)),
      offset: String(offset),
      fields: 'id,title,main_picture,synopsis,mean,popularity,num_episodes,media_type,status,genres'
    };

    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/anime/season/${year}/${season.toLowerCase()}?${new URLSearchParams(params)}`,
        { headers: this.headers }
      );

      return {
        statusCode: response.status,
        data: response.data.data.map((item: any) => item.node) as AnimeDetails[],
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      console.error('Error getting seasonal anime from MAL:', error);
      return { 
        statusCode: 500, 
        data: [], 
        headers: {} 
      };
    }
  }

  /**
   * Get anime suggestions based on user's list
   *
   * @param limit Maximum number of results (default 100, max 100)
   * @param offset Pagination offset
   * @param fields Optional fields to include in the response
   * @returns API response with suggested anime
   */
  public async getSuggestedAnime(
    limit: number = 100,
    offset: number = 0,
    fields?: string[]
  ): Promise<APIResponse<any>> {
    if (!this.accessToken) {
      throw new Error('Access token required');
    }

    const fieldList = fields || [
      'id', 'title', 'main_picture', 'synopsis',
      'mean', 'popularity', 'num_episodes', 'media_type',
      'status', 'genres'
    ];

    const params: Record<string, string> = {
      limit: String(Math.min(limit, 100)),
      offset: String(offset),
      fields: fieldList.join(',')
    };

    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/anime/suggestions?${new URLSearchParams(params)}`,
        { headers: this.headers }
      );

      return {
        statusCode: response.status,
        data: response.data.data.map((item: any) => item.node) as AnimeDetails[],
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      console.error('Error getting anime suggestions from MAL:', error);
      return { 
        statusCode: 500, 
        data: [], 
        headers: {} 
      };
    }
  }
}
