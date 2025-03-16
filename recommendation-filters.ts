/**
 * Recommendation Filters
 * 
 * Advanced filtering algorithms for the recommendation engine.
 * These filters are applied after the initial recommendation generation
 * to improve diversity, novelty, and relevance of recommendations.
 */

import type { AnimeTitle, UserProfile, RecommendationResult } from './data-models';
import { calculateProfileDistance } from './profile-similarity';

/**
 * Filter options for recommendations
 */
export interface FilterOptions {
  genreDiversity?: boolean;      // Ensure genre diversity
  timeRangeDiversity?: boolean;  // Mix of old and new anime
  popularitySpread?: boolean;    // Mix of popular and niche anime
  excludeGenres?: string[];      // Genres to exclude
  includeGenres?: string[];      // Genres to include
  yearRange?: {                  // Release year range
    min?: number;
    max?: number;
  };
  episodeRange?: {              // Episode count range
    min?: number;
    max?: number;
  };
  minRating?: number;           // Minimum average rating
}

/**
 * Apply all specified filters to recommendations
 * 
 * @param recommendations Initial recommendations
 * @param options Filter options
 * @returns Filtered recommendations
 */
export function applyFilters(
  recommendations: RecommendationResult[],
  options: FilterOptions = {}
): RecommendationResult[] {
  let filtered = [...recommendations];
  
  // Apply content filters first
  filtered = applyContentFilters(filtered, options);
  
  // Apply diversity filters
  if (options.genreDiversity) {
    filtered = applyGenreDiversity(filtered);
  }
  
  if (options.timeRangeDiversity) {
    filtered = applyTimeRangeDiversity(filtered);
  }
  
  if (options.popularitySpread) {
    filtered = applyPopularitySpread(filtered);
  }
  
  return filtered;
}

/**
 * Apply basic content filters (exclusions, inclusions, ranges)
 * 
 * @param recommendations Recommendations to filter
 * @param options Filter options
 * @returns Filtered recommendations
 */
function applyContentFilters(
  recommendations: RecommendationResult[],
  options: FilterOptions
): RecommendationResult[] {
  return recommendations.filter(rec => {
    const anime = rec.anime;
    
    // Exclude specific genres
    if (options.excludeGenres && options.excludeGenres.length > 0) {
      if (anime.genres.some(genre => options.excludeGenres!.includes(genre))) {
        return false;
      }
    }
    
    // Include specific genres (must have at least one)
    if (options.includeGenres && options.includeGenres.length > 0) {
      if (!anime.genres.some(genre => options.includeGenres!.includes(genre))) {
        return false;
      }
    }
    
    // Year range filter
    if (options.yearRange) {
      if (options.yearRange.min !== undefined && anime.year < options.yearRange.min) {
        return false;
      }
      if (options.yearRange.max !== undefined && anime.year > options.yearRange.max) {
        return false;
      }
    }
    
    // Episode count filter
    if (options.episodeRange) {
      if (options.episodeRange.min !== undefined && anime.episodeCount < options.episodeRange.min) {
        return false;
      }
      if (options.episodeRange.max !== undefined && anime.episodeCount > options.episodeRange.max) {
        return false;
      }
    }
    
    // Minimum rating filter
    if (options.minRating !== undefined && anime.rating < options.minRating) {
      return false;
    }
    
    return true;
  });
}

/**
 * Apply genre diversity filter to ensure recommendations span multiple genres
 * 
 * @param recommendations Recommendations to diversify
 * @returns Diversified recommendations
 */
function applyGenreDiversity(
  recommendations: RecommendationResult[]
): RecommendationResult[] {
  // If we have few recommendations, don't filter further
  if (recommendations.length <= 5) {
    return recommendations;
  }
  
  const result: RecommendationResult[] = [];
  const usedGenres = new Set<string>();
  const remainingRecs = [...recommendations];
  
  // First pass: get one recommendation for each primary genre
  while (remainingRecs.length > 0 && result.length < recommendations.length * 0.8) {
    let bestCandidate: RecommendationResult | null = null;
    let bestCandidateIndex = -1;
    let bestCandidateNewGenres = 0;
    
    // Find the recommendation that adds the most new genres
    for (let i = 0; i < remainingRecs.length; i++) {
      const rec = remainingRecs[i];
      const newGenres = rec.anime.genres.filter(genre => !usedGenres.has(genre));
      
      if (newGenres.length > bestCandidateNewGenres) {
        bestCandidate = rec;
        bestCandidateIndex = i;
        bestCandidateNewGenres = newGenres.length;
      }
    }
    
    if (bestCandidate && bestCandidateNewGenres > 0) {
      // Add the best candidate
      result.push(bestCandidate);
      
      // Mark its genres as used
      bestCandidate.anime.genres.forEach(genre => usedGenres.add(genre));
      
      // Remove from remaining
      remainingRecs.splice(bestCandidateIndex, 1);
    } else {
      // No new genres to add, so add the highest scored remaining
      remainingRecs.sort((a, b) => b.score - a.score);
      result.push(remainingRecs.shift()!);
    }
  }
  
  // Second pass: add remaining high-scoring recommendations
  if (result.length < recommendations.length) {
    remainingRecs.sort((a, b) => b.score - a.score);
    while (result.length < recommendations.length && remainingRecs.length > 0) {
      result.push(remainingRecs.shift()!);
    }
  }
  
  return result;
}

/**
 * Apply time range diversity filter to mix old and new anime
 * 
 * @param recommendations Recommendations to diversify
 * @returns Diversified recommendations
 */
function applyTimeRangeDiversity(
  recommendations: RecommendationResult[]
): RecommendationResult[] {
  // If we have few recommendations, don't filter further
  if (recommendations.length <= 5) {
    return recommendations;
  }
  
  // Group anime by decade
  const animeByDecade: { [decade: string]: RecommendationResult[] } = {};
  
  recommendations.forEach(rec => {
    const year = rec.anime.year;
    const decade = Math.floor(year / 10) * 10;
    const decadeKey = decade.toString();
    
    if (!animeByDecade[decadeKey]) {
      animeByDecade[decadeKey] = [];
    }
    
    animeByDecade[decadeKey].push(rec);
  });
  
  // Get decades in chronological order
  const decades = Object.keys(animeByDecade).sort();
  
  // Calculate how many to take from each decade
  const result: RecommendationResult[] = [];
  const totalNeeded = recommendations.length;
  let remaining = totalNeeded;
  
  // First, ensure we have at least one from each decade if possible
  decades.forEach(decade => {
    if (animeByDecade[decade].length > 0 && remaining > 0) {
      // Sort by score and take the best one
      animeByDecade[decade].sort((a, b) => b.score - a.score);
      result.push(animeByDecade[decade].shift()!);
      remaining--;
    }
  });
  
  // Distribute remaining slots proportionally to decade sizes
  if (remaining > 0) {
    // Calculate total remaining anime
    let totalRemainingAnime = 0;
    decades.forEach(decade => {
      totalRemainingAnime += animeByDecade[decade].length;
    });
    
    // Distribute slots based on proportion of remaining anime
    decades.forEach(decade => {
      if (animeByDecade[decade].length === 0) return;
      
      const proportion = animeByDecade[decade].length / totalRemainingAnime;
      let slotsForDecade = Math.round(remaining * proportion);
      
      // Ensure we don't take more than available
      slotsForDecade = Math.min(slotsForDecade, animeByDecade[decade].length);
      
      if (slotsForDecade > 0) {
        // Sort by score and take the best ones
        animeByDecade[decade].sort((a, b) => b.score - a.score);
        
        for (let i = 0; i < slotsForDecade && remaining > 0; i++) {
          result.push(animeByDecade[decade].shift()!);
          remaining--;
        }
      }
    });
  }
  
  // If we still have slots, fill with highest scoring remaining
  if (remaining > 0) {
    const allRemaining = decades.flatMap(decade => animeByDecade[decade]);
    allRemaining.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < remaining && i < allRemaining.length; i++) {
      result.push(allRemaining[i]);
    }
  }
  
  return result;
}

/**
 * Apply popularity spread filter to mix popular and niche anime
 * 
 * @param recommendations Recommendations to diversify
 * @returns Diversified recommendations
 */
function applyPopularitySpread(
  recommendations: RecommendationResult[]
): RecommendationResult[] {
  // If we have few recommendations, don't filter further
  if (recommendations.length <= 5) {
    return recommendations;
  }
  
  // Sort by score (primary) and popularity (secondary)
  const sortedRecs = [...recommendations].sort((a, b) => {
    // First by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Then by popularity
    return b.anime.popularity - a.anime.popularity;
  });
  
  const result: RecommendationResult[] = [];
  const totalSlots = recommendations.length;
  
  // Take 50% from top scorers regardless of popularity
  const topScorerCount = Math.floor(totalSlots * 0.5);
  result.push(...sortedRecs.slice(0, topScorerCount));
  
  // Take remaining recommendations with a mix of popularity levels
  const remaining = sortedRecs.slice(topScorerCount);
  
  // Sort remaining by score first, then mix popularity
  const popularitySegments: RecommendationResult[][] = [[], [], []];
  
  // Divide into high, medium, low popularity
  remaining.forEach(rec => {
    const popularity = rec.anime.popularity;
    
    if (popularity >= 70) {
      popularitySegments[0].push(rec); // High popularity
    } else if (popularity >= 30) {
      popularitySegments[1].push(rec); // Medium popularity
    } else {
      popularitySegments[2].push(rec); // Low popularity
    }
  });
  
  // Calculate slots for each segment
  const remainingSlots = totalSlots - result.length;
  const slotsPerSegment = [
    Math.floor(remainingSlots * 0.5),  // 50% high popularity
    Math.floor(remainingSlots * 0.3),  // 30% medium popularity
    Math.floor(remainingSlots * 0.2)   // 20% low popularity
  ];
  
  // Adjust if we don't have enough in some segment
  for (let i = 0; i < 3; i++) {
    if (popularitySegments[i].length < slotsPerSegment[i]) {
      const deficit = slotsPerSegment[i] - popularitySegments[i].length;
      slotsPerSegment[i] = popularitySegments[i].length;
      
      // Redistribute deficit to other segments
      for (let j = 0; j < 3; j++) {
        if (j !== i && popularitySegments[j].length > slotsPerSegment[j]) {
          const extraSlots = Math.min(
            deficit,
            popularitySegments[j].length - slotsPerSegment[j]
          );
          slotsPerSegment[j] += extraSlots;
          deficit -= extraSlots;
          
          if (deficit === 0) break;
        }
      }
    }
  }
  
  // Take the top scoring from each segment
  for (let i = 0; i < 3; i++) {
    if (slotsPerSegment[i] > 0 && popularitySegments[i].length > 0) {
      popularitySegments[i].sort((a, b) => b.score - a.score);
      result.push(...popularitySegments[i].slice(0, slotsPerSegment[i]));
    }
  }
  
  // If we still have slots, fill with highest scoring remaining
  const allRemaining = popularitySegments.flat();
  allRemaining.sort((a, b) => b.score - a.score);
  
  const stillNeeded = totalSlots - result.length;
  if (stillNeeded > 0) {
    result.push(...allRemaining.slice(0, stillNeeded));
  }
  
  return result;
}

/**
 * Apply collaborative filtering based on similar user profiles
 * 
 * @param recommendations Current recommendations
 * @param userProfile Current user profile
 * @param similarProfiles Array of similar user profiles
 * @param similarProfilesAnime Map of anime liked by similar profiles
 * @returns Enhanced recommendations with collaborative filtering
 */
export function applyCollaborativeFiltering(
  recommendations: RecommendationResult[],
  userProfile: UserProfile,
  similarProfiles: UserProfile[],
  similarProfilesAnime: { [userId: string]: AnimeTitle[] }
): RecommendationResult[] {
  if (similarProfiles.length === 0) {
    return recommendations; // No similar profiles available
  }
  
  // Calculate profile distances
  const profileDistances = similarProfiles.map(profile => ({
    userId: profile.userId,
    distance: calculateProfileDistance(userProfile, profile)
  }));
  
  // Sort by ascending distance (closest profiles first)
  profileDistances.sort((a, b) => a.distance - b.distance);
  
  // Take the top 30% of profiles
  const closestProfiles = profileDistances.slice(
    0, 
    Math.max(3, Math.ceil(profileDistances.length * 0.3))
  );
  
  // Get anime from closest profiles that isn't already in recommendations
  const existingAnimeIds = new Set(recommendations.map(rec => rec.anime.id));
  const collaborativeRecs: { anime: AnimeTitle, similarityScore: number }[] = [];
  
  closestProfiles.forEach(profileMatch => {
    const userId = profileMatch.userId;
    const userAnime = similarProfilesAnime[userId] || [];
    const profileWeight = 1 - profileMatch.distance; // Convert distance to similarity
    
    userAnime.forEach(anime => {
      if (!existingAnimeIds.has(anime.id)) {
        // Add to collaborative recommendations with weighted score
        collaborativeRecs.push({
          anime,
          similarityScore: profileWeight * anime.rating / 10 // Weight by rating and profile similarity
        });
        
        existingAnimeIds.add(anime.id);
      }
    });
  });
  
  // Sort collaborative recommendations by similarity score
  collaborativeRecs.sort((a, b) => b.similarityScore - a.similarityScore);
  
  // Take top 30% of original recommendations
  const topRecommendations = recommendations.slice(
    0,
    Math.ceil(recommendations.length * 0.7)
  );
  
  // Fill remaining slots with collaborative recommendations
  const slotsRemaining = recommendations.length - topRecommendations.length;
  const collaborativeToAdd = Math.min(collaborativeRecs.length, slotsRemaining);
  
  // Convert collaborative recommendations to standard format
  for (let i = 0; i < collaborativeToAdd; i++) {
    const collab = collaborativeRecs[i];
    topRecommendations.push({
      anime: collab.anime,
      score: collab.similarityScore * 10, // Scale to 0-10
      matchReasons: [
        {
          dimension: 'collaborative',
          strength: collab.similarityScore,
          explanation: 'This anime is enjoyed by users with similar psychological profiles.'
        }
      ]
    });
  }
  
  return topRecommendations;
}