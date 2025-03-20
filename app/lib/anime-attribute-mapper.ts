/**
 * Anime Attribute Mapping
 *
 * Maps anime attributes from external APIs to psychological dimensions
 * used in the recommendation system. This creates a bridge between
 * objective anime metadata and subjective psychological preferences.
 */

import type { AnimeTitle } from './anime-api-adapter';

// Genre dimension mappings - how genres correlate to psychological dimensions
const genreDimensionMappings: Record<string, Record<string, number>> = {
  'Action': {
    visualPace: 8,
    narrativePace: 7,
    emotionalIntensity: 7,
    fantasyRealism: 2
  },
  'Adventure': {
    narrativePace: 6,
    noveltyFamiliarity: 3,
    fantasyRealism: 2
  },
  'Comedy': {
    emotionalValence: 4,
    moralAmbiguity: 3,
    intellectualEmotional: -2
  },
  'Drama': {
    emotionalIntensity: 8,
    emotionalValence: -2,
    characterGrowth: 8,
    intellectualEmotional: -1
  },
  'Fantasy': {
    visualComplexity: 7,
    fantasyRealism: 4
  },
  'Horror': {
    emotionalIntensity: 9,
    emotionalValence: -4,
    moralAmbiguity: 8
  },
  'Mystery': {
    narrativeComplexity: 8,
    plotPredictability: 2,
    intellectualEmotional: 4
  },
  'Psychological': {
    narrativeComplexity: 9,
    characterComplexity: 9,
    moralAmbiguity: 9,
    intellectualEmotional: 5
  },
  'Romance': {
    emotionalIntensity: 7,
    emotionalValence: 2,
    characterGrowth: 7,
    intellectualEmotional: -3
  },
  'Sci-Fi': {
    narrativeComplexity: 7,
    fantasyRealism: 1,
    intellectualEmotional: 3
  },
  'Slice of Life': {
    narrativePace: 3,
    emotionalValence: 2,
    fantasyRealism: -3,
    noveltyFamiliarity: -2
  },
  'Thriller': {
    narrativePace: 8,
    plotPredictability: 3,
    emotionalIntensity: 8
  }
};

// Studio dimension mappings - certain studios have recognizable styles
const studioDimensionMappings: Record<string, Record<string, number>> = {
  'Kyoto Animation': {
    visualComplexity: 7,
    colorSaturation: 8,
    emotionalIntensity: 7,
    characterGrowth: 8,
    emotionalValence: 3
  },
  'Shaft': {
    visualComplexity: 9,
    visualPace: 8,
    narrativeComplexity: 8,
    intellectualEmotional: 4
  },
  'Trigger': {
    visualComplexity: 8,
    colorSaturation: 9,
    visualPace: 9,
    narrativePace: 8
  },
  'Madhouse': {
    visualComplexity: 7,
    narrativeComplexity: 8,
    characterComplexity: 8
  },
  'Bones': {
    visualComplexity: 8,
    colorSaturation: 8,
    narrativePace: 7,
    emotionalIntensity: 7
  },
  'ufotable': {
    visualComplexity: 9,
    colorSaturation: 7,
    visualPace: 8,
    narrativePace: 6
  },
  'Wit Studio': {
    visualComplexity: 8,
    narrativePace: 8,
    emotionalIntensity: 8
  },
  'A-1 Pictures': {
    visualComplexity: 7,
    colorSaturation: 7,
    narrativePace: 6
  },
  'MAPPA': {
    visualComplexity: 8,
    colorSaturation: 6,
    narrativeComplexity: 7,
    characterComplexity: 8
  },
  'Production I.G': {
    visualComplexity: 8,
    narrativeComplexity: 7,
    characterComplexity: 7
  }
};

// Format dimension mappings - how formats typically affect psychological dimensions
const formatDimensionMappings: Record<string, Record<string, number>> = {
  'TV': {
    narrativeComplexity: 6
  },
  'Movie': {
    visualComplexity: 8,
    narrativeComplexity: 7
  },
  'OVA': {
    visualComplexity: 7
  },
  'Special': {
    narrativeComplexity: 4
  },
  'ONA': {
    narrativeComplexity: 5
  }
};

// Status mappings for if a show is complete, ongoing, etc.
const statusDimensionMappings: Record<string, Record<string, number>> = {
  'FINISHED': {
    narrativeComplexity: 7
  },
  'RELEASING': {
    noveltyFamiliarity: 4
  },
  'NOT_YET_RELEASED': {
    noveltyFamiliarity: 5
  }
};

// Score to dimension mappings - how user ratings correlate to dimensions
const scoreToDimensionMapping = (score?: number): Record<string, number> => {
  if (!score) return {};

  // Higher scores correlate with certain dimensions
  if (score >= 8) {
    return {
      characterComplexity: 7,
      narrativeComplexity: 7,
      emotionalIntensity: 7
    };
  } else if (score >= 7) {
    return {
      characterComplexity: 6,
      narrativeComplexity: 6
    };
  }

  return {};
};

// Popularity to dimension mappings
const popularityToDimensionMapping = (popularity?: number): Record<string, number> => {
  if (!popularity) return {};

  // Very popular shows tend to have certain characteristics
  if (popularity < 1000) { // Highly popular
    return {
      noveltyFamiliarity: -2 // More familiar than novel
    };
  } else if (popularity < 5000) {
    return {
      noveltyFamiliarity: 0 // Neutral
    };
  }

  return {
    noveltyFamiliarity: 2 // More novel than familiar
  };
};

// Season to color mapping - different seasons have different visual tones
const seasonToDimensionMapping = (season?: string): Record<string, number> => {
  if (!season) return {};

  const seasonLower = season.toLowerCase();

  if (seasonLower === 'winter') {
    return {
      colorSaturation: 4,
      emotionalValence: -1
    };
  } else if (seasonLower === 'spring') {
    return {
      colorSaturation: 7,
      emotionalValence: 2
    };
  } else if (seasonLower === 'summer') {
    return {
      colorSaturation: 8,
      emotionalValence: 3
    };
  } else if (seasonLower === 'fall') {
    return {
      colorSaturation: 6,
      emotionalValence: 0
    };
  }

  return {};
};

/**
 * Maps anime attributes to psychological dimensions
 *
 * @param anime Anime title with metadata
 * @returns Object mapping psychological dimensions to values (0-10)
 */
export function mapAnimeToDimensions(anime: AnimeTitle): Record<string, number> {
  // Initialize dimensions with default mid-values
  const dimensions: Record<string, number> = {
    visualComplexity: 5,
    colorSaturation: 5,
    visualPace: 5,
    narrativeComplexity: 5,
    narrativePace: 5,
    plotPredictability: 5,
    characterComplexity: 5,
    characterGrowth: 5,
    emotionalIntensity: 5,
    emotionalValence: 0, // -5 to 5 scale
    moralAmbiguity: 5,
    fantasyRealism: 0, // -5 to 5 scale
    intellectualEmotional: 0, // -5 to 5 scale
    noveltyFamiliarity: 0 // -5 to 5 scale
  };

  // Weight factors for different attribute types
  const weights = {
    genre: 1.0,
    studio: 0.8,
    format: 0.5,
    status: 0.3,
    score: 0.6,
    popularity: 0.4,
    season: 0.4
  };

  // Apply genre mappings
  if (anime.genres && anime.genres.length > 0) {
    let genreCount = 0;

    anime.genres.forEach(genre => {
      const mappings = genreDimensionMappings[genre];
      if (mappings) {
        genreCount++;

        // Apply each dimension mapping with genre weight
        Object.entries(mappings).forEach(([dimension, value]) => {
          if (dimension in dimensions) {
            dimensions[dimension] += (value - dimensions[dimension]) * weights.genre;
          }
        });
      }
    });

    // Normalize genre impact based on number of matched genres
    if (genreCount > 0) {
      // Already applied in weighted average above
    }
  }

  // Apply studio mappings
  if (anime.studios && anime.studios.length > 0) {
    anime.studios.forEach(studio => {
      const mappings = studioDimensionMappings[studio];
      if (mappings) {
        // Apply each dimension mapping with studio weight
        Object.entries(mappings).forEach(([dimension, value]) => {
          if (dimension in dimensions) {
            dimensions[dimension] += (value - dimensions[dimension]) * weights.studio;
          }
        });
      }
    });
  }

  // Apply format mappings
  if (anime.format) {
    const mappings = formatDimensionMappings[anime.format];
    if (mappings) {
      Object.entries(mappings).forEach(([dimension, value]) => {
        if (dimension in dimensions) {
          dimensions[dimension] += (value - dimensions[dimension]) * weights.format;
        }
      });
    }
  }

  // Apply status mappings
  if (anime.status) {
    const mappings = statusDimensionMappings[anime.status];
    if (mappings) {
      Object.entries(mappings).forEach(([dimension, value]) => {
        if (dimension in dimensions) {
          dimensions[dimension] += (value - dimensions[dimension]) * weights.status;
        }
      });
    }
  }

  // Apply score mappings
  const scoreMappings = scoreToDimensionMapping(anime.score);
  Object.entries(scoreMappings).forEach(([dimension, value]) => {
    if (dimension in dimensions) {
      dimensions[dimension] += (value - dimensions[dimension]) * weights.score;
    }
  });

  // Apply popularity mappings
  const popularityMappings = popularityToDimensionMapping(anime.popularity);
  Object.entries(popularityMappings).forEach(([dimension, value]) => {
    if (dimension in dimensions) {
      dimensions[dimension] += (value - dimensions[dimension]) * weights.popularity;
    }
  });

  // Apply season mappings
  const seasonMappings = seasonToDimensionMapping(anime.season);
  Object.entries(seasonMappings).forEach(([dimension, value]) => {
    if (dimension in dimensions) {
      dimensions[dimension] += (value - dimensions[dimension]) * weights.season;
    }
  });

  // Ensure values are within bounds
  Object.entries(dimensions).forEach(([dimension, value]) => {
    if (dimension === 'emotionalValence' || dimension === 'fantasyRealism' ||
        dimension === 'intellectualEmotional' || dimension === 'noveltyFamiliarity') {
      // These dimensions are on a -5 to 5 scale
      dimensions[dimension] = Math.max(-5, Math.min(5, value));
    } else {
      // Standard dimensions are on a 0 to 10 scale
      dimensions[dimension] = Math.max(0, Math.min(10, value));
    }
  });

  return dimensions;
}

/**
 * Get explanation for why an anime matches a user's profile
 *
 * @param anime Anime title
 * @param userProfile User's psychological profile
 * @returns Array of explanations for strong matches
 */
export function getMatchExplanations(
  anime: AnimeTitle,
  userProfile: Record<string, number>
): Array<{dimension: string, strength: number, explanation: string}> {
  const animeDimensions = mapAnimeToDimensions(anime);
  const matches: Array<{dimension: string, strength: number, explanation: string}> = [];

  // Dimension names in human-readable format
  const dimensionNames: Record<string, string> = {
    visualComplexity: 'Visual Complexity',
    colorSaturation: 'Color Vibrancy',
    visualPace: 'Visual Pacing',
    narrativeComplexity: 'Story Complexity',
    narrativePace: 'Narrative Pacing',
    plotPredictability: 'Plot Predictability',
    characterComplexity: 'Character Depth',
    characterGrowth: 'Character Development',
    emotionalIntensity: 'Emotional Intensity',
    emotionalValence: 'Emotional Tone',
    moralAmbiguity: 'Moral Ambiguity',
    fantasyRealism: 'Fantasy vs. Realism',
    intellectualEmotional: 'Intellectual Appeal',
    noveltyFamiliarity: 'Novelty'
  };

  // Explanation templates
  const explanationTemplates: Record<string, Array<string>> = {
    visualComplexity: [
      'Matches your preference for {value} visual detail and complexity',
      'The {value} visual style aligns with your preferences'
    ],
    colorSaturation: [
      'Features {value} color palette that suits your taste',
      'The {value} visual tones match your preferences'
    ],
    narrativeComplexity: [
      'Has a {value} storyline complexity that you tend to enjoy',
      'Features a {value} narrative structure that matches your preferences'
    ],
    characterComplexity: [
      'Contains {value} characters that match your preference depth',
      'The {value} character development aligns with your taste'
    ],
    emotionalIntensity: [
      'Delivers {value} emotional impact that resonates with you',
      'The {value} emotional moments match your preferences'
    ],
    fantasyRealism: [
      'Balances fantasy and realism in a way that appeals to you',
      'The {value} setting matches your preference for fantasy vs. realism'
    ]
  };

  // Value descriptors
  const getValueDescriptor = (dimension: string, value: number): string => {
    if (dimension === 'emotionalValence') {
      if (value > 3) return 'uplifting';
      if (value > 1) return 'positive';
      if (value > -1) return 'balanced';
      if (value > -3) return 'somber';
      return 'dark';
    }

    if (dimension === 'fantasyRealism') {
      if (value > 3) return 'highly fantastical';
      if (value > 1) return 'fantasy-oriented';
      if (value > -1) return 'balanced';
      if (value > -3) return 'grounded';
      return 'highly realistic';
    }

    if (dimension === 'intellectualEmotional') {
      if (value > 3) return 'intellectually stimulating';
      if (value > 1) return 'thought-provoking';
      if (value > -1) return 'balanced';
      if (value > -3) return 'emotionally engaging';
      return 'emotionally powerful';
    }

    if (dimension === 'noveltyFamiliarity') {
      if (value > 3) return 'highly innovative';
      if (value > 1) return 'fresh';
      if (value > -1) return 'balanced';
      if (value > -3) return 'comfortably familiar';
      return 'classic';
    }

    // For 0-10 scale dimensions
    if (value >= 8) return 'high';
    if (value >= 6) return 'moderate';
    if (value >= 4) return 'balanced';
    if (value >= 2) return 'subtle';
    return 'minimal';
  };

  // Calculate match strength for each dimension
  Object.entries(userProfile).forEach(([dimension, userValue]) => {
    if (dimension in animeDimensions) {
      const animeValue = animeDimensions[dimension];

      // Calculate how close the anime is to user's preference
      let similarity: number;

      if (dimension === 'emotionalValence' || dimension === 'fantasyRealism' ||
          dimension === 'intellectualEmotional' || dimension === 'noveltyFamiliarity') {
        // For -5 to 5 scale, normalize distance to 0-1
        similarity = 1 - (Math.abs(userValue - animeValue) / 10);
      } else {
        // For 0-10 scale, normalize distance to 0-1
        similarity = 1 - (Math.abs(userValue - animeValue) / 10);
      }

      // Only include strong matches
      if (similarity >= 0.8) {
        const descriptor = getValueDescriptor(dimension, animeValue);

        // Get a random explanation template
        const templates = explanationTemplates[dimension] || [
          `Matches your preference for ${dimensionNames[dimension] || dimension}`
        ];
        const template = templates[Math.floor(Math.random() * templates.length)];

        const explanation = template.replace('{value}', descriptor);

        matches.push({
          dimension,
          strength: similarity,
          explanation
        });
      }
    }
  });

  // Sort by match strength (highest first)
  matches.sort((a, b) => b.strength - a.strength);

  // Return top matches
  return matches.slice(0, 3);
}

/**
 * Calculate overall match score between anime and user profile
 *
 * @param anime Anime title or pre-mapped dimensions
 * @param userProfile User's psychological profile
 * @returns Match score from 0-100
 */
export function calculateMatchScore(
  anime: AnimeTitle | Record<string, number>,
  userProfile: Record<string, number>
): number {
  // Get anime dimensions if not already provided
  const animeDimensions = 'title' in anime ? mapAnimeToDimensions(anime as AnimeTitle) : anime;

  // Dimension importance weights
  const dimensionWeights: Record<string, number> = {
    visualComplexity: 0.8,
    colorSaturation: 0.6,
    visualPace: 0.7,
    narrativeComplexity: 1.0,
    narrativePace: 0.8,
    plotPredictability: 0.8,
    characterComplexity: 1.0,
    characterGrowth: 0.9,
    emotionalIntensity: 0.9,
    emotionalValence: 0.8,
    moralAmbiguity: 0.7,
    fantasyRealism: 0.8,
    intellectualEmotional: 0.8,
    noveltyFamiliarity: 0.6
  };

  let totalWeight = 0;
  let weightedSimilaritySum = 0;

  // Calculate weighted similarity across all dimensions
  Object.entries(userProfile).forEach(([dimension, userValue]) => {
    if (dimension in animeDimensions && dimension in dimensionWeights) {
      const animeValue = animeDimensions[dimension];
      const weight = dimensionWeights[dimension];

      // Calculate similarity based on dimension scale
      let similarity: number;

      if (dimension === 'emotionalValence' || dimension === 'fantasyRealism' ||
          dimension === 'intellectualEmotional' || dimension === 'noveltyFamiliarity') {
        // For -5 to 5 scale, normalize distance to 0-1
        similarity = 1 - (Math.abs(userValue - animeValue) / 10);
      } else {
        // For 0-10 scale, normalize distance to 0-1
        similarity = 1 - (Math.abs(userValue - animeValue) / 10);
      }

      weightedSimilaritySum += similarity * weight;
      totalWeight += weight;
    }
  });

  // Calculate final weighted score (0-100)
  const matchScore = (weightedSimilaritySum / totalWeight) * 100;

  // Round to nearest integer
  return Math.round(matchScore);
}
