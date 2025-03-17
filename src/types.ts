export interface Env {
  API_VERSION: string;
  SESSIONS: KVNamespace;
  PROFILES: KVNamespace;
  ANILIST_ACCESS_TOKEN?: string;
  MAL_CLIENT_ID?: string;
  MAL_CLIENT_SECRET?: string;
  TMDB_API_KEY?: string;
  YOUTUBE_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

export interface Session {
  id: string;
  created: string;
  isNewUser: boolean;
  profileConfidence: number;
  interactionCount: number;
}

export interface Profile {
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
  suggestedAdjustments: Array<{
    dimension: string;
    explanation: string;
    currentValue: number;
    suggestedValue: number;
  }>;
}

export interface AnimeRecommendation {
  id: string;
  title: string;
  image: string;
  genres: string[];
  score: number;
  synopsis: string;
  match: number;
  reasons: string[];
  trailer?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}
