import type { UserProfile, Question, QuestionOption } from './data-models';
import { getEmptyConfidences, getEmptyDimensions, PsychologicalDimensions } from './psychological-dimensions';

/**
 * Core profile update algorithm
 * 
 * Updates a user profile based on answers to psychological questions.
 * Uses Bayesian updating to gradually improve dimension estimates with confidence.
 */
export function updateProfileFromQuestion(
  profile: UserProfile,
  question: Question,
  selectedOptionId: string
): UserProfile {
  // Find the selected option
  const selectedOption = question.options.find(option => option.id === selectedOptionId);
  if (!selectedOption) {
    console.warn(`Selected option ${selectedOptionId} not found in question ${question.id}`);
    return profile;
  }
  
  // Create a copy of the profile for updating
  const updatedProfile: UserProfile = {
    ...profile,
    dimensions: { ...profile.dimensions },
    confidences: { ...profile.confidences },
    answeredQuestions: [...profile.answeredQuestions, question.id],
    interactionCount: profile.interactionCount + 1,
    lastUpdated: new Date().toISOString()
  };
  
  // Apply each mapping from the selected option
  for (const mapping of selectedOption.mappings) {
    const { dimension, value, confidence } = mapping;
    
    // Skip if this is not a valid dimension
    if (!(dimension in PsychologicalDimensions)) {
      continue;
    }
    
    // Get current values (or defaults)
    const currentValue = profile.dimensions[dimension] || 0;
    const currentConfidence = profile.confidences[dimension] || 0;
    
    // Apply Bayesian update
    const updatedValue = applyBayesianUpdate(
      currentValue, 
      value, 
      currentConfidence, 
      confidence
    );
    
    // Update confidence (confidence grows with each data point, but never reaches 1)
    const updatedConfidence = combineConfidences(currentConfidence, confidence);
    
    // Store updated values
    updatedProfile.dimensions[dimension] = updatedValue;
    updatedProfile.confidences[dimension] = updatedConfidence;
  }
  
  return updatedProfile;
}

/**
 * Apply a Bayesian update to a dimension value
 * 
 * This creates a weighted average that favors the value with higher confidence
 */
function applyBayesianUpdate(
  currentValue: number,
  newValue: number,
  currentConfidence: number,
  newConfidence: number
): number {
  // If no prior confidence, just use the new value
  if (currentConfidence === 0) {
    return newValue;
  }
  
  // If no new confidence, keep current value
  if (newConfidence === 0) {
    return currentValue;
  }
  
  // Weighted average based on relative confidences
  const combinedWeight = currentConfidence + newConfidence;
  return (
    (currentValue * currentConfidence) + 
    (newValue * newConfidence)
  ) / combinedWeight;
}

/**
 * Combine confidence values
 * 
 * This increases confidence with each data point, but with diminishing returns
 */
function combineConfidences(
  currentConfidence: number,
  newConfidence: number
): number {
  // Start with a simple normalized average if current confidence is 0
  if (currentConfidence === 0) {
    return Math.min(newConfidence, 0.5); // Cap initial confidence at 0.5
  }
  
  // Combine confidences non-linearly to avoid reaching 1.0 too quickly
  // This formula gives diminishing returns as confidence increases
  const combinedConfidence = currentConfidence + 
    (1 - currentConfidence) * newConfidence * 0.5;
  
  return Math.min(combinedConfidence, 0.95); // Cap at 0.95 to never reach perfect confidence
}

/**
 * Update a profile based on anime feedback
 * 
 * This is used when a user rates an anime or expresses preferences about it
 */
export function updateProfileFromAnimeFeedback(
  profile: UserProfile,
  animeAttributes: { [dimension: string]: number },
  rating: number,  // User rating 1-10
  feedbackType: 'rating' | 'liked' | 'disliked' | 'neutral' = 'rating'
): UserProfile {
  // Create a copy of the profile for updating
  const updatedProfile: UserProfile = {
    ...profile,
    dimensions: { ...profile.dimensions },
    confidences: { ...profile.confidences },
    interactionCount: profile.interactionCount + 1,
    lastUpdated: new Date().toISOString()
  };
  
  // Convert rating to a feedback strength (0-1)
  let feedbackStrength: number;
  
  switch (feedbackType) {
    case 'liked':
      feedbackStrength = 0.8;
      break;
    case 'disliked':
      feedbackStrength = 0.8; // Same strength but will pull in opposite direction
      break;
    case 'neutral':
      feedbackStrength = 0.3;
      break;
    case 'rating':
    default:
      // Convert 1-10 rating to 0-1 strength
      // Ratings in the middle (5-6) have less influence than strong opinions
      feedbackStrength = Math.abs((rating - 5.5) / 4.5);
  }
  
  // Only use dimensions that exist in the anime attributes
  const validDimensions = Object.keys(animeAttributes)
    .filter(dim => dim in PsychologicalDimensions);
  
  for (const dimension of validDimensions) {
    const animeValue = animeAttributes[dimension];
    const currentValue = profile.dimensions[dimension] || 0;
    const currentConfidence = profile.confidences[dimension] || 0;
    
    // For liked/positive ratings, pull profile toward anime value
    // For disliked/negative ratings, pull profile away from anime value
    let targetValue: number;
    let updateConfidence: number;
    
    if (feedbackType === 'disliked' || (feedbackType === 'rating' && rating < 5.5)) {
      // For negative feedback, move away from the anime value
      // Calculate the opposite direction from the anime value
      const distanceFromMin = animeValue - PsychologicalDimensions[dimension].min;
      const distanceFromMax = PsychologicalDimensions[dimension].max - animeValue;
      
      // If closer to min, move toward max and vice versa
      if (distanceFromMin < distanceFromMax) {
        targetValue = animeValue + (PsychologicalDimensions[dimension].max - animeValue) / 2;
      } else {
        targetValue = animeValue - (animeValue - PsychologicalDimensions[dimension].min) / 2;
      }
      
      // Lower confidence for negative feedback (we know what they don't like, but not what they do)
      updateConfidence = feedbackStrength * 0.4;
    } else {
      // For positive feedback, move toward the anime value
      targetValue = animeValue;
      updateConfidence = feedbackStrength * 0.6;
    }
    
    // Apply Bayesian update with lower confidence than direct question answers
    updatedProfile.dimensions[dimension] = applyBayesianUpdate(
      currentValue, 
      targetValue, 
      currentConfidence, 
      updateConfidence
    );
    
    // Update confidence (lower impact than direct questions)
    updatedProfile.confidences[dimension] = combineConfidences(
      currentConfidence, 
      updateConfidence
    );
  }
  
  return updatedProfile;
}

/**
 * Generate dimension adjustment suggestions based on user's preferences
 * and anime ratings history.
 * 
 * This is useful for giving users a way to explicitly update their profile.
 */
export function generateProfileAdjustments(
  profile: UserProfile,
  ratedAnime: { anime: { attributes: { [dimension: string]: number } }, rating: number }[]
): {
  dimension: string,
  currentValue: number,
  suggestedValue: number,
  confidence: number,
  explanation: string
}[] {
  if (ratedAnime.length === 0) {
    return [];
  }
  
  // Calculate average values for each dimension from highly rated anime (rating > 7)
  const highlyRated = ratedAnime.filter(item => item.rating > 7);
  if (highlyRated.length === 0) {
    return [];
  }
  
  const dimensionValues: { [dimension: string]: number[] } = {};
  
  // Collect values for each dimension from highly rated anime
  for (const { anime } of highlyRated) {
    for (const [dimension, value] of Object.entries(anime.attributes)) {
      if (!(dimension in dimensionValues)) {
        dimensionValues[dimension] = [];
      }
      dimensionValues[dimension].push(value);
    }
  }
  
  // Find dimensions with significant differences
  const adjustments: {
    dimension: string,
    currentValue: number,
    suggestedValue: number,
    confidence: number,
    explanation: string
  }[] = [];
  
  for (const [dimension, values] of Object.entries(dimensionValues)) {
    // Skip dimensions with too few data points
    if (values.length < 2) continue;
    
    // Calculate average value from highly rated anime
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Get current profile value
    const currentValue = profile.dimensions[dimension] || 0;
    
    // Calculate normalized difference
    const normalizedDiff = Math.abs(avgValue - currentValue) / 
      (PsychologicalDimensions[dimension]?.max - 
       PsychologicalDimensions[dimension]?.min || 10);
    
    // Only suggest adjustment if difference is significant
    if (normalizedDiff > 0.25) {
      // Calculate confidence based on number of samples and agreement
      // More samples and lower variance = higher confidence
      const variance = calculateVariance(values);
      const normalizedVariance = variance / 
        Math.pow(PsychologicalDimensions[dimension]?.max - 
                PsychologicalDimensions[dimension]?.min || 10, 2);
      
      // Confidence based on number of samples and variance
      const confidence = Math.min(
        0.3 + (values.length / 10) * 0.3, 
        0.8
      ) * Math.max(0.5, 1 - normalizedVariance);
      
      // Generate explanation
      const explanation = generateAdjustmentExplanation(
        dimension, 
        currentValue, 
        avgValue, 
        values.length
      );
      
      adjustments.push({
        dimension,
        currentValue,
        suggestedValue: avgValue,
        confidence,
        explanation
      });
    }
  }
  
  // Sort by confidence descending and return top 3
  return adjustments
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
}

/**
 * Generate natural language explanation for a profile adjustment
 */
function generateAdjustmentExplanation(
  dimension: string,
  currentValue: number,
  suggestedValue: number,
  sampleCount: number
): string {
  // Direction of change
  const direction = suggestedValue > currentValue ? 'higher' : 'lower';
  
  // Get default explanation
  let explanation = `Based on ${sampleCount} anime you enjoyed, your ${dimension.replace(/([A-Z])/g, ' $1').toLowerCase()} appears to be ${direction} than your current profile suggests.`;
  
  // Customize explanation for specific dimensions
  switch (dimension) {
    case 'visualComplexity':
      explanation = suggestedValue > currentValue
        ? `You seem to enjoy anime with more detailed and complex visuals than your profile currently indicates.`
        : `You appear to prefer cleaner, simpler visuals than your profile currently suggests.`;
      break;
      
    case 'narrativeComplexity':
      explanation = suggestedValue > currentValue
        ? `The anime you enjoy tend to have more complex, multi-layered narratives than your profile indicates.`
        : `You seem to prefer more straightforward storytelling than your profile currently suggests.`;
      break;
      
    case 'emotionalIntensity':
      explanation = suggestedValue > currentValue
        ? `The anime you rate highly tend to have more emotional intensity than your profile suggests.`
        : `You seem to prefer anime with more measured emotional tones than your profile indicates.`;
      break;
      
    case 'moralAmbiguity':
      explanation = suggestedValue > currentValue
        ? `You appear to enjoy stories with more moral complexity than your profile suggests.`
        : `You seem to prefer stories with clearer moral frameworks than indicated in your profile.`;
      break;
  }
  
  return explanation;
}