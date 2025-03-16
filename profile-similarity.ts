import type { UserProfile } from './data-models';
import { PsychologicalDimensions, normalizeDimension } from './psychological-dimensions';

/**
 * Calculate similarity between a user profile and anime attributes
 * Returns a score from 0-1 where 1 is perfect match
 */
export function calculateProfileSimilarity(
  profile: UserProfile, 
  attributes: { [dimension: string]: number },
  options: {
    confidenceWeighting?: boolean,  // Whether to weight by confidence
    dimensionImportance?: boolean   // Whether to weight by dimension importance
  } = {}
): { 
  overallScore: number, 
  dimensionScores: { [dimension: string]: number } 
} {
  const { confidenceWeighting = true, dimensionImportance = true } = options;
  
  // Get all dimensions that exist in both profile and anime
  const sharedDimensions = Object.keys(profile.dimensions)
    .filter(dim => dim in attributes && dim in PsychologicalDimensions);
  
  if (sharedDimensions.length === 0) {
    return { 
      overallScore: 0, 
      dimensionScores: {} 
    };
  }
  
  // Calculate score for each dimension
  const dimensionScores: { [dimension: string]: number } = {};
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const dimension of sharedDimensions) {
    // Normalize both values to 0-1 for comparison
    const profileValueNorm = normalizeDimension(dimension, profile.dimensions[dimension]);
    const animeValueNorm = normalizeDimension(dimension, attributes[dimension]);
    
    // Calculate similarity on this dimension (1 - distance)
    // Distance is squared to penalize larger differences more
    const similarity = 1 - Math.pow(Math.abs(profileValueNorm - animeValueNorm), 2);
    dimensionScores[dimension] = similarity;
    
    // Calculate weight for this dimension based on confidence and importance
    let weight = 1.0;
    
    if (confidenceWeighting && profile.confidences?.[dimension]) {
      weight *= profile.confidences[dimension];
    }
    
    if (dimensionImportance && PsychologicalDimensions[dimension]) {
      weight *= PsychologicalDimensions[dimension].importance;
    }
    
    // If no weighting is applied, use equal weights
    if (!confidenceWeighting && !dimensionImportance) {
      weight = 1;
    }
    
    weightedSum += similarity * weight;
    totalWeight += weight;
  }
  
  // Calculate final score
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    overallScore,
    dimensionScores
  };
}

/**
 * Generate explanation for why an anime matches a user profile
 */
export function generateMatchReasons(
  profile: UserProfile,
  attributes: { [dimension: string]: number },
  similarityResult: { 
    overallScore: number, 
    dimensionScores: { [dimension: string]: number } 
  }
): {
  dimension: string;
  strength: number;
  explanation: string;
}[] {
  // Get top 3 matching dimensions by score
  const sortedDimensions = Object.entries(similarityResult.dimensionScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .slice(0, 3);
  
  return sortedDimensions.map(([dimension, score]) => {
    const profileValue = profile.dimensions[dimension];
    const animeValue = attributes[dimension];
    
    // Generate natural language explanation based on the dimension
    let explanation = '';
    
    switch (dimension) {
      case 'visualComplexity':
        explanation = animeValue > 7
          ? "This anime's detailed and complex visual style aligns with your preferences."
          : "This anime's clean and focused visual style matches your preferences.";
        break;
        
      case 'narrativeComplexity':
        explanation = animeValue > 7
          ? "The multi-layered storytelling in this anime suits your preference for complex narratives."
          : "The straightforward narrative style of this anime matches your preferences.";
        break;
        
      case 'emotionalIntensity':
        explanation = animeValue > 7
          ? "The emotional depth and intensity of this series aligns with your preferences."
          : "The measured emotional tone of this series matches your viewing preferences.";
        break;
        
      case 'moralAmbiguity':
        explanation = animeValue > 7
          ? "You tend to enjoy morally complex stories like this one."
          : "This anime's clear moral framework aligns with your preferences.";
        break;
        
      case 'fantasyRealism':
        explanation = animeValue > 0
          ? "The fantastical elements in this anime align with your preference for imaginative worlds."
          : "The realistic setting of this anime matches your preference for grounded stories.";
        break;
        
      case 'characterComplexity':
        explanation = animeValue > 7
          ? "This anime features the kind of nuanced, complex characters you tend to enjoy."
          : "The straightforward character archetypes in this anime match your preferences.";
        break;
        
      default:
        // Generic explanation for other dimensions
        explanation = `This anime's ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()} closely aligns with your preferences.`;
    }
    
    return {
      dimension,
      strength: score,
      explanation
    };
  });
}

/**
 * Calculate the distance between two profiles in the psychological dimension space
 */
export function calculateProfileDistance(
  profileA: UserProfile, 
  profileB: UserProfile
): number {
  // Get shared dimensions
  const sharedDimensions = Object.keys(profileA.dimensions)
    .filter(dim => dim in profileB.dimensions && dim in PsychologicalDimensions);
  
  if (sharedDimensions.length === 0) {
    return 1; // Maximum distance if no shared dimensions
  }
  
  // Calculate Euclidean distance in normalized space
  let sumSquaredDiff = 0;
  
  for (const dimension of sharedDimensions) {
    const valueA = normalizeDimension(dimension, profileA.dimensions[dimension]);
    const valueB = normalizeDimension(dimension, profileB.dimensions[dimension]);
    
    sumSquaredDiff += Math.pow(valueA - valueB, 2);
  }
  
  // Return normalized distance (0-1)
  return Math.sqrt(sumSquaredDiff / sharedDimensions.length);
}