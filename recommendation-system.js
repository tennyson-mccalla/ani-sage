/**
 * DEPRECATED: This file contains the original JavaScript conceptual implementation. 
 * See recommendation-engine.ts for the current TypeScript implementation.
 */

// Conceptual implementation of the psychological profile-based recommendation system

// Define the psychological dimensions we track
const dimensions = {
  // Approach to conflict (direct vs. indirect)
  resolutionStyle: { min: 0, max: 10 }, // 0: avoid, 10: confront
  
  // Preference for complexity  
  complexityPreference: { min: 0, max: 10 }, // 0: straightforward, 10: complex
  
  // Emotional vs. logical processing
  processingStyle: { min: 0, max: 10 }, // 0: emotional, 10: logical
  
  // Optimism vs. pessimism
  outlookPolarity: { min: -5, max: 5 }, // -5: pessimistic, 5: optimistic
  
  // Order vs. chaos preference
  orderChaosPreference: { min: -5, max: 5 }, // -5: order, 5: chaos
  
  // Past vs. future orientation
  temporalOrientation: { min: -5, max: 5 }, // -5: past, 5: future
  
  // Individual vs. collective focus
  socialOrientation: { min: -5, max: 5 }, // -5: individual, 5: collective
  
  // Color palette preferences (mapped to 3 dimensions)
  colorSaturation: { min: 0, max: 10 }, // 0: muted, 10: vibrant
  colorBrightness: { min: 0, max: 10 }, // 0: dark, 10: bright
  colorHarmony: { min: 0, max: 10 }, // 0: clashing, 10: harmonious
};

// Sample questions that map to dimensions
const questions = [
  {
    text: "You discover a secret passage. Do you...",
    options: [
      { text: "Explore it immediately", mappings: { resolutionStyle: 8, orderChaosPreference: 3 } },
      { text: "Research first, then explore", mappings: { resolutionStyle: 5, orderChaosPreference: -2 } },
      { text: "Tell others and explore as a group", mappings: { resolutionStyle: 3, socialOrientation: 4 } },
      { text: "Mark it but leave it alone", mappings: { resolutionStyle: 1, orderChaosPreference: -4 } }
    ]
  },
  {
    text: "Which color palette appeals to you most?",
    // Options would contain image references to different palettes
    options: [
      { text: "Palette A (Vibrant, high-contrast)", mappings: { colorSaturation: 9, colorBrightness: 8, colorHarmony: 5 } },
      { text: "Palette B (Muted, earthy tones)", mappings: { colorSaturation: 2, colorBrightness: 4, colorHarmony: 8 } },
      { text: "Palette C (Dark, rich colors)", mappings: { colorSaturation: 7, colorBrightness: 2, colorHarmony: 6 } },
      { text: "Palette D (Pastel, light colors)", mappings: { colorSaturation: 4, colorBrightness: 9, colorHarmony: 7 } }
    ]
  },
  // More questions would be defined here
];

// Function to update user profile based on responses with confidence weighting
function updateProfile(userProfile, questionId, selectedOptionIndex) {
  const question = questions.find(q => q.id === questionId);
  if (!question) return userProfile;
  
  const selectedOption = question.options[selectedOptionIndex];
  const newProfile = { ...userProfile };
  
  // Update each dimension based on the selected option's mappings
  Object.entries(selectedOption.mappings).forEach(([dimension, value]) => {
    // Get the predictive power of this dimension
    const dimensionPower = dimensionPredictiveness[dimension] || 0.5;
    
    // Get confidence in current value (starts low, increases with more data points)
    const currentConfidence = newProfile[`${dimension}_confidence`] || 0.3;
    const newConfidence = Math.min(0.9, currentConfidence + 0.15); // Confidence increases with more data
    
    if (newProfile[dimension] === undefined) {
      // First data point for this dimension
      newProfile[dimension] = value;
      newProfile[`${dimension}_confidence`] = 0.4; // Initial confidence
    } else {
      // Weighted average based on confidence and dimension power
      const oldValueWeight = currentConfidence;
      const newValueWeight = dimensionPower * (1 - currentConfidence);
      const totalWeight = oldValueWeight + newValueWeight;
      
      newProfile[dimension] = (
        (newProfile[dimension] * oldValueWeight) + 
        (value * newValueWeight)
      ) / totalWeight;
      
      newProfile[`${dimension}_confidence`] = newConfidence;
    }
    
    // Ensure the value stays within defined bounds
    const bounds = dimensions[dimension];
    newProfile[dimension] = Math.max(bounds.min, Math.min(bounds.max, newProfile[dimension]));
  });
  
  // Record this question has been answered to avoid repetition
  if (!newProfile.answeredQuestions) {
    newProfile.answeredQuestions = [];
  }
  newProfile.answeredQuestions.push(questionId);
  
  return newProfile;
}

// Define predictiveness of each dimension based on data analysis
const dimensionPredictiveness = {
  // Primary dimensions (highly predictive)
  visualAestheticPreference: 0.85,
  narrativeStructurePreference: 0.80,
  resolutionStyle: 0.78,
  complexityPreference: 0.75,
  emotionalTone: 0.72,
  
  // Secondary dimensions (moderately predictive)
  processingStyle: 0.68,
  outlookPolarity: 0.65,
  orderChaosPreference: 0.62,
  characterAttachment: 0.60,
  pacePreference: 0.58,
  
  // Tertiary dimensions (somewhat predictive)
  temporalOrientation: 0.50,
  socialOrientation: 0.48,
  colorSaturation: 0.45,
  colorBrightness: 0.40,
  colorHarmony: 0.35
};

// Advanced anime recommendation based on psychological profile with multi-stage filtering
function recommendAnime(userProfile, animeDatabase) {
  // Stage 1: Initial broad filtering based on highest confidence dimensions
  let filteredAnime = initialFiltering(userProfile, animeDatabase);
  
  // Stage 2: Similarity clustering to find representative anime
  const clusters = clusterSimilarAnime(filteredAnime);
  
  // Stage 3: Select top representatives from each relevant cluster
  const representatives = selectClusterRepresentatives(clusters, userProfile);
  
  // Stage 4: Fine-grained scoring of representatives and their nearest neighbors
  return detailedScoring(representatives, userProfile);
}

// Initial filtering to reduce from millions/thousands to hundreds
function initialFiltering(userProfile, animeDatabase) {
  // Get high-confidence dimensions
  const highConfidenceDimensions = Object.keys(userProfile)
    .filter(key => !key.endsWith('_confidence') && !key.includes('answeredQuestions'))
    .filter(dimension => {
      const confidence = userProfile[`${dimension}_confidence`] || 0;
      return confidence > 0.6 && dimensionPredictiveness[dimension] > 0.6;
    });
  
  if (highConfidenceDimensions.length === 0) {
    // Not enough high-confidence data, use broad filtering
    return animeDatabase.slice(0, 500); // Return top 500 popular titles
  }
  
  // Filter based on high-confidence dimensions only
  return animeDatabase.filter(anime => {
    let matchScore = 0;
    
    highConfidenceDimensions.forEach(dimension => {
      const userValue = userProfile[dimension];
      const animeValue = anime.attributes[dimension];
      
      if (animeValue !== undefined) {
        // Allow matches within a reasonable range
        const difference = Math.abs(userValue - animeValue);
        const dimensionRange = dimensions[dimension].max - dimensions[dimension].min;
        const normalizedDifference = difference / dimensionRange;
        
        if (normalizedDifference < 0.3) { // Within 30% of range
          matchScore++;
        }
      }
    });
    
    // Must match on at least half of the high-confidence dimensions
    return matchScore >= Math.max(1, Math.floor(highConfidenceDimensions.length / 2));
  });
}

// Group similar anime into clusters
function clusterSimilarAnime(animeList) {
  // This would use a real clustering algorithm in production
  // Simplified version for concept demonstration
  
  const clusters = {};
  
  animeList.forEach(anime => {
    // Create a feature vector for this anime
    const features = createFeatureVector(anime);
    
    // Find or create appropriate cluster
    let clusterKey = determineClusterKey(features);
    
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    
    clusters[clusterKey].push(anime);
  });
  
  return clusters;
}

// Create a feature vector representation of an anime
function createFeatureVector(anime) {
  // Extract core features that define similarity
  return {
    visualStyle: anime.attributes.visualAestheticPreference || 5,
    narrativeStyle: anime.attributes.narrativeStructurePreference || 5,
    pacing: anime.attributes.pacePreference || 5,
    toneKey: anime.attributes.emotionalTone || 5,
    characterDepth: anime.attributes.characterComplexity || 5
  };
}

// Determine which cluster an anime belongs to
function determineClusterKey(features) {
  // Simplified clustering logic
  // In production, this would use proper clustering algorithms
  
  const visualBucket = Math.floor(features.visualStyle / 2);
  const narrativeBucket = Math.floor(features.narrativeStyle / 3);
  const toneBucket = features.toneKey > 5 ? 'positive' : 'negative';
  
  return `${visualBucket}-${narrativeBucket}-${toneBucket}`;
}

// Select representatives from relevant clusters
function selectClusterRepresentatives(clusters, userProfile) {
  const representatives = [];
  
  // Determine which clusters are most relevant to user profile
  const relevantClusters = findRelevantClusters(clusters, userProfile);
  
  // Select top anime from each relevant cluster
  relevantClusters.forEach(clusterKey => {
    const cluster = clusters[clusterKey];
    if (!cluster || cluster.length === 0) return;
    
    // Score each anime in the cluster
    const scoredAnime = cluster.map(anime => ({
      anime,
      score: calculateDetailedScore(anime, userProfile)
    }));
    
    // Get top 2-3 from each cluster
    const topFromCluster = scoredAnime
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    representatives.push(...topFromCluster);
  });
  
  return representatives;
}

// Find clusters most relevant to the user's profile
function findRelevantClusters(clusters, userProfile) {
  // Create a feature vector for the user
  const userFeatures = {
    visualStyle: userProfile.visualAestheticPreference || 5,
    narrativeStyle: userProfile.narrativeStructurePreference || 5,
    pacing: userProfile.pacePreference || 5,
    toneKey: userProfile.emotionalTone || 5,
    characterDepth: userProfile.complexityPreference || 5
  };
  
  // Generate possible cluster keys based on user profile
  const userVisualBucket = Math.floor(userFeatures.visualStyle / 2);
  const userNarrativeBucket = Math.floor(userFeatures.narrativeStyle / 3);
  const userToneBucket = userFeatures.toneKey > 5 ? 'positive' : 'negative';
  
  const primaryKey = `${userVisualBucket}-${userNarrativeBucket}-${userToneBucket}`;
  
  // Also include adjacent clusters for diversity
  const adjacentKeys = [
    `${userVisualBucket+1}-${userNarrativeBucket}-${userToneBucket}`,
    `${userVisualBucket-1}-${userNarrativeBucket}-${userToneBucket}`,
    `${userVisualBucket}-${userNarrativeBucket+1}-${userToneBucket}`,
    `${userVisualBucket}-${userNarrativeBucket-1}-${userToneBucket}`,
    `${userVisualBucket}-${userNarrativeBucket}-${userToneBucket === 'positive' ? 'negative' : 'positive'}`
  ];
  
  // Return all relevant cluster keys that exist
  return [primaryKey, ...adjacentKeys].filter(key => clusters[key] && clusters[key].length > 0);
}

// Detailed scoring for final selection
function detailedScoring(representatives, userProfile) {
  // Calculate detailed scores
  const scoredResults = representatives.map(rep => ({
    anime: rep.anime,
    score: calculateDetailedScore(rep.anime, userProfile)
  }));
  
  // Sort by score
  const sortedResults = scoredResults.sort((a, b) => b.score - a.score);
  
  // Get top 20-30 representatives
  const topResults = sortedResults.slice(0, 25);
  
  // Final diversification step to ensure variety
  return diversifyResults(topResults).slice(0, 10);
}

// Calculate detailed matching score
function calculateDetailedScore(anime, userProfile) {
  let score = 0;
  let totalWeight = 0;
  
  // Score all dimensions where we have data
  Object.entries(userProfile).forEach(([dimension, userValue]) => {
    // Skip confidence and metadata fields
    if (dimension.endsWith('_confidence') || dimension === 'answeredQuestions') return;
    
    if (anime.attributes[dimension] !== undefined) {
      // Get dimension importance and user confidence
      const importance = dimensionPredictiveness[dimension] || 0.5;
      const confidence = userProfile[`${dimension}_confidence`] || 0.5;
      
      // Combined weight factors in both predictiveness and confidence
      const weight = importance * confidence;
      
      // Calculate match quality (10 = perfect match, 0 = worst match)
      const dimensionRange = dimensions[dimension].max - dimensions[dimension].min;
      const difference = Math.abs(userValue - anime.attributes[dimension]);
      const normalizedDifference = difference / dimensionRange;
      const match = 10 * (1 - normalizedDifference);
      
      score += match * weight;
      totalWeight += weight;
    }
  });
  
  // Normalize score
  const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
  
  // Bonus for popularity (small factor to break ties)
  const popularityBonus = anime.popularity ? (anime.popularity / 10000) * 0.5 : 0;
  
  return normalizedScore + popularityBonus;
}

// Ensure diverse results in the final set
function diversifyResults(results) {
  const diverseResults = [];
  const usedClusters = new Set();
  
  // First pass - get the highest scoring anime from each cluster
  results.forEach(result => {
    const anime = result.anime;
    const features = createFeatureVector(anime);
    const clusterKey = determineClusterKey(features);
    
    if (!usedClusters.has(clusterKey)) {
      diverseResults.push(result);
      usedClusters.add(clusterKey);
    }
  });
  
  // Second pass - fill remaining slots with highest scoring remaining anime
  const remainingResults = results.filter(result => {
    const anime = result.anime;
    const features = createFeatureVector(anime);
    const clusterKey = determineClusterKey(features);
    return !usedClusters.has(clusterKey);
  });
  
  // Sort remaining by score and add until we reach desired count
  const sortedRemaining = remainingResults.sort((a, b) => b.score - a.score);
  
  // Add remaining high-scoring anime until we reach our target count
  while (diverseResults.length < 10 && sortedRemaining.length > 0) {
    diverseResults.push(sortedRemaining.shift());
  }
  
  return diverseResults;
}

// Example of mapping anime attributes to psychological dimensions
function mapAnimeAttributes(anime) {
  // This would be a complex function in practice
  // Could use content analysis, viewer data, or expert tagging
  
  const attributes = {
    // Based on narrative style
    resolutionStyle: anime.directness || 5,
    
    // Based on plot complexity, multiple storylines, etc.
    complexityPreference: anime.plotComplexity || 5,
    
    // Based on focus on emotional impact vs. logical progression
    processingStyle: anime.rationalEmotionalBalance || 5,
    
    // Based on overall tone and ending
    outlookPolarity: anime.tonePositivity || 0,
    
    // Based on predictability and rule-following
    orderChaosPreference: anime.narrativeConsistency || 0,
    
    // Based on setting
    temporalOrientation: anime.futuristic ? 3 : (anime.historical ? -3 : 0),
    
    // Based on focus on individual vs. group
    socialOrientation: anime.focusOnCommunity ? 3 : (anime.focusOnIndividual ? -3 : 0),
    
    // Based on art style
    colorSaturation: anime.artStyleSaturation || 5,
    colorBrightness: anime.artStyleBrightness || 5,
    colorHarmony: anime.artStyleHarmony || 5
  };
  
  return attributes;
}

// MCP integration for storing user profile
function storeUserProfileInMCP(userProfile) {
  // This would connect to Anthropic's MCP API
  // Store the full psychological profile for this user
  // This allows for persistence between sessions
  
  const mcpData = {
    userPsychologicalProfile: userProfile,
    profileLastUpdated: new Date().toISOString(),
    // Additional metadata as needed
  };
  
  // Send to MCP API
  return mcpData;
}

// MCP integration for retrieving user profile
async function getUserProfileFromMCP(userId) {
  // Retrieve the stored psychological profile from MCP
  // Return default profile if none exists
  
  try {
    // API call to MCP would go here
    const mcpData = await fetchFromMCP(userId);
    return mcpData.userPsychologicalProfile || createDefaultProfile();
  } catch (error) {
    console.error("Failed to retrieve profile from MCP", error);
    return createDefaultProfile();
  }
}

function createDefaultProfile() {
  // Create a neutral starting profile
  const profile = {};
  Object.entries(dimensions).forEach(([dimension, bounds]) => {
    // Start at the middle of each dimension
    profile[dimension] = (bounds.min + bounds.max) / 2;
  });
  return profile;
}

// Example flow of the recommendation process
async function recommendationProcess(userId) {
  // 1. Get or create user profile
  const userProfile = await getUserProfileFromMCP(userId);
  
  // 2. Select appropriate questions based on current profile
  const selectedQuestions = selectQuestions(userProfile);
  
  // 3. Present questions to user and collect responses
  const updatedProfile = await presentQuestionsAndUpdateProfile(userProfile, selectedQuestions);
  
  // 4. Store updated profile in MCP
  storeUserProfileInMCP(updatedProfile);
  
  // 5. Fetch anime database (or filtered subset)
  const animeDatabase = await fetchAnimeDatabase();
  
  // 6. Generate recommendations
  const recommendations = recommendAnime(updatedProfile, animeDatabase);
  
  // 7. Present recommendations with explanation
  return generateRecommendationExplanations(recommendations, updatedProfile);
}

// Function to explain recommendations based on psychological profile
function generateRecommendationExplanations(recommendations, userProfile) {
  return recommendations.map(rec => {
    // Find the key dimensions that led to this recommendation
    const keyMatches = findKeyDimensionMatches(rec.anime.attributes, userProfile);
    
    // Generate natural language explanation without explicitly mentioning genres
    const explanation = generateNaturalLanguageExplanation(keyMatches, rec.anime);
    
    return {
      anime: rec.anime,
      score: rec.score,
      explanation
    };
  });
}

// Finding the most significant matching dimensions
function findKeyDimensionMatches(animeAttributes, userProfile) {
  const matches = [];
  
  Object.entries(animeAttributes).forEach(([dimension, value]) => {
    if (userProfile[dimension] !== undefined) {
      const similarity = 10 - Math.abs(value - userProfile[dimension]);
      if (similarity > 7) { // High match threshold
        matches.push({
          dimension,
          similarity,
          value,
          userValue: userProfile[dimension]
        });
      }
    }
  });
  
  // Return top 3 matching dimensions
  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// Generate human-readable explanation
function generateNaturalLanguageExplanation(keyMatches, anime) {
  const explanationTemplates = {
    resolutionStyle: [
      "The way conflicts unfold in this story resonates with your approach to challenges.",
      "The characters tackle problems in ways that might feel familiar to you."
    ],
    complexityPreference: [
      "The narrative has layers of complexity that align with your thinking style.",
      "The story's depth matches your appreciation for nuanced storytelling."
    ],
    outlookPolarity: [
      "The overall tone of this series matches your worldview.",
      "The perspective this story takes on life's challenges reflects your outlook."
    ]
    // Templates for other dimensions would be defined here
  };
  
  let explanation = `We think you might enjoy "${anime.title}" because `;
  
  // Add specific reasons based on key matches
  const reasons = keyMatches.map(match => {
    const templates = explanationTemplates[match.dimension] || [
      `it aligns with your preferences.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  });
  
  // Join reasons with proper grammar
  if (reasons.length === 1) {
    explanation += reasons[0];
  } else if (reasons.length === 2) {
    explanation += `${reasons[0]} and ${reasons[1]}`;
  } else {
    explanation += `${reasons[0]}, ${reasons[1]}, and ${reasons[2]}`;
  }
  
  return explanation;
}
