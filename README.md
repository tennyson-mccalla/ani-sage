# Ani-Sage

A psychological anime recommendation system that uses indirect psychological questions to build user profiles and match them with anime based on their psychological preferences.

## Features

- Psychological profiling without direct anime questions
- Multi-stage adaptive questioning system
- Bayesian profile updating with confidence scores
- Multi-stage recommendation filtering with clustering
- Integration with multiple anime data sources (AniList, MyAnimeList, TMDb)
- Trailer integration with YouTube
- High-quality posters from TMDb
- Modern React UI with Tailwind CSS
- MCP (Model Context Protocol) integration for profile storage

## System Architecture

Ani-Sage uses a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────┐
│           User Interface        │
│  React + TypeScript + Tailwind  │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│      Recommendation Engine      │
│    Clustering + Filtering       │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│       User Psychology Layer     │
│   Profile + Question Mapping    │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│      Data Integration Layer     │
│    Unified API Adapter Pattern  │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│    Multiple Anime API Sources   │
│  AniList, MAL, TMDb, YouTube    │
└─────────────────────────────────┘
```

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

## Setup

### Backend Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your API keys (see `.env.example`).

3. Run the API server:

```bash
npm start
```

### Frontend Setup

1. Navigate to the UI directory:

```bash
cd ui/ui
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Run the development server:

```bash
npm run dev
```

### Demo and Test Scripts

- `npm run demo` - Run the API integration demo
- `npm run api-demo` - Run dedicated API demo
- `npm run recommendation-demo` - Test the recommendation engine
- `npm test` - Run Jest tests

## Project Structure

- `/api` - API integration modules
  - `/core` - Base API client with shared functionality
  - `/providers` - Provider-specific API clients
  - `anime-api-adapter.ts` - Unified adapter for all anime sources
  - `anime-attribute-mapper.ts` - Maps anime attributes to psychological dimensions
  - `mcp-anime-integration.ts` - Integrates with MCP for profile storage
- `/ui` - User interface
  - `/src` - Main UI code
  - `/components` - React components
  - `/context` - React context providers
  - `/services` - API service layer
  - `/pages` - Main application pages
- `psychological-dimensions.ts` - Core psychological dimensions used for profiling
- `question-bank.ts` - Bank of psychological questions for user profiling
- `profile-similarity.ts` - Similarity calculation between user profiles and anime
- `profile-update.ts` - Bayesian profile updating algorithm
- `recommendation-engine.ts` - Core recommendation algorithms
- `recommendation-service.ts` - Service connecting UI to recommendation engine
- `recommendation-filters.ts` - Additional filters for diversity and relevance

## Development

The project is built in TypeScript and follows a modular architecture. To add a new feature or API integration:

1. Create a new client in the `/api/providers` directory
2. Add conversion functions in the `anime-api-adapter.ts`
3. Update the `anime-attribute-mapper.ts` if new attributes are available
4. Update the environment configuration in `api/config.ts`

### UI Development

The UI is built with React, TypeScript, and Tailwind CSS. It uses:

1. React Context API for state management
2. React Router for navigation
3. Framer Motion for animations
4. Shadcn/UI component library
5. Axios for API communication

## Configuration

### API Configuration

The API configuration file is located at:
```
ui/ui/src/config/api.ts
```

This file contains settings for:
- API base URL
- Timeouts
- Mock API mode toggle
- Storage keys

### UI Environment Variables

Create a `.env` file in the ui/ui directory with:
- `VITE_API_BASE_URL`: URL to your API server
- `VITE_ENABLE_MOCK_API`: Toggle mock API mode (for development)
- `VITE_ENABLE_ANALYTICS`: Toggle analytics (if implemented)

## Tech Stack

- **Language**: TypeScript
- **Frontend**: React, Tailwind CSS, Framer Motion
- **State Management**: React Context API
- **Testing**: Jest
- **External APIs**: AniList, MyAnimeList, TMDb, YouTube