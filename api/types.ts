export interface QuestionOptionMapping {
  dimension: string;
  value: number;
  confidence: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
  value?: number;
  mappings: QuestionOptionMapping[];
  dimensionUpdates?: Record<string, number>;
  confidenceUpdates?: Record<string, number>;
}

export interface Question {
  id: string;
  text: string;
  type: 'image' | 'text' | 'scenario' | 'preference';
  stage: number;
  targetDimensions: string[];
  options: QuestionOption[];
  description?: string;
  imageUrl?: string;
}

export interface Profile {
  id: string;
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIResponse<T = any> {
  statusCode: number;
  data?: T;
  error?: string;
  message?: string;
}

export interface AnimeTitle {
  id: string;
  title: string;
  alternativeTitles: string[];
  image?: {
    medium: string;
    large: string;
  };
  synopsis: string;
  score: number;
  genres?: string[];
  trailer?: string;
  externalIds?: Record<string, string>;
}

export interface AnimeAttributes {
  [key: string]: number;
}

export interface RecommendationParams {
  dimensions: Record<string, number>;
  count?: number;
}
