import { AnimeRecommendation } from '../components/recommendations/AnimeCard';
import { Dimension } from '../components/profile/DimensionDisplay';

// Mock API service - in production this would be actual API calls to backend

// Mock data
const mockRecommendations: AnimeRecommendation[] = [
  {
    id: '1',
    title: 'Fullmetal Alchemist: Brotherhood',
    image: 'https://via.placeholder.com/300x450?text=Anime+1',
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
    image: 'https://via.placeholder.com/300x450?text=Anime+2',
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
    image: 'https://via.placeholder.com/300x450?text=Anime+3',
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
  },
  {
    id: '4',
    title: 'Attack on Titan',
    image: 'https://via.placeholder.com/300x450?text=Anime+4',
    genres: ['Action', 'Drama', 'Fantasy'],
    score: 8.8,
    synopsis: 'In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.',
    match: 88,
    reasons: [
      'The moral ambiguity that matches your preferences',
      'The visual intensity you appreciate',
      'The narrative complexity you favor'
    ],
    trailer: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ'
  },
  {
    id: '5',
    title: 'March Comes in Like a Lion',
    image: 'https://via.placeholder.com/300x450?text=Anime+5',
    genres: ['Drama', 'Slice of Life'],
    score: 8.6,
    synopsis: 'A story about a teenage shogi player dealing with his emotional struggles, his development, and his relationships with his foster family and friends.',
    match: 87,
    reasons: [
      'The in-depth character development you value',
      'The emotional nuance you connect with',
      'The subtle storytelling approach you enjoy'
    ]
  },
  {
    id: '6',
    title: 'A Silent Voice',
    image: 'https://via.placeholder.com/300x450?text=Anime+6',
    genres: ['Drama', 'Romance'],
    score: 8.9,
    synopsis: 'A young man is ostracized by his classmates after he bullies a deaf girl to the point where she moves away. Years later, he sets off on a path for redemption.',
    match: 85,
    reasons: [
      'The emotional depth that resonates with you',
      'The character growth narrative you prefer',
      'The visual storytelling elements you appreciate'
    ],
    trailer: 'https://www.youtube.com/watch?v=nfK6UgLra7g'
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
    },
    { 
      name: 'Emotional Valence', 
      value: -2.1, 
      min: -5, 
      max: 5,
      lowLabel: 'Dark, Negative',
      highLabel: 'Light, Positive'
    },
    { 
      name: 'Intellectual vs. Emotional', 
      value: 3.4, 
      min: -5, 
      max: 5,
      lowLabel: 'Emotional',
      highLabel: 'Intellectual'
    },
    { 
      name: 'Fantasy vs. Realism', 
      value: 2.7, 
      min: -5, 
      max: 5,
      lowLabel: 'Realistic',
      highLabel: 'Fantastic'
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
   * Get recommendations based on user answers
   */
  getRecommendations: async (answers: Record<string, string>): Promise<AnimeRecommendation[]> => {
    // In production, this would send answers to backend
    console.log('Getting recommendations with answers:', answers);
    
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockRecommendations);
      }, 1500);
    });
  },
  
  /**
   * Get psychological profile
   */
  getUserProfile: async (): Promise<typeof mockProfile> => {
    // In production, this would fetch from backend
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockProfile);
      }, 800);
    });
  },
  
  /**
   * Update psychological profile from question answers
   */
  updateProfile: async (answers: Record<string, string>) => {
    // In production, this would send to backend
    console.log('Updating profile with answers:', answers);
    
    // Simulate API delay
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },
  
  /**
   * Apply suggested adjustments to profile
   */
  applyProfileAdjustments: async () => {
    // In production, this would update profile on backend
    console.log('Applying profile adjustments');
    
    // Simulate API delay
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }
};