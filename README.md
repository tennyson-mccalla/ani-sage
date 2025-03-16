# Ani-Sage

A psychological anime recommendation system that uses indirect psychological questions to build user profiles and match them with anime based on their psychological preferences.

## Features

- Psychological profiling without direct anime questions
- Multi-stage adaptive questioning system
- Anime recommendations based on psychological dimensions
- Integration with multiple anime data sources (AniList, MyAnimeList, TMDb)
- Trailer integration with YouTube
- High-quality posters from TMDb
- MCP (Model Context Protocol) integration for profile storage

## API Integrations

The application integrates with multiple APIs to provide comprehensive anime data:

### TMDb (The Movie Database)

Used primarily for high-quality poster images and metadata. TMDb often has better image assets than specialized anime databases.

### AniList

Used for comprehensive anime metadata, seasonal anime information, and user-specific features like watchlists (requires authentication).

### MyAnimeList

Used for anime metadata and user-specific features like ratings and watchlists (requires authentication).

### YouTube Data API

Used to fetch official trailers for anime recommendations.

### OpenAI API

Used for enhancing recommendations and analyzing user preferences.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your API keys (see `.env.example`).

3. Run the API integration demo:

```bash
npm run demo
```

## Project Structure

- `/api` - API integration modules
  - `/core` - Base API client with shared functionality
  - `/providers` - Provider-specific API clients
  - `anime-api-adapter.ts` - Unified adapter for all anime sources
  - `anime-attribute-mapper.ts` - Maps anime attributes to psychological dimensions
  - `mcp-anime-integration.ts` - Integrates with MCP for profile storage
- `psychological-dimensions.ts` - Core psychological dimensions used for profiling
- `question-bank.ts` - Bank of psychological questions for user profiling
- `profile-similarity.ts` - Similarity calculation between user profiles and anime

## Development

The project is built in TypeScript and follows a modular architecture. To add a new feature or API integration:

1. Create a new client in the `/api/providers` directory
2. Add conversion functions in the `anime-api-adapter.ts`
3. Update the `anime-attribute-mapper.ts` if new attributes are available
4. Update the environment configuration in `api/config.ts`