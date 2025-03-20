/**
 * API Module Exports
 *
 * This file exports all the API functionality from the various modules
 * to make imports easier.
 */

// Core API functionality
export * from '../app/lib/core/client';

// Provider-specific clients - export each client class explicitly to avoid name conflicts
import { AniListClient } from '../app/lib/providers/anilist/client';
import { MALClient } from '../app/lib/providers/mal/client';
import { TMDbClient } from '../app/lib/providers/tmdb/client';
import { YouTubeClient } from '../app/lib/providers/youtube/client';

export { AniListClient, MALClient, TMDbClient, YouTubeClient };

// Unified API adapter - export specific names to avoid conflicts
import type { AnimeTitle } from '../app/lib/anime-api-adapter';
import { AnimeApiAdapter, AniListAdapter } from '../app/lib/anime-api-adapter';
import { ApiProvider } from '../app/lib/anime-api-adapter';
import type { ApiConfig } from '../app/lib/anime-api-adapter';

export { AnimeApiAdapter, ApiProvider };
export type { ApiConfig, AnimeTitle };

// Anime attribute mapping
export * from '../app/lib/anime-attribute-mapper';

// MCP integration
export * from './mcp-anime-integration';

// Demo
export { runApiDemo } from './demo';

// Helper function to create API adapter
import * as dotenv from 'dotenv';

/**
 * Create an API adapter with configuration from environment variables
 *
 * @returns Configured API adapter instance
 */
export function createApiAdapter(): AnimeApiAdapter {
  // First look for configured adapter
  try {
    return new AnimeApiAdapter({
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
    }, ApiProvider.ANILIST);
  } catch (error) {
    // Fall back to AniList adapter (doesn't need API key)
    console.warn('Using AniList adapter fallback:', error);
    return new AniListAdapter();
  }
}