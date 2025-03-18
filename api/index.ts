/**
 * API Module Exports
 *
 * This file exports all the API functionality from the various modules
 * to make imports easier.
 */

// Core API functionality
export * from './core/client.js';

// Provider-specific clients - export each client class explicitly to avoid name conflicts
import { AniListClient } from './providers/anilist/client.js';
import { MALClient } from './providers/mal/client.js';
import { TMDbClient } from './providers/tmdb/client.js';
import { YouTubeClient } from './providers/youtube/client.js';

export { AniListClient, MALClient, TMDbClient, YouTubeClient };

// Unified API adapter - export specific names to avoid conflicts
import type { AnimeTitle } from './anime-api-adapter.js';
import { AnimeApiAdapter, AniListAdapter } from './anime-api-adapter.js';
import { ApiProvider } from './anime-api-adapter.js';
import type { ApiConfig } from './anime-api-adapter.js';

export { AnimeApiAdapter, ApiProvider };
export type { ApiConfig, AnimeTitle };

// Anime attribute mapping
export * from './anime-attribute-mapper.js';

// MCP integration
export * from './mcp-anime-integration.js';

// Demo
export { runApiDemo } from './demo.js';

// Helper function to create API adapter
import * as dotenv from 'dotenv';

/**
 * Create an API adapter with configuration from environment variables
 *
 * @returns Configured API adapter instance
 */
export function createApiAdapter(): AnimeApiAdapter {
  // For now, we'll just use AniList
  return new AniListAdapter();
}
