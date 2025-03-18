import { BaseAPIClient, APIResponse } from '../../core/client.js';

// AniList Models
export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

export interface AnimeCoverImage {
  medium?: string;
  large?: string;
}

export interface AnimeStartDate {
  year?: number;
  month?: number;
  day?: number;
}

export interface AnimeStudio {
  name: string;
}

export interface AnimeStudioConnection {
  nodes: AnimeStudio[];
}

export interface AnimeDetails {
  id: number;
  title: AnimeTitle;
  coverImage?: AnimeCoverImage;
  description?: string;
  averageScore?: number;
  popularity?: number;
  genres?: string[];
  format?: string;
  episodes?: number;
  duration?: number;
  status?: string;
  startDate?: AnimeStartDate;
  studios?: AnimeStudioConnection;
  season?: string;
  seasonYear?: number;
}

export interface AnimeStatus {
  status: string; // CURRENT, COMPLETED, PAUSED, DROPPED, PLANNING
  score?: number;
  progress?: number;
  repeat?: number;
  updatedAt?: number;
}

export interface UserInfo {
  id: number;
  name: string;
  avatar?: { medium?: string; large?: string };
  bannerImage?: string;
  about?: string;
  createdAt?: number;
  statistics?: {
    anime?: {
      count?: number;
      meanScore?: number;
      minutesWatched?: number;
      episodesWatched?: number;
    }
  };
}

/**
 * AniList API client
 *
 * Provides access to the AniList GraphQL API for anime data
 */
export class AniListClient extends BaseAPIClient {
  private accessToken?: string;

  /**
   * Initialize the AniList client
   *
   * @param accessToken Optional OAuth access token
   * @param options Client configuration options
   */
  constructor(
    accessToken?: string,
    options?: {
      enableCache?: boolean;
      enableRateLimit?: boolean;
      maxRetries?: number;
    }
  ) {
    super('https://graphql.anilist.co', options);
    this.accessToken = accessToken;
  }

  /**
   * Get headers with authentication if available
   *
   * @returns Headers object with authentication if token is set
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Make a GraphQL request to the AniList API
   *
   * @param query GraphQL query string
   * @param variables Variables for the GraphQL query
   * @returns API response with data or error
   */
  private async graphqlRequest<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint: '',
      data: {
        query,
        variables: variables || {}
      },
      headers: this.getHeaders()
    });
  }

  /**
   * Search for anime by title
   *
   * @param query Search query string
   * @param limit Maximum number of results (default 10, max 50)
   * @returns API response with array of anime matching the search
   */
  public async searchAnime(
    query: string,
    limit: number = 10
  ): Promise<APIResponse<AnimeDetails[]>> {
    if (!query) {
      throw new Error('Search query cannot be empty');
    }

    const gqlQuery = `
      query ($search: String, $limit: Int) {
        Page(page: 1, perPage: $limit) {
          media(search: $search, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              medium
              large
            }
            description
            averageScore
            popularity
            genres
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      gqlQuery,
      { search: query, limit: Math.min(limit, 50) }
    );

    // Transform the data
    if (response.data && response.data.data) {
      const mediaList = response.data.data.Page.media;
      response.data = mediaList;
    }

    return response as APIResponse<AnimeDetails[]>;
  }

  /**
   * Get detailed information about a specific anime
   *
   * @param animeId AniList anime ID
   * @returns API response with detailed anime information
   */
  public async getAnimeDetails(animeId: number): Promise<APIResponse<AnimeDetails>> {
    if (!animeId) {
      throw new Error('Anime ID is required');
    }

    const gqlQuery = `
      query ($id: Int!) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            medium
            large
          }
          description
          averageScore
          popularity
          genres
          format
          episodes
          duration
          status
          startDate {
            year
            month
            day
          }
          studios {
            nodes {
              name
            }
          }
          season
          seasonYear
        }
      }
    `;

    const response = await this.graphqlRequest(
      gqlQuery,
      { id: animeId }
    );

    // Transform the data
    if (response.data && response.data.data) {
      response.data = response.data.data.Media;
    }

    return response as APIResponse<AnimeDetails>;
  }

  /**
   * Get a user's anime list
   *
   * @param username AniList username
   * @param status Optional filter by status
   * @param limit Maximum number of results
   * @returns API response with the user's anime list
   */
  public async getUserAnimeList(
    username: string,
    status?: string,
    limit: number = 100
  ): Promise<APIResponse<any>> {
    const gqlQuery = `
      query ($username: String, $status: MediaListStatus, $limit: Int) {
        MediaListCollection(userName: $username, type: ANIME, status: $status) {
          lists {
            entries {
              media {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  medium
                }
                genres
                averageScore
                popularity
              }
              status
              score
              progress
              repeat
              updatedAt
            }
          }
        }
      }
    `;

    return await this.graphqlRequest(
      gqlQuery,
      {
        username,
        status,
        limit: Math.min(limit, 500)
      }
    );
  }

  /**
   * Update anime status in user's list
   *
   * @param mediaId AniList media ID
   * @param status Status to set
   * @param score Optional score (0-10)
   * @param progress Optional episode progress
   * @returns API response with the updated status
   */
  public async updateAnimeStatus(
    mediaId: number,
    status: string,
    score?: number,
    progress?: number
  ): Promise<APIResponse<any>> {
    if (!this.accessToken) {
      throw new Error('Access token required');
    }

    const gqlQuery = `
      mutation ($mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int) {
        SaveMediaListEntry(mediaId: $mediaId, status: $status, score: $score, progress: $progress) {
          id
          status
          score
          progress
        }
      }
    `;

    return await this.graphqlRequest(
      gqlQuery,
      {
        mediaId,
        status,
        score,
        progress
      }
    );
  }

  /**
   * Set or update the access token
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
   * @param username AniList username
   * @returns API response with user information
   */
  public async getUserInfo(username: string): Promise<APIResponse<UserInfo>> {
    const query = `
      query ($name: String) {
        User(name: $name) {
          id
          name
          avatar {
            large
            medium
          }
          bannerImage
          about
          createdAt
          statistics {
            anime {
              count
              meanScore
              minutesWatched
              episodesWatched
            }
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      query,
      { name: username }
    );

    // Transform the data
    if (response.data && response.data.data) {
      response.data = response.data.data.User;
    }

    return response as APIResponse<UserInfo>;
  }

  /**
   * Get anime from a specific season
   *
   * @param year The year of the season
   * @param season The season (WINTER, SPRING, SUMMER, FALL)
   * @param sortBy Sort order for results (default: POPULARITY_DESC)
   * @param limit Maximum number of results (default: 50)
   * @returns API response with seasonal anime
   */
  public async getSeasonAnime(
    year: number,
    season: string,
    sortBy: string = "POPULARITY_DESC",
    limit: number = 50
  ): Promise<APIResponse<AnimeDetails[]>> {
    // Validate and format season
    season = season.toUpperCase();
    if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(season)) {
      throw new Error("Season must be one of: winter, spring, summer, fall");
    }

    const query = `
      query ($season: MediaSeason, $year: Int, $sort: [MediaSort], $limit: Int) {
        Page(page: 1, perPage: $limit) {
          media(season: $season, seasonYear: $year, type: ANIME, sort: $sort) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            description
            format
            episodes
            status
            genres
            studios {
              nodes {
                name
              }
            }
            startDate {
              year
              month
              day
            }
            popularity
            averageScore
            seasonYear
            season
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      query,
      {
        season,
        year,
        sort: [sortBy],
        limit: Math.min(limit, 100)  // Cap at 100 for API limits
      }
    );

    // Transform the response
    if (response.data?.data?.Page?.media) {
      response.data = response.data.data.Page.media;
    } else {
      response.data = [];
    }

    return response as APIResponse<AnimeDetails[]>;
  }

  /**
   * Get currently airing anime
   *
   * @param limit Maximum number of results (default: 50)
   * @returns API response with currently airing anime
   */
  public async getCurrentlyAiring(limit: number = 50): Promise<APIResponse<AnimeDetails[]>> {
    const query = `
      query ($status: MediaStatus, $sort: [MediaSort], $limit: Int) {
        Page(page: 1, perPage: $limit) {
          media(status: $status, type: ANIME, sort: $sort) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            description
            format
            episodes
            status
            genres
            studios {
              nodes {
                name
              }
            }
            startDate {
              year
              month
              day
            }
            popularity
            averageScore
            seasonYear
            season
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      query,
      {
        status: "RELEASING",
        sort: ["POPULARITY_DESC"],
        limit: Math.min(limit, 100)  // Cap at 100 for API limits
      }
    );

    // Transform the response
    if (response.data?.data?.Page?.media) {
      response.data = response.data.data.Page.media;
    } else {
      response.data = [];
    }

    return response as APIResponse<AnimeDetails[]>;
  }

  /**
   * Get popular anime
   *
   * @param limit Maximum number of results (default: 50)
   * @param page Page number for pagination (default: 1)
   * @returns API response with popular anime
   */
  public async getPopularAnime(limit: number = 50, page: number = 1): Promise<APIResponse<AnimeDetails[]>> {
    const query = `
      query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: $sort) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            description
            format
            episodes
            status
            genres
            studios {
              nodes {
                name
              }
            }
            startDate {
              year
              month
              day
            }
            popularity
            averageScore
            seasonYear
            season
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      query,
      {
        page,
        perPage: Math.min(limit, 50),
        sort: ["POPULARITY_DESC"]
      }
    );

    // Transform the response
    if (response.data?.data?.Page?.media) {
      response.data = response.data.data.Page.media;
    } else {
      response.data = [];
    }

    return response as APIResponse<AnimeDetails[]>;
  }

  /**
   * Get top-rated anime
   *
   * @param limit Maximum number of results (default: 50)
   * @param page Page number for pagination (default: 1)
   * @returns API response with top-rated anime
   */
  public async getTopAnime(limit: number = 50, page: number = 1): Promise<APIResponse<AnimeDetails[]>> {
    const query = `
      query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: $sort) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            description
            format
            episodes
            status
            genres
            studios {
              nodes {
                name
              }
            }
            startDate {
              year
              month
              day
            }
            popularity
            averageScore
            seasonYear
            season
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      query,
      {
        page,
        perPage: Math.min(limit, 50),
        sort: ["SCORE_DESC"]
      }
    );

    // Transform the response
    if (response.data?.data?.Page?.media) {
      response.data = response.data.data.Page.media;
    } else {
      response.data = [];
    }

    return response as APIResponse<AnimeDetails[]>;
  }

  /**
   * Get anime recommendations based on a specific anime
   *
   * @param animeId ID of the anime to get recommendations for
   * @returns API response with recommended anime
   */
  public async getAnimeRecommendations(animeId: number): Promise<APIResponse<AnimeDetails[]>> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          recommendations(sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  large
                  medium
                }
                description
                format
                episodes
                status
                genres
                studios {
                  nodes {
                    name
                  }
                }
                startDate {
                  year
                  month
                  day
                }
                popularity
                averageScore
                seasonYear
                season
              }
            }
          }
        }
      }
    `;

    const response = await this.graphqlRequest(
      query,
      { id: animeId }
    );

    // Transform the response
    if (response.data?.data?.Media?.recommendations?.nodes) {
      response.data = response.data.data.Media.recommendations.nodes.map(
        (node: any) => node.mediaRecommendation
      );
    } else {
      response.data = [];
    }

    return response as APIResponse<AnimeDetails[]>;
  }
}
