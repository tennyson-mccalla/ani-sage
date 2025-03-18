export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
  dimensionUpdates?: Record<string, number>;
  confidenceUpdates?: Record<string, number>;
}

export interface Question {
  id: string;
  type?: string;
  text: string;
  description?: string;
  imageUrl?: string;
  options: QuestionOption[];
  stage: number;
  targetDimensions?: string[];
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
