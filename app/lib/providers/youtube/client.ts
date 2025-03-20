/**
 * YouTube API client implementation.
 *
 * This module provides a client for the YouTube Data API v3, primarily used to
 * search for anime trailers and retrieve video information. It requires a valid
 * YouTube API key with quota available.
 */

import { BaseAPIClient, APIResponse } from '../../core/client';
import axios from 'axios';

// YouTube Models
export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface VideoSnippet {
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnails: Record<string, VideoThumbnail>;
}

export interface VideoId {
  kind: string;
  videoId: string;
}

export interface Video {
  id: VideoId | string;
  snippet: VideoSnippet;
  statistics?: Record<string, any>;
}

export interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

/**
 * YouTube Data API client implementation
 */
export class YouTubeClient extends BaseAPIClient {
  private readonly apiKey: string;
  private readonly apiBaseUrl = 'https://www.googleapis.com/youtube/v3';

  /**
   * Initialize YouTube client with API key
   *
   * @param apiKey YouTube Data API key
   * @param options Client configuration options
   */
  constructor(
    apiKey: string,
    options?: {
      enableCache?: boolean;
      enableRateLimit?: boolean;
      maxRetries?: number;
    }
  ) {
    super('https://www.googleapis.com/youtube/v3', {
      ...options,
      providerName: 'youtube' // Explicitly set provider name for rate limiting
    });
    this.apiKey = apiKey;
  }

  /**
   * Handle YouTube API response and check for quota errors
   *
   * @param response API response to check
   * @throws Error if quota is exceeded
   */
  private handleResponse<T>(response: APIResponse<T>): APIResponse<T> {
    if (response.statusCode === 403) {
      // Check for quota exceeded message
      const errorData = response.data as any;
      if (errorData?.error?.errors?.some((e: any) => e.reason === 'quotaExceeded')) {
        // Create an error with rate limit information
        const error = new Error('YouTube API daily quota exceeded. The quota will reset at midnight Pacific Time.') as Error & {
          statusCode: number;
          retryAfter?: number;
        };
        error.statusCode = 429; // Use 429 to trigger rate limit handling

        // Set retry-after to a long time (4 hours) to prevent further quota usage
        // This isn't perfect since quota resets at midnight PT, but it's a reasonable fallback
        error.retryAfter = 4 * 60 * 60; // 4 hours in seconds

        throw error;
      }
    }
    return response;
  }

  /**
   * Search for videos on YouTube
   *
   * @param query Search query string
   * @param maxResults Maximum number of results (default 10, max 50)
   * @param type Type of results (default 'video')
   * @param part Parts to include in response (default 'snippet')
   * @returns API response with search results
   */
  public async searchVideos(
    query: string,
    maxResults: number = 10,
    type: string = 'video',
    part: string = 'snippet'
  ): Promise<APIResponse<Video[]>> {
    if (!query) {
      throw new Error('Search query cannot be empty');
    }

    const params = {
      q: query,
      maxResults: Math.min(maxResults, 50), // YouTube maximum
      type,
      part,
      key: this.apiKey
    };

    const response = await this.request<{items: any[]}>({
      method: 'GET',
      endpoint: 'search',
      params
    });

    const processedResponse = this.handleResponse(response);

    // Transform the response to extract videos
    let videos: Video[] = [];
    if (processedResponse.data && processedResponse.data.items) {
      videos = processedResponse.data.items.map(item => ({
        id: item.id,
        snippet: item.snippet
      }));
    }

    // Return a new response object with the correct type
    return {
      ...processedResponse,
      data: videos
    };
  }

  /**
   * Search for anime trailers on YouTube
   *
   * @param animeName Anime name to search for
   * @returns URL of the found anime trailer or null if not found
   */
  async searchAnimeTrailer(animeName: string): Promise<string | null> {
    try {
      // Create multiple search queries with different variations for better results
      const searchQueries = [
        `${animeName} official anime trailer`,
        `${animeName} anime trailer official`,
        `${animeName} PV`, // Japanese term for promotional video
        `${animeName} trailer`
      ];
      
      // Try each query until we find a good result
      for (const searchQuery of searchQueries) {
        const response = await axios.get(`${this.apiBaseUrl}/search`, {
          params: {
            part: 'snippet',
            q: searchQuery,
            type: 'video',
            maxResults: 3, // Get a few results to filter
            key: this.apiKey,
            relevanceLanguage: 'en' // Prefer English results
          }
        });
  
        if (response.data.items && response.data.items.length > 0) {
          // Look for official trailers first
          const officialTrailer = response.data.items.find((item: any) => 
            (item.snippet.title.toLowerCase().includes('official') && 
             item.snippet.title.toLowerCase().includes('trailer')) ||
            (item.snippet.channelTitle.toLowerCase().includes('official') ||
             item.snippet.channelTitle.toLowerCase().includes('aniplex') ||
             item.snippet.channelTitle.toLowerCase().includes('funimation') ||
             item.snippet.channelTitle.toLowerCase().includes('crunchyroll'))
          );
          
          // Use official trailer if found, otherwise use the first result
          const videoItem = officialTrailer || response.data.items[0];
          const videoId = videoItem.id.videoId;
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
  
      return null;
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return null;
    }
  }

  /**
   * Get detailed information about a specific video
   *
   * @param videoId YouTube video ID
   * @returns Detailed video information or null if not found
   */
  async getVideoDetails(videoId: string): Promise<YouTubeSearchResult | null> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/videos`, {
        params: {
          part: 'snippet',
          id: videoId,
          key: this.apiKey
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting video details:', error);
      return null;
    }
  }
}
