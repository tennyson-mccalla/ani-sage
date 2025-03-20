/**
 * API Configuration
 *
 * This module handles loading API keys and other configuration
 * from environment variables. In a production environment, these
 * would be set in the server environment or via a secure
 * configuration management system.
 *
 * For local development, they can be set in a .env file.
 */

import { AnimeApiAdapter, ApiProvider } from '../app/lib/anime-api-adapter';
import { MCPAnimeIntegration } from './mcp-anime-integration';

/**
 * API configuration interface
 */
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
  openai?: {
    apiKey: string;
    model?: string;
  };
}

/**
 * Load API configuration from environment variables
 *
 * @returns API configuration object
 */
export function loadApiConfig(): ApiConfig {
  const config: ApiConfig = {};

  // AniList config - no client ID needed for public API
  // Only add if access token is provided for authenticated requests
  if (process.env.ANILIST_ACCESS_TOKEN) {
    config.anilist = {
      accessToken: process.env.ANILIST_ACCESS_TOKEN
    };
  } else {
    config.anilist = {}; // Still enable AniList without auth
  }

  // MyAnimeList config - client ID is required
  if (process.env.MAL_CLIENT_ID) {
    config.mal = {
      clientId: process.env.MAL_CLIENT_ID,
      clientSecret: process.env.MAL_CLIENT_SECRET,
      accessToken: process.env.MAL_ACCESS_TOKEN
    };
  }

  // TMDb config - API key (read access token) is required
  if (process.env.TMDB_API_KEY) {
    config.tmdb = {
      apiKey: process.env.TMDB_API_KEY
    };
  }

  // YouTube config - API key is required
  if (process.env.YOUTUBE_API_KEY) {
    config.youtube = {
      apiKey: process.env.YOUTUBE_API_KEY
    };
  }

  // OpenAI config - API key is required
  if (process.env.OPENAI_API_KEY) {
    config.openai = {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o'
    };
  }

  return config;
}

/**
 * Create an API adapter from environment configuration
 *
 * @returns Configured AnimeApiAdapter instance
 */
export function createApiAdapter(): AnimeApiAdapter {
  const config = loadApiConfig();

  // Determine default provider based on availability
  let defaultProvider = ApiProvider.ANILIST; // Default to AniList (doesn't need auth for read)
  if (!config.anilist && config.mal) {
    defaultProvider = ApiProvider.MAL;
  }

  return new AnimeApiAdapter(config, defaultProvider);
}

/**
 * Create an MCP integration from environment configuration
 *
 * @returns Configured MCPAnimeIntegration instance
 */
export function createMCPIntegration(): MCPAnimeIntegration {
  const apiAdapter = createApiAdapter();
  return new MCPAnimeIntegration(apiAdapter);
}
