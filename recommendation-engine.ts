/**
 * Recommendation Engine Implementation
 * 
 * This module implements the core recommendation algorithms using psychological
 * profiles to match users with anime. It uses a multi-stage filtering approach:
 * 
 * 1. Initial Filtering: Broad filtering based on high-confidence dimensions
 * 2. Clustering: Group similar anime together
 * 3. Representative Selection: Select top anime from each relevant cluster
 * 4. Detailed Scoring: Fine-grained scoring of selected anime
 * 5. Diversification: Ensure diversity in the final recommendations
 */

import type { UserProfile, AnimeTitle, RecommendationResult } from './data-models';
import { PsychologicalDimensions, normalizeDimension } from './psychological-dimensions';
import { calculateProfileSimilarity, generateMatchReasons } from './profile-similarity';

/**
 * Main recommendation function that orchestrates the multi-stage filtering process
 * 
 * @param userProfile The user's psychological profile
 * @param animeDatabase Array of available anime to recommend from
 * @param options Additional configuration options
 * @returns Array of recommendation results
 */
export function recommendAnime(
  userProfile: UserProfile, 
  animeDatabase: AnimeTitle[],
  options: {
    count?: number;           // Number of recommendations to return
    minScore?: number;        // Minimum match score (0-1)
    excludeIds?: string[];    // Anime IDs to exclude (already seen)
    includeClusters?: string[]; // Specific clusters to include
    excludeClusters?: string[]; // Specific clusters to exclude
  } = {}
): RecommendationResult[] {
  const {
    count = 10,
    minScore = 0.4,
    excludeIds = [],
    includeClusters = [],
    excludeClusters = []
  } = options;
  
  // Filter out anime the user has already seen
  const filteredDatabase = animeDatabase.filter(anime => !excludeIds.includes(anime.id));
  
  if (filteredDatabase.length === 0) {
    return [];
  }
  
  // Stage 1: Initial broad filtering based on highest confidence dimensions
  const initialFiltered = initialFiltering(userProfile, filteredDatabase);
  
  // Stage 2: Similarity clustering to find representative anime
  const clusters = clusterSimilarAnime(initialFiltered);
  
  // Stage 3: Select top representatives from each relevant cluster
  const representatives = selectClusterRepresentatives(
    clusters, 
    userProfile, 
    includeClusters, 
    excludeClusters
  );
  
  // Stage 4: Fine-grained scoring of representatives
  const scoredResults = detailedScoring(representatives, userProfile, minScore);
  
  // Stage 5: Diversity enhancement
  const diverseResults = diversifyResults(scoredResults, count);
  
  // Generate final recommendation results with explanations
  return diverseResults.map(result => {
    const similarityResult = calculateProfileSimilarity(userProfile, result.anime.attributes);
    const matchReasons = generateMatchReasons(userProfile, result.anime.attributes, similarityResult);
    
    return {
      anime: result.anime,
      score: result.score * 10, // Scale to 0-10
      matchReasons
    };
  });
}

/**
 * Initial filtering to reduce thousands of anime to hundreds
 * Uses only high-confidence dimensions to avoid filtering out potentially good matches
 * 
 * @param userProfile The user's psychological profile
 * @param animeDatabase Array of available anime
 * @returns Filtered array of anime
 */
export function initialFiltering(
  userProfile: UserProfile, 
  animeDatabase: AnimeTitle[]
): AnimeTitle[] {
  // Get high-confidence dimensions
  const highConfidenceDimensions = Object.keys(userProfile.dimensions)
    .filter(dimension => {
      const confidence = userProfile.confidences[dimension] || 0;
      const importanceThreshold = 0.6;
      const confidenceThreshold = 0.4;
      
      return confidence > confidenceThreshold && 
             PsychologicalDimensions[dimension]?.importance > importanceThreshold;
    });
  
  // If we don't have enough confidence in any dimensions yet,
  // return popular anime as a fallback
  if (highConfidenceDimensions.length === 0) {
    return animeDatabase
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 500);
  }
  
  // Filter based on high-confidence dimensions only
  return animeDatabase.filter(anime => {
    let matchScore = 0;
    
    highConfidenceDimensions.forEach(dimension => {
      const userValue = userProfile.dimensions[dimension];
      const animeValue = anime.attributes[dimension];
      
      if (animeValue !== undefined) {
        // Allow matches within a reasonable range
        const userValueNorm = normalizeDimension(dimension, userValue);
        const animeValueNorm = normalizeDimension(dimension, animeValue);
        const difference = Math.abs(userValueNorm - animeValueNorm);
        
        // Consider it a match if within 30% of the normalized range
        if (difference < 0.3) {
          matchScore++;
        }
      }
    });
    
    // Must match on at least half of the high-confidence dimensions
    const requiredMatches = Math.max(1, Math.floor(highConfidenceDimensions.length / 2));
    return matchScore >= requiredMatches;
  });
}

/**
 * Feature vector type definition for clustering
 */
interface AnimeFeatureVector {
  visualStyle: number;
  narrativeStyle: number;
  emotionalTone: number;
  characterDepth: number;
  pacing: number;
}

/**
 * Group similar anime into clusters based on their psychological attributes
 * 
 * @param animeList Array of anime to cluster
 * @returns Object mapping cluster IDs to arrays of anime
 */
export function clusterSimilarAnime(
  animeList: AnimeTitle[]
): { [clusterId: string]: AnimeTitle[] } {
  const clusters: { [clusterId: string]: AnimeTitle[] } = {};
  
  animeList.forEach(anime => {
    // Create a feature vector for this anime
    const features = createFeatureVector(anime);
    
    // Determine which cluster this anime belongs to
    const clusterId = determineClusterId(features);
    
    // Create cluster if it doesn't exist yet
    if (!clusters[clusterId]) {
      clusters[clusterId] = [];
    }
    
    // Add anime to appropriate cluster
    clusters[clusterId].push(anime);
    
    // Store cluster ID on anime for future reference
    anime.cluster = clusterId;
  });
  
  return clusters;
}

/**
 * Create a feature vector representation of an anime for clustering
 * 
 * @param anime Anime to create feature vector for
 * @returns Feature vector
 */
export function createFeatureVector(anime: AnimeTitle): AnimeFeatureVector {
  // Map key attributes to our feature vector
  // Use default middle values if attribute not available
  return {
    visualStyle: anime.attributes.visualComplexity || 5,
    narrativeStyle: anime.attributes.narrativeComplexity || 5,
    emotionalTone: anime.attributes.emotionalValence || 0,
    characterDepth: anime.attributes.characterComplexity || 5,
    pacing: anime.attributes.narrativePace || 5
  };
}

/**
 * Determine cluster ID for an anime based on its feature vector
 * 
 * @param features Feature vector
 * @returns Cluster ID string
 */
export function determineClusterId(features: AnimeFeatureVector): string {
  // Create more fine-grained buckets for each feature dimension to increase diversity
  const visualBucket = Math.floor(features.visualStyle / 2); // 0-5 (more granular)
  const narrativeBucket = Math.floor(features.narrativeStyle / 2); // 0-5 (more granular)
  
  // Add positive/negative distinction with intensity level
  const emotionIntensity = Math.floor(Math.abs(features.emotionalTone) / 2.5); // 0-4
  const emotionBucket = features.emotionalTone >= 0 ? `pos${emotionIntensity}` : `neg${emotionIntensity}`;
  
  // More granular character depth buckets
  const characterBucket = Math.floor(features.characterDepth / 3.33); // 0-3 (more granular)
  
  // Add pacing as a clustering dimension for more diversity
  const pacingBucket = Math.floor(features.pacing / 3.33); // 0-3
  
  // Combine buckets into a more specific cluster ID
  return `${visualBucket}-${narrativeBucket}-${characterBucket}-${emotionBucket}-p${pacingBucket}`;
}

/**
 * Select representatives from relevant clusters based on user profile
 * 
 * @param clusters Clusters of anime
 * @param userProfile User's psychological profile
 * @param includeClusters Optional clusters to include
 * @param excludeClusters Optional clusters to exclude
 * @returns Array of anime representatives with scores
 */
export function selectClusterRepresentatives(
  clusters: { [clusterId: string]: AnimeTitle[] },
  userProfile: UserProfile,
  includeClusters: string[] = [],
  excludeClusters: string[] = []
): { anime: AnimeTitle; score: number; }[] {
  const representatives: { anime: AnimeTitle; score: number; }[] = [];
  
  // Determine which clusters are relevant to user profile
  const relevantClusterIds = findRelevantClusters(
    clusters, 
    userProfile,
    includeClusters,
    excludeClusters
  );
  
  // Select top anime from each relevant cluster
  relevantClusterIds.forEach(clusterId => {
    const cluster = clusters[clusterId];
    if (!cluster || cluster.length === 0) return;
    
    // Score each anime in the cluster
    const scoredAnime = cluster.map(anime => ({
      anime,
      score: calculateMatchScore(anime, userProfile)
    }));
    
    // Get top 1-2 from each cluster to ensure more cluster diversity
    const topFromCluster = scoredAnime
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    
    representatives.push(...topFromCluster);
  });
  
  return representatives;
}

/**
 * Find clusters most relevant to the user's profile
 * 
 * @param clusters All available clusters
 * @param userProfile User's psychological profile
 * @param includeClusters Optional clusters to include
 * @param excludeClusters Optional clusters to exclude
 * @returns Array of relevant cluster IDs
 */
export function findRelevantClusters(
  clusters: { [clusterId: string]: AnimeTitle[] },
  userProfile: UserProfile,
  includeClusters: string[] = [],
  excludeClusters: string[] = []
): string[] {
  // Create a feature vector for the user
  const userFeatures: AnimeFeatureVector = {
    visualStyle: userProfile.dimensions.visualComplexity || 5,
    narrativeStyle: userProfile.dimensions.narrativeComplexity || 5,
    emotionalTone: userProfile.dimensions.emotionalValence || 0,
    characterDepth: userProfile.dimensions.characterComplexity || 5,
    pacing: userProfile.dimensions.narrativePace || 5
  };
  
  // Generate the user's primary cluster ID
  const primaryClusterId = determineClusterId(userFeatures);
  
  // Generate adjacent clusters for diversity
  const adjacentClusterIds = generateAdjacentClusters(userFeatures);
  
  // Combine primary, adjacent, and explicitly included clusters
  const candidateClusters = new Set([
    primaryClusterId,
    ...adjacentClusterIds,
    ...includeClusters
  ]);
  
  // Remove excluded clusters
  excludeClusters.forEach(id => candidateClusters.delete(id));
  
  // Filter for clusters that actually exist in our data
  return Array.from(candidateClusters)
    .filter(id => clusters[id] && clusters[id].length > 0);
}

/**
 * Generate adjacent clusters for diversity
 * 
 * @param features Feature vector to find adjacent clusters for
 * @returns Array of adjacent cluster IDs
 */
function generateAdjacentClusters(features: AnimeFeatureVector): string[] {
  // Use the same bucketing logic as in determineClusterId for consistency
  const visualBucket = Math.floor(features.visualStyle / 2);
  const narrativeBucket = Math.floor(features.narrativeStyle / 2);
  const emotionIntensity = Math.floor(Math.abs(features.emotionalTone) / 2.5);
  const emotionBucket = features.emotionalTone >= 0 ? `pos${emotionIntensity}` : `neg${emotionIntensity}`;
  const characterBucket = Math.floor(features.characterDepth / 3.33);
  const pacingBucket = Math.floor(features.pacing / 3.33);
  
  const adjacentClusters: string[] = [];
  
  // Visual variation (more granular)
  if (visualBucket > 0) {
    adjacentClusters.push(`${visualBucket-1}-${narrativeBucket}-${characterBucket}-${emotionBucket}-p${pacingBucket}`);
  }
  if (visualBucket < 5) {
    adjacentClusters.push(`${visualBucket+1}-${narrativeBucket}-${characterBucket}-${emotionBucket}-p${pacingBucket}`);
  }
  
  // Narrative variation (more granular)
  if (narrativeBucket > 0) {
    adjacentClusters.push(`${visualBucket}-${narrativeBucket-1}-${characterBucket}-${emotionBucket}-p${pacingBucket}`);
  }
  if (narrativeBucket < 5) {
    adjacentClusters.push(`${visualBucket}-${narrativeBucket+1}-${characterBucket}-${emotionBucket}-p${pacingBucket}`);
  }
  
  // Emotional tone variations - try different intensities and polarities
  const oppositePolarity = features.emotionalTone >= 0 ? 'neg' : 'pos';
  // Add opposite polarity with same intensity
  adjacentClusters.push(`${visualBucket}-${narrativeBucket}-${characterBucket}-${oppositePolarity}${emotionIntensity}-p${pacingBucket}`);
  
  // Try different emotional intensities
  for (let i = 0; i < 4; i++) {
    if (i !== emotionIntensity) {
      // Same polarity, different intensity
      const polarityPrefix = features.emotionalTone >= 0 ? 'pos' : 'neg';
      adjacentClusters.push(`${visualBucket}-${narrativeBucket}-${characterBucket}-${polarityPrefix}${i}-p${pacingBucket}`);
    }
  }
  
  // Character depth variation (more granular)
  if (characterBucket > 0) {
    adjacentClusters.push(`${visualBucket}-${narrativeBucket}-${characterBucket-1}-${emotionBucket}-p${pacingBucket}`);
  }
  if (characterBucket < 3) {
    adjacentClusters.push(`${visualBucket}-${narrativeBucket}-${characterBucket+1}-${emotionBucket}-p${pacingBucket}`);
  }
  
  // Pacing variation
  if (pacingBucket > 0) {
    adjacentClusters.push(`${visualBucket}-${narrativeBucket}-${characterBucket}-${emotionBucket}-p${pacingBucket-1}`);
  }
  if (pacingBucket < 3) {
    adjacentClusters.push(`${visualBucket}-${narrativeBucket}-${characterBucket}-${emotionBucket}-p${pacingBucket+1}`);
  }
  
  return adjacentClusters;
}

/**
 * Calculate match score between anime and user profile
 * 
 * @param anime Anime to score
 * @param userProfile User profile to match against
 * @returns Match score (0-1)
 */
export function calculateMatchScore(
  anime: AnimeTitle, 
  userProfile: UserProfile
): number {
  const similarityResult = calculateProfileSimilarity(
    userProfile, 
    anime.attributes,
    { confidenceWeighting: true, dimensionImportance: true }
  );
  
  // Add a tiny bonus for popularity to break ties between similar anime, but keep it small to avoid dominating the recommendation
  const popularityBonus = Math.min(anime.popularity, 100) / 5000;
  
  return similarityResult.overallScore + popularityBonus;
}

/**
 * Detailed scoring of anime representatives
 * 
 * @param representatives Anime representatives from clusters
 * @param userProfile User profile
 * @param minScore Minimum score threshold
 * @returns Scored anime results
 */
export function detailedScoring(
  representatives: { anime: AnimeTitle; score: number }[],
  userProfile: UserProfile,
  minScore: number = 0.4
): { anime: AnimeTitle; score: number }[] {
  // Sort by score descending
  const sortedResults = representatives
    .sort((a, b) => b.score - a.score);
  
  // Filter by minimum score threshold
  return sortedResults.filter(result => result.score >= minScore);
}

/**
 * Ensure diverse results in the final recommendation set
 * 
 * @param results Scored anime results
 * @param targetCount Target number of recommendations
 * @returns Diversified anime results
 */
export function diversifyResults(
  results: { anime: AnimeTitle; score: number }[],
  targetCount: number = 10
): { anime: AnimeTitle; score: number }[] {
  if (results.length <= targetCount) {
    return results;
  }
  
  const diverseResults: { anime: AnimeTitle; score: number }[] = [];
  const usedClusters = new Set<string>();
  const clusterScores: { [clusterId: string]: { count: number; totalScore: number; avgScore?: number } } = {};
  
  // Calculate average score by cluster to find strongest clusters
  results.forEach(result => {
    const clusterId = result.anime.cluster;
    if (!clusterId) return;
    
    if (!clusterScores[clusterId]) {
      clusterScores[clusterId] = { count: 0, totalScore: 0 };
    }
    clusterScores[clusterId].count++;
    clusterScores[clusterId].totalScore += result.score;
  });
  
  // Calculate average scores
  Object.keys(clusterScores).forEach(clusterId => {
    if (clusterScores[clusterId].count > 0) {
      clusterScores[clusterId].avgScore = 
        clusterScores[clusterId].totalScore / clusterScores[clusterId].count;
    }
  });
  
  // Group results by cluster
  const clusterGroups: { [clusterId: string]: { anime: AnimeTitle; score: number }[] } = {};
  
  results.forEach(result => {
    const clusterId = result.anime.cluster;
    if (!clusterId) return;
    
    if (!clusterGroups[clusterId]) {
      clusterGroups[clusterId] = [];
    }
    clusterGroups[clusterId].push(result);
  });
  
  // Sort clusters by average score
  const sortedClusterIds = Object.keys(clusterScores)
    .sort((a, b) => {
      const scoreA = clusterScores[a].avgScore || 0;
      const scoreB = clusterScores[b].avgScore || 0;
      return scoreB - scoreA;
    });
  
  // First pass - get the highest scoring anime from best clusters
  for (const clusterId of sortedClusterIds) {
    if (diverseResults.length >= targetCount) break;
    
    if (!usedClusters.has(clusterId) && clusterGroups[clusterId]?.length > 0) {
      // Sort anime within cluster by score
      const sortedClusterResults = clusterGroups[clusterId]
        .sort((a, b) => b.score - a.score);
      
      // Take the best anime from this cluster
      diverseResults.push(sortedClusterResults[0]);
      usedClusters.add(clusterId);
    }
  }
  
  // Second pass - try to add another anime from the highest scoring clusters
  // if we still need more recommendations and those clusters have multiple good options
  if (diverseResults.length < targetCount) {
    for (const clusterId of sortedClusterIds) {
      if (diverseResults.length >= targetCount) break;
      
      if (clusterGroups[clusterId]?.length > 1) {
        // Sort anime within cluster by score
        const sortedClusterResults = clusterGroups[clusterId]
          .sort((a, b) => b.score - a.score);
        
        // Take the second best anime only if it's score is still good
        if (sortedClusterResults[1].score > 0.7) {
          diverseResults.push(sortedClusterResults[1]);
        }
        
        if (diverseResults.length >= targetCount) break;
      }
    }
  }
  
  // Third pass - add remaining high-scoring anime regardless of cluster
  if (diverseResults.length < targetCount) {
    // Get all anime we haven't used yet
    const usedAnimeIds = new Set(diverseResults.map(r => r.anime.id));
    const remainingResults = results.filter(result => !usedAnimeIds.has(result.anime.id));
    
    // Sort remaining by score and add until we reach desired count
    const sortedRemaining = remainingResults.sort((a, b) => b.score - a.score);
    
    while (diverseResults.length < targetCount && sortedRemaining.length > 0) {
      diverseResults.push(sortedRemaining.shift()!);
    }
  }
  
  return diverseResults;
}