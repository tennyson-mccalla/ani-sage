/**
 * API Module Exports
 *
 * This file exports all the API functionality from the various modules
 * to make imports easier.
 */

// Core API functionality
export * from './core/client';

// Provider-specific clients - export each client class explicitly to avoid name conflicts
import { AniListClient } from './providers/anilist/client';
import { MALClient } from './providers/mal/client';
import { TMDbClient } from './providers/tmdb/client';
import { YouTubeClient } from './providers/youtube/client';

export { AniListClient, MALClient, TMDbClient, YouTubeClient };

// Unified API adapter - export specific names to avoid conflicts
import type { AnimeTitle } from './anime-api-adapter';
import { AnimeApiAdapter } from './anime-api-adapter';
import { ApiProvider } from './anime-api-adapter';
import type { ApiConfig } from './anime-api-adapter';

export { AnimeApiAdapter, ApiProvider };
export type { ApiConfig, AnimeTitle };

// Anime attribute mapping
export * from './anime-attribute-mapper';

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
  // Load environment variables if not already loaded
  dotenv.config();

  // Create configuration object from environment variables
  const config: ApiConfig = {
    tmdb: {
      apiKey: process.env.TMDB_API_KEY || ''
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY || ''
    }
  };

  // Add MAL configuration if available
  if (process.env.MAL_CLIENT_ID) {
    config.mal = {
      clientId: process.env.MAL_CLIENT_ID,
      clientSecret: process.env.MAL_CLIENT_SECRET,
      accessToken: process.env.MAL_ACCESS_TOKEN
    };
  }

  // Add AniList configuration if available
  if (process.env.ANILIST_ACCESS_TOKEN) {
    config.anilist = {
      accessToken: process.env.ANILIST_ACCESS_TOKEN
    };
  }

  // Return new instance of the adapter
  return new AnimeApiAdapter(config);
}
