import { Dimension } from '../components/profile/DimensionDisplay';

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

// Mock data
const mockRecommendations: AnimeRecommendation[] = [
  {
    id: '1',
    title: 'Fullmetal Alchemist: Brotherhood',
    image: 'https://dummyimage.com/300x450/3498db/ffffff&text=Anime+1',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    score: 9.1,
    synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, changing their bodies.',
    match: 98,
    reasons: [
      'The moral complexities align with your preferences',
      'The detailed visuals match your aesthetic taste',
      'The character growth elements you value'
    ],
    trailer: 'https://www.youtube.com/watch?v=--IcmZkvL0Q'
  },
  {
    id: '2',
    title: 'Steins;Gate',
    image: 'https://dummyimage.com/300x450/e74c3c/ffffff&text=Anime+2',
    genres: ['Sci-Fi', 'Thriller', 'Drama'],
    score: 9.0,
    synopsis: 'A group of friends accidentally create a time machine, leading to dramatic consequences as they attempt to prevent global disaster.',
    match: 95,
    reasons: [
      'The narrative complexity that engages you',
      'The emotional intensity you prefer',
      'The character dynamics you connect with'
    ],
    trailer: 'https://www.youtube.com/watch?v=27OZc-ku6is'
  },
  {
    id: '3',
    title: 'Violet Evergarden',
    image: 'https://dummyimage.com/300x450/27ae60/ffffff&text=Anime+3',
    genres: ['Drama', 'Fantasy', 'Slice of Life'],
    score: 8.9,
    synopsis: 'A former soldier becomes a letter writer and explores the meaning of love as she recovers from the war.',
    match: 92,
    reasons: [
      'The emotional depth that resonates with you',
      'The detailed visuals that match your preferences',
      'The character-driven narrative you enjoy'
    ],
    trailer: 'https://www.youtube.com/watch?v=0CJeDetA45Q'
  }
];

const mockProfile = {
  dimensions: [
    {
      name: 'Visual Complexity',
      value: 7.5,
      min: 1,
      max: 10,
      lowLabel: 'Simple, Clean',
      highLabel: 'Detailed, Complex'
    },
    {
      name: 'Narrative Complexity',
      value: 8.2,
      min: 1,
      max: 10,
      lowLabel: 'Straightforward',
      highLabel: 'Multi-layered'
    },
    {
      name: 'Emotional Intensity',
      value: 6.8,
      min: 1,
      max: 10,
      lowLabel: 'Gentle',
      highLabel: 'Intense'
    },
    {
      name: 'Character Complexity',
      value: 8.5,
      min: 1,
      max: 10,
      lowLabel: 'Archetypal',
      highLabel: 'Nuanced'
    },
    {
      name: 'Moral Ambiguity',
      value: 7.9,
      min: 1,
      max: 10,
      lowLabel: 'Clear Morals',
      highLabel: 'Ambiguous'
    }
  ] as Dimension[],
  suggestedAdjustments: [
    {
      dimension: 'Narrative Complexity',
      explanation: 'You seem to enjoy more complex narratives than your current profile suggests.',
      currentValue: 8.2,
      suggestedValue: 9.1
    },
    {
      dimension: 'Emotional Valence',
      explanation: 'You might prefer slightly less dark stories than your current profile indicates.',
      currentValue: -2.1,
      suggestedValue: -1.2
    }
  ]
};

// API service functions
export const apiService = {
  /**
   * Create a new user session
   */
  createSession: async (): Promise<string> => {
    const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    console.log('Creating session. Using real API:', useRealApi, process.env.NEXT_PUBLIC_USE_REAL_API);
    
    if (useRealApi) {
      try {
        const apiUrl = `/api/v1/session`;
        console.log('Posting to session API:', apiUrl);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}) // Send an empty body
        });
        
        console.log('Session API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Session created successfully:', data);
        return data.sessionId;
      } catch (error) {
        console.error('Error creating session:', error);
        // Generate a mock session ID as fallback
        const mockId = `mock-${Math.random().toString(36).substring(2, 15)}`;
        console.log('Falling back to mock session ID:', mockId);
        return mockId;
      }
    } else {
      // Generate a mock session ID
      const mockId = `mock-${Math.random().toString(36).substring(2, 15)}`;
      console.log('Using mock session ID:', mockId);
      return mockId;
    }
  },

  /**
   * Get recommendations based on user answers
   */
  getRecommendations: async (answers: Record<string, string>, sessionId?: string | null): Promise<AnimeRecommendation[]> => {
    // Check for environment flag to use real API
    const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    console.log('Getting recommendations. Using real API:', useRealApi, 'for session:', sessionId);
    
    if (useRealApi && sessionId) {
      try {
        const apiUrl = `/api/v1/recommendations?sessionId=${sessionId}`;
        console.log('Fetching recommendations from:', apiUrl);
        const response = await fetch(apiUrl);
        
        console.log('Recommendations response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Recommendations fetched successfully:', data);
        return data.recommendations;
      } catch (error) {
        console.error('Error fetching recommendations from API:', error);
        
        // For development, use mock data for mock/fallback sessions
        if (sessionId?.startsWith('mock-') || sessionId?.startsWith('fallback-')) {
          console.log('Using mock recommendations for', sessionId);
          return mockRecommendations;
        }
        
        // Fall back to mock data if API fails
        return mockRecommendations;
      }
    } else {
      // Use mock data
      console.log('Using mock recommendations data (no real API or sessionId):', answers);
      
      // Simulate API delay
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(mockRecommendations);
        }, 1500);
      });
    }
  },

  /**
   * Get psychological profile
   */
  getUserProfile: async (sessionId?: string | null): Promise<typeof mockProfile> => {
    const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    console.log('Getting profile. Using real API:', useRealApi, 'for session:', sessionId);
    
    if (useRealApi && sessionId) {
      try {
        const apiUrl = `/api/v1/profile?sessionId=${sessionId}`;
        console.log('Fetching profile from:', apiUrl);
        const response = await fetch(apiUrl);
        
        console.log('Profile fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to get profile: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Profile fetched successfully:', data);
        return data.profile;
      } catch (error) {
        console.error('Error fetching profile from API:', error);
        
        // For development, use mock data for mock/fallback sessions
        if (sessionId?.startsWith('mock-') || sessionId?.startsWith('fallback-')) {
          console.log('Using mock profile data for', sessionId);
          return mockProfile;
        }
        
        // Fall back to mock data
        return mockProfile;
      }
    } else {
      // Use mock data
      console.log('Using mock profile data (no real API or sessionId)');
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(mockProfile);
        }, 800);
      });
    }
  },

  /**
   * Update psychological profile from question answers
   */
  updateProfile: async (answers: Record<string, string>, sessionId?: string | null) => {
    const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    console.log('Updating profile. Using real API:', useRealApi, 'for session:', sessionId);
    
    if (useRealApi && sessionId) {
      try {
        const apiUrl = `/api/v1/profile?sessionId=${sessionId}`;
        console.log('Posting to profile API:', apiUrl, 'with answers:', answers);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answers })
        });
        
        console.log('Profile update response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to update profile: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Profile updated successfully:', result);
        return result;
      } catch (error) {
        console.error('Error updating profile:', error);
        
        // For development, try to use fallback mock session
        if (sessionId?.startsWith('mock-') || sessionId?.startsWith('fallback-')) {
          console.log('Using mock data for', sessionId);
          // Return mock data
          return {
            success: true,
            profile: mockProfile
          };
        }
      }
    } else {
      // Mock update
      console.log('Using mock update with answers:', answers);
      
      // Simulate API delay
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('Mock profile update completed');
          resolve({
            success: true,
            profile: mockProfile
          });
        }, 500);
      });
    }
  },

  /**
   * Apply suggested profile adjustments
   */
  applyProfileAdjustments: async (sessionId?: string | null) => {
    const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
    
    if (useRealApi && sessionId) {
      try {
        const apiUrl = `/api/v1/profile/adjust?sessionId=${sessionId}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to apply profile adjustments: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error applying profile adjustments:', error);
        // Silently fail and continue with mock data
      }
    } else {
      // Mock adjustments
      console.log('Applying profile adjustments');
      
      // Simulate API delay
      return new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    }
  }
};
