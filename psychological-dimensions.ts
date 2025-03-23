import type { DimensionSet } from './data-models';

/**
 * Core psychological dimensions used throughout the system.
 * 
 * These dimensions are carefully chosen to map well to anime preferences while
 * being distinct from simple genre preferences. They represent deeper
 * psychological traits that influence media preferences.
 */
export const PsychologicalDimensions: DimensionSet = {
  // Cognitive dimensions
  
  visualComplexity: {
    min: 1,  // Simple, clean visuals
    max: 10, // Complex, detailed visuals
    description: "Preference for visual complexity and detail in animation",
    importance: 0.8
  },
  
  narrativeComplexity: {
    min: 1,  // Straightforward, linear stories
    max: 10, // Complex, multi-layered narratives
    description: "Preference for complex vs. straightforward narrative structures",
    importance: 0.9
  },
  
  abstractConcrete: {
    min: -5, // Very concrete, literal
    max: 5,  // Very abstract, metaphorical
    description: "Preference for concrete vs. abstract storytelling",
    importance: 0.7
  },
  
  noveltyFamiliarity: {
    min: -5, // Strong preference for familiar elements
    max: 5,  // Strong preference for novel experiences
    description: "Preference for familiar vs. novel experiences",
    importance: 0.6
  },
  
  // Emotional dimensions
  
  emotionalIntensity: {
    min: 1,  // Mild, gentle emotional experiences
    max: 10, // Intense, overwhelming emotional experiences
    description: "Preference for emotional intensity in content",
    importance: 0.85
  },
  
  emotionalValence: {
    min: -5, // Negative emotional tone (sad, tense)
    max: 5,  // Positive emotional tone (uplifting, joyful)
    description: "Preference for positive vs. negative emotional experiences",
    importance: 0.9  // Increased importance based on test results showing this dimension needs more weight
  },
  
  conflictResolution: {
    min: -5, // Preference for unresolved, ambiguous endings
    max: 5,  // Preference for clear resolution and closure
    description: "Preference for resolution style in storytelling",
    importance: 0.6
  },
  
  // Moral/Philosophical dimensions
  
  moralAmbiguity: {
    min: 1,  // Clear moral distinctions
    max: 10, // High moral ambiguity
    description: "Tolerance for moral ambiguity in characters and plots",
    importance: 0.8
  },
  
  idealismCynicism: {
    min: -5, // Cynical worldview
    max: 5,  // Idealistic worldview
    description: "Preference for idealistic vs. cynical perspectives",
    importance: 0.7
  },
  
  fantasyRealism: {
    min: -5, // Strong preference for realism
    max: 5,  // Strong preference for fantasy/escapism
    description: "Preference for realistic vs. fantastical settings",
    importance: 0.75
  },
  
  // Social dimensions
  
  socialComplexity: {
    min: 1,  // Focus on individual characters
    max: 10, // Complex social dynamics and relationships
    description: "Preference for social complexity and relationship dynamics",
    importance: 0.7
  },
  
  powerDynamics: {
    min: -5, // Interest in stories about the powerless
    max: 5,  // Interest in stories about the powerful
    description: "Interest in power dynamics and hierarchy",
    importance: 0.6
  },
  
  // Character dimensions
  
  characterComplexity: {
    min: 1,  // Simple, archetypal characters
    max: 10, // Complex, nuanced characters
    description: "Preference for character complexity and development",
    importance: 0.85
  },
  
  characterAgency: {
    min: -5, // Characters ruled by fate/circumstances
    max: 5,  // Characters with high personal agency
    description: "Preference for characters with different levels of agency",
    importance: 0.6
  },
  
  // Theme dimensions
  
  intellectualEmotional: {
    min: -5, // Strong focus on emotional aspects
    max: 5,  // Strong focus on intellectual aspects
    description: "Preference for emotional vs. intellectual engagement",
    importance: 0.7
  },
  
  traditionInnovation: {
    min: -5, // Respect for tradition and established forms
    max: 5,  // Valuing innovation and subversion of norms
    description: "Preference for traditional vs. innovative approaches",
    importance: 0.6
  }
};

/**
 * Get dimensions with values all set to zero - useful for initializing new profiles
 */
export const getEmptyDimensions = (): { [dimension: string]: number } => {
  const dimensions: { [dimension: string]: number } = {};
  
  for (const key of Object.keys(PsychologicalDimensions)) {
    dimensions[key] = 0;
  }
  
  return dimensions;
};

/**
 * Get dimensions with confidences all set to zero - useful for initializing new profiles
 */
export const getEmptyConfidences = (): { [dimension: string]: number } => {
  const confidences: { [dimension: string]: number } = {};
  
  for (const key of Object.keys(PsychologicalDimensions)) {
    confidences[key] = 0;
  }
  
  return confidences;
};

/**
 * Create new user profile with initial zero values
 */
export const createInitialProfile = (userId: string): import('./data-models').UserProfile => {
  return {
    userId,
    dimensions: getEmptyDimensions(),
    confidences: getEmptyConfidences(),
    answeredQuestions: [],
    lastUpdated: new Date().toISOString(),
    interactionCount: 0
  };
};

/**
 * Get a dimension's range (from min to max)
 */
export const getDimensionRange = (dimension: string): number => {
  const dim = PsychologicalDimensions[dimension];
  if (!dim) return 0;
  
  return dim.max - dim.min;
}

/**
 * Normalize a dimension value to 0-1 scale
 */
export const normalizeDimension = (dimension: string, value: number): number => {
  const dim = PsychologicalDimensions[dimension];
  if (!dim) return 0;
  
  // Normalize to 0-1 scale
  return (value - dim.min) / (dim.max - dim.min);
}

/**
 * Denormalize from 0-1 scale back to dimension's actual range
 */
export const denormalizeDimension = (dimension: string, normalizedValue: number): number => {
  const dim = PsychologicalDimensions[dimension];
  if (!dim) return 0;
  
  // Convert from 0-1 scale to actual range
  return dim.min + normalizedValue * (dim.max - dim.min);
}