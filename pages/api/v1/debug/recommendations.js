// Debug recommendations API endpoint for v1 API

export default function handler(req, res) {
  // Accept both GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      error: 'method_not_allowed',
      message: `Method ${req.method} not allowed`
    });
  }
  
  console.log(`[Fallback API] Debug recommendations API accessed via ${req.method}`);
  
  // Get profile from body for POST or use default for GET
  const profile = req.method === 'POST' ? req.body.profile : {
    dimensions: {
      visualComplexity: 5.0,
      narrativeComplexity: 5.0,
      emotionalIntensity: 5.0,
      characterComplexity: 5.0,
      moralAmbiguity: 5.0
    }
  };
  
  console.log('[Fallback API] Using profile:', profile);
  
  // Generate test recommendations with scores that match the profile
  const recommendations = [
    {
      id: '1',
      title: 'Fullmetal Alchemist: Brotherhood',
      image: 'https://image.tmdb.org/t/p/original/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg',
      genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
      score: 9.1,
      synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, changing their bodies.',
      match: 92,
      reasons: [
        'The detailed visuals match your aesthetic taste',
        'The character growth elements you value',
        'The moral complexity aligns with your preferences'
      ],
      trailer: 'https://www.youtube.com/watch?v=--IcmZkvL0Q',
      externalIds: {
        mal: 5114,
        tmdb: 31911,
        anilist: 5114
      },
      traits: {
        visualComplexity: 8.2,
        narrativeComplexity: 8.7,
        emotionalIntensity: 7.9,
        characterComplexity: 9.0,
        moralAmbiguity: 7.8
      }
    },
    {
      id: '2',
      title: 'K-On!',
      image: 'https://image.tmdb.org/t/p/original/JVsmlouhaB4Zz6R7Csm7w3baL4.jpg',
      genres: ['Comedy', 'Music', 'Slice of Life'],
      score: 8.2,
      synopsis: 'Four high school girls join the light music club to try to save it from being disbanded. They begin to train to become a proper band.',
      match: 87,
      reasons: [
        'The simple visual style matches your preferences',
        'The straightforward storytelling aligns with your taste',
        'The gentle emotional tone resonates with your profile'
      ],
      trailer: 'https://www.youtube.com/watch?v=m7_-RBl0lfY',
      externalIds: {
        mal: 5680,
        tmdb: 43040,
        anilist: 5680
      },
      traits: {
        visualComplexity: 3.5,
        narrativeComplexity: 2.8,
        emotionalIntensity: 4.2,
        characterComplexity: 5.3,
        moralAmbiguity: 1.5
      }
    },
    {
      id: '3',
      title: 'Made in Abyss',
      image: 'https://image.tmdb.org/t/p/original/3NTAbAiao4JLzFQw6YxP1YZppM8.jpg',
      genres: ['Adventure', 'Drama', 'Fantasy', 'Mystery'],
      score: 8.7,
      synopsis: 'A young girl and her robot companion search for her mother in a dangerous, mysterious and fantastical chasm.',
      match: 84,
      reasons: [
        'The emotional intensity matches your preference',
        'The dark themes create the moral ambiguity you enjoy',
        'The complex narrative elements align with your profile'
      ],
      trailer: 'https://www.youtube.com/watch?v=DiUKh_MjsI0',
      externalIds: {
        mal: 34599,
        tmdb: 72636,
        anilist: 97986
      },
      traits: {
        visualComplexity: 9.1,
        narrativeComplexity: 8.5,
        emotionalIntensity: 9.2,
        characterComplexity: 7.6,
        moralAmbiguity: 8.7
      }
    }
  ];
  
  // Return debug information with recommendations
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    profileUsed: profile,
    recommendations: recommendations,
    debug: {
      source: "pages/api/v1/debug/recommendations.js fallback API",
      recommendationCount: recommendations.length,
      generationMethod: "Static test data with dynamic match explanations"
    }
  });
}