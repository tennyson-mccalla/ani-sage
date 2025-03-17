import axios from 'axios';
import { AnimeRecommendation } from '../components/recommendations/AnimeCard';
import { Dimension } from '../components/profile/DimensionDisplay';
import { apiConfig } from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: apiConfig.timeouts.default
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(apiConfig.sessionStorage.authTokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to convert API dimension data to UI format
const mapApiDimensionsToUi = (apiDimensions: Record<string, number>): Dimension[] => {
  // Define dimension metadata
  const dimensionMeta: Record<string, { name: string, min: number, max: number, lowLabel: string, highLabel: string }> = {
    visualComplexity: {
      name: 'Visual Complexity',
      min: 1,
      max: 10,
      lowLabel: 'Simple, Clean',
      highLabel: 'Detailed, Complex'
    },
    narrativeComplexity: {
      name: 'Narrative Complexity',
      min: 1,
      max: 10,
      lowLabel: 'Straightforward',
      highLabel: 'Multi-layered'
    },
    emotionalIntensity: {
      name: 'Emotional Intensity',
      min: 1,
      max: 10,
      lowLabel: 'Gentle',
      highLabel: 'Intense'
    },
    characterComplexity: {
      name: 'Character Complexity',
      min: 1,
      max: 10,
      lowLabel: 'Archetypal',
      highLabel: 'Nuanced'
    },
    moralAmbiguity: {
      name: 'Moral Ambiguity',
      min: 1,
      max: 10,
      lowLabel: 'Clear Morals',
      highLabel: 'Ambiguous'
    },
    emotionalValence: {
      name: 'Emotional Valence',
      min: -5,
      max: 5,
      lowLabel: 'Dark, Negative',
      highLabel: 'Light, Positive'
    },
    intellectualEmotional: {
      name: 'Intellectual vs. Emotional',
      min: -5,
      max: 5,
      lowLabel: 'Emotional',
      highLabel: 'Intellectual'
    },
    fantasyRealism: {
      name: 'Fantasy vs. Realism',
      min: -5,
      max: 5,
      lowLabel: 'Realistic',
      highLabel: 'Fantastic'
    }
  };

  return Object.entries(apiDimensions)
    .filter(([key]) => dimensionMeta[key])
    .map(([key, value]) => ({
      name: dimensionMeta[key].name,
      value,
      min: dimensionMeta[key].min,
      max: dimensionMeta[key].max,
      lowLabel: dimensionMeta[key].lowLabel,
      highLabel: dimensionMeta[key].highLabel
    }));
};

// Helper function to map API recommendation to UI format
const mapApiRecommendationToUi = (apiRec: any): AnimeRecommendation => {
  return {
    id: apiRec.id,
    title: apiRec.title,
    // Map the image URL directly from the imageUrls.poster or use a placeholder
    image: apiRec.imageUrls?.poster || 'https://placehold.co/300x450/25163c/ffffff?text=No+Image',
    genres: apiRec.genres || [],
    score: apiRec.score || 0,
    synopsis: apiRec.synopsis || '',
    match: apiRec.score * 10 || 0, // Convert 0-10 to 0-100
    reasons: apiRec.matchReasons?.map((r: any) => r.explanation) || [],
    trailer: apiRec.externalIds?.youtubeTrailerId ?
      `https://youtube.com/watch?v=${apiRec.externalIds.youtubeTrailerId}` :
      undefined
  };
};

// Mock data for development and fallback scenarios
const mockData = {
  // Mock recommendations
  recommendations: [
    {
      id: '1',
      title: 'Fullmetal Alchemist: Brotherhood',
      imageUrls: { poster: 'https://placehold.co/300x450/25163c/ffffff?text=Fullmetal+Alchemist' },
      genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
      score: 9.1,
      synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, changing their bodies.',
      matchReasons: [
        { explanation: 'The moral complexities align with your preferences' },
        { explanation: 'The detailed visuals match your aesthetic taste' },
        { explanation: 'The character growth elements you value' }
      ],
      externalIds: { youtubeTrailerId: '--IcmZkvL0Q' }
    },
    {
      id: '2',
      title: 'Steins;Gate',
      imageUrls: { poster: 'https://placehold.co/300x450/25163c/ffffff?text=Steins;Gate' },
      genres: ['Sci-Fi', 'Thriller', 'Drama'],
      score: 9.0,
      synopsis: 'A group of friends accidentally create a time machine, leading to dramatic consequences as they attempt to prevent global disaster.',
      matchReasons: [
        { explanation: 'The narrative complexity that engages you' },
        { explanation: 'The emotional intensity you prefer' },
        { explanation: 'The character dynamics you connect with' }
      ],
      externalIds: { youtubeTrailerId: '27OZc-ku6is' }
    },
    {
      id: '3',
      title: 'Violet Evergarden',
      imageUrls: { poster: 'https://placehold.co/300x450/25163c/ffffff?text=Violet+Evergarden' },
      genres: ['Drama', 'Fantasy', 'Slice of Life'],
      score: 8.9,
      synopsis: 'A former soldier becomes a letter writer and explores the meaning of love as she recovers from the war.',
      matchReasons: [
        { explanation: 'The emotional depth that resonates with you' },
        { explanation: 'The detailed visuals that match your preferences' },
        { explanation: 'The character-driven narrative you enjoy' }
      ],
      externalIds: { youtubeTrailerId: '0CJeDetA45Q' }
    }
  ],

  // Mock profile data
  profile: {
    dimensions: {
      visualComplexity: 7.5,
      narrativeComplexity: 8.2,
      emotionalIntensity: 6.8,
      characterComplexity: 8.5,
      moralAmbiguity: 7.9,
      emotionalValence: -2.1,
      intellectualEmotional: 3.4,
      fantasyRealism: 2.7
    },
    suggestedAdjustments: [
      {
        dimension: 'narrativeComplexity',
        explanation: 'You seem to enjoy more complex narratives than your current profile suggests.',
        currentValue: 8.2,
        suggestedValue: 9.1
      },
      {
        dimension: 'emotionalValence',
        explanation: 'You might prefer slightly less dark stories than your current profile indicates.',
        currentValue: -2.1,
        suggestedValue: -1.2
      }
    ]
  },

  // Mock questions
  questions: [
    {
      id: 'visual-style',
      type: 'text',
      text: 'Which visual style do you prefer in anime?',
      options: [
        { id: 'clean-simple', text: 'Clean and simple visuals, with emphasis on character expressions' },
        { id: 'balanced', text: 'Balanced visuals with moderate detail' },
        { id: 'detailed', text: 'Highly detailed and intricate visuals' },
        { id: 'dynamic', text: 'Dynamic and energetic visuals with lots of movement' }
      ]
    },
    {
      id: 'narrative-complexity',
      type: 'text',
      text: 'How do you feel about complex storylines?',
      options: [
        { id: 'low-complexity', text: 'I prefer straightforward stories that are easy to follow' },
        { id: 'medium-complexity', text: 'I enjoy some complexity but don\'t want to feel lost' },
        { id: 'high-complexity', text: 'I love intricate plots with multiple layers and twists' }
      ]
    },
    {
      id: 'character-depth',
      type: 'text',
      text: 'What kind of characters do you connect with most?',
      options: [
        { id: 'simple-characters', text: 'Clear, straightforward characters with defined traits' },
        { id: 'balanced-characters', text: 'Characters with some depth but still relatable' },
        { id: 'complex-characters', text: 'Deep, nuanced characters with internal conflicts and growth' }
      ]
    },
    {
      id: 'moral-ambiguity',
      type: 'scenario',
      text: 'In stories, do you prefer:',
      options: [
        { id: 'clear-morals', text: 'Clear heroes and villains with defined moral boundaries' },
        { id: 'nuanced-morals', text: 'Characters with understandable motivations even when doing wrong' },
        { id: 'ambiguous', text: 'Morally ambiguous situations where right and wrong aren\'t clear' }
      ]
    },
    {
      id: 'emotional-tone',
      type: 'text',
      text: 'Which emotional tone do you prefer in stories?',
      options: [
        { id: 'light-optimistic', text: 'Light and optimistic' },
        { id: 'exciting-uplifting', text: 'Exciting and uplifting' },
        { id: 'dark-serious', text: 'Dark and serious' },
        { id: 'bittersweet-reflective', text: 'Bittersweet and reflective' }
      ]
    }
  ]
};

// API service functions
export const apiService = {
  /**
   * Initialize or get user session
   */
  initSession: async () => {
    // Check if we already have a session
    const existingSessionId = localStorage.getItem(apiConfig.sessionStorage.sessionIdKey);

    // If mock API is enabled, return fake session data
    if (apiConfig.enableMockApi) {
      const sessionId = existingSessionId || 'mock-session-123';
      // Store session ID for future requests
      localStorage.setItem(apiConfig.sessionStorage.sessionIdKey, sessionId);
      return {
        sessionId,
        isNewUser: !existingSessionId,
        profileConfidence: 0.75,
        interactionCount: existingSessionId ? 12 : 0
      };
    }

    try {
      // If we have an existing session, include it in the request
      const params = existingSessionId ? { existingSessionId } : {};
      const response = await apiClient.get('/session', { params });

      // Store new session ID
      if (response.data && response.data.sessionId) {
        localStorage.setItem(apiConfig.sessionStorage.sessionIdKey, response.data.sessionId);
      }

      return response.data;
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error;
    }
  },

  /**
   * Get questions for user profile building
   */
  getQuestions: async (count = 5, stage?: number) => {
    // Get session ID
    const sessionId = localStorage.getItem(apiConfig.sessionStorage.sessionIdKey) || 'new-session';

    // If mock API is enabled, return mock questions
    if (apiConfig.enableMockApi) {
      console.log('Using mock questions data');
      return mockData.questions;
    }

    try {
      // Include session ID in params
      const params: Record<string, any> = { count, sessionId };
      if (stage !== undefined) {
        params.stage = stage;
      }

      const response = await apiClient.get('/questions', { params });
      if (response.data && response.data.questions) {
        return response.data.questions;
      } else {
        throw new Error('Invalid response format from questions endpoint');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback to mock data if API call fails
      console.log('Falling back to mock questions data');
      return mockData.questions;
    }
  },

  /**
   * Submit answer to a question
   */
  submitAnswer: async (questionId: string, optionId: string) => {
    // Get session ID
    const sessionId = localStorage.getItem(apiConfig.sessionStorage.sessionIdKey) || 'new-session';

    // If mock API is enabled, return mock success response
    if (apiConfig.enableMockApi) {
      console.log(`Mock API: Submitting answer ${optionId} for question ${questionId}`);
      return {
        success: true,
        profileUpdated: true,
        nextAction: 'more_questions',
        profile: mockData.profile
      };
    }

    try {
      // Include session ID in the request body
      const response = await apiClient.post(`/questions/${questionId}/answer`, {
        optionId,
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },

  /**
   * Get recommendations based on user answers
   */
  getRecommendations: async (answers: Record<string, string> = {}): Promise<AnimeRecommendation[]> => {
    // Get session ID
    const sessionId = localStorage.getItem(apiConfig.sessionStorage.sessionIdKey) || 'new-session';

    // If mock API is enabled, return mock recommendations
    if (apiConfig.enableMockApi) {
      console.log('Using mock recommendations data', answers);
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockData.recommendations.map(mapApiRecommendationToUi);
    }

    try {
      // If answers provided, update the profile first
      if (Object.keys(answers).length > 0) {
        // Submit each answer separately
        for (const [questionId, optionId] of Object.entries(answers)) {
          await apiService.submitAnswer(questionId, optionId);
        }
      }

      // Get recommendations
      const response = await apiClient.get('/recommendations', {
        params: {
          includeReasons: true,
          count: 10,
          sessionId // Include session ID in params
        }
      });

      if (response.data && response.data.recommendations) {
        // Map API response to UI format
        return response.data.recommendations.map(mapApiRecommendationToUi);
      } else {
        throw new Error('Invalid response format from recommendations endpoint');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);

      // Fallback to mock data if API call fails
      console.log('Falling back to mock recommendations data');
      return mockData.recommendations.map(mapApiRecommendationToUi);
    }
  },

  /**
   * Get psychological profile
   */
  getUserProfile: async () => {
    // Get session ID
    const sessionId = localStorage.getItem(apiConfig.sessionStorage.sessionIdKey) || 'new-session';

    // If mock API is enabled, return mock profile
    if (apiConfig.enableMockApi) {
      console.log('Using mock profile data');
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Map mock profile to UI format
      const dimensions = mapApiDimensionsToUi(mockData.profile.dimensions);

      // Convert mock adjustments
      const suggestedAdjustments = mockData.profile.suggestedAdjustments.map(adj => ({
        dimension: adj.dimension.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
        explanation: adj.explanation,
        currentValue: adj.currentValue,
        suggestedValue: adj.suggestedValue
      }));

      return {
        dimensions,
        suggestedAdjustments
      };
    }

    try {
      // Include session ID in params
      const response = await apiClient.get('/profile', {
        params: { sessionId }
      });

      // Map API response to UI format
      const dimensions = mapApiDimensionsToUi(response.data.dimensions);

      // Convert adjustments if available
      let suggestedAdjustments: any[] = [];

      if (response.data.suggestedAdjustments) {
        suggestedAdjustments = response.data.suggestedAdjustments.map((adj: any) => ({
          dimension: adj.dimension.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
          explanation: adj.explanation,
          currentValue: adj.currentValue,
          suggestedValue: adj.suggestedValue
        }));
      }

      return {
        dimensions,
        suggestedAdjustments,
        answeredQuestions: response.data.answeredQuestions || []
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);

      // Fallback to mock data if API call fails
      console.log('Falling back to mock profile data');
      const dimensions = mapApiDimensionsToUi(mockData.profile.dimensions);

      const suggestedAdjustments = mockData.profile.suggestedAdjustments.map(adj => ({
        dimension: adj.dimension.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
        explanation: adj.explanation,
        currentValue: adj.currentValue,
        suggestedValue: adj.suggestedValue
      }));

      return {
        dimensions,
        suggestedAdjustments,
        answeredQuestions: []
      };
    }
  },

  /**
   * Update psychological profile from question answers
   */
  updateProfile: async (answers: Record<string, string>) => {
    // If mock API is enabled, just log the answers
    if (apiConfig.enableMockApi) {
      console.log('Mock API: Updating profile with answers:', answers);
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }

    try {
      // Submit each answer separately to update profile
      for (const [questionId, optionId] of Object.entries(answers)) {
        await apiService.submitAnswer(questionId, optionId);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Apply suggested adjustments to profile
   */
  applyProfileAdjustments: async () => {
    // If mock API is enabled, just log the action
    if (apiConfig.enableMockApi) {
      console.log('Mock API: Applying profile adjustments');
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }

    try {
      await apiClient.post('/profile/apply-adjustments');
    } catch (error) {
      console.error('Error applying profile adjustments:', error);
      throw error;
    }
  },

  /**
   * Get detailed information about a specific anime
   */
  getAnimeDetails: async (animeId: string) => {
    // If mock API is enabled, find the anime in mock data
    if (apiConfig.enableMockApi) {
      const mockAnime = mockData.recommendations.find(anime => anime.id === animeId);

      if (mockAnime) {
        console.log(`Mock API: Getting details for anime ${animeId}`);
        // Add some additional mock data for details view
        return {
          ...mockAnime,
          alternativeTitles: [`${mockAnime.title} (Japanese)`, `${mockAnime.title} (English)`],
          year: 2020,
          season: 'SPRING',
          episodeCount: 24,
          popularity: 98,
          similarTitles: mockData.recommendations
            .filter(a => a.id !== animeId)
            .slice(0, 3)
            .map(a => ({
              id: a.id,
              title: a.title,
              imageUrl: a.imageUrls.poster || `https://placehold.co/300x450/25163c/ffffff?text=${encodeURIComponent(a.title)}`
            }))
        };
      }

      throw new Error(`Anime with ID ${animeId} not found`);
    }

    try {
      const response = await apiClient.get(`/recommendations/${animeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching anime details for ${animeId}:`, error);
      throw error;
    }
  },

  /**
   * Submit feedback on an anime recommendation
   */
  submitAnimeFeedback: async (animeId: string, interactionType: 'viewed' | 'selected' | 'watched' | 'rated', rating?: number, feedback?: string) => {
    // If mock API is enabled, just log the feedback
    if (apiConfig.enableMockApi) {
      console.log(`Mock API: Submitting ${interactionType} feedback for anime ${animeId}`,
        rating !== undefined ? `with rating ${rating}` : '',
        feedback ? `and comment "${feedback}"` : '');
      return;
    }

    try {
      const payload: any = { interactionType };

      if (interactionType === 'rated' && rating !== undefined) {
        payload.rating = rating;
      }

      if (feedback) {
        payload.feedback = feedback;
      }

      await apiClient.post(`/recommendations/${animeId}/feedback`, payload);
    } catch (error) {
      console.error(`Error submitting feedback for anime ${animeId}:`, error);
      throw error;
    }
  },

  sanitizeString: (str: string): string => {
    // Implementation of sanitizeString function
    return str;
  }
};
