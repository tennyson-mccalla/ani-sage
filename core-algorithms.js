/**
 * Core Recommendation Algorithms
 * 
 * This module contains the key algorithms for the psychological anime 
 * recommendation system, including profile updating, filtering, and
 * recommendation generation.
 */

const { DIMENSIONS, dimensionPredictiveness } = require('./question-bank');

/**
 * Updates a user's psychological profile based on their response to a question
 * 
 * @param {Object} userProfile - Current user profile
 * @param {String} questionId - ID of the answered question
 * @param {String} selectedOptionId - ID of the selected option
 * @param {Array} questions - Question bank
 * @returns {Object} Updated user profile
 */
function updateUserProfile(userProfile, questionId, selectedOptionId, questions) {
  // Find the question and selected option
  const question = questions.find(q => q.id === questionId);
  if (!question) return userProfile;
  
  const selectedOption = question.options.find(o => o.id === selectedOptionId);
  if (!selectedOption) return userProfile;
  
  // Create a copy of the profile to update
  const newProfile = {
    ...userProfile,
    dimensions: { ...userProfile.dimensions },
    confidences: { ...userProfile.confidences },
    answeredQuestions: [...(userProfile.answeredQuestions || [])],
    interactionCount: (userProfile.interactionCount || 0) + 1,
    lastUpdated: new Date().toISOString()
  };
  
  // Update each dimension based on the selected option's mappings
  selectedOption.mappings.forEach(mapping => {
    const { dimension, value } = mapping;
    
    // Get current values or set defaults
    const currentValue = newProfile.dimensions[dimension] !== undefined 
      ? newProfile.dimensions[dimension] 
      : (DIMENSIONS[dimension].min + DIMENSIONS[dimension].max) / 2; // Default to middle
      
    const currentConfidence = newProfile.confidences[dimension] || 0.3; // Default confidence
    
    // Get dimension predictiveness
    const dimensionPower = dimensionPredictiveness[dimension] || 0.5;
    
    // Calculate new confidence level (increases with more data points)
    const newConfidence = Math.min(0.9, currentConfidence + 0.15 * dimensionPower);
    
    // Calculate weighted average based on confidence
    const oldValueWeight = currentConfidence;
    const newValueWeight = dimensionPower * (1 - currentConfidence);
    const totalWeight = oldValueWeight + newValueWeight;
    
    const updatedValue = ((currentValue * oldValueWeight) + (value * newValueWeight)) / totalWeight;
    
    // Ensure value stays within dimension bounds
    const bounds = DIMENSIONS[dimension];
    newProfile.dimensions[dimension] = Math.max(
      bounds.min, 
      Math.min(bounds.max, updatedValue)
    );
    
    // Update confidence
    newProfile.confidences[dimension] = newConfidence;
  });
  
  // Record that this question has been answered
  newProfile.answeredQuestions.push(questionId);
  
  return newProfile;
}

/**
 * Selects the next appropriate questions based on user profile
 * 
 * @param {Object} userProfile - Current user profile
 * @param {Array} questions - Complete question bank
 * @param {Number} count - Number of questions to return
 * @returns {Array} Selected questions
 */
function selectNextQuestions(userProfile, questions, count = 3) {
  // Get answered questions
  const answeredQuestionIds = userProfile.answeredQuestions || [];
  
  // Get eligible questions
  const eligibleQuestions = questions.filter(question => {
    // Skip already answered questions
    if (answeredQuestionIds.includes(question.id)) {
      return false;
    }
    
    // Check prerequisites
    if (question.prerequisiteScore) {
      for (const prereq of question.prerequisiteScore) {
        const userValue = userProfile.dimensions[prereq.dimension];
        
        // Skip if user doesn't have a value for this dimension
        if (userValue === undefined) {
          return false;
        }
        
        // Skip if value doesn't fall within required range
        if (userValue < prereq.minValue || userValue > prereq.maxValue) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  // Determine appropriate stage
  let targetStage = 1;
  const interactionCount = userProfile.interactionCount || 0;
  
  if (interactionCount > 15) {
    targetStage = 5;
  } else if (interactionCount > 10) {
    targetStage = 4;
  } else if (interactionCount > 5) {
    targetStage = 3;
  } else if (interactionCount > 2) {
    targetStage = 2;
  }
  
  // Prioritize questions from the target stage
  const stageQuestions = eligibleQuestions.filter(q => q.stage === targetStage);
  
  // If we don't have enough stage questions, add questions from other stages
  let selectedQuestions = [...stageQuestions];
  
  if (selectedQuestions.length < count) {
    // Add questions from adjacent stages
    const otherStages = [targetStage - 1, targetStage + 1].filter(s => s > 0 && s <= 5);
    const additionalQuestions = eligibleQuestions
      .filter(q => otherStages.includes(q.stage) && !selectedQuestions.includes(q))
      .slice(0, count - selectedQuestions.length);
    
    selectedQuestions = [...selectedQuestions, ...additionalQuestions];
  }
  
  // If we still don't have enough, add questions from any stage
  if (selectedQuestions.length < count) {
    const remainingQuestions = eligibleQuestions
      .filter(q => !selectedQuestions.includes(q))
      .slice(0, count - selectedQuestions.length);
    
    selectedQuestions = [...selectedQuestions, ...remainingQuestions];
  }
  
  // Randomize order slightly to prevent predictability
  return shuffleArray(selectedQuestions).slice(0, count);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate anime recommendations based on user profile
 * 
 * @param {Object} userProfile - User psychological profile
 * @param {Array} animeDatabase - Complete anime database
 * @param {Number} resultCount - Number of results to return
 * @returns {Array} Recommended anime with scores and explanations
 */
function generateRecommendations(userProfile, animeDatabase, resultCount = 10) {
  // Stage 1: Initial filtering
  const filteredAnime = initialFiltering(userProfile, animeDatabase);
  
  // Stage 2: Cluster similar anime
  const clusters = clusterSimilarAnime(filteredAnime);
  
  // Stage 3: Select representatives from relevant clusters
  const relevantClusters = findRelevantClusters(clusters, userProfile);
  const representatives = selectClusterRepresentatives(relevantClusters, userProfile);
  
  // Stage 4: Detailed scoring of representatives
  const scoredResults = detailedScoring(representatives, userProfile);
  
  // Stage 5: Diversify final results
  return diversifyResults(scoredResults, resultCount);
}

/**
 * Initial broad filtering based on high-confidence dimensions
 */
function initialFiltering(userProfile, animeDatabase) {
  // Get high-confidence dimensions
  const highConfidenceDimensions = Object.keys(userProfile.dimensions)
    .filter(dimension => {
      const confidence = userProfile.confidences[dimension] || 0;
      return confidence > 0.6 && dimensionPredictiveness[dimension] > 0.6;
    });
  
  // If we don't have enough confident dimensions, return popular titles
  if (highConfidenceDimensions.length < 2) {
    return [...animeDatabase]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 500);
  }
  
  // Filter based on high-confidence dimensions
  return animeDatabase.filter(anime => {
    let matchCount = 0;
    let totalDimensions = 0;
    
    highConfidenceDimensions.forEach(dimension => {
      const userValue = userProfile.dimensions[dimension];
      const animeValue = anime.attributes[dimension];
      
      if (animeValue !== undefined) {
        totalDimensions++;
        
        // Check if within a reasonable range (30% of dimension range)
        const dimensionRange = DIMENSIONS[dimension].max - DIMENSIONS[dimension].min;
        const difference = Math.abs(userValue - animeValue);
        const normalizedDifference = difference / dimensionRange;
        
        if (normalizedDifference < 0.3) {
          matchCount++;
        }
      }
    });
    
    // Must match on at least half of the available dimensions
    return totalDimensions > 0 && matchCount >= Math.max(1, Math.floor(totalDimensions / 2));
  });
}

/**
 * Group similar anime into clusters
 */
function clusterSimilarAnime(animeList) {
  // Create clusters based on key attributes
  const clusters = {};
  
  animeList.forEach(anime => {
    // Create a simplified feature representation
    const features = {
      visualStyle: getFeatureValue(anime, ['visualComplexity', 'colorSaturation']),
      narrativeStyle: getFeatureValue(anime, ['narrativeComplexity', 'narrativePace']),
      characterStyle: getFeatureValue(anime, ['characterComplexity', 'characterGrowth']),
      emotionalTone: getFeatureValue(anime, ['emotionalIntensity', 'emotionalValence']),
      themeStyle: getFeatureValue(anime, ['moralAmbiguity', 'fantasyRealism'])
    };
    
    // Generate cluster key
    const clusterKey = generateClusterKey(features);
    
    // Add to appropriate cluster
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    
    clusters[clusterKey].push(anime);
  });
  
  return clusters;
}

/**
 * Get aggregated feature value from anime attributes
 */
function getFeatureValue(anime, dimensions) {
  let sum = 0;
  let count = 0;
  
  dimensions.forEach(dim => {
    if (anime.attributes[dim] !== undefined) {
      sum += anime.attributes[dim];
      count++;
    }
  });
  
  return count > 0 ? sum / count : 5; // Default to middle value
}

/**
 * Generate cluster key from features
 */
function generateClusterKey(features) {
  // Simplify each feature into buckets (low, medium, high)
  const visualBucket = getBucket(features.visualStyle);
  const narrativeBucket = getBucket(features.narrativeStyle);
  const characterBucket = getBucket(features.characterStyle);
  const emotionalBucket = getBucket(features.emotionalTone);
  const themeBucket = getBucket(features.themeStyle);
  
  return `${visualBucket}-${narrativeBucket}-${characterBucket}-${emotionalBucket}-${themeBucket}`;
}

/**
 * Convert numeric value to bucket label
 */
function getBucket(value, buckets = 3) {
  const bucketSize = 10 / buckets;
  return Math.floor(value / bucketSize);
}

/**
 * Find clusters relevant to the user's profile
 */
function findRelevantClusters(clusters, userProfile) {
  // Create feature representation of user
  const userFeatures = {
    visualStyle: getProfileFeatureValue(userProfile, ['visualComplexity', 'colorSaturation']),
    narrativeStyle: getProfileFeatureValue(userProfile, ['narrativeComplexity', 'narrativePace']),
    characterStyle: getProfileFeatureValue(userProfile, ['characterComplexity', 'characterGrowth']),
    emotionalTone: getProfileFeatureValue(userProfile, ['emotionalIntensity', 'emotionalValence']),
    themeStyle: getProfileFeatureValue(userProfile, ['moralAmbiguity', 'fantasyRealism'])
  };
  
  // Generate user's cluster key
  const userClusterKey = generateClusterKey(userFeatures);
  
  // Get primary and adjacent cluster keys
  const clusterKeys = [userClusterKey, ...generateAdjacentClusterKeys(userClusterKey)];
  
  // Return relevant clusters that exist
  const relevantClusters = {};
  
  clusterKeys.forEach(key => {
    if (clusters[key] && clusters[key].length > 0) {
      relevantClusters[key] = clusters[key];
    }
  });
  
  return relevantClusters;
}

/**
 * Get feature value from user profile
 */
function getProfileFeatureValue(userProfile, dimensions) {
  let sum = 0;
  let count = 0;
  
  dimensions.forEach(dim => {
    if (userProfile.dimensions[dim] !== undefined) {
      sum += userProfile.dimensions[dim];
      count++;
    }
  });
  
  return count > 0 ? sum / count : 5; // Default to middle value
}

/**
 * Generate keys for clusters adjacent to the given key
 */
function generateAdjacentClusterKeys(key) {
  // Parse key components
  const components = key.split('-').map(c => parseInt(c));
  
  // Generate adjacent keys by varying each component by +/-1
  const adjacentKeys = [];
  
  for (let i = 0; i < components.length; i++) {
    for (let delta of [-1, 1]) {
      const newComponents = [...components];
      newComponents[i] = Math.max(0, Math.min(2, newComponents[i] + delta));
      adjacentKeys.push(newComponents.join('-'));
    }
  }
  
  return adjacentKeys;
}

/**
 * Select representative anime from relevant clusters
 */
function selectClusterRepresentatives(relevantClusters, userProfile) {
  const representatives = [];
  
  // Process each relevant cluster
  Object.entries(relevantClusters).forEach(([clusterKey, animeList]) => {
    // Score each anime in the cluster
    const scoredAnime = animeList.map(anime => ({
      anime,
      score: calculateDetailedScore(anime, userProfile)
    }));
    
    // Get top representatives from each cluster
    const topFromCluster = scoredAnime
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    representatives.push(...topFromCluster);
  });
  
  return representatives;
}

/**
 * Calculate detailed matching score between anime and user profile
 */
function calculateDetailedScore(anime, userProfile) {
  let score = 0;
  let totalWeight = 0;
  
  // Score all dimensions where we have data
  Object.entries(userProfile.dimensions).forEach(([dimension, userValue]) => {
    if (anime.attributes[dimension] !== undefined) {
      // Get dimension importance and user confidence
      const importance = dimensionPredictiveness[dimension] || 0.5;
      const confidence = userProfile.confidences[dimension] || 0.5;
      
      // Combined weight factors in both predictiveness and confidence
      const weight = importance * confidence;
      
      // Calculate match quality (10 = perfect match, 0 = worst match)
      const dimensionRange = DIMENSIONS[dimension].max - DIMENSIONS[dimension].min;
      const difference = Math.abs(userValue - anime.attributes[dimension]);
      const normalizedDifference = difference / dimensionRange;
      const match = 10 * (1 - normalizedDifference);
      
      score += match * weight;
      totalWeight += weight;
    }
  });
  
  // Normalize score
  const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
  
  // Small bonus for popularity (to break ties)
  const popularityBonus = anime.popularity ? (anime.popularity / 10000) * 0.5 : 0;
  
  return normalizedScore + popularityBonus;
}

/**
 * Ensure diverse results in the final set
 */
function diversifyResults(scoredResults, resultCount) {
  // First pass - get highest scoring anime from distinct clusters
  const usedClusters = new Set();
  const diverseResults = [];
  
  // Sort by score first
  const sortedResults = [...scoredResults].sort((a, b) => b.score - a.score);
  
  // Add one from each cluster
  sortedResults.forEach(result => {
    // Extract cluster from anime or calculate it
    const cluster = result.anime.cluster || 
                    generateClusterKey({
                      visualStyle: getFeatureValue(result.anime, ['visualComplexity', 'colorSaturation']),
                      narrativeStyle: getFeatureValue(result.anime, ['narrativeComplexity', 'narrativePace']),
                      characterStyle: getFeatureValue(result.anime, ['characterComplexity', 'characterGrowth']),
                      emotionalTone: getFeatureValue(result.anime, ['emotionalIntensity', 'emotionalValence']),
                      themeStyle: getFeatureValue(result.anime, ['moralAmbiguity', 'fantasyRealism'])
                    });
    
    if (!usedClusters.has(cluster) && diverseResults.length < resultCount) {
      diverseResults.push(result);
      usedClusters.add(cluster);
    }
  });
  
  // Fill remaining slots with highest scoring remaining anime
  if (diverseResults.length < resultCount) {
    const remainingResults = sortedResults.filter(r => !diverseResults.includes(r));
    diverseResults.push(...remainingResults.slice(0, resultCount - diverseResults.length));
  }
  
  // Generate explanations
  return diverseResults.map(result => ({
    ...result,
    matchReasons: generateMatchReasons(result.anime, userProfile)
  })).slice(0, resultCount);
}

/**
 * Generate human-readable match reasons
 */
function generateMatchReasons(anime, userProfile) {
  // Find the dimensions with strongest matches
  const dimensionMatches = [];
  
  Object.entries(userProfile.dimensions).forEach(([dimension, userValue]) => {
    if (anime.attributes[dimension] !== undefined) {
      const dimensionRange = DIMENSIONS[dimension].max - DIMENSIONS[dimension].min;
      const difference = Math.abs(userValue - anime.attributes[dimension]);
      const normalizedDifference = difference / dimensionRange;
      const matchStrength = 1 - normalizedDifference;
      
      if (matchStrength > 0.7) {
        dimensionMatches.push({
          dimension,
          strength: matchStrength,
          userValue,
          animeValue: anime.attributes[dimension]
        });
      }
    }
  });
  
  // Sort by match strength
  const topMatches = dimensionMatches
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);
  
  // Generate explanations
  return topMatches.map(match => ({
    dimension: match.dimension,
    strength: match.strength,
    explanation: generateExplanationForDimension(match.dimension, match.strength)
  }));
}

/**
 * Generate human-readable explanation for dimension match
 */
function generateExplanationForDimension(dimension, strength) {
  const explanations = {
    visualComplexity: [
      "The visual style matches your preference for complexity and detail.",
      "The artistic approach aligns with your visual preferences."
    ],
    colorSaturation: [
      "The color palette resonates with your color preferences.",
      "The visual tone matches your preference for color intensity."
    ],
    narrativeComplexity: [
      "The storytelling style has the level of complexity you enjoy.",
      "The narrative structure aligns with your preference for complexity."
    ],
    narrativePace: [
      "The story unfolds at a pace that matches your preference.",
      "The pacing of events aligns with your preferred storytelling rhythm."
    ],
    characterComplexity: [
      "The character depth matches your preference for complexity.",
      "The character development has the nuance you appreciate."
    ],
    emotionalIntensity: [
      "The emotional impact aligns with your preferred intensity.",
      "The emotional depth matches what resonates with you."
    ],
    moralAmbiguity: [
      "The moral complexity aligns with your comfort for ambiguity.",
      "The ethical dimensions match your preference for nuanced dilemmas."
    ],
    fantasyRealism: [
      "The balance of fantasy and realism matches your preference.",
      "The world-building approach aligns with your taste."
    ]
  };
  
  // Default explanation if specific one not available
  const defaultExplanations = [
    "Elements of this story align with your preferences.",
    "This matches your demonstrated preferences in significant ways."
  ];
  
  // Get appropriate explanations
  const options = explanations[dimension] || defaultExplanations;
  
  // Select one randomly
  return options[Math.floor(Math.random() * options.length)];
}

module.exports = {
  updateUserProfile,
  selectNextQuestions,
  generateRecommendations
};
