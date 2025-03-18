// Core Data Models for Psychological Anime Recommendation System

// ================ USER PROFILE MODELS ================

/**
 * Psychological dimension definition
 */
export interface PsychologicalDimension {
  min: number;           // Minimum value on this dimension
  max: number;           // Maximum value on this dimension
  description: string;   // Description of what this dimension represents
  importance: number;    // How predictive this dimension is (0-1)
}

/**
 * Complete set of psychological dimensions used in the system
 */
export interface DimensionSet {
  [key: string]: PsychologicalDimension;
}

/**
 * User's psychological profile
 */
interface UserProfile {
  userId: string;                        // Unique identifier
  dimensions: {                          // Values for each psychological dimension
    [dimension: string]: number;
  };
  confidences: {                         // Confidence in each dimension value (0-1)
    [dimension: string]: number;
  };
  answeredQuestions: string[];           // IDs of questions already answered
  lastUpdated: string;                   // ISO timestamp
  interactionCount: number;              // Number of interactions/questions answered
}

// ================ QUESTION MODELS ================

/**
 * Option mapping to psychological dimensions
 */
interface OptionMapping {
  dimension: string;     // Dimension being mapped
  value: number;         // Value on that dimension
  confidence: number;    // Confidence of this mapping (0-1)
}

/**
 * Question option
 */
interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;     // Optional image reference
  mappings: OptionMapping[];  // How selecting this option maps to dimensions
}

/**
 * Question types
 */
type QuestionType = 'text' | 'image' | 'color' | 'scenario' | 'preference';

/**
 * Question definition
 */
interface Question {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  imageUrl?: string;         // Optional image for visual questions
  options: QuestionOption[];
  targetDimensions: string[]; // Which dimensions this question primarily targets
  prerequisiteScore?: {      // Optional score needed to see this question
    dimension: string;
    minValue: number;
    maxValue: number;
  }[];
  stage: number;             // Which stage of questioning this belongs to (1-5)
}

// ================ ANIME MODELS ================

/**
 * Anime attributes (psychological mapping)
 */
interface AnimeAttributes {
  [dimension: string]: number;  // Value for each psychological dimension
}

/**
 * External API IDs
 */
interface ExternalIds {
  malId?: number;         // MyAnimeList ID
  anilistId?: number;     // AniList ID
  tmdbId?: number;        // TMDb ID
  youtubeTrailerId?: string;  // YouTube trailer video ID
}

/**
 * Main anime model
 */
interface AnimeTitle {
  id: string;                 // Internal ID
  title: string;              // Primary title
  alternativeTitles: string[];  // Alternative titles
  synopsis: string;           // Description
  genres: string[];           // Genre tags
  year: number;               // Release year
  season?: string;            // Release season
  episodeCount: number;       // Number of episodes
  attributes: AnimeAttributes;  // Psychological attributes
  popularity: number;         // Popularity score (0-100)
  rating: number;             // Average rating (0-10)
  externalIds: ExternalIds;   // IDs for external APIs
  imageUrls: {                // Image references
    poster?: string;
    banner?: string;
    thumbnail?: string;
  };
  cluster?: string;           // Assigned psychological cluster
  vectors?: number[];         // Numerical feature vectors for similarity
}

// ================ RECOMMENDATION MODELS ================

/**
 * Recommendation result
 */
interface RecommendationResult {
  anime: AnimeTitle;
  score: number;              // Match score (0-10)
  matchReasons: {             // Explainable match reasons
    dimension: string;
    strength: number;         // How strongly this dimension matched (0-1)
    explanation: string;      // Human-readable explanation
  }[];
  similarTitles?: string[];   // IDs of similar anime
}

/**
 * Complete recommendation set
 */
interface RecommendationSet {
  userId: string;
  timestamp: string;          // ISO timestamp
  recommendations: RecommendationResult[];
  profileSnapshot: UserProfile;  // Snapshot of user profile at time of recommendation
}

// ================ MCP INTEGRATION ================

/**
 * MCP context data structure
 */
interface MCPContext {
  userId: string;
  userProfile: UserProfile;
  interactionHistory: {
    questionId: string;
    optionSelected: string;
    timestamp: string;
  }[];
  recommendationHistory: {
    animeId: string;
    interactionType: 'viewed' | 'selected' | 'watched' | 'rated';
    rating?: number;
    timestamp: string;
  }[];
}

// Export all models
export type {
  PsychologicalDimension,
  DimensionSet,
  UserProfile,
  OptionMapping,
  QuestionOption,
  QuestionType,
  Question,
  AnimeAttributes,
  ExternalIds,
  AnimeTitle,
  RecommendationResult,
  RecommendationSet,
  MCPContext
};
