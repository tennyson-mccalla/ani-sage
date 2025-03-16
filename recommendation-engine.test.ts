/**
 * Recommendation Engine Tests
 * 
 * This file contains tests for the recommendation engine functionality.
 */
import { expect, describe, test } from '@jest/globals';

import { createInitialProfile } from './psychological-dimensions';
import { 
  recommendAnime, 
  initialFiltering, 
  clusterSimilarAnime,
  createFeatureVector,
  determineClusterId,
  calculateMatchScore
} from './recommendation-engine';

import type { AnimeTitle, UserProfile } from './data-models';

describe('Recommendation Engine', () => {
  // Mock user profile for testing
  const mockUserProfile: UserProfile = {
    ...createInitialProfile('test-user-1'),
    dimensions: {
      visualComplexity: 7,
      narrativeComplexity: 8,
      emotionalIntensity: 6,
      characterComplexity: 7,
      moralAmbiguity: 8,
      fantasyRealism: 3,
      emotionalValence: -2,
      intellectualEmotional: 2
    },
    confidences: {
      visualComplexity: 0.8,
      narrativeComplexity: 0.9,
      emotionalIntensity: 0.7,
      characterComplexity: 0.8,
      moralAmbiguity: 0.6,
      fantasyRealism: 0.7,
      emotionalValence: 0.5,
      intellectualEmotional: 0.6
    }
  };
  
  // Mock anime database for testing
  const mockAnimeDatabase: AnimeTitle[] = [
    {
      id: 'anime-1',
      title: 'Complex Narrative Anime',
      alternativeTitles: ['CNarr'],
      synopsis: 'A complex narrative with deep characters',
      genres: ['Psychological', 'Drama', 'Sci-Fi'],
      year: 2020,
      episodeCount: 24,
      attributes: {
        visualComplexity: 8,
        narrativeComplexity: 9,
        emotionalIntensity: 7,
        characterComplexity: 8,
        moralAmbiguity: 9,
        fantasyRealism: 2,
        emotionalValence: -3,
        intellectualEmotional: 4
      },
      popularity: 85,
      rating: 8.7,
      externalIds: { malId: 101 },
      imageUrls: {}
    },
    {
      id: 'anime-2',
      title: 'Action Adventure',
      alternativeTitles: ['AA'],
      synopsis: 'An action-packed adventure',
      genres: ['Action', 'Adventure', 'Fantasy'],
      year: 2018,
      episodeCount: 13,
      attributes: {
        visualComplexity: 6,
        narrativeComplexity: 4,
        emotionalIntensity: 8,
        characterComplexity: 5,
        moralAmbiguity: 4,
        fantasyRealism: 4,
        emotionalValence: 2,
        intellectualEmotional: -2
      },
      popularity: 92,
      rating: 7.8,
      externalIds: { malId: 102 },
      imageUrls: {}
    },
    {
      id: 'anime-3',
      title: 'Slice of Life Drama',
      alternativeTitles: ['SoL'],
      synopsis: 'A gentle slice of life story',
      genres: ['Slice of Life', 'Drama', 'Romance'],
      year: 2019,
      episodeCount: 12,
      attributes: {
        visualComplexity: 5,
        narrativeComplexity: 6,
        emotionalIntensity: 7,
        characterComplexity: 8,
        moralAmbiguity: 5,
        fantasyRealism: -3,
        emotionalValence: 1,
        intellectualEmotional: -3
      },
      popularity: 75,
      rating: 8.2,
      externalIds: { malId: 103 },
      imageUrls: {}
    }
  ];
  
  test('initialFiltering correctly filters based on high-confidence dimensions', () => {
    const filtered = initialFiltering(mockUserProfile, mockAnimeDatabase);
    
    // We expect filtering to match these high-confidence dimensions
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some(anime => anime.id === 'anime-1')).toBeTruthy();
  });
  
  test('createFeatureVector extracts key features from anime', () => {
    const vector = createFeatureVector(mockAnimeDatabase[0]);
    
    expect(vector).toEqual({
      visualStyle: 8,
      narrativeStyle: 9,
      emotionalTone: -3,
      characterDepth: 8,
      pacing: 5 // Default value since not in attributes
    });
  });
  
  test('determineClusterId creates consistent cluster IDs', () => {
    const features = createFeatureVector(mockAnimeDatabase[0]);
    const clusterId = determineClusterId(features);
    
    expect(typeof clusterId).toBe('string');
    expect(clusterId.split('-').length).toBe(4);
    
    // Test consistency - same features should produce same cluster ID
    const sameFeatures = { ...features };
    expect(determineClusterId(sameFeatures)).toBe(clusterId);
  });
  
  test('clusterSimilarAnime groups anime by similarity', () => {
    const clusters = clusterSimilarAnime(mockAnimeDatabase);
    
    // We should have at least one cluster
    expect(Object.keys(clusters).length).toBeGreaterThan(0);
    
    // Check that each anime got assigned to exactly one cluster
    const totalAnime = Object.values(clusters).flat().length;
    expect(totalAnime).toBe(mockAnimeDatabase.length);
  });
  
  test('calculateMatchScore computes appropriate match scores', () => {
    // Anime similar to user profile should have high score
    const similarAnimeScore = calculateMatchScore(mockAnimeDatabase[0], mockUserProfile);
    
    // Anime different from user profile should have lower score
    const differentAnimeScore = calculateMatchScore(mockAnimeDatabase[2], mockUserProfile);
    
    expect(similarAnimeScore).toBeGreaterThan(0.5); // Should be a good match
    expect(similarAnimeScore).toBeGreaterThan(differentAnimeScore); // Should be better than different anime
  });
  
  test('recommendAnime returns recommendations', () => {
    const count = 3; // Our mock database only has 3 anime, so max is 3
    const recommendations = recommendAnime(mockUserProfile, mockAnimeDatabase, { count });
    
    // Just ensure we get at least one recommendation
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].score).toBeGreaterThan(0);
    expect(recommendations[0].anime).toBeDefined();
    expect(recommendations[0].matchReasons).toBeDefined();
    expect(recommendations[0].matchReasons.length).toBeGreaterThan(0);
  });
});