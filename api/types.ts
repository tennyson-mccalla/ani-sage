export interface QuestionOption {
  id: string;
  text: string;
  mappings: { dimension: string; value: number; }[];
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
}

export interface Profile {
  id: string;
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
}

export interface Session {
  sessionId: string;
  profileId: string;
}

export interface APIResponse<T = any> {
  statusCode: number;
  data?: T;
  error?: string;
  message?: string;
}
