/**
 * API Module Exports
 * 
 * This file exports all the API functionality from the various modules
 * to make imports easier.
 */

// Core API functionality
export * from './core/client';

// Provider-specific clients
export * from './providers/anilist/client';
export * from './providers/mal/client';
export * from './providers/tmdb/client';
export * from './providers/youtube/client';

// Unified API adapter
export * from './anime-api-adapter';

// Anime attribute mapping
export * from './anime-attribute-mapper';

// MCP integration
export * from './mcp-anime-integration';

// Demo
export { runApiDemo } from './demo';